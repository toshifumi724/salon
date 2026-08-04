-- フェーズ1 MVP: サロン情報・投稿データ・投稿画像のテーブル

-- サロン情報(将来のマルチテナント化の土台。MVPでは1件のみ使用)
create table if not exists salons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- 投稿データ(写真+コメント。ブログ本文・WordPress投稿IDは将来のフェーズで使用)
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  comment text not null,
  blog_content text,
  wordpress_post_id text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 投稿に紐づく画像(Supabase Storageのパスを保存)
create table if not exists post_images (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists posts_salon_id_idx on posts(salon_id);
create index if not exists post_images_post_id_idx on post_images(post_id);

-- MVPでは開発者本人のサロンを1件だけ登録しておく
insert into salons (name)
select 'サンプルサロン'
where not exists (select 1 from salons);
