import "server-only";

export type WordPressConfig = {
  siteUrl: string;
  username: string;
  appPassword: string;
  postStatus: string;
};

/**
 * WordPress REST API(アプリケーションパスワード認証)へブログ記事を投稿する。
 * 連携設定はサロンごとにDBで管理する(複数サロン対応のため)。
 */
export async function createWordPressPost(
  { siteUrl, username, appPassword, postStatus }: WordPressConfig,
  { title, content }: { title: string; content: string }
): Promise<string> {
  const auth = Buffer.from(`${username}:${appPassword}`).toString("base64");

  const res = await fetch(
    `${siteUrl.replace(/\/$/, "")}/wp-json/wp/v2/posts`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({ title, content, status: postStatus || "draft" }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `WordPressへの投稿に失敗しました(${res.status}): ${text.slice(0, 300)}`
    );
  }

  const data = await res.json();
  return String(data.id);
}
