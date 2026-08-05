import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getCurrentSalonId } from "@/lib/salon";

const SCOPE = "https://www.googleapis.com/auth/business.manage";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name}が設定されていません`);
  }
  return value;
}

export function getGoogleAuthUrl(redirectUri: string, state: string): string {
  const clientId = requireEnv("GOOGLE_CLIENT_ID");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};

async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<TokenResponse> {
  const clientId = requireEnv("GOOGLE_CLIENT_ID");
  const clientSecret = requireEnv("GOOGLE_CLIENT_SECRET");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`トークン取得に失敗しました: ${text.slice(0, 300)}`);
  }

  return res.json();
}

async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const clientId = requireEnv("GOOGLE_CLIENT_ID");
  const clientSecret = requireEnv("GOOGLE_CLIENT_SECRET");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`トークン更新に失敗しました: ${text.slice(0, 300)}`);
  }

  return res.json();
}

async function listFirstAccount(accessToken: string): Promise<string> {
  const res = await fetch(
    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Googleアカウント取得に失敗しました: ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  const account = data.accounts?.[0];
  if (!account) {
    throw new Error("Googleビジネスアカウントが見つかりませんでした");
  }
  return account.name as string; // "accounts/xxxxx"
}

async function listFirstLocation(
  accessToken: string,
  accountName: string
): Promise<string> {
  const res = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`店舗情報の取得に失敗しました: ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  const location = data.locations?.[0];
  if (!location) {
    throw new Error("Googleビジネスプロフィールの店舗が見つかりませんでした");
  }
  return location.name as string; // "locations/xxxxx"
}

/**
 * OAuthコールバックで受け取った認可コードから、アクセストークン取得〜
 * アカウント/店舗の特定〜DB保存までを行う。
 */
export async function completeGoogleOAuth(
  code: string,
  redirectUri: string
): Promise<void> {
  const tokens = await exchangeCodeForTokens(code, redirectUri);
  if (!tokens.refresh_token) {
    throw new Error(
      "refresh_tokenが取得できませんでした。Googleアカウントの連携を一度解除してから再度お試しください。"
    );
  }

  const accountName = await listFirstAccount(tokens.access_token);
  const locationName = await listFirstLocation(tokens.access_token, accountName);

  const supabase = createServiceRoleClient();
  const salonId = await getCurrentSalonId();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  const { error } = await supabase.from("google_connections").upsert(
    {
      salon_id: salonId,
      google_account_id: accountName,
      google_location_id: locationName,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "salon_id" }
  );

  if (error) {
    throw new Error(`Google連携情報の保存に失敗しました: ${error.message}`);
  }
}

type GoogleConnection = {
  google_account_id: string;
  google_location_id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
};

export async function getGoogleConnection(): Promise<GoogleConnection | null> {
  const supabase = createServiceRoleClient();
  const salonId = await getCurrentSalonId();
  const { data } = await supabase
    .from("google_connections")
    .select(
      "google_account_id, google_location_id, access_token, refresh_token, token_expires_at"
    )
    .eq("salon_id", salonId)
    .maybeSingle();
  return data;
}

async function getValidAccessToken(connection: GoogleConnection): Promise<string> {
  const expiresAt = new Date(connection.token_expires_at).getTime();
  const isExpiringSoon = expiresAt - Date.now() < 60 * 1000;

  if (!isExpiringSoon) {
    return connection.access_token;
  }

  const tokens = await refreshAccessToken(connection.refresh_token);
  const supabase = createServiceRoleClient();
  const salonId = await getCurrentSalonId();
  const expiresAt2 = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await supabase
    .from("google_connections")
    .update({
      access_token: tokens.access_token,
      token_expires_at: expiresAt2,
      updated_at: new Date().toISOString(),
    })
    .eq("salon_id", salonId);

  return tokens.access_token;
}

async function getAuthorizedConnection(): Promise<{
  accessToken: string;
  connection: GoogleConnection;
}> {
  const connection = await getGoogleConnection();
  if (!connection) {
    throw new Error("Googleアカウントが連携されていません");
  }
  const accessToken = await getValidAccessToken(connection);
  return { accessToken, connection };
}

/**
 * Googleビジネスプロフィールに投稿(Local Post)を作成する。
 * 画像は含めず、テキストのみのシンプルな投稿(MVP)。
 */
export async function createGoogleLocalPost(summary: string): Promise<string> {
  const { accessToken, connection } = await getAuthorizedConnection();

  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/${connection.google_account_id}/${connection.google_location_id}/localPosts`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        languageCode: "ja",
        summary,
        topicType: "STANDARD",
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Googleへの投稿に失敗しました: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  return data.name as string;
}

export type GoogleReview = {
  name: string; // "accounts/*/locations/*/reviews/*"
  reviewerName: string | null;
  starRating: string | null;
  comment: string | null;
  createTime: string | null;
  existingReplyComment: string | null;
};

/**
 * Googleビジネスプロフィールに投稿された口コミの一覧を取得する。
 */
export async function listGoogleReviews(): Promise<GoogleReview[]> {
  const { accessToken, connection } = await getAuthorizedConnection();

  const reviews: GoogleReview[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(
      `https://mybusiness.googleapis.com/v4/${connection.google_account_id}/${connection.google_location_id}/reviews`
    );
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`口コミの取得に失敗しました: ${text.slice(0, 300)}`);
    }

    const data = await res.json();
    for (const r of data.reviews ?? []) {
      reviews.push({
        name: r.name,
        reviewerName: r.reviewer?.displayName ?? null,
        starRating: r.starRating ?? null,
        comment: r.comment ?? null,
        createTime: r.createTime ?? null,
        existingReplyComment: r.reviewReply?.comment ?? null,
      });
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  return reviews;
}

/**
 * 口コミへの返信を送信する(既に返信がある場合は上書き)。
 */
export async function replyToGoogleReview(
  reviewName: string,
  comment: string
): Promise<void> {
  const { accessToken } = await getAuthorizedConnection();

  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/${reviewName}/reply`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ comment }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`口コミへの返信送信に失敗しました: ${text.slice(0, 300)}`);
  }
}
