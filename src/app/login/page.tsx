"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-rose-600 text-lg font-semibold text-white">
            サ
          </div>
          <h1 className="text-lg font-semibold text-stone-900">
            サロン管理にログイン
          </h1>
        </div>

        <form
          action={formAction}
          className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          <label
            className="mb-1.5 block text-sm font-medium text-stone-700"
            htmlFor="email"
          >
            メールアドレス
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoFocus
            className="mb-4 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
          />

          <label
            className="mb-1.5 block text-sm font-medium text-stone-700"
            htmlFor="password"
          >
            パスワード
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="mb-4 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
          />

          {state.error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-rose-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-50"
          >
            {pending ? "確認中..." : "ログイン"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-stone-500">
          アカウントをお持ちでない方は{" "}
          <Link
            href="/signup"
            className="font-medium text-rose-600 hover:underline"
          >
            新規登録
          </Link>
        </p>
      </div>
    </main>
  );
}
