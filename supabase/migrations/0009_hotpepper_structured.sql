-- フェーズ4: SALON BOARDの各入力欄(スタイル名/スタイリストコメント/メニュー内容/
-- ブログタイトル/ブログ本文)にそのまま対応させるため、単一テキストから項目別に分割する
alter table posts drop column if exists hotpepper_content;

alter table posts add column if not exists hotpepper_style_title text;
alter table posts add column if not exists hotpepper_stylist_comment text;
alter table posts add column if not exists hotpepper_menu_content text;
alter table posts add column if not exists hotpepper_blog_title text;
alter table posts add column if not exists hotpepper_blog_body text;
