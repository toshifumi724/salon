import { createServiceRoleClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/logout-action";
import { UploadForm } from "./upload-form";

type PostRow = {
  id: string;
  comment: string;
  created_at: string;
  post_images: { id: string; storage_path: string }[];
};

async function getRecentPosts() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, comment, created_at, post_images(id, storage_path)")
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

export default async function AdminPage() {
  const posts = await getRecentPosts();

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

      <UploadForm />

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-medium text-gray-500">最近の投稿</h2>
        {posts.length === 0 && (
          <p className="text-sm text-gray-400">まだ投稿がありません</p>
        )}
        <ul className="space-y-4">
          {posts.map((post) => (
            <li
              key={post.id}
              className="rounded border border-gray-200 p-4"
            >
              <div className="mb-2 flex gap-2 overflow-x-auto">
                {post.images.map((img) =>
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
              <p className="text-sm text-gray-800">{post.comment}</p>
              <p className="mt-1 text-xs text-gray-400">
                {new Date(post.created_at).toLocaleString("ja-JP")}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
