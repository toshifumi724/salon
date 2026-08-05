"use client";

import { useActionState } from "react";
import { saveWordPressSettings, type SaveWordPressSettingsState } from "./actions";

const initialState: SaveWordPressSettingsState = {};

type Props = {
  wordpressUrl: string | null;
  wordpressUsername: string | null;
  wordpressPostStatus: string;
};

export function WordPressForm({
  wordpressUrl,
  wordpressUsername,
  wordpressPostStatus,
}: Props) {
  const [state, formAction, pending] = useActionState(
    saveWordPressSettings,
    initialState
  );

  return (
    <form
      action={formAction}
      className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
    >
      <h2 className="mb-3 text-sm font-medium text-gray-700">WordPress連携設定</h2>

      <label className="mb-1 block text-sm text-gray-700" htmlFor="wordpress_url">
        サイトURL
      </label>
      <input
        id="wordpress_url"
        name="wordpress_url"
        type="url"
        required
        defaultValue={wordpressUrl ?? ""}
        placeholder="https://your-site.example.com"
        className="mb-3 w-full rounded border border-gray-300 px-3 py-2 text-sm"
      />

      <label
        className="mb-1 block text-sm text-gray-700"
        htmlFor="wordpress_username"
      >
        ユーザー名
      </label>
      <input
        id="wordpress_username"
        name="wordpress_username"
        type="text"
        required
        defaultValue={wordpressUsername ?? ""}
        className="mb-3 w-full rounded border border-gray-300 px-3 py-2 text-sm"
      />

      <label
        className="mb-1 block text-sm text-gray-700"
        htmlFor="wordpress_app_password"
      >
        アプリケーションパスワード
      </label>
      <input
        id="wordpress_app_password"
        name="wordpress_app_password"
        type="password"
        required
        placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
        className="mb-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
      />
      <p className="mb-3 text-xs text-gray-400">
        通常のログインパスワードではなく、WordPress管理画面の「ユーザー &gt;
        プロフィール &gt; アプリケーションパスワード」から発行してください。
        セキュリティのため現在の設定値は表示されません。
      </p>

      <label
        className="mb-1 block text-sm text-gray-700"
        htmlFor="wordpress_post_status"
      >
        投稿時の公開状態
      </label>
      <select
        id="wordpress_post_status"
        name="wordpress_post_status"
        defaultValue={wordpressPostStatus}
        className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="draft">下書き(確認後に手動で公開)</option>
        <option value="publish">即公開</option>
      </select>

      {state.error && <p className="mb-3 text-sm text-red-600">{state.error}</p>}
      {state.success && (
        <p className="mb-3 text-sm text-green-600">保存しました</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {pending ? "保存中..." : "保存する"}
      </button>
    </form>
  );
}
