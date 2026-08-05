import Link from "next/link";
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
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">連携設定</h1>
        <Link href="/admin" className="text-sm text-gray-500 hover:underline">
          ← 投稿管理に戻る
        </Link>
      </div>

      <WordPressForm
        wordpressUrl={salon?.wordpress_url ?? null}
        wordpressUsername={salon?.wordpress_username ?? null}
        wordpressPostStatus={salon?.wordpress_post_status ?? "draft"}
      />
    </main>
  );
}
