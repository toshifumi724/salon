-- 予約管理アプリ 初期スキーマ
-- 将来の複数サロン(SaaS化)を見据え salon_id を全テーブルに持たせるが、
-- MVPでは salons テーブルに1行のみ登録して運用する。

create extension if not exists pgcrypto;

create table if not exists salons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'Asia/Tokyo',
  created_at timestamptz not null default now()
);

-- スタッフ(担当者)。MVPでは1人のみ登録するが、将来の複数スタッフ対応のため最初からテーブル化
create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 施術メニュー(所要時間・料金)
create table if not exists menus (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  name text not null,
  duration_minutes int not null check (duration_minutes > 0),
  price_yen int not null check (price_yen >= 0),
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 曜日ごとの基本営業時間(定休日含む)
create table if not exists business_hours (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6), -- 0=日,1=月...6=土
  is_closed boolean not null default false,
  open_time time,
  close_time time,
  unique (salon_id, day_of_week)
);

-- 特定の日だけ営業時間や予約枠をサロン側が手動で上書きしたい場合に使用
-- start_times が設定されている日は、自動計算の代わりにこの時刻リストを予約可能枠として使う
create table if not exists daily_slot_overrides (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  staff_id uuid not null references staff(id) on delete cascade,
  date date not null,
  is_closed boolean not null default false,
  start_times jsonb, -- 例: ["09:00","11:30","14:00","16:00"]
  created_at timestamptz not null default now(),
  unique (salon_id, staff_id, date)
);

-- 会員登録したお客様(会員/ゲストどちらも予約はreservationsに記録)
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null, -- 会員登録した場合のみセット
  name text not null,
  email text,
  phone text,
  memo text, -- 顧客カルテ的な自由メモ
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_customers_user_id on customers(user_id);

-- 来店履歴・接客メモ(予約に紐づく個別メモ)
create table if not exists customer_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  reservation_id uuid,
  note text not null,
  created_at timestamptz not null default now()
);

-- 予約本体
create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  staff_id uuid not null references staff(id),
  menu_id uuid not null references menus(id),
  customer_id uuid references customers(id) on delete set null,
  guest_name text not null,
  guest_email text not null,
  guest_phone text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'confirmed' check (status in ('confirmed','cancelled')),
  cancel_token uuid not null default gen_random_uuid(), -- ゲスト予約の本人確認なしキャンセル/変更用リンクに使用
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_reservations_staff_date on reservations(staff_id, start_at);
create index if not exists idx_reservations_customer on reservations(customer_id);

-- 管理者(サロン側)アカウント。Supabase Authのユーザーとsalonの紐付け
create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id)
);

-- RLS設定
alter table salons enable row level security;
alter table staff enable row level security;
alter table menus enable row level security;
alter table business_hours enable row level security;
alter table daily_slot_overrides enable row level security;
alter table customers enable row level security;
alter table customer_notes enable row level security;
alter table reservations enable row level security;
alter table admin_users enable row level security;

-- 予約サイト表示用に、公開情報(サロン名・スタッフ・メニュー・営業時間)は誰でも閲覧可
create policy "public read salons" on salons for select using (true);
create policy "public read staff" on staff for select using (is_active = true);
create policy "public read menus" on menus for select using (is_active = true);
create policy "public read business_hours" on business_hours for select using (true);
create policy "public read daily_slot_overrides" on daily_slot_overrides for select using (true);

-- 顧客・予約・管理系は匿名クライアントから直接読み書きさせず、
-- Next.jsのサーバー側(Service Role Key)経由でのみ操作する方針のためRLSはデフォルト拒否のままにする
-- (管理画面ログインユーザーがSupabase Auth経由で直接読みたい場合は、admin_usersを参照するポリシーを別途追加する)
create policy "admin manage own salon customers" on customers for select
  using (exists (select 1 from admin_users au where au.user_id = auth.uid() and au.salon_id = customers.salon_id));

create policy "admin manage own salon reservations" on reservations for select
  using (exists (select 1 from admin_users au where au.user_id = auth.uid() and au.salon_id = reservations.salon_id));

create policy "customer read own reservations" on reservations for select
  using (customer_id in (select id from customers where user_id = auth.uid()));
