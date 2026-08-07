import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getCurrentSalonId } from "@/lib/salon";
import { getGoogleConnection } from "@/lib/google";
import { UploadForm } from "./upload-form";
import { PostItem } from "./post-item";

// ログイン状態や投稿データは常に最新を返す必要があるため、静的化させない
export const dynamic = "force-dynamic";

type PostRow = {
  id: string;
  comment: string;
  created_at: string;
  blog_title: string | null;
  blog_content: string | null;
  wordpress_post_id: string | null;
  google_post_id: string | null;
  hotpepper_content: string | null;
  post_images: { id: string; storage_path: string }[];
};

async function getRecentPosts() {
  const supabase = createServiceRoleClient();
  const salonId = await getCurrentSalonId();
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, comment, created_at, blog_title, blog_content, wordpress_post_id, google_post_id, hotpepper_content, post_images(id, storage_path)"
    )
    .eq("salon_id", salonId)
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
    <>
      <h1 className="mb-6 text-xl font-semibold text-stone-900">投稿管理</h1>

      {params.google_error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Google連携エラー: {params.google_error}
        </p>
      )}
      {params.google_connected && (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Googleビジネスプロフィールと連携しました
        </p>
      )}

      <section className="mb-6 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="mb-2 text-sm font-medium text-stone-700">
          Googleビジネスプロフィール連携
        </h2>
        {googleConnection ? (
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              連携済み
            </span>
            <Link
              href="/admin/reviews"
              className="text-sm font-medium text-rose-600 hover:underline"
            >
              口コミ管理へ →
            </Link>
          </div>
        ) : (
          <div>
            <p className="mb-3 text-sm text-stone-500">
              未連携です。連携するとGoogleへの投稿ができるようになります。
            </p>
            <a
              href="/api/google/auth"
              className="inline-block rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
            >
              Googleアカウントと連携する
            </a>
          </div>
        )}
      </section>

      <UploadForm />

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-medium text-stone-500">
          最近の投稿
        </h2>
        {posts.length === 0 && (
          <p className="rounded-xl border border-dashed border-stone-300 bg-white px-4 py-8 text-center text-sm text-stone-400">
            まだ投稿がありません
          </p>
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
              hotpepperContent={post.hotpepper_content}
            />
          ))}
        </ul>
      </section>
    </>
  );
}
