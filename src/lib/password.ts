import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// Node.jsランタイム専用(Server Action / Route Handlerからのみ呼び出すこと)。
// Edge runtimeで動くsrc/proxy.tsからは絶対にimportしない。

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPasswordHash(password: string, stored: string): boolean {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;

  const hash = scryptSync(password, salt, 64);
  const storedHash = Buffer.from(hashHex, "hex");
  if (hash.length !== storedHash.length) return false;

  return timingSafeEqual(hash, storedHash);
}
