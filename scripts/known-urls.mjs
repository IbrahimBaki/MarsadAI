#!/usr/bin/env node
// Prints every URL and title already published, so a new digest can skip repeats.
// Essentials are printed with "essentials" instead of a date: they are already known,
// so only report one as news when something genuinely new happened to it.
// Usage: npm run known            (everything)
//        npm run known -- 30      (last 30 days only, plus essentials)
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
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

const ess = path.join(dir, "essentials.json");
if (existsSync(ess)) {
  for (const it of JSON.parse(readFileSync(ess, "utf8")).items)
    console.log(`essentials\t${it.url}\t${it.title}`);
}
