"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <main className="mx-auto max-w-md bg-brand-bg p-4 text-brand-text">
        <p>{email} 宛にログイン用のリンクを送信しました。メールをご確認ください。</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md bg-brand-bg p-4">
      <h1 className="mb-4 font-heading text-2xl tracking-wide text-brand-heading">会員ログイン</h1>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          required
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border border-brand-divider bg-brand-surface p-2 text-brand-text focus:border-brand-heading focus:outline-none"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="w-full rounded bg-brand-strong p-2 text-white transition-colors hover:bg-brand-heading"
        >
          ログインリンクを送る
        </button>
      </form>
    </main>
  );
}
