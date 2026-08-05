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

const STAR_LABELS: Record<string, string> = {
  ONE: "★☆☆☆☆",
  TWO: "★★☆☆☆",
  THREE: "★★★☆☆",
  FOUR: "★★★★☆",
  FIVE: "★★★★★",
};

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
    <li className="rounded border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-800">
          {reviewerName ?? "匿名のお客様"}
        </span>
        {starRating && (
          <span className="text-sm text-amber-500">
            {STAR_LABELS[starRating] ?? starRating}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-gray-700">{comment ?? "(本文なし)"}</p>
      {reviewCreatedAt && (
        <p className="mt-1 text-xs text-gray-400">
          {new Date(reviewCreatedAt).toLocaleString("ja-JP")}
        </p>
      )}

      <div className="mt-3 border-t border-gray-100 pt-3">
        {sentComment ? (
          <div>
            <p className="mb-1 text-xs font-medium text-gray-400">返信済み</p>
            <p className="text-sm text-gray-700">{sentComment}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {!reply && (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {isGenerating ? "再生成中..." : "再生成"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={isSending}
                    className="rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
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
