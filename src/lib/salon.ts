import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth";

/**
 * ログイン中のサロンIDを取得する。/admin配下はproxy.tsで認証必須のため、
 * 通常はここでエラーになることはない。
 */
export async function getCurrentSalonId(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const salonId = await verifySessionCookie(token);

  if (!salonId) {
    throw new Error("ログインしていません");
  }

  return salonId;
}
