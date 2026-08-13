import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

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

export type SalonToneProfile = {
  toneLevel: "polite" | "friendly" | "casual";
  targetCustomer: string | null;
  brandKeywords: string | null;
  useEmoji: boolean;
  styleSample: string | null;
};

/**
 * コンテンツ生成の文体をサロンごとに調整するためのプロフィールを取得する。
 */
export async function getSalonToneProfile(
  salonId: string
): Promise<SalonToneProfile> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("salons")
    .select("tone_level, target_customer, brand_keywords, use_emoji, style_sample")
    .eq("id", salonId)
    .single();

  return {
    toneLevel: (data?.tone_level as SalonToneProfile["toneLevel"]) ?? "friendly",
    targetCustomer: data?.target_customer ?? null,
    brandKeywords: data?.brand_keywords ?? null,
    useEmoji: data?.use_emoji ?? false,
    styleSample: data?.style_sample ?? null,
  };
}
