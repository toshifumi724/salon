"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { generateReviewReply } from "@/lib/claude";
import { replyToGoogleReview } from "@/lib/google";

export type GenerateReplyState = { reply?: string; error?: string };

export async function generateReplyDraft(
  reviewId: string
): Promise<GenerateReplyState> {
  try {
    const supabase = createServiceRoleClient();
    const { data: review, error } = await supabase
      .from("reviews")
      .select("comment, star_rating, reviewer_name")
      .eq("id", reviewId)
      .single();

    if (error || !review) {
      return { error: "口コミが見つかりません" };
    }

    const reply = await generateReviewReply({
      comment: review.comment,
      starRating: review.star_rating,
      reviewerName: review.reviewer_name,
    });

    await supabase
      .from("reviews")
      .update({ ai_reply_draft: reply })
      .eq("id", reviewId);

    revalidatePath("/admin/reviews");
    return { reply };
  } catch (err) {
    const message = err instanceof Error ? err.message : "不明なエラー";
    return { error: `返信文の生成に失敗しました: ${message}` };
  }
}

export type SendReplyState = { success?: boolean; error?: string };

export async function sendReviewReply(
  reviewId: string,
  reply: string
): Promise<SendReplyState> {
  const trimmed = reply.trim();
  if (!trimmed) {
    return { error: "返信文を入力してください" };
  }

  try {
    const supabase = createServiceRoleClient();
    const { data: review, error } = await supabase
      .from("reviews")
      .select("google_review_name")
      .eq("id", reviewId)
      .single();

    if (error || !review) {
      return { error: "口コミが見つかりません" };
    }

    await replyToGoogleReview(review.google_review_name, trimmed);

    await supabase
      .from("reviews")
      .update({
        reply_comment: trimmed,
        replied_at: new Date().toISOString(),
      })
      .eq("id", reviewId);

    revalidatePath("/admin/reviews");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "不明なエラー";
    return { error: `返信の送信に失敗しました: ${message}` };
  }
}
