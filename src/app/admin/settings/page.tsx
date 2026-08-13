import { createServiceRoleClient } from "@/lib/supabase/server";
import { getCurrentSalonId } from "@/lib/salon";
import { WordPressForm } from "./wordpress-form";
import { ToneForm } from "./tone-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = createServiceRoleClient();
  const salonId = await getCurrentSalonId();

  const { data: salon } = await supabase
    .from("salons")
    .select(
      "wordpress_url, wordpress_username, wordpress_post_status, tone_level, target_customer, brand_keywords, use_emoji, style_sample"
    )
    .eq("id", salonId)
    .single();

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold text-stone-900">連携設定</h1>

      <div className="space-y-6">
        <ToneForm
          toneLevel={salon?.tone_level ?? "friendly"}
          targetCustomer={salon?.target_customer ?? null}
          brandKeywords={salon?.brand_keywords ?? null}
          useEmoji={salon?.use_emoji ?? false}
          styleSample={salon?.style_sample ?? null}
        />

        <WordPressForm
          wordpressUrl={salon?.wordpress_url ?? null}
          wordpressUsername={salon?.wordpress_username ?? null}
          wordpressPostStatus={salon?.wordpress_post_status ?? "draft"}
        />
      </div>
    </>
  );
}
