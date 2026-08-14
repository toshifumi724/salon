import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";

// .env.localを簡易的に読み込む(dotenv非依存)
export function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

export async function waitForEnter(message) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  await rl.question(message);
  rl.close();
}

/**
 * ラベルセル(td/th)の隣にある入力欄を見つけて値を入力する。
 * SALON BOARDの実際のHTML構造を検証できていないため、ラベルの文字列を頼りに
 * 探索するベストエフォート方式。見つからない場合は警告を出すだけで停止しない。
 */
export async function fillFieldByLabel(page, labelText, value, { tag = "input" } = {}) {
  const locator = page
    .locator(
      `xpath=//*[self::td or self::th][starts-with(normalize-space(string(.)), "${labelText}")]/following-sibling::*[1]//${tag}`
    )
    .first();

  const count = await locator.count();
  if (count === 0) {
    console.warn(`  ⚠ 「${labelText}」の入力欄が見つかりませんでした。手動で入力してください。`);
    return false;
  }

  await locator.fill(value);
  console.log(`  ✓ 「${labelText}」に入力しました`);
  return true;
}
