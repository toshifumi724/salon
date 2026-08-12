"use client";

import { useState } from "react";

export default function AdminSignupPage() {
  const [salonName, setSalonName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salonName, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "登録に失敗しました");
        return;
      }
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="mx-auto max-w-md bg-brand-bg p-4 text-brand-text">
        <p className="mb-4">登録が完了しました。</p>
        <a className="text-brand-strong underline hover:text-brand-heading" href="/admin/login">
          ログイン画面へ進む
        </a>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md bg-brand-bg p-4">
      <h1 className="mb-4 font-heading text-2xl tracking-wide text-brand-heading">サロン管理者アカウント作成</h1>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          required
          placeholder="サロン名"
          value={salonName}
          onChange={(e) => setSalonName(e.target.value)}
          className="w-full rounded border border-brand-divider bg-brand-surface p-2 text-brand-text focus:border-brand-heading focus:outline-none"
        />
        <input
          required
          type="email"
          placeholder="管理者メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border border-brand-divider bg-brand-surface p-2 text-brand-text focus:border-brand-heading focus:outline-none"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-brand-strong p-2 text-white transition-colors hover:bg-brand-heading disabled:opacity-50"
        >
          {submitting ? "作成中..." : "アカウントを作成する"}
        </button>
      </form>
      <p className="mt-4 text-xs text-brand-text/60">
        作成後、ログイン画面からメールアドレスでログインしてください。
      </p>
    </main>
  );
}
