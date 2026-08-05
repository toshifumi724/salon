import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/google";

const STATE_COOKIE = "google_oauth_state";

export async function GET(request: NextRequest) {
  const state = crypto.randomUUID();
  const redirectUri = `${request.nextUrl.origin}/api/google/callback`;

  let authUrl: string;
  try {
    authUrl = getGoogleAuthUrl(redirectUri, state);
  } catch (err) {
    const message = err instanceof Error ? err.message : "不明なエラー";
    return NextResponse.redirect(
      new URL(`/admin?google_error=${encodeURIComponent(message)}`, request.url)
    );
  }

  const response = NextResponse.redirect(authUrl);
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10分
  });
  return response;
}
