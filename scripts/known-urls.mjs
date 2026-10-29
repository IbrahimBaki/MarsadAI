#!/usr/bin/env node
// Prints every URL and title already published, so a new digest can skip repeats.
// Usage: npm run known            (everything)
//        npm run known -- 30      (last 30 days only)
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const dir = path.join(root, "content");
const days = Number(process.argv[2]) || Infinity;
const files = readdirSync(dir)
  .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
  .sort()
  .reverse()
  .slice(0, days);

for (const f of files) {
  const d = JSON.parse(readFileSync(path.join(dir, f), "utf8"));
  for (const it of d.items) console.log(`${d.date}\t${it.url}\t${it.title}`);
}
