import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { SalonToneProfile } from "@/lib/salon";

// 月間ランニングコスト上限(CLAUDE.md参照)を守るため、コストの低いHaiku 4.5を既定で使用。
// 品質が不十分な場合は環境変数CLAUDE_MODELで claude-sonnet-5 等に切り替え可能。
const MODEL = process.env.CLAUDE_MODEL || "claude-haiku-4-5";

// 文体参考サンプルが長すぎるとコストが膨らむため、プロンプトに含める長さを制限する
const STYLE_SAMPLE_MAX_LENGTH = 1500;

const TONE_LEVEL_INSTRUCTIONS: Record<SalonToneProfile["toneLevel"], string> = {
  polite:
    "です・ます調のかしこまった丁寧な敬語を使い、格式のある落ち着いた文章にしてください。",
  friendly: "親しみやすく温かみのある丁寧な言葉遣いにしてください。",
  casual:
    "堅苦しくなりすぎない、フランクで親近感のある話し言葉に近いトーンにしてください(ただし失礼にならない程度にしてください)。",
};

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEYが設定されていません");
  }
  return new Anthropic({ apiKey });
}

/**
 * サロンごとのトーン設定・文体参考サンプルを、システムプロンプトに追加する指示文に変換する。
 */
function buildToneInstructions(profile?: SalonToneProfile): string {
  if (!profile) return "";

  const lines: string[] = ["", "【このサロン向けの文体指定】"];
  lines.push(TONE_LEVEL_INSTRUCTIONS[profile.toneLevel]);

  if (profile.targetCustomer) {
    lines.push(`主なターゲット顧客は「${profile.targetCustomer}」です。この客層に響く言葉選びを意識してください。`);
  }
  if (profile.brandKeywords) {
    lines.push(`お店のこだわりや特徴(${profile.brandKeywords})に触れられる場合は、不自然にならない範囲で自然に盛り込んでください。`);
  }
  lines.push(
    profile.useEmoji
      ? "文章に合う絵文字を適度に使ってかまいません。"
      : "絵文字は使わないでください。"
  );

  if (profile.styleSample) {
    const sample = profile.styleSample.slice(0, STYLE_SAMPLE_MAX_LENGTH);
    lines.push(
      "",
      "【文体の参考】",
      "以下はこのサロンが過去に実際に使った文章です。言い回しや語尾、雰囲気をできるだけ近づけてください(内容や固有名詞をそのままコピーしないこと):",
      `"""${sample}"""`
    );
  }

  return lines.join("\n");
}

export async function generateBlogPost(
  comment: string,
  toneProfile?: SalonToneProfile
): Promise<{ title: string; content: string }> {
  const client = getClient();

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 2000,
    system:
      "あなたは美容室のブログ記事を書くライターです。スタイリストが書いた短いコメントをもとに、来店を検討しているお客様向けの魅力的なブログ記事を日本語で作成してください。" +
      buildToneInstructions(toneProfile),
    messages: [
      {
        role: "user",
        content: `スタイリストのコメント:\n${comment}`,
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "ブログ記事のタイトル" },
            content: {
              type: "string",
              description: "ブログ記事の本文(改行含む)",
            },
          },
          required: ["title", "content"],
          additionalProperties: false,
        },
      },
    },
  });

  if (!response.parsed_output) {
    throw new Error("Claude APIからの応答を解析できませんでした");
  }

  const { title, content } = response.parsed_output as {
    title: string;
    content: string;
  };
  return { title, content };
}

export async function generateGoogleCaption(
  comment: string,
  toneProfile?: SalonToneProfile
): Promise<string> {
  const client = getClient();

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 1000,
    system:
      "あなたは美容室のGoogleビジネスプロフィール投稿文を書く担当者です。スタイリストが書いた短いコメントをもとに、来店を検討しているお客様向けの親しみやすい投稿文を日本語で作成してください。200文字程度を目安に、簡潔にまとめてください。ハッシュタグは使わないでください。" +
      buildToneInstructions(toneProfile),
    messages: [
      {
        role: "user",
        content: `スタイリストのコメント:\n${comment}`,
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            caption: { type: "string", description: "Google投稿文" },
          },
          required: ["caption"],
          additionalProperties: false,
        },
      },
    },
  });

  if (!response.parsed_output) {
    throw new Error("Claude APIからの応答を解析できませんでした");
  }

  return (response.parsed_output as { caption: string }).caption;
}

const STAR_RATING_LABELS: Record<string, string> = {
  ONE: "1",
  TWO: "2",
  THREE: "3",
  FOUR: "4",
  FIVE: "5",
};

