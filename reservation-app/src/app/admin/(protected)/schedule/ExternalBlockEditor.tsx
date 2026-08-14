"use client";

import { useState, useTransition } from "react";
import type { ExternalBlockedSlot, Staff } from "@/lib/types";
import { addExternalBlock, deleteExternalBlock } from "./actions";

function todayJST(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

export default function ExternalBlockEditor({
  staffList,
  blocks,
}: {
  staffList: Staff[];
  blocks: ExternalBlockedSlot[];
}) {
  const [staffId, setStaffId] = useState(staffList[0]?.id ?? "");
  const [date, setDate] = useState(todayJST());
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const staffName = (id: string) => staffList.find((s) => s.id === id)?.name ?? "";

  function add() {
    setError(null);
    startTransition(async () => {
      try {
        await addExternalBlock({ staffId, date, startTime, endTime, note });
        setNote("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "登録に失敗しました");
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteExternalBlock(id);
    });
  }

  const sorted = [...blocks].sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));

  return (
    <div className="space-y-4 rounded-lg border border-brand-divider bg-brand-surface p-4 shadow-sm">
      <p className="text-sm text-brand-text/70">
        サロンボードなど、このアプリ以外で入った予約をここに登録しておくと、二重予約を防げます。
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {staffList.length > 1 && (
          <select
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            className="rounded border border-brand-divider bg-white p-2 text-brand-text"
          >
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded border border-brand-divider bg-white p-2 text-brand-text"
        />
        <input
          type="time"
          value={startTime}
          step={1800}
          onChange={(e) => setStartTime(e.target.value)}
          className="rounded border border-brand-divider bg-white p-2 text-brand-text"
        />
        〜
        <input
          type="time"
          value={endTime}
          step={1800}
          onChange={(e) => setEndTime(e.target.value)}
          className="rounded border border-brand-divider bg-white p-2 text-brand-text"
        />
        <input
          type="text"
          placeholder="メモ(任意・お客様名など)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="rounded border border-brand-divider bg-white p-2 text-brand-text"
        />
        <button
          type="button"
          disabled={pending || !staffId}
          onClick={add}
          className="rounded bg-brand-strong px-3 py-2 text-white transition-colors hover:bg-brand-heading disabled:opacity-50"
        >
          追加
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-1">
        {sorted.length === 0 && <p className="text-sm text-brand-text/60">登録されている外部予約ブロックはありません。</p>}
        {sorted.map((b) => (
          <div
            key={b.id}
            className="flex flex-wrap items-center gap-2 rounded border border-brand-divider bg-white p-2 text-sm text-brand-text"
          >
            <span>{b.date}</span>
            <span>
              {b.start_time.slice(0, 5)}〜{b.end_time.slice(0, 5)}
            </span>
            <span className="text-brand-text/60">{staffName(b.staff_id)}</span>
            {b.external_ref && <span className="text-brand-text/60">{b.external_ref}</span>}
            <button type="button" onClick={() => remove(b.id)} className="ml-auto text-red-600">
              削除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
