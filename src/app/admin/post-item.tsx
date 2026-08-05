"use client";

import { useState, useTransition } from "react";
import {
  generateBlogContent,
  publishToWordPress,
  generateGoogleCaptionAction,
  publishToGoogle,
  generateHotpepperContentAction,
} from "./actions";

type Props = {
  id: string;
  comment: string;
  createdAt: string;
  images: { id: string; url: string | null }[];
  blogTitle: string | null;
  blogContent: string | null;
  wordpressPostId: string | null;
  googlePostId: string | null;
  isGoogleConnected: boolean;
  hotpepperContent: string | null;
};

export function PostItem({
  id,
  comment,
  createdAt,
  images,
  blogTitle,
  blogContent,
  wordpressPostId,
  googlePostId,
  isGoogleConnected,
  hotpepperContent,
}: Props) {
  const [title, setTitle] = useState(blogTitle ?? "");
  const [content, setContent] = useState(blogContent ?? "");
  const [wpId, setWpId] = useState(wordpressPostId);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, startGenerate] = useTransition();
  const [isPublishing, startPublish] = useTransition();

  const [caption, setCaption] = useState("");
  const [googleId, setGoogleId] = useState(googlePostId);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [isGeneratingCaption, startGenerateCaption] = useTransition();
  const [isPublishingGoogle, startPublishGoogle] = useTransition();

  const [hotpepper, setHotpepper] = useState(hotpepperContent ?? "");
  const [hotpepperError, setHotpepperError] = useState<string | null>(null);
  const [isGeneratingHotpepper, startGenerateHotpepper] = useTransition();
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    setError(null);
    startGenerate(async () => {
      const result = await generateBlogContent(id);
      if (result.error) {
        setError(result.error);
      } else {
        setTitle(result.title ?? "");
        setContent(result.content ?? "");
      }
    });
  };

  const handlePublish = () => {
    setError(null);
    startPublish(async () => {
      const result = await publishToWordPress(id, title, content);
      if (result.error) {
        setError(result.error);
      } else {
        setWpId(result.wordpressPostId ?? null);
      }
    });
  };

  const handleGenerateCaption = () => {
    setGoogleError(null);
    startGenerateCaption(async () => {
      const result = await generateGoogleCaptionAction(id);
      if (result.error) {
        setGoogleError(result.error);
      } else {
        setCaption(result.caption ?? "");
      }
    });
  };

  const handlePublishGoogle = () => {
    setGoogleError(null);
    startPublishGoogle(async () => {
      const result = await publishToGoogle(id, caption);
      if (result.error) {
        setGoogleError(result.error);
      } else {
        setGoogleId(result.googlePostId ?? null);
      }
    });
  };

  const handleGenerateHotpepper = () => {
    setHotpepperError(null);
    setCopied(false);
    startGenerateHotpepper(async () => {
      const result = await generateHotpepperContentAction(id);
      if (result.error) {
        setHotpepperError(result.error);
      } else {
        setHotpepper(result.content ?? "");
      }
    });
  };

  const handleCopyHotpepper = async () => {
    try {
      await navigator.clipboard.writeText(hotpepper);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setHotpepperError("コピーに失敗しました。手動で選択してコピーしてください");
    }
  };

  return (
    <li className="rounded border border-gray-200 p-4">
      <div className="mb-2 flex gap-2 overflow-x-auto">
        {images.map((img) =>
          img.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={img.id}
              src={img.url}
              alt=""
              className="h-24 w-24 flex-shrink-0 rounded object-cover"
            />
          ) : null
        )}
      </div>
      <p className="text-sm text-gray-800">{comment}</p>
      <p className="mt-1 text-xs text-gray-400">
        {new Date(createdAt).toLocaleString("ja-JP")}
      </p>

      <div className="mt-3 border-t border-gray-100 pt-3">
        <p className="mb-2 text-xs font-medium text-gray-400">
          ブログ記事(WordPress)
        </p>
        {!content && (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {isGenerating ? "生成中..." : "AIでブログ記事を生成"}
          </button>
        )}

        {content && (
          <div className="space-y-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!!wpId}
              placeholder="タイトル"
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm disabled:bg-gray-50"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={!!wpId}
              rows={6}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm disabled:bg-gray-50"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !!wpId}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {isGenerating ? "再生成中..." : "再生成"}
              </button>
              {wpId ? (
                <span className="text-sm text-green-600">
                  WordPress投稿済み(ID: {wpId})
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                >
                  {isPublishing ? "投稿中..." : "WordPressに投稿(下書き)"}
                </button>
              )}
            </div>
          </div>
        )}

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {isGoogleConnected && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          <p className="mb-2 text-xs font-medium text-gray-400">
            Googleビジネスプロフィール投稿
          </p>
          {!caption && !googleId && (
            <button
              type="button"
              onClick={handleGenerateCaption}
              disabled={isGeneratingCaption}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {isGeneratingCaption ? "生成中..." : "AIで投稿文を生成"}
            </button>
          )}

          {(caption || googleId) && (
            <div className="space-y-2">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                disabled={!!googleId}
                rows={3}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm disabled:bg-gray-50"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateCaption}
                  disabled={isGeneratingCaption || !!googleId}
                  className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {isGeneratingCaption ? "再生成中..." : "再生成"}
                </button>
                {googleId ? (
                  <span className="text-sm text-green-600">
                    Google投稿済み
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handlePublishGoogle}
                    disabled={isPublishingGoogle}
                    className="rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                  >
                    {isPublishingGoogle ? "投稿中..." : "Googleに投稿"}
                  </button>
                )}
              </div>
            </div>
          )}

          {googleError && (
            <p className="mt-2 text-sm text-red-600">{googleError}</p>
          )}
        </div>
      )}

      <div className="mt-3 border-t border-gray-100 pt-3">
        <p className="mb-2 text-xs font-medium text-gray-400">
          ホットペッパービューティー用文章(コピペ用・自動投稿なし)
        </p>
        {!hotpepper && (
          <button
            type="button"
            onClick={handleGenerateHotpepper}
            disabled={isGeneratingHotpepper}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {isGeneratingHotpepper ? "生成中..." : "AIで文章を生成"}
          </button>
        )}

        {hotpepper && (
          <div className="space-y-2">
            <textarea
              value={hotpepper}
              onChange={(e) => setHotpepper(e.target.value)}
              rows={5}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateHotpepper}
                disabled={isGeneratingHotpepper}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {isGeneratingHotpepper ? "再生成中..." : "再生成"}
              </button>
              <button
                type="button"
                onClick={handleCopyHotpepper}
                className="rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
              >
                {copied ? "コピーしました" : "文章をコピー"}
              </button>
            </div>
            <p className="text-xs text-gray-400">
              ホットペッパービューティーには公式APIがないため、この文章をコピーして管理画面に貼り付けてください。
            </p>
          </div>
        )}

        {hotpepperError && (
          <p className="mt-2 text-sm text-red-600">{hotpepperError}</p>
        )}
      </div>
    </li>
  );
}
