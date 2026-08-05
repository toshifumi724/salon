-- ブログ記事のタイトルを保存する列を追加
alter table posts add column if not exists blog_title text;
