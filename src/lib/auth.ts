import "server-only";
import { scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Users come from the AUTH_USERS env var, one per line or separated by ";":
 *   ibrahim:my-password
 *   sara:scrypt.<salt-hex>.<hash-hex>     (from `npm run hash-password`)
 * The username is case-insensitive.
 */
function users(): Map<string, string> {
  const raw = process.env.AUTH_USERS ?? (process.env.NODE_ENV === "production" ? "" : "demo:demo");
  const map = new Map<string, string>();
  for (const entry of raw.split(/[;\n]/)) {
    const i = entry.indexOf(":");
    if (i < 1) continue;
    map.set(entry.slice(0, i).trim().toLowerCase(), entry.slice(i + 1).trim());
  }
  return map;
}

function safeEqual(a: Buffer, b: Buffer) {
  return a.length === b.length && timingSafeEqual(a, b);
}

export function checkPassword(username: string, password: string): string | null {
  const name = username.trim().toLowerCase();
  const stored = users().get(name);
  if (!stored) return null;
  if (stored.startsWith("scrypt.")) {
    const [, saltHex, hashHex] = stored.split(".");
    const hash = scryptSync(password, Buffer.from(saltHex, "hex"), 32);
    return safeEqual(hash, Buffer.from(hashHex, "hex")) ? name : null;
  }
  return safeEqual(Buffer.from(password), Buffer.from(stored)) ? name : null;
}

