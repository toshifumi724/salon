-- フェーズ2: Googleの口コミ取得・AI返信文生成・送信用テーブル

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  google_review_name text not null unique, -- "accounts/*/locations/*/reviews/*"
  reviewer_name text,
  star_rating text, -- ONE / TWO / THREE / FOUR / FIVE
  comment text,
  review_created_at timestamptz,
  ai_reply_draft text,
  reply_comment text,
  replied_at timestamptz,
  synced_at timestamptz not null default now()
);

create index if not exists reviews_salon_id_idx on reviews(salon_id);
