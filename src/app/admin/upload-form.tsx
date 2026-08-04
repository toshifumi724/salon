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
      className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
    >
      <h2 className="mb-3 text-sm font-medium text-gray-700">新規投稿</h2>

      <label className="mb-1 block text-sm text-gray-700" htmlFor="images">
        写真(最大5枚・JPEG/PNG/WEBP・1枚5MBまで)
      </label>
      <input
        id="images"
        name="images"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        required
        className="mb-3 block w-full text-sm"
      />

      <label className="mb-1 block text-sm text-gray-700" htmlFor="comment">
        コメント
      </label>
      <textarea
        id="comment"
        name="comment"
        required
        rows={4}
        placeholder="今日のスタイリングのポイントなど..."
        className="mb-3 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
      />

      {state.error && (
        <p className="mb-3 text-sm text-red-600">{state.error}</p>
      )}
      {state.success && (
        <p className="mb-3 text-sm text-green-600">投稿を保存しました</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {pending ? "アップロード中..." : "投稿する"}
      </button>
    </form>
  );
}
