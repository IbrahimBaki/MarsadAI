import "server-only";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { SECTION_META, type SectionId } from "./sections";
import type { Digest, FeedItem, FeedPayload, Item, RadarEntry, RepoStats } from "./types";

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "content");
const SIGNALS_DIR = path.join(ROOT, "signals");
const DAY_FILE = /^\d{4}-\d{2}-\d{2}\.json$/;
/** How many days of raw signals the Radar view shows. */
const RADAR_DAYS = 21;
const RADAR_MAX = 2500;

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch {
    return null;
  }
}

async function listJson(dir: string, pattern = /\.json$/) {
  if (!existsSync(dir)) return [];
  return (await readdir(dir)).filter((f) => pattern.test(f)).sort();
}

const shortId = (s: string) => createHash("sha1").update(s).digest("hex").slice(0, 12);

type Signals = {
  date: string;
  awesome?: { list: string; section: string; name: string; url: string; desc: string; heading: string }[];
  releases?: { repo: string; section: string; tag: string; url: string; previous: string | null }[];
  trending?: { repo: string; section: string; url: string; description: string | null; stars: number }[];
};

async function loadRadar(): Promise<RadarEntry[]> {
  const files = (await listJson(SIGNALS_DIR, DAY_FILE)).reverse().slice(0, RADAR_DAYS);
  const out: RadarEntry[] = [];
  const seen = new Set<string>();
  const section = (s: string): SectionId => (SECTION_META[s as SectionId] ? (s as SectionId) : "devtools");
  for (const f of files) {
    const s = await readJson<Signals>(path.join(SIGNALS_DIR, f));
    if (!s) continue;
    for (const r of s.releases ?? []) {
      const id = `rel-${shortId(r.repo + r.tag)}`;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push({
        id, type: "release", section: section(r.section), date: s.date, title: `${r.repo} ${r.tag}`,
        url: r.url, desc: "", repo: r.repo, tag: r.tag, previous: r.previous ?? undefined,
      });
    }
    for (const t of s.trending ?? []) {
      const id = `trd-${shortId(t.repo)}`;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push({
        id, type: "trending", section: section(t.section), date: s.date, title: t.repo, url: t.url,
        desc: t.description ?? "", repo: t.repo, stars: t.stars,
      });
    }
    for (const a of s.awesome ?? []) {
      const id = `awe-${shortId(a.url.toLowerCase())}`;
      if (seen.has(id)) continue;
      seen.add(id);
      const gh = a.url.match(/github\.com\/([^/]+\/[^/#?]+)/i);
      out.push({
        id, type: "awesome", section: section(a.section), date: s.date, title: a.name, url: a.url,
        desc: a.desc, list: a.list, heading: a.heading, repo: gh ? gh[1].replace(/\.git$/, "") : undefined,
      });
    }
    if (out.length >= RADAR_MAX) break;
  }
  return out.slice(0, RADAR_MAX);
}

async function loadEssentials(): Promise<Item[]> {
  const dir = path.join(CONTENT_DIR, "essentials");
  const items: Item[] = [];
  for (const f of await listJson(dir)) {
    const data = await readJson<{ items: Item[] }>(path.join(dir, f));
    if (data?.items) items.push(...data.items);
  }
  return items;
}

/** Everything the app shows. Cached per request/build. */
export const loadFeed = cache(async (): Promise<FeedPayload> => {
  const days: FeedPayload["days"] = [];
  const items: FeedItem[] = [];
  const ids = new Set<string>();

  for (const file of (await listJson(CONTENT_DIR, DAY_FILE)).reverse()) {
    const digest = await readJson<Digest>(path.join(CONTENT_DIR, file));
    if (!digest) continue;
    days.push({ date: digest.date, headline: digest.headline, headline_en: digest.headline_en });
    for (const item of digest.items) {
      if (ids.has(item.id)) continue;
      ids.add(item.id);
      items.push({ ...item, date: digest.date, essential: false });
    }
  }

  const essentials = (await loadEssentials()).map((item) => ({ ...item, date: "", essential: true }));
  const statsFile = await readJson<{ updated: string; repos: Record<string, RepoStats> }>(
    path.join(CONTENT_DIR, "stats.json"),
  );

  return {
    days,
    items,
    essentials,
    radar: await loadRadar(),
    stats: statsFile?.repos ?? {},
    statsUpdated: statsFile?.updated ?? null,
  };
});

export async function findItem(id: string) {
  const feed = await loadFeed();
  return feed.items.find((i) => i.id === id) ?? feed.essentials.find((i) => i.id === id) ?? null;
}
