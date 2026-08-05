import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getDefaultSalonId } from "@/lib/salon";
import { listGoogleReviews } from "@/lib/google";

/**
 * Googleから最新の口コミ一覧を取得し、DBに反映(なければ追加・あれば更新)する。
 * 返信済みの場合はGoogle側の返信内容でreply_commentを上書きする。
 */
export async function syncReviewsFromGoogle(): Promise<void> {
  const reviews = await listGoogleReviews();
  const supabase = createServiceRoleClient();
  const salonId = await getDefaultSalonId();

  for (const review of reviews) {
    await supabase.from("reviews").upsert(
      {
        salon_id: salonId,
        google_review_name: review.name,
        reviewer_name: review.reviewerName,
        star_rating: review.starRating,
        comment: review.comment,
        review_created_at: review.createTime,
        reply_comment: review.existingReplyComment,
        replied_at: review.existingReplyComment ? new Date().toISOString() : null,
        synced_at: new Date().toISOString(),
      },
      { onConflict: "google_review_name" }
    );
  }
}
