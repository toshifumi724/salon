import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service Role Keyを使うサーバー専用クライアント(RLSを無視して全操作可能)。
// API Route / Server Action からのみ使用し、絶対にクライアントコンポーネントに渡さないこと。
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
