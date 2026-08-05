import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// 月間ランニングコスト上限(CLAUDE.md参照)を守るため、コストの低いHaiku 4.5を既定で使用。
// 品質が不十分な場合は環境変数CLAUDE_MODELで claude-sonnet-5 等に切り替え可能。
const MODEL = process.env.CLAUDE_MODEL || "claude-haiku-4-5";

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEYが設定されていません");
  }
  return new Anthropic({ apiKey });
}

export async function generateBlogPost(
  comment: string
): Promise<{ title: string; content: string }> {
  const client = getClient();

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 2000,
    system:
      "あなたは美容室のブログ記事を書くライターです。スタイリストが書いた短いコメントをもとに、来店を検討しているお客様向けの魅力的なブログ記事を日本語で作成してください。",
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

export async function generateGoogleCaption(comment: string): Promise<string> {
  const client = getClient();

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 1000,
    system:
      "あなたは美容室のGoogleビジネスプロフィール投稿文を書く担当者です。スタイリストが書いた短いコメントをもとに、来店を検討しているお客様向けの親しみやすい投稿文を日本語で作成してください。200文字程度を目安に、簡潔にまとめてください。ハッシュタグは使わないでください。",
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
