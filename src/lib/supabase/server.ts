import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * service role keyを使うクライアント。サーバー側(Server Action / Route Handler)専用。
 * クライアントコンポーネントには絶対に渡さないこと。
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabaseの環境変数が設定されていません(NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)"
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
