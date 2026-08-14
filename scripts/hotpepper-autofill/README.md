# ホットペッパービューティー(SALON BOARD)自動入力ツール

ホットペッパービューティーには公式APIがないため、投稿の完全自動化はできません。
このツールは、SALON BOARDの入力フォームに文章を**自動で入力するだけ**のツールです。

**送信(登録する/投稿する)ボタンは絶対に自動で押しません。**
必ずご自身の目で内容を確認してから、自分の手でボタンを押してください。
(ホットペッパー側の利用規約への配慮のため)

このツールは自分のPC上で動かします。Vercel(本番サイト)側では動きません。

## 事前準備(初回のみ)

```
npx playwright install chromium
```

## 使い方: スタイル掲載情報

1. `scripts/hotpepper-autofill/example-style.json` をコピーして中身を書き換える
   (管理画面の「AIで文章を生成」で作った文章、または自分で書いた文章を入れてください)
   - `styleTitle`: スタイル名(30文字以内)
   - `stylistComment`: スタイリストコメント(120文字以内)
   - `menuContent`: メニュー内容(50文字以内)
2. 実行する
   ```
   node scripts/hotpepper-autofill/fill-style.mjs --file scripts/hotpepper-autofill/my-style.json
   ```
3. ブラウザが開くので、SALON BOARDに手動でログインし、スタイルの新規追加/編集画面を開く
4. ターミナルに戻ってEnterキーを押す → 自動入力される
5. 内容を確認して、自分で「登録する」ボタンを押す

## 使い方: ブログ投稿

1. `scripts/hotpepper-autofill/example-blog.json` をコピーして中身を書き換える
   - `blogTitle`: タイトル(25文字以内)
   - `blogBody`: 本文(1000文字以内)
2. 実行する
   ```
   node scripts/hotpepper-autofill/fill-blog.mjs --file scripts/hotpepper-autofill/my-blog.json
   ```
3. ブラウザが開くので、SALON BOARDに手動でログインし、ブログの新規投稿画面を開く
4. ターミナルに戻ってEnterキーを押す → 自動入力される
5. 内容を確認して、自分で「確認する」→「投稿する」を押す

## 注意事項

- このツールはSALON BOARDの画面のスクリーンショットをもとに作成しており、実際のHTML構造を
  確認したものではありません。画面の項目が見つからない場合は警告が表示されるだけで止まらない
  ので、その項目は手動で入力してください。
- 画像のアップロード、クーポン選択、ヘアスタイル特集の選択などは自動化していません。手動で設定
  してください。
- ログインID・パスワードはこのツールに保存されません。毎回手動でログインしてください。
- 実際に使ってみて、うまく入力できない項目があれば教えてください。調整します。
