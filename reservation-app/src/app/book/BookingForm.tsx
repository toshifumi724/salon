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
  }, [menuId, date]);

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
      <div className="rounded border p-4">
        <p className="mb-2 font-bold">ご予約が確定しました。</p>
        <p className="mb-4 text-sm text-gray-600">確認メールをお送りしました。</p>
        <a className="text-blue-600 underline" href={`/r/${result.cancelToken}`}>
          予約内容の確認・変更・キャンセルはこちら
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section>
        <h2 className="mb-2 font-bold">1. メニューを選択</h2>
        <div className="space-y-2">
          {menus.map((m) => (
            <label key={m.id} className="flex items-center gap-2 rounded border p-2">
              <input
                type="radio"
                name="menu"
                checked={menuId === m.id}
                onChange={() => setMenuId(m.id)}
              />
              <span>
                {m.name}（{m.duration_minutes}分・{m.price_yen.toLocaleString()}円）
              </span>
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-bold">2. 日付を選択</h2>
        <input
          type="date"
          value={date}
          min={todayJST()}
          onChange={(e) => setDate(e.target.value)}
          className="rounded border p-2"
        />
      </section>

      <section>
        <h2 className="mb-2 font-bold">3. 時間を選択</h2>
        {loadingSlots && <p className="text-sm text-gray-500">空き状況を確認中...</p>}
        {!loadingSlots && slots.length === 0 && (
          <p className="text-sm text-gray-500">この日は空きがありません。別の日をお選びください。</p>
        )}
        <div className="flex flex-wrap gap-2">
          {slots.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setTime(s)}
              className={`rounded border px-3 py-1 ${time === s ? "bg-black text-white" : ""}`}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      {time && (
        <section className="space-y-2">
          <h2 className="mb-2 font-bold">4. お客様情報</h2>
          <input
            required
            placeholder="お名前"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border p-2"
          />
          <input
            required
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border p-2"
          />
          <input
            placeholder="電話番号(任意)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded border p-2"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-black p-2 text-white disabled:opacity-50"
          >
            {submitting ? "送信中..." : "この内容で予約する"}
          </button>
        </section>
      )}
    </form>
  );
}
