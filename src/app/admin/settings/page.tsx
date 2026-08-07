import { createServiceRoleClient } from "@/lib/supabase/server";
import { getCurrentSalonId } from "@/lib/salon";
import { WordPressForm } from "./wordpress-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = createServiceRoleClient();
  const salonId = await getCurrentSalonId();

  const { data: salon } = await supabase
    .from("salons")
    .select("wordpress_url, wordpress_username, wordpress_post_status")
    .eq("id", salonId)
    .single();

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold text-stone-900">連携設定</h1>

      <WordPressForm
        wordpressUrl={salon?.wordpress_url ?? null}
        wordpressUsername={salon?.wordpress_username ?? null}
        wordpressPostStatus={salon?.wordpress_post_status ?? "draft"}
      />
    </>
  );
}