export async function generateReviewReply({
  comment,
  starRating,
  reviewerName,
  toneProfile,
}: {
  comment: string | null;
  starRating: string | null;
  reviewerName: string | null;
  toneProfile?: SalonToneProfile;
}): Promise<string> {
  const client = getClient();

  const ratingLabel = starRating ? STAR_RATING_LABELS[starRating] : null;

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 1000,
    system:
      "あなたは美容室のオーナーです。お客様からのGoogle口コミに対する返信文を日本語で作成してください。丁寧で温かみのある言葉遣いにし、低評価(1〜3)の場合は謝意と改善への誠実な姿勢を示し、高評価(4〜5)の場合は感謝を伝えてください。定型文っぽくならないよう、口コミの内容に具体的に触れてください。300文字以内でまとめてください。" +
      buildToneInstructions(toneProfile),
    messages: [
      {
        role: "user",
        content: [
          reviewerName ? `お客様のお名前: ${reviewerName}` : null,
          ratingLabel ? `評価: ${ratingLabel}/5` : null,
          `口コミ本文:\n${comment ?? "(本文なし)"}`,
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            reply: { type: "string", description: "口コミへの返信文" },
          },
          required: ["reply"],
          additionalProperties: false,
        },
      },
    },
  });

  if (!response.parsed_output) {
    throw new Error("Claude APIからの応答を解析できませんでした");
  }

  return (response.parsed_output as { reply: string }).reply;
}

export type HotpepperContent = {
  styleTitle: string;
  stylistComment: string;
  menuContent: string;
  blogTitle: string;
  blogBody: string;
};

// SALON BOARD(ホットペッパービューティー管理画面)の入力欄の文字数上限に合わせる
const HOTPEPPER_LIMITS = {
  styleTitle: 30,
  stylistComment: 120,
  menuContent: 50,
  blogTitle: 25,
  blogBody: 1000,
} as const;

/**
 * ホットペッパービューティーには公式APIが無いため自動投稿はしない。
 * SALON BOARD(管理画面)の「スタイル掲載」「ブログ投稿」の各入力欄にそのまま
 * コピー&ペーストできるよう、欄ごとの文字数上限に収めた文章を生成する。
 */
export async function generateHotpepperContent(
  comment: string,
  toneProfile?: SalonToneProfile
): Promise<HotpepperContent> {
  const client = getClient();

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 2000,
    system:
      "あなたは美容室のホットペッパービューティー掲載用の文章を書く担当者です。スタイリストが書いた短いコメントをもとに、SALON BOARD(ホットペッパービューティーの管理画面)にそのまま貼り付けられる文章を日本語で作成してください。見出しや記号(#や*など)は使わないでください。" +
      "以下の5つを、それぞれの文字数上限を必ず守って作成してください:\n" +
      `- style_title: スタイル掲載の「スタイル名」。${HOTPEPPER_LIMITS.styleTitle}文字以内。お客様の目を引く短いキャッチコピー。\n` +
      `- stylist_comment: スタイル掲載の「スタイリストコメント」。${HOTPEPPER_LIMITS.stylistComment}文字以内。スタイリスト目線でおすすめポイントを伝える文章。\n` +
      `- menu_content: スタイル掲載の「メニュー内容」。${HOTPEPPER_LIMITS.menuContent}文字以内。施術メニューを簡潔に列挙。\n` +
      `- blog_title: ブログ投稿の「タイトル」。${HOTPEPPER_LIMITS.blogTitle}文字以内。\n` +
      `- blog_body: ブログ投稿の「本文」。${HOTPEPPER_LIMITS.blogBody}文字以内。お客様が来店したくなるような、施術内容やポイントが伝わる読み物として作成。` +
      buildToneInstructions(toneProfile),
    messages: [
      {
        role: "user",
        content: `スタイリストのコメント:\n${comment}`,
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            style_title: {
              type: "string",
              description: `スタイル名(${HOTPEPPER_LIMITS.styleTitle}文字以内)`,
            },
            stylist_comment: {
              type: "string",
              description: `スタイリストコメント(${HOTPEPPER_LIMITS.stylistComment}文字以内)`,
            },
            menu_content: {
              type: "string",
              description: `メニュー内容(${HOTPEPPER_LIMITS.menuContent}文字以内)`,
            },
            blog_title: {
              type: "string",
              description: `ブログタイトル(${HOTPEPPER_LIMITS.blogTitle}文字以内)`,
            },
            blog_body: {
              type: "string",
              description: `ブログ本文(${HOTPEPPER_LIMITS.blogBody}文字以内)`,
            },
          },
          required: [
            "style_title",
            "stylist_comment",
            "menu_content",
            "blog_title",
            "blog_body",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  if (!response.parsed_output) {
    throw new Error("Claude APIからの応答を解析できませんでした");
  }

  const parsed = response.parsed_output as {
    style_title: string;
    stylist_comment: string;
    menu_content: string;
    blog_title: string;
    blog_body: string;
  };

  return {
    styleTitle: parsed.style_title.slice(0, HOTPEPPER_LIMITS.styleTitle),
    stylistComment: parsed.stylist_comment.slice(0, HOTPEPPER_LIMITS.stylistComment),
    menuContent: parsed.menu_content.slice(0, HOTPEPPER_LIMITS.menuContent),
    blogTitle: parsed.blog_title.slice(0, HOTPEPPER_LIMITS.blogTitle),
    blogBody: parsed.blog_body.slice(0, HOTPEPPER_LIMITS.blogBody),
  };
}
