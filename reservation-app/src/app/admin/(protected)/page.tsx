import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { jstDateOf, jstMinutesOfDay } from "@/lib/jst";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const { salonId } = await requireAdmin();
  const admin = createAdminClient();

  const { data: reservations } = await admin
    .from("reservations")
    .select("id, status, start_at, guest_name, guest_phone, menus(name), staff(name)")
    .eq("salon_id", salonId)
    .eq("status", "confirmed")
    .gte("start_at", new Date().toISOString())
    .order("start_at", { ascending: true })
    .limit(50);

  const grouped = new Map<string, typeof reservations>();
  for (const r of reservations ?? []) {
    const date = jstDateOf(r.start_at);
    if (!grouped.has(date)) grouped.set(date, []);
    grouped.get(date)!.push(r);
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl tracking-wide text-brand-heading">予約一覧(今後の予約)</h1>
      {grouped.size === 0 && <p className="text-sm text-brand-text/60">今後の予約はありません。</p>}
      {[...grouped.entries()].map(([date, list]) => (
        <div key={date}>
          <h2 className="mb-2 font-bold text-brand-strong">{date}</h2>
          <div className="space-y-2">
            {list!.map((r) => {
              const minutes = jstMinutesOfDay(r.start_at);
              const timeLabel = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
              const menu = r.menus as unknown as { name: string } | null;
              const staff = r.staff as unknown as { name: string } | null;
              return (
                <div
                  key={r.id}
                  className="rounded-lg border border-brand-divider bg-brand-surface p-2 text-sm text-brand-text shadow-sm"
                >
                  <p>
                    {timeLabel} - {menu?.name}（担当: {staff?.name}）
                  </p>
                  <p>
                    {r.guest_name} 様 {r.guest_phone ?? ""}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
