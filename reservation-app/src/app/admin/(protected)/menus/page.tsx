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
      <h1 className="text-xl font-bold">メニュー設定</h1>

      <div className="space-y-2">
        {(menus ?? []).map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded border p-2 text-sm">
            <span>
              {m.name}（{m.duration_minutes}分・{m.price_yen.toLocaleString()}円）{!m.is_active && "[非公開]"}
            </span>
            <ToggleMenuButton menuId={m.id} isActive={m.is_active} />
          </div>
        ))}
      </div>

      <form action={addMenu} className="space-y-2 rounded border p-4">
        <h2 className="font-bold">新しいメニューを追加</h2>
        <input name="name" required placeholder="メニュー名(例: カラー)" className="w-full rounded border p-2" />
        <input
          name="duration_minutes"
          required
          type="number"
          min={5}
          step={5}
          placeholder="所要時間(分)"
          className="w-full rounded border p-2"
        />
        <input
          name="price_yen"
          required
          type="number"
          min={0}
          placeholder="料金(円)"
          className="w-full rounded border p-2"
        />
        <button type="submit" className="w-full rounded bg-black p-2 text-white">
          追加する
        </button>
      </form>
    </div>
  );
}
