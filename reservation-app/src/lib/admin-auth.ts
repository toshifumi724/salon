import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** 管理画面の各ページで呼び出し、管理者でなければ /admin/login へリダイレクトする */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const admin = createAdminClient();
  const { data: adminUser } = await admin
    .from("admin_users")
    .select("salon_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminUser) redirect("/admin/login?error=not_admin");

  return { user, salonId: adminUser.salon_id as string };
}
