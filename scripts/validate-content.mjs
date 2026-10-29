#!/usr/bin/env node
// Validates every content/YYYY-MM-DD.json file. Exits 1 on any error.
// Usage: npm run validate            (all files)
//        npm run validate -- 2026-10-29   (one day)
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const contentDir = path.join(root, "content");
const sectionsSrc = readFileSync(path.join(root, "src/lib/sections.ts"), "utf8");
const SECTIONS = new Set([...sectionsSrc.matchAll(/\{\s*id:\s*"([a-z]+)"/g)].map((m) => m[1]));
const KINDS = new Set(["release", "repo", "skill", "mcp", "model", "tool", "article", "video"]);
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[a-z0-9][a-z0-9-]{2,90}$/;

const only = process.argv[2];
const files = readdirSync(contentDir)
  .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
  .filter((f) => !only || f === `${only}.json`)
  .sort();

const errors = [];
const ids = new Map();
const urls = new Map();
let count = 0;

for (const file of files) {
  const where = (m) => errors.push(`${file}: ${m}`);
  let d;
  try {
    d = JSON.parse(readFileSync(path.join(contentDir, file), "utf8"));
  } catch (e) {
    where(`invalid JSON — ${e.message}`);
    continue;
  }
  if (d.date !== file.replace(".json", "")) where(`"date" must equal the file name`);
  if (!DAY.test(d.date ?? "")) where(`bad "date"`);
  if (typeof d.headline !== "string" || d.headline.length < 10) where(`"headline" is missing or too short`);
  if (!Array.isArray(d.items) || d.items.length === 0) {
    where(`"items" must be a non-empty array`);
    continue;
  }
  d.items.forEach((it, i) => {
    const at = (m) => where(`items[${i}] (${it?.id ?? "?"}): ${m}`);
    count++;
    if (!ID.test(it.id ?? "")) at(`"id" must be lowercase kebab-case, 3–90 chars`);
    if (ids.has(it.id)) at(`duplicate id, already in ${ids.get(it.id)}`);
    ids.set(it.id, file);
    if (!SECTIONS.has(it.section)) at(`"section" must be one of ${[...SECTIONS].join(", ")}`);
    if (!KINDS.has(it.kind)) at(`"kind" must be one of ${[...KINDS].join(", ")}`);
    for (const k of ["title", "summary", "why", "source"]) {
      if (typeof it[k] !== "string" || it[k].trim().length < 2) at(`"${k}" is required`);
    }
    if (typeof it.summary === "string" && it.summary.length > 420) at(`"summary" is longer than 420 chars`);
    if (typeof it.why === "string" && it.why.length > 300) at(`"why" is longer than 300 chars`);
    try {
      const u = new URL(it.url);
      if (u.protocol !== "https:" && u.protocol !== "http:") throw 0;
      const key = u.href.replace(/\/$/, "").toLowerCase();
      if (urls.has(key)) at(`duplicate url, already in ${urls.get(key)}`);
      urls.set(key, file);
    } catch {
      at(`"url" must be a full http(s) URL`);
    }
    if (![1, 2, 3].includes(it.importance)) at(`"importance" must be 1, 2 or 3`);
    if (!Array.isArray(it.tags) || it.tags.length > 6 || it.tags.some((t) => typeof t !== "string"))
      at(`"tags" must be an array of up to 6 strings`);
  });
}

if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join("\n"));
  console.error(`\n${errors.length} problem(s).`);
  process.exit(1);
}
console.log(`✓ ${files.length} day file(s), ${count} item(s) — all valid.`);
