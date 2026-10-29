#!/usr/bin/env node
// Prints every URL, repo and title already published, so a new digest can skip repeats.
// Essentials are printed with "essentials" instead of a date: they are already known,
// so only report one as news when something genuinely new happened to it.
// Usage: npm run known            (everything)
//        npm run known -- 30      (last 30 days only, plus essentials)
import { existsSync, readFileSync, readdirSync } from "node:fs";
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

const line = (label, it) => console.log(`${label}\t${it.section}\t${it.repo ?? "-"}\t${it.url}\t${it.title}`);

for (const f of files) {
  const d = JSON.parse(readFileSync(path.join(dir, f), "utf8"));
  for (const it of d.items) line(d.date, it);
}

const essDir = path.join(dir, "essentials");
if (existsSync(essDir)) {
  for (const f of readdirSync(essDir).filter((f) => f.endsWith(".json")).sort()) {
    for (const it of JSON.parse(readFileSync(path.join(essDir, f), "utf8")).items) line("essentials", it);
  }
}
