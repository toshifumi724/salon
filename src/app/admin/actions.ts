"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getDefaultSalonId } from "@/lib/salon";
import { generateBlogPost } from "@/lib/claude";
import { createWordPressPost } from "@/lib/wordpress";

export type CreatePostState = { error?: string; success?: boolean };

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function createPost(
  _prevState: CreatePostState,
  formData: FormData
): Promise<CreatePostState> {
  const comment = String(formData.get("comment") ?? "").trim();
  const files = formData
    .getAll("images")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (!comment) {
    return { error: "コメントを入力してください" };
  }
  if (files.length === 0) {
    return { error: "写真を1枚以上選択してください" };
  }
  if (files.length > MAX_FILES) {
    return { error: `写真は${MAX_FILES}枚までです` };
  }
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { error: "対応していない画像形式です(JPEG/PNG/WEBPのみ)" };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { error: "1枚あたり5MBまでの画像を選択してください" };
    }
  }

  try {
    const supabase = createServiceRoleClient();
    const salonId = await getDefaultSalonId();

    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({ salon_id: salonId, comment })
      .select("id")
      .single();

    if (postError || !post) {
      return { error: `投稿の保存に失敗しました: ${postError?.message}` };
    }

    for (const [index, file] of files.entries()) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${post.id}/${index}-${Date.now()}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(path, buffer, { contentType: file.type });

      if (uploadError) {
        return {
          error: `画像のアップロードに失敗しました: ${uploadError.message}`,
        };
      }

      const { error: imageError } = await supabase
        .from("post_images")
        .insert({
          post_id: post.id,
          storage_path: path,
          sort_order: index,
        });

      if (imageError) {
        return {
          error: `画像情報の保存に失敗しました: ${imageError.message}`,
        };
      }
    }

    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "不明なエラー";
    return { error: `投稿に失敗しました: ${message}` };
  }
}

export type GenerateBlogState = {
  title?: string;
  content?: string;
  error?: string;
};

export async function generateBlogContent(
  postId: string
): Promise<GenerateBlogState> {
  try {
    const supabase = createServiceRoleClient();
    const { data: post, error } = await supabase
      .from("posts")
      .select("comment")
      .eq("id", postId)
      .single();

    if (error || !post) {
      return { error: "投稿が見つかりません" };
    }

    const { title, content } = await generateBlogPost(post.comment);

    const { error: updateError } = await supabase
      .from("posts")
      .update({
        blog_title: title,
        blog_content: content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId);

    if (updateError) {
      return { error: `保存に失敗しました: ${updateError.message}` };
    }

    revalidatePath("/admin");
    return { title, content };
  } catch (err) {
    const message = err instanceof Error ? err.message : "不明なエラー";
    return { error: `ブログ記事の生成に失敗しました: ${message}` };
  }
}

export type PublishState = { wordpressPostId?: string; error?: string };

export async function publishToWordPress(
  postId: string,
  title: string,
  content: string
): Promise<PublishState> {
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();

  if (!trimmedTitle || !trimmedContent) {
    return { error: "タイトルと本文を入力してください" };
  }

  try {
    const wordpressPostId = await createWordPressPost({
      title: trimmedTitle,
      content: trimmedContent,
    });

    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("posts")
      .update({
        blog_title: trimmedTitle,
        blog_content: trimmedContent,
        wordpress_post_id: wordpressPostId,
        status: "published",
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId);

    if (error) {
      return { error: `WordPress投稿IDの保存に失敗しました: ${error.message}` };
    }

    revalidatePath("/admin");
    return { wordpressPostId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "不明なエラー";
    return { error: `WordPressへの投稿に失敗しました: ${message}` };
  }
}
