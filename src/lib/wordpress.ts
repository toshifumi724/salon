import "server-only";

/**
 * WordPress REST API(アプリケーションパスワード認証)へブログ記事を投稿する。
 * 安全のため既定では下書き(draft)として投稿する。内容を確認後、
 * WordPress管理画面から手動で公開するか、WORDPRESS_POST_STATUS=publish を設定する。
 */
export async function createWordPressPost({
  title,
  content,
}: {
  title: string;
  content: string;
}): Promise<string> {
  const siteUrl = process.env.WORDPRESS_URL;
  const username = process.env.WORDPRESS_USERNAME;
  const appPassword = process.env.WORDPRESS_APP_PASSWORD;

  if (!siteUrl || !username || !appPassword) {
    throw new Error(
      "WordPressの環境変数が設定されていません(WORDPRESS_URL / WORDPRESS_USERNAME / WORDPRESS_APP_PASSWORD)"
    );
  }

  const status = process.env.WORDPRESS_POST_STATUS || "draft";
  const auth = Buffer.from(`${username}:${appPassword}`).toString("base64");

  const res = await fetch(
    `${siteUrl.replace(/\/$/, "")}/wp-json/wp/v2/posts`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({ title, content, status }),
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
