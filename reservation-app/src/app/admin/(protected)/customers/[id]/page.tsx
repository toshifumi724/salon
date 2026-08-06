import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { jstDateOf, jstMinutesOfDay } from "@/lib/jst";
import MemoForm from "./MemoForm";
import NoteForm from "./NoteForm";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin();
  const admin = createAdminClient();

  const { data: customer } = await admin.from("customers").select("*").eq("id", id).single();
  const { data: reservations } = await admin
    .from("reservations")
    .select("id, status, start_at, menus(name)")
    .eq("customer_id", id)
    .order("start_at", { ascending: false });
  const { data: notes } = await admin
    .from("customer_notes")
    .select("id, note, created_at")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  if (!customer) return <p>顧客が見つかりません。</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">{customer.name} 様</h1>
        <p className="text-sm text-gray-600">
          {customer.email} {customer.phone}
        </p>
      </div>

      <section>
        <h2 className="mb-2 font-bold">顧客カルテ(メモ)</h2>
        <MemoForm customerId={customer.id} initialMemo={customer.memo ?? ""} />
      </section>

      <section>
        <h2 className="mb-2 font-bold">来店履歴</h2>
        <div className="space-y-2">
          {(reservations ?? []).map((r) => {
            const menu = r.menus as unknown as { name: string } | null;
            const minutes = jstMinutesOfDay(r.start_at);
            const timeLabel = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
            return (
              <div key={r.id} className="rounded border p-2 text-sm">
                {jstDateOf(r.start_at)} {timeLabel} - {menu?.name}
                （{r.status === "confirmed" ? "確定" : "キャンセル"}）
              </div>
            );
          })}
          {(reservations ?? []).length === 0 && <p className="text-sm text-gray-500">来店履歴がありません。</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-bold">接客メモ・履歴</h2>
        <NoteForm customerId={customer.id} />
        <div className="mt-2 space-y-2">
          {(notes ?? []).map((n) => (
            <div key={n.id} className="rounded border p-2 text-sm">
              <p>{n.note}</p>
              <p className="text-xs text-gray-500">{new Date(n.created_at).toLocaleString("ja-JP")}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
