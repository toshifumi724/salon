import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { addMenu } from "./actions";
import ToggleMenuButton from "./ToggleMenuButton";

export const dynamic = "force-dynamic";

export default async function MenusPage() {
  const { salonId } = await requireAdmin();
  const admin = createAdminClient();
  const { data: menus } = await admin
    .from("menus")
    .select("*")
    .eq("salon_id", salonId)
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl tracking-wide text-brand-heading">メニュー設定</h1>

      <div className="space-y-2">
        {(menus ?? []).map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between rounded-lg border border-brand-divider bg-brand-surface p-2 text-sm text-brand-text shadow-sm"
          >
            <span>
              {m.name}（{m.duration_minutes}分・{m.price_yen.toLocaleString()}円）{!m.is_active && "[非公開]"}
            </span>
            <ToggleMenuButton menuId={m.id} isActive={m.is_active} />
          </div>
        ))}
      </div>

      <form action={addMenu} className="space-y-2 rounded-lg border border-brand-divider bg-brand-surface p-4 shadow-sm">
        <h2 className="font-bold text-brand-strong">新しいメニューを追加</h2>
        <input
          name="name"
          required
          placeholder="メニュー名(例: カラー)"
          className="w-full rounded border border-brand-divider bg-white p-2 text-brand-text focus:border-brand-heading focus:outline-none"
        />
        <input
          name="duration_minutes"
          required
          type="number"
          min={5}
          step={5}
          placeholder="所要時間(分)"
          className="w-full rounded border border-brand-divider bg-white p-2 text-brand-text focus:border-brand-heading focus:outline-none"
        />
        <input
          name="price_yen"
          required
          type="number"
          min={0}
          placeholder="料金(円)"
          className="w-full rounded border border-brand-divider bg-white p-2 text-brand-text focus:border-brand-heading focus:outline-none"
        />
        <button
          type="submit"
          className="w-full rounded bg-brand-strong p-2 text-white transition-colors hover:bg-brand-heading"
        >
          追加する
        </button>
      </form>
    </div>
  );
}
