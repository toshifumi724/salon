import { createAdminClient } from "./supabase/admin";

/** MVPは単一サロン運用のため、env の DEFAULT_SALON_ID を正とする */
export function getDefaultSalonId(): string {
  const id = process.env.DEFAULT_SALON_ID;
  if (!id) throw new Error("DEFAULT_SALON_ID が未設定です。.env を確認してください。");
  return id;
}

/** スタッフ未指定時に使うデフォルトスタッフ(現状1人体制のため先頭のスタッフ) */
export async function getDefaultStaffId(salonId: string): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("staff")
    .select("id")
    .eq("salon_id", salonId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(1)
    .single();
  if (error || !data) throw new Error("有効なスタッフが登録されていません。管理画面から登録してください。");
  return data.id;
}
