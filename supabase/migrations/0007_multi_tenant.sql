-- フェーズ3: 複数サロンが個別にログインできるようにするための最低限のマルチテナント対応

alter table salons add column if not exists email text unique;
alter table salons add column if not exists password_hash text;

-- サロンごとのWordPress連携設定(これまではenv変数で1サロン分のみだった)
alter table salons add column if not exists wordpress_url text;
alter table salons add column if not exists wordpress_username text;
alter table salons add column if not exists wordpress_app_password text;
alter table salons add column if not exists wordpress_post_status text not null default 'draft';
