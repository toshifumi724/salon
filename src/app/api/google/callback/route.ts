import { NextRequest, NextResponse } from "next/server";
import { completeGoogleOAuth } from "@/lib/google";

const STATE_COOKIE = "google_oauth_state";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const savedState = request.cookies.get(STATE_COOKIE)?.value;

  const fail = (message: string) =>
    NextResponse.redirect(
      new URL(`/admin?google_error=${encodeURIComponent(message)}`, request.url)
    );

  if (!code || !state || !savedState || state !== savedState) {
    return fail("Google連携の認可情報が確認できませんでした。もう一度お試しください。");
  }

  try {
    const redirectUri = `${request.nextUrl.origin}/api/google/callback`;
    await completeGoogleOAuth(code, redirectUri);
  } catch (err) {
    const message = err instanceof Error ? err.message : "不明なエラー";
    return fail(message);
  }

  const response = NextResponse.redirect(
    new URL("/admin?google_connected=1", request.url)
  );
  response.cookies.delete(STATE_COOKIE);
  return response;
}
