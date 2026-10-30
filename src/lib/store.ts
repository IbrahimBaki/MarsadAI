import "server-only";
import { redis } from "./redis";
import type { UserState } from "./types";

// In-memory fallback for local development.
const memory = new Map<string, Set<string>>();

export type ListName = "seen" | "fav";
const key = (user: string, list: ListName) => `marsad:u:${user}:${list}`;

export const storeIsPersistent = Boolean(redis);

export async function getState(user: string): Promise<UserState> {
  if (redis) {
    const [seen, fav] = await Promise.all([
      redis.smembers<string[]>(key(user, "seen")),
      redis.smembers<string[]>(key(user, "fav")),
    ]);
    return { seen: seen ?? [], fav: fav ?? [] };
  }
  return {
    seen: [...(memory.get(key(user, "seen")) ?? [])],
    fav: [...(memory.get(key(user, "fav")) ?? [])],
  };
}

export async function setMembership(user: string, list: ListName, ids: string[], on: boolean) {
  if (ids.length === 0) return;
  const k = key(user, list);
  if (redis) {
    const [first, ...rest] = ids;
    if (on) await redis.sadd(k, first, ...rest);
    else await redis.srem(k, ...ids);
    return;
  }
  const set = memory.get(k) ?? new Set<string>();
  for (const id of ids) {
    if (on) set.add(id);
    else set.delete(id);
  }
  memory.set(k, set);
}
