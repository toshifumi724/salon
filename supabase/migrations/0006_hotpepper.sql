-- フェーズ4: ホットペッパービューティー用コンテンツ(コピペ用・投稿機能なし)
alter table posts add column if not exists hotpepper_content text;
