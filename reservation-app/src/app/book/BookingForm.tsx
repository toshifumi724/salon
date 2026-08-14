"use client";

import { useEffect, useState } from "react";
import type { Menu } from "@/lib/types";

function todayJST(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

export default function BookingForm({ menus }: { menus: Menu[] }) {
  const [menuId, setMenuId] = useState(menus[0]?.id ?? "");
  const [date, setDate] = useState(todayJST());
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ cancelToken: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!menuId || !date) return;
    let ignore = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- データ取得開始を示すための正当なローディング状態更新
    setLoadingSlots(true);
    setTime(null);
    fetch(`/api/availability?date=${date}&menuId=${menuId}`)
      .then((r) => r.json())
      .then((d) => {
        if (ignore) return;
        setSlots(d.slots ?? []);
      })
      .finally(() => {
        if (!ignore) setLoadingSlots(false);
      });
    return () => {
      ignore = true;
    };
  }, [menuId, date, refreshKey]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!time) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuId, date, time, name, email, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "予約に失敗しました");
        return;
      }
      setResult({ cancelToken: data.cancelToken });
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="rounded-lg border border-brand-divider bg-brand-surface p-4 shadow-sm">
        <p className="mb-2 font-heading text-lg text-brand-heading">ご予約が確定しました。</p>
        <p className="mb-4 text-sm text-brand-text/70">確認メールをお送りしました。</p>
        <a
          className="mb-2 block text-brand-strong underline hover:text-brand-heading"
          href={`/r/${result.cancelToken}`}
        >
          予約内容の確認・変更・キャンセルはこちら
        </a>
        <button
          type="button"
          onClick={() => {
            setResult(null);
            setTime(null);
            setName("");
            setEmail("");
            setPhone("");
            setRefreshKey((k) => k + 1);
          }}
          className="text-brand-strong underline hover:text-brand-heading"
        >
          他の日程でもう1件予約する
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section>
        <h2 className="mb-2 font-heading text-brand-heading">1. メニューを選択</h2>
        <div className="space-y-2">
          {menus.map((m) => (
            <label
              key={m.id}
              className={`flex items-center gap-2 rounded-lg border p-2 transition-colors ${
                menuId === m.id
                  ? "border-brand-strong bg-brand-surface"
                  : "border-brand-divider bg-brand-surface/60"
              }`}
            >
              <input
                type="radio"
                name="menu"
                checked={menuId === m.id}
                onChange={() => setMenuId(m.id)}
                className="accent-brand-strong"
              />
              <span className="text-brand-text">
                {m.name}（{m.duration_minutes}分・{m.price_yen.toLocaleString()}円）
              </span>
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-heading text-brand-heading">2. 日付を選択</h2>
        <input
          type="date"
          value={date}
          min={todayJST()}
          onChange={(e) => setDate(e.target.value)}
          className="rounded border border-brand-divider bg-brand-surface p-2 text-brand-text focus:border-brand-heading focus:outline-none"
        />
      </section>

      <section>
        <h2 className="mb-2 font-heading text-brand-heading">3. 時間を選択</h2>
        {loadingSlots && <p className="text-sm text-brand-text/60">空き状況を確認中...</p>}
        {!loadingSlots && slots.length === 0 && (
          <p className="text-sm text-brand-text/60">この日は空きがありません。別の日をお選びください。</p>
        )}
        <div className="flex flex-wrap gap-2">
          {slots.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setTime(s)}
              className={`rounded border px-3 py-1 transition-colors ${
                time === s
                  ? "border-brand-strong bg-brand-strong text-white"
                  : "border-brand-divider bg-brand-surface text-brand-text hover:border-brand-heading"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      {time && (
        <section className="space-y-2">
          <h2 className="mb-2 font-heading text-brand-heading">4. お客様情報</h2>
          <input
            required
            placeholder="お名前"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-brand-divider bg-brand-surface p-2 text-brand-text focus:border-brand-heading focus:outline-none"
          />
          <input
            required
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-brand-divider bg-brand-surface p-2 text-brand-text focus:border-brand-heading focus:outline-none"
          />
          <input
            placeholder="電話番号(任意)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded border border-brand-divider bg-brand-surface p-2 text-brand-text focus:border-brand-heading focus:outline-none"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-brand-strong p-2 text-white transition-colors hover:bg-brand-heading disabled:opacity-50"
          >
            {submitting ? "送信中..." : "この内容で予約する"}
          </button>
        </section>
      )}
    </form>
  );
}
