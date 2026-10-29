#!/usr/bin/env node
// Validates content/YYYY-MM-DD.json digests and content/essentials/*.json. Exits 1 on any error.
// Usage: npm run validate                 (everything)
//        npm run validate -- 2026-10-29   (one day + essentials)
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = path.join(root, "content");
const config = JSON.parse(readFileSync(path.join(root, "config/sections.json"), "utf8"));
const SECTIONS = new Set(config.sections.map((s) => s.id));
const KINDS = new Set(Object.keys(config.kinds));
const PRICING = new Set(Object.keys(config.pricing));
const NO_PRICING_KINDS = new Set(["article", "release", "video"]);
const ID = /^[a-z0-9][a-z0-9-]{2,90}$/;
const REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

const only = process.argv[2];
const files = readdirSync(contentDir)
  .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
  .filter((f) => !only || f === `${only}.json`)
  .sort();
if (only && files.length === 0) {
  console.error(`✗ content/${only}.json not found`);
  process.exit(1);
}

const errors = [];
const ids = new Map();
const allIds = new Set();
const pendingAlternatives = [];
let count = 0;

const isStr = (v, min = 2) => typeof v === "string" && v.trim().length >= min;
const isUrl = (v) => {
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
};

function checkItems(file, items, urls, { essential }) {
  const where = (m) => errors.push(`${file}: ${m}`);
  if (!Array.isArray(items) || items.length === 0) {
    where(`"items" must be a non-empty array`);
    return;
  }
  items.forEach((it, i) => {
    const at = (m) => where(`items[${i}] (${it?.id ?? "?"}): ${m}`);
    count++;
    if (!ID.test(it.id ?? "")) at(`"id" must be lowercase kebab-case, 3–90 chars`);
    if (ids.has(it.id)) at(`duplicate id, already in ${ids.get(it.id)}`);
    ids.set(it.id, file);
    allIds.add(it.id);
    if (!SECTIONS.has(it.section)) at(`"section" must be one of ${[...SECTIONS].join(", ")}`);
    if (!KINDS.has(it.kind)) at(`"kind" must be one of ${[...KINDS].join(", ")}`);
    for (const k of ["title", "summary", "why", "source"]) if (!isStr(it[k])) at(`"${k}" is required`);
    if (isStr(it.summary) && it.summary.length > 420) at(`"summary" is longer than 420 chars`);
    if (isStr(it.why) && it.why.length > 320) at(`"why" is longer than 320 chars`);
    if (!isUrl(it.url)) at(`"url" must be a full http(s) URL`);
    else {
      const key = it.url.replace(/\/$/, "").toLowerCase();
      if (urls.has(key)) at(`duplicate url, already in ${urls.get(key)}`);
      urls.set(key, file);
    }
    if (![1, 2, 3].includes(it.importance)) at(`"importance" must be 1, 2 or 3`);
    if (!Array.isArray(it.tags) || it.tags.length > 6 || it.tags.some((t) => typeof t !== "string"))
      at(`"tags" must be an array of up to 6 strings`);

    // Detail fields
    if (it.repo !== undefined && !REPO.test(it.repo)) at(`"repo" must look like owner/name`);
    if (it.pricing !== undefined) {
      if (!PRICING.has(it.pricing?.model)) at(`"pricing.model" must be one of ${[...PRICING].join(", ")}`);
      if (it.pricing.note !== undefined && !isStr(it.pricing.note)) at(`"pricing.note" must be text`);
    } else if (!NO_PRICING_KINDS.has(it.kind)) {
      at(`"pricing" is required for kind "${it.kind}"`);
    }
    if (!isStr(it.about, 80)) at(`"about" (the full explanation for the details page) is required, 80+ chars`);
    for (const k of ["features", "usage", "requirements"]) {
      if (it[k] !== undefined && (!Array.isArray(it[k]) || it[k].some((x) => !isStr(x))))
        at(`"${k}" must be an array of strings`);
    }
    if (essential && (!Array.isArray(it.features) || it.features.length < 2))
      at(`essentials need at least 2 "features"`);
    if (it.install !== undefined &&
      (!Array.isArray(it.install) || it.install.some((x) => !isStr(x?.label) || !isStr(x?.cmd))))
      at(`"install" must be [{label, cmd}]`);
    if (it.links !== undefined &&
      (!Array.isArray(it.links) || it.links.some((x) => !isStr(x?.label) || !isUrl(x?.url))))
      at(`"links" must be [{label, url}]`);
    if (it.alternatives !== undefined) {
      if (!Array.isArray(it.alternatives) || it.alternatives.some((x) => !isStr(x)))
        at(`"alternatives" must be an array of ids`);
      else pendingAlternatives.push([file, it.id, it.alternatives]);
    }
  });
}

// Essentials
const essDir = path.join(contentDir, "essentials");
const essUrls = new Map();
if (existsSync(essDir)) {
  for (const f of readdirSync(essDir).filter((f) => f.endsWith(".json")).sort()) {
    const name = `essentials/${f}`;
    try {
      const e = JSON.parse(readFileSync(path.join(essDir, f), "utf8"));
      checkItems(name, e.items, essUrls, { essential: true });
    } catch (e) {
      errors.push(`${name}: invalid JSON — ${e.message}`);
    }
  }
}

// Daily digests
const dailyUrls = new Map();
for (const file of files) {
  let d;
  try {
    d = JSON.parse(readFileSync(path.join(contentDir, file), "utf8"));
  } catch (e) {
    errors.push(`${file}: invalid JSON — ${e.message}`);
    continue;
  }
  if (d.date !== file.replace(".json", "")) errors.push(`${file}: "date" must equal the file name`);
  if (!isStr(d.headline, 10)) errors.push(`${file}: "headline" is missing or too short`);
  checkItems(file, d.items, dailyUrls, { essential: false });
}

// Alternatives that look like ids must point at a real item
if (!only) {
  for (const [file, id, alts] of pendingAlternatives) {
    for (const a of alts) {
      if (ID.test(a) && a.startsWith("ess-") && !allIds.has(a))
        errors.push(`${file}: ${id}: alternative "${a}" is not an existing id`);
    }
  }
}

if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join("\n"));
  console.error(`\n${errors.length} problem(s).`);
  process.exit(1);
}
console.log(`✓ ${files.length} day file(s) + essentials, ${count} item(s) — all valid.`);
