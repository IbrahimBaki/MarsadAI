import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Digest, Essentials, FeedPayload, FeedItem } from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content");
const DAY_FILE = /^\d{4}-\d{2}-\d{2}\.json$/;

export async function loadFeed(): Promise<FeedPayload> {
  let files: string[] = [];
  try {
    files = (await readdir(CONTENT_DIR)).filter((f) => DAY_FILE.test(f));
  } catch {
    return { days: [], items: [], essentials: [] };
  }
  files.sort().reverse(); // newest first

  const days: FeedPayload["days"] = [];
  const items: FeedItem[] = [];
  const seenIds = new Set<string>();

  for (const file of files) {
    const digest = JSON.parse(await readFile(path.join(CONTENT_DIR, file), "utf8")) as Digest;
    days.push({ date: digest.date, headline: digest.headline });
    for (const item of digest.items) {
      if (seenIds.has(item.id)) continue;
      seenIds.add(item.id);
      items.push({ ...item, date: digest.date });
    }
  }
  let essentials: FeedItem[] = [];
  try {
    const raw = JSON.parse(await readFile(path.join(CONTENT_DIR, "essentials.json"), "utf8")) as Essentials;
    essentials = raw.items.map((item) => ({ ...item, date: "" }));
  } catch {}

  return { days, items, essentials };
}
