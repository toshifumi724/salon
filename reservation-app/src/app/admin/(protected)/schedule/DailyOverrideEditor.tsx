"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Menu, Staff } from "@/lib/types";
import { upsertDailyOverride, clearDailyOverride } from "./actions";

function todayJST(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

export default function DailyOverrideEditor({ staffList, menus }: { staffList: Staff[]; menus: Menu[] }) {
  const [staffId, setStaffId] = useState(staffList[0]?.id ?? "");
  const [date, setDate] = useState(todayJST());
  const [menuId, setMenuId] = useState(menus[0]?.id ?? "");
  const [autoSlots, setAutoSlots] = useState<string[]>([]);
  const [times, setTimes] = useState<string[]>([]);
  const [isClosed, setIsClosed] = useState(false);
  const [newTime, setNewTime] = useState("09:00");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!menuId || !date) return;
    fetch(`/api/availability?date=${date}&menuId=${menuId}&staffId=${staffId}`)
      .then((r) => r.json())
      .then((d) => setAutoSlots(d.slots ?? []));
  }, [menuId, date, staffId]);

  useEffect(() => {
    if (!staffId || !date) return;
    const supabase = createClient();
    supabase
      .from("daily_slot_overrides")
      .select("is_closed, start_times")
      .eq("staff_id", staffId)
      .eq("date", date)
      .maybeSingle()
      .then(({ data }) => {
        setIsClosed(data?.is_closed ?? false);
        setTimes(data?.start_times ?? []);
      });
  }, [staffId, date]);

  function save() {
    startTransition(async () => {
      await upsertDailyOverride({ staffId, date, isClosed, startTimes: times });
      setMessage("保存しました");
    });
  }

  function clear() {
    startTransition(async () => {
      await clearDailyOverride({ staffId, date });
      setTimes([]);
      setIsClosed(false);
      setMessage("自動計算に戻しました");
    });
  }

  return (
    <div className="space-y-4 rounded border p-4">
      <div className="flex flex-wrap gap-2">
        {staffList.length > 1 && (
          <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="rounded border p-2">
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded border p-2" />
        <select value={menuId} onChange={(e) => setMenuId(e.target.value)} className="rounded border p-2">
          {menus.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}({m.duration_minutes}分) の場合で自動計算をプレビュー
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm text-gray-600">自動計算した場合の枠: {autoSlots.join(", ") || "なし"}</p>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isClosed} onChange={(e) => setIsClosed(e.target.checked)} />
        この日は臨時休業にする
      </label>

      {!isClosed && (
        <div>
          <p className="mb-1 text-sm font-bold">この日の予約開始時刻(手動指定・30分刻み)</p>
          <div className="mb-2 flex flex-wrap gap-2">
            {times.map((t) => (
              <span key={t} className="flex items-center gap-1 rounded border px-2 py-1 text-sm">
                {t}
                <button type="button" onClick={() => setTimes(times.filter((x) => x !== t))} className="text-red-600">
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="time"
              step={1800}
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="rounded border p-1"
            />
            <button
              type="button"
              onClick={() => {
                if (!times.includes(newTime)) setTimes([...times, newTime].sort());
              }}
              className="rounded border px-2 py-1 text-sm"
            >
              追加
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button disabled={pending} onClick={save} className="rounded bg-black px-4 py-2 text-sm text-white">
          この日の設定を保存
        </button>
        <button disabled={pending} onClick={clear} className="rounded border px-4 py-2 text-sm">
          自動計算に戻す(設定削除)
        </button>
      </div>
      {message && <p className="text-sm text-green-700">{message}</p>}
    </div>
  );
}
