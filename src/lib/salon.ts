import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * MVPでは1サロンのみ運用のため、最初に登録されたサロンを既定のサロンとして扱う。
 * フェーズ3(マルチテナント化)でログイン中サロンを判定するロジックに置き換える。
 */
export async function getDefaultSalonId(): Promise<string> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("salons")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error(
      "サロン情報が見つかりません。SupabaseでSQLマイグレーションが実行されているか確認してください。"
    );
  }

  return data.id as string;
}
