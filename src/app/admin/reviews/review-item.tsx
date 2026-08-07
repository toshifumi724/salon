"use client";

import { useState, useTransition } from "react";
import { generateReplyDraft, sendReviewReply } from "./actions";

type Props = {
  id: string;
  reviewerName: string | null;
  starRating: string | null;
  comment: string | null;
  reviewCreatedAt: string | null;
  aiReplyDraft: string | null;
  replyComment: string | null;
};

const STAR_COUNT: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

function Stars({ rating }: { rating: string }) {
  const count = STAR_COUNT[rating] ?? 0;
  return (
    <span className="text-sm text-amber-400" aria-label={`評価${count}/5`}>
      {"★".repeat(count)}
      <span className="text-stone-200">{"★".repeat(5 - count)}</span>
    </span>
  );
}

const secondaryButtonClass =
  "rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 transition hover:bg-stone-50 disabled:opacity-50";

const primaryButtonClass =
  "rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-50";

export function ReviewItem({
  id,
  reviewerName,
  starRating,
  comment,
  reviewCreatedAt,
  aiReplyDraft,
  replyComment,
}: Props) {
  const [reply, setReply] = useState(aiReplyDraft ?? "");
  const [sentComment, setSentComment] = useState(replyComment);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, startGenerate] = useTransition();
  const [isSending, startSend] = useTransition();

  const handleGenerate = () => {
    setError(null);
    startGenerate(async () => {
      const result = await generateReplyDraft(id);
      if (result.error) {
        setError(result.error);
      } else {
        setReply(result.reply ?? "");
      }
    });
  };

  const handleSend = () => {
    setError(null);
    startSend(async () => {
      const result = await sendReviewReply(id, reply);
      if (result.error) {
        setError(result.error);
      } else {
        setSentComment(reply);
      }
    });
  };

  return (
    <li className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-stone-800">
          {reviewerName ?? "匿名のお客様"}
        </span>
        {starRating && <Stars rating={starRating} />}
      </div>
      <p className="mt-1.5 text-sm text-stone-700">{comment ?? "(本文なし)"}</p>
      {reviewCreatedAt && (
        <p className="mt-1 text-xs text-stone-400">
          {new Date(reviewCreatedAt).toLocaleString("ja-JP")}
        </p>
      )}

      <div className="mt-4 border-t border-stone-100 pt-4">
        {sentComment ? (
          <div>
            <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              返信済み
            </span>
            <p className="mt-2 text-sm text-stone-700">{sentComment}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {!reply && (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className={secondaryButtonClass}
              >
                {isGenerating ? "生成中..." : "AIで返信文を生成"}
              </button>
            )}
            {reply && (
              <>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-stone-300 px-2.5 py-1.5 text-sm text-stone-900 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className={secondaryButtonClass}
                  >
                    {isGenerating ? "再生成中..." : "再生成"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={isSending}
                    className={primaryButtonClass}
                  >
                    {isSending ? "送信中..." : "この内容で返信を送信"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </li>
  );
}
