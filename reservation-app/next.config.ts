import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // ルートプロジェクト(コンテンツ投稿SaaS)とlockfileが並存するため、明示的にこのディレクトリをrootにする
  turbopack: {
    root: path.join(__dirname),
  },
  // WordPressサイトのページ内にiframe埋め込みできるようにする(/bookのみ許可)。
  // 本番運用時は .env の WORDPRESS_SITE_ORIGIN に埋め込み元のオリジンを指定すること。
  async headers() {
    const wordpressOrigin = process.env.WORDPRESS_SITE_ORIGIN || "*";
    return [
      {
        source: "/book",
        headers: [
          { key: "Content-Security-Policy", value: `frame-ancestors ${wordpressOrigin}` },
        ],
      },
    ];
  },
};

export default nextConfig;
