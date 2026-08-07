import { createServiceRoleClient } from "@/lib/supabase/server";
import { getCurrentSalonId } from "@/lib/salon";
import { getGoogleConnection } from "@/lib/google";
import { syncReviewsFromGoogle } from "@/lib/reviews";
import { ReviewItem } from "./review-item";

// ログイン状態や口コミデータは常に最新を返す必要があるため、静的化させない
export const dynamic = "force-dynamic";

type ReviewRow = {
  id: string;
  reviewer_name: string | null;
  star_rating: string | null;
  comment: string | null;
  review_created_at: string | null;
  ai_reply_draft: string | null;
  reply_comment: string | null;
};

async function getReviews(): Promise<{ reviews: ReviewRow[]; syncError: string | null }> {
  let syncError: string | null = null;
  try {
    await syncReviewsFromGoogle();
  } catch (err) {
    syncError = err instanceof Error ? err.message : "口コミの取得に失敗しました";
  }

  const supabase = createServiceRoleClient();
  const salonId = await getCurrentSalonId();
  const { data } = await supabase
    .from("reviews")
    .select(
      "id, reviewer_name, star_rating, comment, review_created_at, ai_reply_draft, reply_comment"
    )
    .eq("salon_id", salonId)
    .order("review_created_at", { ascending: false });

  return { reviews: data ?? [], syncError };
}

export default async function ReviewsPage() {
  const connection = await getGoogleConnection().catch(() => null);

  if (!connection) {
    return (
      <>
        <h1 className="mb-6 text-xl font-semibold text-stone-900">口コミ管理</h1>
        <p className="rounded-xl border border-dashed border-stone-300 bg-white px-4 py-8 text-center text-sm text-stone-500">
          Googleビジネスプロフィールが連携されていません。先に投稿管理画面から連携してください。
        </p>
      </>
    );
  }

  const { reviews, syncError } = await getReviews();

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold text-stone-900">口コミ管理</h1>

      {syncError && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          口コミの取得に失敗しました: {syncError}
        </p>
      )}

      {reviews.length === 0 && !syncError && (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white px-4 py-8 text-center text-sm text-stone-400">
          口コミがまだありません
        </p>
      )}

      <ul className="space-y-4">
        {reviews.map((review) => (
          <ReviewItem
            key={review.id}
            id={review.id}
            reviewerName={review.reviewer_name}
            starRating={review.star_rating}
            comment={review.comment}
            reviewCreatedAt={review.review_created_at}
            aiReplyDraft={review.ai_reply_draft}
            replyComment={review.reply_comment}
          />
        ))}
      </ul>
    </>
  );
}
