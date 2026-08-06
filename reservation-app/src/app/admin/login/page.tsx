"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback?next=/admin` },
    });
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <main className="mx-auto max-w-md p-4">
        <p>{email} 宛にログイン用のリンクを送信しました。メールをご確認ください。</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-4 text-xl font-bold">サロン管理画面ログイン</h1>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          required
          type="email"
          placeholder="管理者メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border p-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="w-full rounded bg-black p-2 text-white">
          ログインリンクを送る
        </button>
      </form>
      <p className="mt-4 text-xs text-gray-500">
        ※事前にSupabaseの admin_users テーブルへ登録されたメールアドレスのみログインできます。
      </p>
    </main>
  );
}
