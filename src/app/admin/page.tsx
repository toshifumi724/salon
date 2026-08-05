import { createServiceRoleClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/logout-action";
import { getGoogleConnection } from "@/lib/google";
import { UploadForm } from "./upload-form";
import { PostItem } from "./post-item";

type PostRow = {
  id: string;
  comment: string;
  created_at: string;
  blog_title: string | null;
  blog_content: string | null;
  wordpress_post_id: string | null;
  google_post_id: string | null;
  post_images: { id: string; storage_path: string }[];
};

async function getRecentPosts() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, comment, created_at, blog_title, blog_content, wordpress_post_id, google_post_id, post_images(id, storage_path)"
    )
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) return [];

  const posts = data as unknown as PostRow[];

  return Promise.all(
    posts.map(async (post) => {
      const images = await Promise.all(
        post.post_images.map(async (img) => {
          const { data: signed } = await supabase.storage
            .from("post-images")
            .createSignedUrl(img.storage_path, 60 * 60);
          return { id: img.id, url: signed?.signedUrl ?? null };
        })
      );
      return { ...post, images };
    })
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ google_error?: string; google_connected?: string }>;
}) {
  const [posts, googleConnection, params] = await Promise.all([
    getRecentPosts(),
    getGoogleConnection().catch(() => null),
    searchParams,
  ]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">投稿管理</h1>
        <form action={logout}>
          <button
            type="submit"
            className="text-sm text-gray-500 hover:underline"
          >
            ログアウト
          </button>
        </form>
      </div>

      {params.google_error && (
        <p className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          Google連携エラー: {params.google_error}
        </p>
      )}
      {params.google_connected && (
        <p className="mb-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-600">
          Googleビジネスプロフィールと連携しました
        </p>
      )}

      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-medium text-gray-700">
          Googleビジネスプロフィール連携
        </h2>
        {googleConnection ? (
          <p className="text-sm text-green-600">連携済みです</p>
        ) : (
          <div>
            <p className="mb-2 text-sm text-gray-500">
              未連携です。連携するとGoogleへの投稿ができるようになります。
            </p>
            <a
              href="/api/google/auth"
              className="inline-block rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
            >
              Googleアカウントと連携する
            </a>
          </div>
        )}
      </section>

      <UploadForm />

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-medium text-gray-500">最近の投稿</h2>
        {posts.length === 0 && (
          <p className="text-sm text-gray-400">まだ投稿がありません</p>
        )}
        <ul className="space-y-4">
          {posts.map((post) => (
            <PostItem
              key={post.id}
              id={post.id}
              comment={post.comment}
              createdAt={post.created_at}
              images={post.images}
              blogTitle={post.blog_title}
              blogContent={post.blog_content}
              wordpressPostId={post.wordpress_post_id}
              googlePostId={post.google_post_id}
              isGoogleConnected={!!googleConnection}
            />
          ))}
        </ul>
      </section>
    </main>
  );
}
