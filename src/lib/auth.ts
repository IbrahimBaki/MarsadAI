import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { redis } from "./redis";

/**
 * Two kinds of accounts:
 * - Fixed users from the AUTH_USERS env var, one per line or separated by ";":
 *     ibrahim:my-password
 *     sara:scrypt.<salt-hex>.<hash-hex>     (from `npm run hash-password`)
 * - Self-registered users (username + password, no email), stored hashed in Redis.
 * Usernames are case-insensitive.
 */

export const USERNAME = /^[a-z0-9][a-z0-9._-]{2,23}$/;
export const MIN_PASSWORD = 8;
const SIGNUPS_PER_HOUR = 5;

const userKey = (name: string) => `marsad:user:${name}`;
// Dev fallback when Redis isn't configured; lost on restart.
const memoryUsers = new Map<string, string>();
const memoryHits = new Map<string, { n: number; until: number }>();

function envUsers(): Map<string, string> {
  const raw = process.env.AUTH_USERS ?? (process.env.NODE_ENV === "production" ? "" : "demo:demo");
  const map = new Map<string, string>();
  for (const entry of raw.split(/[;\n]/)) {
    const i = entry.indexOf(":");
    if (i < 1) continue;
    map.set(entry.slice(0, i).trim().toLowerCase(), entry.slice(i + 1).trim());
  }
  return map;
}

export function signupEnabled() {
  return process.env.ALLOW_SIGNUP !== "false";
}

function hashPassword(password: string) {
  const salt = randomBytes(16);
  return `scrypt.${salt.toString("hex")}.${scryptSync(password, salt, 32).toString("hex")}`;
}

function safeEqual(a: Buffer, b: Buffer) {
  return a.length === b.length && timingSafeEqual(a, b);
}

function verify(stored: string, password: string) {
  if (stored.startsWith("scrypt.")) {
    const [, saltHex, hashHex] = stored.split(".");
    const hash = scryptSync(password, Buffer.from(saltHex, "hex"), 32);
    return safeEqual(hash, Buffer.from(hashHex, "hex"));
  }
  return safeEqual(Buffer.from(password), Buffer.from(stored));
}

async function storedPassword(name: string): Promise<string | null> {
  const fixed = envUsers().get(name);
  if (fixed) return fixed;
  if (redis) return (await redis.get<string>(userKey(name))) ?? null;
  return memoryUsers.get(name) ?? null;
}

export async function checkPassword(username: string, password: string): Promise<string | null> {
  const name = username.trim().toLowerCase();
  const stored = await storedPassword(name);
  return stored && verify(stored, password) ? name : null;
}

export type RegisterError = "disabled" | "invalid_username" | "weak_password" | "taken" | "rate_limited";

/** Counts sign-ups per client IP per hour, to slow down bulk account creation. */
async function allowSignup(ip: string) {
  const key = `marsad:rl:signup:${ip}`;
  if (redis) {
    const n = await redis.incr(key);
    if (n === 1) await redis.expire(key, 3600);
    return n <= SIGNUPS_PER_HOUR;
  }
  const now = Date.now();
  const hit = memoryHits.get(key);
  const next = hit && hit.until > now ? { n: hit.n + 1, until: hit.until } : { n: 1, until: now + 3600_000 };
  memoryHits.set(key, next);
  return next.n <= SIGNUPS_PER_HOUR;
}

export async function registerUser(
  username: string,
  password: string,
  ip: string,
): Promise<{ ok: true; name: string } | { ok: false; error: RegisterError }> {
  if (!signupEnabled()) return { ok: false, error: "disabled" };
  const name = username.trim().toLowerCase();
  if (!USERNAME.test(name)) return { ok: false, error: "invalid_username" };
  if (password.length < MIN_PASSWORD || password.length > 200) return { ok: false, error: "weak_password" };
  if (envUsers().has(name)) return { ok: false, error: "taken" };
  if (!(await allowSignup(ip))) return { ok: false, error: "rate_limited" };

  const hashed = hashPassword(password);
  if (redis) {
    // NX: only succeeds if nobody registered the name first.
    const created = await redis.set(userKey(name), hashed, { nx: true });
    if (created !== "OK") return { ok: false, error: "taken" };
  } else {
    if (memoryUsers.has(name)) return { ok: false, error: "taken" };
    memoryUsers.set(name, hashed);
  }
  return { ok: true, name };
}
