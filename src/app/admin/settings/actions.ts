"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getCurrentSalonId } from "@/lib/salon";

export type SaveWordPressSettingsState = { error?: string; success?: boolean };

export async function saveWordPressSettings(
  _prevState: SaveWordPressSettingsState,
  formData: FormData
): Promise<SaveWordPressSettingsState> {
  const siteUrl = String(formData.get("wordpress_url") ?? "").trim();
  const username = String(formData.get("wordpress_username") ?? "").trim();
  const appPassword = String(formData.get("wordpress_app_password") ?? "").trim();
  const postStatus = String(formData.get("wordpress_post_status") ?? "draft");

  if (!siteUrl || !username || !appPassword) {
    return { error: "URL・ユーザー名・アプリケーションパスワードをすべて入力してください" };
  }

  try {
    const supabase = createServiceRoleClient();
    const salonId = await getCurrentSalonId();

    const { error } = await supabase
      .from("salons")
      .update({
        wordpress_url: siteUrl,
        wordpress_username: username,
        wordpress_app_password: appPassword,
        wordpress_post_status: postStatus === "publish" ? "publish" : "draft",
      })
      .eq("id", salonId);

    if (error) {
      return { error: `保存に失敗しました: ${error.message}` };
    }

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "不明なエラー";
    return { error: `保存に失敗しました: ${message}` };
  }
}

const TONE_LEVELS = ["polite", "friendly", "casual"] as const;
const STYLE_SAMPLE_MAX_LENGTH = 1500;

export type SaveToneSettingsState = { error?: string; success?: boolean };

export async function saveToneSettings(
  _prevState: SaveToneSettingsState,
  formData: FormData
): Promise<SaveToneSettingsState> {
  const toneLevelInput = String(formData.get("tone_level") ?? "friendly");
  const toneLevel = (
    TONE_LEVELS as readonly string[]
  ).includes(toneLevelInput)
    ? toneLevelInput
    : "friendly";
  const targetCustomer = String(formData.get("target_customer") ?? "").trim();
  const brandKeywords = String(formData.get("brand_keywords") ?? "").trim();
  const useEmoji = formData.get("use_emoji") === "on";
  const styleSample = String(formData.get("style_sample") ?? "")
    .trim()
    .slice(0, STYLE_SAMPLE_MAX_LENGTH);

  try {
    const supabase = createServiceRoleClient();
    const salonId = await getCurrentSalonId();

    const { error } = await supabase
      .from("salons")
      .update({
        tone_level: toneLevel,
        target_customer: targetCustomer || null,
        brand_keywords: brandKeywords || null,
        use_emoji: useEmoji,
        style_sample: styleSample || null,
      })
      .eq("id", salonId);

    if (error) {
      return { error: `保存に失敗しました: ${error.message}` };
    }

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "不明なエラー";
    return { error: `保存に失敗しました: ${message}` };
  }
}
