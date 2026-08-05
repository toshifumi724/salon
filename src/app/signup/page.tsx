"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup, type SignupState } from "./actions";

const initialState: SignupState = {};

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h1 className="mb-4 text-lg font-semibold text-gray-900">
          新規サロン登録
        </h1>

        <label className="mb-1 block text-sm text-gray-700" htmlFor="salon_name">
          サロン名
        </label>
        <input
          id="salon_name"
          name="salon_name"
          type="text"
          required
          autoFocus
          className="mb-3 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
        />

        <label className="mb-1 block text-sm text-gray-700" htmlFor="email">
          メールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mb-3 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
        />

        <label className="mb-1 block text-sm text-gray-700" htmlFor="password">
          パスワード(8文字以上)
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="mb-3 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
        />

        {state.error && (
          <p className="mb-3 text-sm text-red-600">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {pending ? "登録中..." : "登録する"}
        </button>

        <p className="mt-3 text-center text-sm text-gray-500">
          既にアカウントをお持ちの方は{" "}
          <Link href="/login" className="text-gray-900 underline">
            ログイン
          </Link>
        </p>
      </form>
    </main>
  );
}
