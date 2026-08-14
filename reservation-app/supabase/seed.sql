-- 開発初期データ(必要に応じて内容を書き換えてください)
insert into salons (id, name) values
  ('00000000-0000-0000-0000-000000000001', '白髪ぼかし×脱白髪染め専門店 KIZASI')
on conflict (id) do nothing;

insert into staff (salon_id, name) values
  ('00000000-0000-0000-0000-000000000001', '担当スタイリスト')
on conflict do nothing;

-- 月・火定休、9:00-18:00(datsusiragazome.comの実際の営業時間に合わせた例)
insert into business_hours (salon_id, day_of_week, is_closed, open_time, close_time)
select '00000000-0000-0000-0000-000000000001', d,
  (d in (1, 2)), -- 1=月曜, 2=火曜を定休日に
  '09:00', '18:00'
from generate_series(0, 6) as d
on conflict (salon_id, day_of_week) do nothing;

insert into menus (salon_id, name, duration_minutes, price_yen, sort_order) values
  ('00000000-0000-0000-0000-000000000001', 'カット', 30, 4000, 1),
  ('00000000-0000-0000-0000-000000000001', 'カラー', 120, 8000, 2),
  ('00000000-0000-0000-0000-000000000001', 'カラー+ハイライト', 150, 12000, 3)
on conflict do nothing;
