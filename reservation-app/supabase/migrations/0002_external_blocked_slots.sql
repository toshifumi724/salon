-- サロンボードなど、このアプリの外部で入った予約を「空き枠計算上はブロックする」ためのテーブル。
-- 実際の予約データそのもの(reservations)とは別に扱う。連携スクリプトが定期的に
-- source='salonboard' の行を洗い替え(その日以降を削除して入れ直す)する想定。
create table if not exists external_blocked_slots (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  staff_id uuid not null references staff(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  source text not null default 'salonboard',
  external_ref text,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists idx_external_blocked_slots_staff_date on external_blocked_slots(staff_id, date);

alter table external_blocked_slots enable row level security;
-- 匿名クライアントからは読み書きさせず、Service Role Key経由(連携スクリプト・サーバー側API)でのみ操作する
