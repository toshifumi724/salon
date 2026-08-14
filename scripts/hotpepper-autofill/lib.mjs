import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

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

/**
 * ターミナル操作なしで「準備完了」を伝えられるよう、ブラウザ画面の右上に
 * ボタンを表示し、クリックされるまで待つ。ページ遷移(ログインなど)のたびに
 * ボタンが消えるため、遷移完了ごとに再表示する。
 */
export async function waitForPageButtonClick(page, label) {
  const inject = async () => {
    try {
      await page.evaluate((text) => {
        if (document.getElementById("__autofill_start_btn__")) return;
        const btn = document.createElement("button");
        btn.id = "__autofill_start_btn__";
        btn.textContent = text;
        Object.assign(btn.style, {
          position: "fixed",
          top: "16px",
          right: "16px",
          zIndex: "2147483647",
          padding: "14px 22px",
          fontSize: "16px",
          fontWeight: "bold",
          background: "#e11d48",
          color: "#fff",
          border: "none",
          borderRadius: "10px",
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(0,0,0,.35)",
        });
        btn.onclick = () => {
          window.__autofillReady = true;
          btn.textContent = "入力中...";
          btn.disabled = true;
        };
        document.body.appendChild(btn);
      }, label);
    } catch {
      // ページ遷移中などで失敗した場合は、次のチェック時に再試行する
    }
  };

  page.on("load", inject);
  await inject();

  while (true) {
    try {
      const ready = await page.evaluate(() => window.__autofillReady === true);
      if (ready) break;
    } catch {
      // ページ遷移中は評価できないことがあるため無視して再試行
    }
    await page.waitForTimeout(500);
  }

  page.off("load", inject);
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
