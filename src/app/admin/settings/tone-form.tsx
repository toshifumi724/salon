"use client";

import { useActionState } from "react";
import { saveToneSettings, type SaveToneSettingsState } from "./actions";

const initialState: SaveToneSettingsState = {};

type Props = {
  toneLevel: string;
  targetCustomer: string | null;
  brandKeywords: string | null;
  useEmoji: boolean;
  styleSample: string | null;
};

const inputClass =
  "mb-4 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100";

export function ToneForm({
  toneLevel,
  targetCustomer,
  brandKeywords,
  useEmoji,
  styleSample,
}: Props) {
  const [state, formAction, pending] = useActionState(
    saveToneSettings,
    initialState
  );

  return (
    <form
      action={formAction}
      className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
    >
      <h2 className="mb-4 text-sm font-medium text-stone-700">
        コンテンツ生成のトーン設定
      </h2>
      <p className="mb-4 text-xs text-stone-400">
        ブログ記事・Google投稿文・口コミ返信・ホットペッパー用文章など、AIが生成するすべての文章に反映されます。
      </p>

      <label className="mb-1.5 block text-sm font-medium text-stone-700" htmlFor="tone_level">
        敬語・丁寧さ
      </label>
      <select
        id="tone_level"
        name="tone_level"
        defaultValue={toneLevel}
        className={inputClass}
      >
        <option value="friendly">親しみやすい(標準)</option>
        <option value="polite">とても丁寧・格式のある敬語</option>
        <option value="casual">カジュアル・フランク</option>
      </select>

      <label
        className="mb-1.5 block text-sm font-medium text-stone-700"
        htmlFor="target_customer"
      >
        ターゲット顧客層(任意)
      </label>
      <input
        id="target_customer"
        name="target_customer"
        type="text"
        defaultValue={targetCustomer ?? ""}
        placeholder="例: 20代女性、初めてのお客様も多いです"
        className={inputClass}
      />

      <label
        className="mb-1.5 block text-sm font-medium text-stone-700"
        htmlFor="brand_keywords"
      >
        お店のこだわりワード(任意)
      </label>
      <input
        id="brand_keywords"
        name="brand_keywords"
        type="text"
        defaultValue={brandKeywords ?? ""}
        placeholder="例: オーガニックカラー、完全個室、担当制"
        className={inputClass}
      />

      <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-stone-700">
        <input
          type="checkbox"
          name="use_emoji"
          defaultChecked={useEmoji}
          className="h-4 w-4 rounded border-stone-300 text-rose-600 focus:ring-rose-500"
        />
        絵文字・記号を使う
      </label>

      <label
        className="mb-1.5 mt-3 block text-sm font-medium text-stone-700"
        htmlFor="style_sample"
      >
        過去の文章サンプル(任意)
      </label>
      <textarea
        id="style_sample"
        name="style_sample"
        defaultValue={styleSample ?? ""}
        rows={8}
        maxLength={1500}
        placeholder="ブログやSNSで実際に使った文章を貼り付けると、その言い回しや雰囲気に近づけて生成します"
        className={inputClass}
      />
      <p className="mb-4 -mt-2 text-xs text-stone-400">1500文字まで</p>

      {state.error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          保存しました
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-50"
      >
        {pending ? "保存中..." : "保存する"}
      </button>
    </form>
  );
}
