import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { updateBusinessHours } from "./actions";
import DailyOverrideEditor from "./DailyOverrideEditor";
import ExternalBlockEditor from "./ExternalBlockEditor";
import type { BusinessHour, ExternalBlockedSlot, Menu, Staff } from "@/lib/types";

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

  const { data: externalBlocks } = await admin
    .from("external_blocked_slots")
    .select("*")
    .eq("salon_id", salonId)
    .order("date", { ascending: true });

  return (
    <div className="space-y-8">
      <section>
        <h1 className="mb-4 font-heading text-2xl tracking-wide text-brand-heading">基本営業時間</h1>
        <form action={updateBusinessHours} className="space-y-2">
          {DAY_LABELS.map((label, day) => {
            const bh = businessHours.get(day);
            return (
              <div
                key={day}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-brand-divider bg-brand-surface p-2 text-sm text-brand-text shadow-sm"
              >
                <span className="w-8 font-bold text-brand-strong">{label}</span>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    name={`closed_${day}`}
                    defaultChecked={bh?.is_closed ?? false}
                    className="accent-brand-strong"
                  />
                  定休日
                </label>
                <input
                  type="time"
                  name={`open_${day}`}
                  step={1800}
                  defaultValue={bh?.open_time?.slice(0, 5) ?? "09:00"}
                  className="rounded border border-brand-divider bg-white p-1 focus:border-brand-heading focus:outline-none"
                />
                〜
                <input
                  type="time"
                  name={`close_${day}`}
                  step={1800}
                  defaultValue={bh?.close_time?.slice(0, 5) ?? "18:00"}
                  className="rounded border border-brand-divider bg-white p-1 focus:border-brand-heading focus:outline-none"
                />
              </div>
            );
          })}
          <button
            type="submit"
            className="rounded bg-brand-strong px-4 py-2 text-white transition-colors hover:bg-brand-heading"
          >
            保存する
          </button>
        </form>
      </section>

      <section>
        <h1 className="mb-2 font-heading text-2xl tracking-wide text-brand-heading">特定日の予約枠を手動調整</h1>
        <p className="mb-4 text-sm text-brand-text/70">
          通常はメニューの所要時間から自動で予約枠が計算されます。特定の日だけ枠を変更したい場合や、臨時休業にしたい場合はこちらで設定してください。
        </p>
        <DailyOverrideEditor staffList={(staff ?? []) as Staff[]} menus={(menus ?? []) as Menu[]} />
      </section>

      <section>
        <h1 className="mb-2 font-heading text-2xl tracking-wide text-brand-heading">
          外部予約(サロンボードなど)のブロック管理
        </h1>
        <ExternalBlockEditor
          staffList={(staff ?? []) as Staff[]}
          blocks={(externalBlocks ?? []) as ExternalBlockedSlot[]}
        />
      </section>
    </div>
  );
}
