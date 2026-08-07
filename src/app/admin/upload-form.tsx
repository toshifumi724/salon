"use client";

import { useActionState } from "react";
import { createPost, type CreatePostState } from "./actions";

const initialState: CreatePostState = {};

export function UploadForm() {
  const [state, formAction, pending] = useActionState(
    createPost,
    initialState
  );

  return (
    <form
      action={formAction}
      className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
    >
      <h2 className="mb-4 text-sm font-medium text-stone-700">新規投稿</h2>

      <label className="mb-1.5 block text-sm font-medium text-stone-700" htmlFor="images">
        写真
      </label>
      <input
        id="images"
        name="images"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        required
        className="mb-1 block w-full text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-stone-700 hover:file:bg-stone-200"
      />
      <p className="mb-4 text-xs text-stone-400">
        最大5枚・JPEG/PNG/WEBP・1枚5MBまで
      </p>

      <label className="mb-1.5 block text-sm font-medium text-stone-700" htmlFor="comment">
        コメント
      </label>
      <textarea
        id="comment"
        name="comment"
        required
        rows={4}
        placeholder="今日のスタイリングのポイントなど..."
        className="mb-4 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
      />

      {state.error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          投稿を保存しました
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-50"
      >
        {pending ? "アップロード中..." : "投稿する"}
      </button>
    </form>
  );
}
