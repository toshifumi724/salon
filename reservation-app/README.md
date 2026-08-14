# 予約管理アプリ (reservation-app)

美容室向け予約管理アプリのMVP実装。詳細な要件は `CLAUDE.md` を参照。

## セットアップ手順

1. [Supabase](https://supabase.com) で新しいプロジェクトを作成する
2. Supabaseダッシュボードの SQL Editor で `supabase/migrations/0001_init.sql` を実行する
3. 動作確認用の初期データが欲しい場合は `supabase/seed.sql` も実行する（サロンID等は必要に応じて書き換え）
4. Supabaseダッシュボードの Authentication で自分のメールアドレスのユーザーを作成し、
   `admin_users` テーブルに `salon_id`（seed.sqlのID）と `user_id`（作成したユーザーのID）を1行追加する
   → これで管理画面 (`/admin`) にログインできるようになる
5. `.env.example` を `.env.local` にコピーし、SupabaseのURL・匿名キー・Service Role Keyを設定する
6. メール送信を有効にする場合は [Resend](https://resend.com) でAPIキーを発行し `RESEND_API_KEY` に設定する
   （未設定の場合、メールは送信されずコンソールログに出力されるだけになります）
7. 依存関係をインストールして起動

```bash
npm install
npm run dev
```

- お客様向け予約ページ: `/book`
- 会員ログイン: `/login`
- サロン管理画面: `/admin`（`/admin/login` からログイン）

## WordPressへの埋め込み

WordPressのページに以下のようなiframeタグを設置してください。

```html
<iframe src="https://あなたのデプロイ先URL/book" width="100%" height="800" style="border:none;"></iframe>
```

本番運用時は `.env` の `WORDPRESS_SITE_ORIGIN` に埋め込み元のWordPressサイトのオリジン
（例: `https://your-salon.com`）を設定し、任意のサイトからの埋め込みを防いでください。
