#!/usr/bin/env node
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { loadEnvLocal, waitForEnter, fillFieldByLabel } from "./lib.mjs";

loadEnvLocal();

function parseArgs() {
  const args = process.argv.slice(2);
  const fileIndex = args.indexOf("--file");
  const file =
    fileIndex !== -1 && args[fileIndex + 1]
      ? args[fileIndex + 1]
      : "scripts/hotpepper-autofill/example-blog.json";
  return { file };
}

async function main() {
  const { file } = parseArgs();
  const data = JSON.parse(readFileSync(file, "utf-8"));

  for (const key of ["blogTitle", "blogBody"]) {
    if (!data[key]) {
      console.error(`エラー: ${file} に "${key}" がありません`);
      process.exit(1);
    }
  }

  console.log("ブラウザを起動します...");
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("https://salonboard.com/login/");

  console.log("");
  console.log("=======================================================");
  console.log("1. 開いたブラウザでSALON BOARDにログインしてください");
  console.log("2. ブログの「新規投稿」画面を開いてください");
  console.log("3. 準備ができたら、このターミナルでEnterキーを押してください");
  console.log("=======================================================");
  await waitForEnter("> ");

  if (!page.url().includes("blog")) {
    console.warn(
      "⚠ 現在のURLに「blog」が含まれていません。ブログ投稿画面を開いているか確認してください。"
    );
  }

  console.log("入力しています...");
  await fillFieldByLabel(page, "タイトル", data.blogTitle, { tag: "input" });
  await fillFieldByLabel(page, "本文", data.blogBody, { tag: "textarea" });

  console.log("");
  console.log("=======================================================");
  console.log("入力が完了しました。内容を必ずご自身の目で確認してから、");
  console.log("SALON BOARD側の「確認する」→「投稿する」はご自身で押してください。");
  console.log("(このツールは投稿ボタンを絶対に押しません)");
  console.log("=======================================================");
}

main().catch((err) => {
  console.error("エラーが発生しました:", err);
  process.exit(1);
});
