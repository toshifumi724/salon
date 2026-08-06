import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { updateBusinessHours } from "./actions";
import DailyOverrideEditor from "./DailyOverrideEditor";
import type { BusinessHour, Menu, Staff } from "@/lib/types";

export const dynamic = "force-dynamic";

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export default async function SchedulePage() {
  const { salonId } = await requireAdmin();
  const admin = createAdminClient();

  const { data: businessHoursRaw } = await admin
    .from("business_hours")
    .select("*")
    .eq("salon_id", salonId)
    .order("day_of_week", { ascending: true });

  const businessHours = new Map<number, BusinessHour>();
  for (const bh of (businessHoursRaw ?? []) as BusinessHour[]) businessHours.set(bh.day_of_week, bh);

  const { data: staff } = await admin
    .from("staff")
    .select("*")
    .eq("salon_id", salonId)
    .eq("is_active", true)
    .order("sort_order");

  const { data: menus } = await admin
    .from("menus")
    .select("*")
    .eq("salon_id", salonId)
    .eq("is_active", true)
    .order("sort_order");

  return (
    <div className="space-y-8">
      <section>
        <h1 className="mb-4 text-xl font-bold">基本営業時間</h1>
        <form action={updateBusinessHours} className="space-y-2">
          {DAY_LABELS.map((label, day) => {
            const bh = businessHours.get(day);
            return (
              <div key={day} className="flex flex-wrap items-center gap-2 rounded border p-2 text-sm">
                <span className="w-8 font-bold">{label}</span>
                <label className="flex items-center gap-1">
                  <input type="checkbox" name={`closed_${day}`} defaultChecked={bh?.is_closed ?? false} />
                  定休日
                </label>
                <input
                  type="time"
                  name={`open_${day}`}
                  step={1800}
                  defaultValue={bh?.open_time?.slice(0, 5) ?? "09:00"}
                  className="rounded border p-1"
                />
                〜
                <input
                  type="time"
                  name={`close_${day}`}
                  step={1800}
                  defaultValue={bh?.close_time?.slice(0, 5) ?? "18:00"}
                  className="rounded border p-1"
                />
              </div>
            );
          })}
          <button type="submit" className="rounded bg-black px-4 py-2 text-white">
            保存する
          </button>
        </form>
      </section>

      <section>
        <h1 className="mb-2 text-xl font-bold">特定日の予約枠を手動調整</h1>
        <p className="mb-4 text-sm text-gray-600">
          通常はメニューの所要時間から自動で予約枠が計算されます。特定の日だけ枠を変更したい場合や、臨時休業にしたい場合はこちらで設定してください。
        </p>
        <DailyOverrideEditor staffList={(staff ?? []) as Staff[]} menus={(menus ?? []) as Menu[]} />
      </section>
    </div>
  );
}
