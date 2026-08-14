#!/usr/bin/env node
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { loadEnvLocal, waitForPageButtonClick, fillFieldByLabel } from "./lib.mjs";

loadEnvLocal();

function parseArgs() {
  const args = process.argv.slice(2);
  const fileIndex = args.indexOf("--file");
  const file =
    fileIndex !== -1 && args[fileIndex + 1]
      ? args[fileIndex + 1]
      : "scripts/hotpepper-autofill/my-style.json";
  return { file };
}

async function main() {
  const { file } = parseArgs();
  const data = JSON.parse(readFileSync(file, "utf-8"));

  for (const key of ["styleTitle", "stylistComment", "menuContent"]) {
    if (!data[key]) {
      console.error(`エラー: ${file} に "${key}" がありません`);
      process.exit(1);
    }
  }

  console.log("ブラウザを起動します...");
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("https://salonboard.com/login/");

  console.log("SALON BOARDにログインし、スタイルの新規追加/編集画面を開いてください。");
  console.log("準備ができたら、ブラウザ右上に出ている赤いボタンをクリックしてください。");
  await waitForPageButtonClick(page, "ここをクリックすると自動入力を開始します");

  if (!page.url().includes("styleEdit")) {
    console.warn(
      "⚠ 現在のURLに「styleEdit」が含まれていません。スタイル編集画面を開いているか確認してください。"
    );
  }

  console.log("入力しています...");
  await fillFieldByLabel(page, "スタイル名", data.styleTitle, { tag: "input" });
  await fillFieldByLabel(page, "メニュー内容", data.menuContent, { tag: "textarea" });
  await fillFieldByLabel(page, "コメント", data.stylistComment, { tag: "textarea" });

  console.log("");
  console.log("入力が完了しました。内容を必ずご自身の目で確認してから、");
  console.log("SALON BOARD側の「登録する」ボタンはご自身で押してください。");
  console.log("(このツールは登録ボタンを絶対に押しません)");
}

main().catch((err) => {
  console.error("エラーが発生しました:", err);
  process.exit(1);
});
