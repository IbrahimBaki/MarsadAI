// Validates research/ files: schema of tracks, dossiers, articles and synthesis.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../research/", import.meta.url).pathname;
const errors = [];
const err = (f, m) => errors.push(`${f}: ${m}`);
const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const url = (u) => typeof u === "string" && /^https?:\/\//.test(u);
const hasArabic = (s) => /[؀-ۿ]/.test(s);

const tracks = read(join(root, "tracks.json")).tracks;
const VERDICTS = ["adopt", "adopt-part", "benchmark", "inspire", "watch", "avoid"];
const KINDS = ["open-source", "commercial", "open-core"];

for (const t of tracks) {
  if (!t.id || !t.name?.en || !t.name?.ar || !t.question) err("tracks.json", `track ${t.id} missing id/name/question`);
  const dir = join(root, t.id);
  if (t.status !== "active") continue;
  const cats = new Set(t.categories.map((c) => c.id));
  const crit = t.criteria.map((c) => c.id);
  const ids = new Set();
  const toolsDir = join(dir, "tools");
  for (const file of existsSync(toolsDir) ? readdirSync(toolsDir) : []) {
    const f = `${t.id}/tools/${file}`;
    for (const x of read(join(toolsDir, file)).tools) {
      const w = (m) => err(f, `${x.id}: ${m}`);
      if (!x.id || ids.has(x.id)) w("missing or duplicate id");
      ids.add(x.id);
      if (!cats.has(x.category)) w(`unknown category ${x.category}`);
      if (!KINDS.includes(x.kind)) w(`bad kind ${x.kind}`);
      if (!VERDICTS.includes(x.fit?.verdict)) w("bad verdict");
      if (!x.fit?.role) w("missing fit.role");
      for (const k of ["name", "vendor", "license", "pricing", "summary", "how"]) if (!x[k]) w(`missing ${k}`);
      if (!url(x.url)) w("bad url");
      for (const c of crit) if (!(x.scores?.[c] >= 1 && x.scores?.[c] <= 5)) w(`score ${c} must be 1-5`);
      const min = x.tier === "deep" ? { features: 4, strengths: 3, weaknesses: 2, gaps: 1, sources: 2 } : { features: 1, strengths: 1, weaknesses: 1, gaps: 1, sources: 1 };
      for (const [k, n] of Object.entries(min)) if (!Array.isArray(x[k]) || x[k].length < n) w(`${k} needs ≥${n}`);
      for (const s of x.sources ?? []) if (!url(s)) w(`bad source ${s}`);
      for (const l of x.links ?? []) if (!Array.isArray(l) || !url(l[1])) w("bad link");
      if (hasArabic(JSON.stringify(x))) w("research content must be English");
    }
  }
  const art = join(dir, "articles.json");
  if (existsSync(art)) {
    const seen = new Set();
    for (const a of read(art).articles) {
      if (!a.id || seen.has(a.id)) err(`${t.id}/articles.json`, `duplicate/missing id ${a.id}`);
      seen.add(a.id);
      if (!a.title || !url(a.url) || !a.summary) err(`${t.id}/articles.json`, `${a.id}: needs title, url, summary`);
      if (!["must", "read", "reference"].includes(a.priority)) err(`${t.id}/articles.json`, `${a.id}: bad priority`);
    }
  }
  const syn = join(dir, "synthesis.json");
  if (existsSync(syn)) {
    const s = read(syn);
    for (const k of ["headline", "bottomLine", "priorArt", "architecture", "buildList", "phases", "metrics", "risks", "decisions"])
      if (!s[k]) err(`${t.id}/synthesis.json`, `missing ${k}`);
    for (const p of s.priorArt ?? []) if (p.ref && !ids.has(p.ref) && !p.ref.startsWith("fullscript") && !p.ref.startsWith("copilot")) {
      // refs may point to a dossier or an article
      const arts = existsSync(art) ? read(art).articles.map((a) => a.id) : [];
      if (!arts.includes(p.ref)) err(`${t.id}/synthesis.json`, `priorArt ref ${p.ref} not found`);
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  console.error(`\n${errors.length} error(s)`);
  process.exit(1);
}
console.log("research: OK");
