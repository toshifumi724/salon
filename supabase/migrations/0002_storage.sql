-- 投稿画像を保存するStorageバケット(非公開。アプリのサーバー側からservice role keyでのみアクセス)
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', false)
on conflict (id) do nothing;
