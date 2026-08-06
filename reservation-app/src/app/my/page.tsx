import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jstDateOf, jstMinutesOfDay } from "@/lib/jst";
import CancelButton from "@/components/CancelButton";

export const dynamic = "force-dynamic";

export default async function MyReservationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = createAdminClient();
  const { data: customer } = await admin.from("customers").select("id").eq("user_id", user.id).maybeSingle();

  const { data: reservations } = customer
    ? await admin
        .from("reservations")
        .select("id, status, start_at, menus(name)")
        .eq("customer_id", customer.id)
        .order("start_at", { ascending: false })
    : { data: [] };

  return (
    <main className="mx-auto max-w-md space-y-4 bg-brand-bg p-4">
      <h1 className="font-heading text-2xl tracking-wide text-brand-heading">マイ予約</h1>
      {(reservations ?? []).length === 0 && <p className="text-sm text-brand-text/60">予約履歴がありません。</p>}
      {(reservations ?? []).map((r) => {
        const menu = r.menus as unknown as { name: string } | null;
        const minutes = jstMinutesOfDay(r.start_at);
        const timeLabel = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
        return (
          <div key={r.id} className="space-y-2 rounded-lg border border-brand-divider bg-brand-surface p-4 text-brand-text shadow-sm">
            <p>メニュー: {menu?.name}</p>
            <p>
              日時: {jstDateOf(r.start_at)} {timeLabel}
            </p>
            <p>ステータス: {r.status === "confirmed" ? "確定" : "キャンセル済み"}</p>
            {r.status === "confirmed" && <CancelButton reservationId={r.id} />}
          </div>
        );
      })}
      <a href="/book" className="block text-center text-brand-strong underline hover:text-brand-heading">
        新しく予約する
      </a>
    </main>
  );
}
