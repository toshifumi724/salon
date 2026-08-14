// サロンボードの予約一覧を読み取り、このアプリの external_blocked_slots に反映するスクリプト。
//
// サロンボードには公式APIが無く、実際の画面構成(ログインフォーム・予約一覧のHTML)を
// 開発側から確認する手段が無いため、このスクリプトは「探索モード」から始める設計。
//
// 【使い方】
// 1. .env.local に以下を設定
//      NEXT_PUBLIC_SUPABASE_URL=...
//      SUPABASE_SERVICE_ROLE_KEY=...
//      DEFAULT_SALON_ID=...
//      DEFAULT_STAFF_ID=...(空き枠計算で使っているスタッフのID。Table Editorのstaffテーブルで確認)
//      SALONBOARD_LOGIN_URL=https://salonboard.com/login/
// 2. ターミナルで `node scripts/sync-salonboard.mjs` を実行
// 3. 自動でブラウザ(実画面)が開くので、その場でサロンボードに手動ログインし、
//    予約一覧の画面まで自分で移動する(パスワードはこのスクリプトには保存されない)
// 4. 予約一覧画面まで来たら、ターミナルに戻ってEnterキーを押す
// 5. スクリプトがその画面のHTML/スクリーンショットを scripts/output/ に保存する
//    → これをClaude Codeに共有してもらえれば、実際の予約データの取り出し方(セレクタ)を
//      一緒に確定させ、次のステップで自動反映まで作り込む
//
// 現時点ではまだ「実データの読み取り→DB反映」の部分は未実装(プレースホルダ)。
// 探索モードで得たHTMLを元に、次の変更で実装する。

import { chromium } from "playwright";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { config as loadEnv } from "dotenv";

loadEnv({ path: new URL("../.env.local", import.meta.url).pathname });

const LOGIN_URL = process.env.SALONBOARD_LOGIN_URL ?? "https://salonboard.com/login/";
const OUTPUT_DIR = new URL("./output/", import.meta.url);

async function main() {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log("サロンボードのログイン画面を開きます...");
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(LOGIN_URL);

  console.log("");
  console.log("=== 手動でログインしてください ===");
  console.log("1. 開いたブラウザでサロンボードに普段通りログイン");
  console.log("2. 予約一覧(本日の予約が見える画面)まで自分で移動する");
  console.log("3. 準備ができたら、このターミナルに戻ってEnterキーを押す");
  console.log("");

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  await rl.question("予約一覧画面が表示できたらEnterを押してください... ");
  rl.close();

  const html = await page.content();
  const htmlPath = new URL("reservation-page.html", OUTPUT_DIR);
  const screenshotPath = new URL("reservation-page.png", OUTPUT_DIR);
  writeFileSync(htmlPath, html, "utf-8");
  await page.screenshot({ path: screenshotPath, fullPage: true });

  console.log("");
  console.log(`HTMLを保存しました: ${htmlPath.pathname}`);
  console.log(`スクリーンショットを保存しました: ${screenshotPath.pathname}`);
  console.log("このファイルをClaude Codeに共有すると、実際のデータ取り出し処理を実装できます。");
  console.log("");

  // TODO: 実際のセレクタが分かったら、ここで予約データを抽出して
  // external_blocked_slots に反映する処理を実装する(次のステップ)。
  //
  // 例:
  // const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  // const rows = await page.$$eval("セレクタ", (els) => els.map(...));
  // await admin.from("external_blocked_slots")
  //   .delete()
  //   .eq("staff_id", process.env.DEFAULT_STAFF_ID)
  //   .eq("source", "salonboard")
  //   .gte("date", 今日の日付);
  // await admin.from("external_blocked_slots").insert(rows.map(...));

  await browser.close();
}

main().catch((err) => {
  console.error("エラーが発生しました:", err);
  process.exit(1);
});
