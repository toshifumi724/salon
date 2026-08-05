-- フェーズ2: Google Business Profile連携用のテーブルと列

-- OAuth接続情報(サロンごとに1接続。MVPでは1サロンのみ運用)
create table if not exists google_connections (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  google_account_id text not null,
  google_location_id text not null,
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (salon_id)
);

-- 投稿にGoogleへの投稿IDを記録(WordPress投稿と同様のパターン)
alter table posts add column if not exists google_post_id text;
