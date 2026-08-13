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
  hotpepperStyleTitle: string | null;
  hotpepperStylistComment: string | null;
  hotpepperMenuContent: string | null;
  hotpepperBlogTitle: string | null;
  hotpepperBlogBody: string | null;
};

// SALON BOARD(ホットペッパービューティー管理画面)の入力欄の文字数上限
const HOTPEPPER_LIMITS = {
  styleTitle: 30,
  stylistComment: 120,
  menuContent: 50,
  blogTitle: 25,
  blogBody: 1000,
} as const;

function StatusBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      {label}
    </span>
  );
}

const inputClass =
  "w-full rounded-lg border border-stone-300 px-2.5 py-1.5 text-sm text-stone-900 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100 disabled:bg-stone-50 disabled:text-stone-500";

const secondaryButtonClass =
  "rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 transition hover:bg-stone-50 disabled:opacity-50";

const primaryButtonClass =
  "rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-50";

function HotpepperFieldRow({
  label,
  value,
  onChange,
  maxLength,
  rows,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  rows?: number;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-stone-500">{label}</span>
        <span className="text-xs text-stone-400">
          {value.length}/{maxLength}
        </span>
      </div>
      <div className="flex items-start gap-2">
        {rows ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={maxLength}
            rows={rows}
            className={inputClass}
          />
        ) : (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={maxLength}
            className={inputClass}
          />
        )}
        <button
          type="button"
          onClick={onCopy}
          className={`${secondaryButtonClass} flex-shrink-0`}
        >
          {copied ? "コピー済み" : "コピー"}
        </button>
      </div>
    </div>
  );
}

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
  hotpepperStyleTitle,
  hotpepperStylistComment,
  hotpepperMenuContent,
  hotpepperBlogTitle,
  hotpepperBlogBody,
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

  const [styleTitle, setStyleTitle] = useState(hotpepperStyleTitle ?? "");
  const [stylistComment, setStylistComment] = useState(hotpepperStylistComment ?? "");
  const [menuContent, setMenuContent] = useState(hotpepperMenuContent ?? "");
  const [hpBlogTitle, setHpBlogTitle] = useState(hotpepperBlogTitle ?? "");
  const [hpBlogBody, setHpBlogBody] = useState(hotpepperBlogBody ?? "");
  const [hotpepperError, setHotpepperError] = useState<string | null>(null);
  const [isGeneratingHotpepper, startGenerateHotpepper] = useTransition();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const hasHotpepperContent = Boolean(
    styleTitle || stylistComment || menuContent || hpBlogTitle || hpBlogBody
  );

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
    setCopiedField(null);
    startGenerateHotpepper(async () => {
      const result = await generateHotpepperContentAction(id);
      if (result.error) {
        setHotpepperError(result.error);
      } else if (result.content) {
        setStyleTitle(result.content.styleTitle);
        setStylistComment(result.content.stylistComment);
        setMenuContent(result.content.menuContent);
        setHpBlogTitle(result.content.blogTitle);
        setHpBlogBody(result.content.blogBody);
      }
    });
  };

  const handleCopyField = async (field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      setHotpepperError("コピーに失敗しました。手動で選択してコピーしてください");
    }
  };

  return (
    <li className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      {images.length > 0 && (
        <div className="mb-3 flex gap-2 overflow-x-auto">
          {images.map((img) =>
            img.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={img.id}
                src={img.url}
                alt=""
                className="h-24 w-24 flex-shrink-0 rounded-lg border border-stone-100 object-cover"
              />
            ) : null
          )}
        </div>
      )}
      <p className="text-sm text-stone-800">{comment}</p>
      <p className="mt-1 text-xs text-stone-400">
        {new Date(createdAt).toLocaleString("ja-JP")}
      </p>

      {/* WordPress */}
      <div className="mt-4 border-t border-stone-100 pt-4">
        <p className="mb-2 text-xs font-medium tracking-wide text-stone-400">
          ブログ記事(WordPress)
        </p>
        {!content && (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className={secondaryButtonClass}
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
              className={inputClass}
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={!!wpId}
              rows={6}
              className={inputClass}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !!wpId}
                className={secondaryButtonClass}
              >
                {isGenerating ? "再生成中..." : "再生成"}
              </button>
              {wpId ? (
                <StatusBadge label={`投稿済み(ID: ${wpId})`} />
              ) : (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className={primaryButtonClass}
                >
                  {isPublishing ? "投稿中..." : "WordPressに投稿(下書き)"}
                </button>
              )}
            </div>
          </div>
        )}

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {/* Google */}
      {isGoogleConnected && (
        <div className="mt-4 border-t border-stone-100 pt-4">
          <p className="mb-2 text-xs font-medium tracking-wide text-stone-400">
            Googleビジネスプロフィール投稿
          </p>
          {!caption && !googleId && (
            <button
              type="button"
              onClick={handleGenerateCaption}
              disabled={isGeneratingCaption}
              className={secondaryButtonClass}
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
                className={inputClass}
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateCaption}
                  disabled={isGeneratingCaption || !!googleId}
                  className={secondaryButtonClass}
                >
                  {isGeneratingCaption ? "再生成中..." : "再生成"}
                </button>
                {googleId ? (
                  <StatusBadge label="投稿済み" />
                ) : (
                  <button
                    type="button"
                    onClick={handlePublishGoogle}
                    disabled={isPublishingGoogle}
                    className={primaryButtonClass}
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

      {/* Hot Pepper */}
      <div className="mt-4 border-t border-stone-100 pt-4">
        <p className="mb-2 text-xs font-medium tracking-wide text-stone-400">
          ホットペッパービューティー用文章(コピペ用・自動投稿なし)
        </p>
        {!hasHotpepperContent && (
          <button
            type="button"
            onClick={handleGenerateHotpepper}
            disabled={isGeneratingHotpepper}
            className={secondaryButtonClass}
          >
            {isGeneratingHotpepper ? "生成中..." : "AIで文章を生成"}
          </button>
        )}

        {hasHotpepperContent && (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold text-stone-500">
                SALON BOARD「スタイル掲載情報」用
              </p>
              <div className="space-y-2">
                <HotpepperFieldRow
                  label="スタイル名"
                  value={styleTitle}
                  onChange={setStyleTitle}
                  maxLength={HOTPEPPER_LIMITS.styleTitle}
                  copied={copiedField === "styleTitle"}
                  onCopy={() => handleCopyField("styleTitle", styleTitle)}
                />
                <HotpepperFieldRow
                  label="スタイリストコメント"
                  value={stylistComment}
                  onChange={setStylistComment}
                  maxLength={HOTPEPPER_LIMITS.stylistComment}
                  rows={3}
                  copied={copiedField === "stylistComment"}
                  onCopy={() => handleCopyField("stylistComment", stylistComment)}
                />
                <HotpepperFieldRow
                  label="メニュー内容"
                  value={menuContent}
                  onChange={setMenuContent}
                  maxLength={HOTPEPPER_LIMITS.menuContent}
                  rows={2}
                  copied={copiedField === "menuContent"}
                  onCopy={() => handleCopyField("menuContent", menuContent)}
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-stone-500">
                SALON BOARD「ブログ投稿」用
              </p>
              <div className="space-y-2">
                <HotpepperFieldRow
                  label="タイトル"
                  value={hpBlogTitle}
                  onChange={setHpBlogTitle}
                  maxLength={HOTPEPPER_LIMITS.blogTitle}
                  copied={copiedField === "blogTitle"}
                  onCopy={() => handleCopyField("blogTitle", hpBlogTitle)}
                />
                <HotpepperFieldRow
                  label="本文"
                  value={hpBlogBody}
                  onChange={setHpBlogBody}
                  maxLength={HOTPEPPER_LIMITS.blogBody}
                  rows={6}
                  copied={copiedField === "blogBody"}
                  onCopy={() => handleCopyField("blogBody", hpBlogBody)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateHotpepper}
                disabled={isGeneratingHotpepper}
                className={secondaryButtonClass}
              >
                {isGeneratingHotpepper ? "再生成中..." : "再生成"}
              </button>
            </div>
            <p className="text-xs text-stone-400">
              ホットペッパービューティーには公式APIがないため、各項目をコピーしてSALON BOARDの対応欄に貼り付けてください。
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
