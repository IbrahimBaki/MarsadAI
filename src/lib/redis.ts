import "server-only";
import { Redis } from "@upstash/redis";

// Upstash Redis added from the Vercel Marketplace sets KV_REST_API_*;
// Upstash's own integration sets UPSTASH_REDIS_REST_*. Either works.
const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = url && token ? new Redis({ url, token }) : null;

if (!redis && process.env.NODE_ENV === "production") {
  console.warn("[marsad] Redis is not configured — accounts and seen/favorites will not persist.");
}
