// このファイルはEdge runtime(src/proxy.ts)からも読み込まれるため、
// Node.js専用のAPI(crypto モジュールなど)は使わずWeb Crypto APIのみを使う。
// パスワードのハッシュ化は src/lib/password.ts (Node.js専用)を参照。

const SESSION_COOKIE_NAME = "session";
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7日間

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRETが設定されていません");
  }
  return secret;
}

async function hmacHex(message: string, secret: string): Promise<string> {
  const keyData = new TextEncoder().encode(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * ログイン中のサロンIDを埋め込んだ、改ざん検知可能なセッションCookie値を作成する。
 */
export async function createSessionCookieValue(salonId: string): Promise<string> {
  const secret = getSessionSecret();
  const expiresAt = Date.now() + SESSION_MAX_AGE_MS;
  const payload = `${salonId}.${expiresAt}`;
  const signature = await hmacHex(payload, secret);
  return `${payload}.${signature}`;
}

/**
 * セッションCookieを検証し、有効であればサロンIDを返す。
 * 署名不一致・期限切れの場合はnullを返す。
 */
export async function verifySessionCookie(
  value: string | undefined
): Promise<string | null> {
  if (!value) return null;

  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [salonId, expiresAtStr, signature] = parts;

  const expiresAt = Number(expiresAtStr);
  if (!salonId || !Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return null;
  }

  try {
    const secret = getSessionSecret();
    const expected = await hmacHex(`${salonId}.${expiresAtStr}`, secret);
    return timingSafeEqualString(signature, expected) ? salonId : null;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE_NAME };
