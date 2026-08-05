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
