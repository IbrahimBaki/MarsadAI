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
  if (!t.id || !t.name?.en || !t.name?.ar || !t.question?.en || !t.question?.ar) err("tracks.json", `track ${t.id} missing id/name/question (en + ar)`);
  for (const x of [...(t.scope ?? []), ...(t.assumptions ?? [])]) if (!x.en || !x.ar) err("tracks.json", `track ${t.id}: scope/assumptions need en + ar`);
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
      const { ar, ...en } = x;
      if (hasArabic(JSON.stringify(en))) w("English fields contain Arabic");
      if (!ar) w("missing ar block");
      else {
        for (const k of ["summary", "how", "role"]) if (!ar[k] || !hasArabic(ar[k])) w(`ar.${k} missing or not Arabic`);
        for (const k of ["features", "strengths", "weaknesses", "gaps"])
          if (!Array.isArray(ar[k]) || ar[k].length !== x[k].length) w(`ar.${k} must have ${x[k].length} items, aligned with English`);
      }
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
      if (!a.ar?.summary) err(`${t.id}/articles.json`, `${a.id}: missing ar.summary`);
      if (a.why && !a.ar?.why) err(`${t.id}/articles.json`, `${a.id}: missing ar.why`);
    }
  }
  const idx = join(dir, "index.json");
  if (existsSync(idx)) for (const i of read(idx).items) if (!i.ar?.summary || !i.ar?.group) err(`${t.id}/index.json`, `${i.name}: missing ar.summary/ar.group`);
  const bpf = join(dir, "blueprint.json");
  if (existsSync(bpf)) {
    const bp = read(bpf);
    const L = (v, where) => { if (!v?.en || !v?.ar) err(`${t.id}/blueprint.json`, `${where}: needs en + ar`); };
    L(bp.goal, "goal"); L(bp.answer, "answer");
    for (const f of bp.flow) { L(f.name, `flow ${f.id}`); L(f.desc, `flow ${f.id}`); }
    for (const b of bp.blocks) {
      for (const k of ["name", "need", "plan"]) L(b[k], `${b.id}.${k}`);
      const refs = [...b.pick, ...b.alternatives, ...[b.compare, b.compare2].filter(Boolean).flatMap((c) => c.tools), ...(b.modes ?? []).flatMap((m) => m.tools)];
      for (const r of refs) if (!ids.has(r)) err(`${t.id}/blueprint.json`, `${b.id}: unknown tool ${r}`);
      for (const c of [b.compare, b.compare2].filter(Boolean))
        for (const row of c.rows) { L(row.label, `${b.id} row`); if (row.values.length !== c.tools.length) err(`${t.id}/blueprint.json`, `${b.id}: row "${row.label.en}" has ${row.values.length} values for ${c.tools.length} tools`); row.values.forEach((v) => L(v, `${b.id} "${row.label.en}"`)); }
    }
  }
  const syn = join(dir, "synthesis.json");
  if (existsSync(syn)) {
    const s = read(syn);
    for (const k of ["headline", "bottomLine", "priorArt", "architecture", "buildList", "phases", "metrics", "risks", "decisions"]) {
      if (!s[k]) err(`${t.id}/synthesis.json`, `missing ${k}`);
      if (!s.ar?.[k]) err(`${t.id}/synthesis.json`, `missing ar.${k}`);
      else if (Array.isArray(s[k]) && s.ar[k].length !== s[k].length) err(`${t.id}/synthesis.json`, `ar.${k} length differs`);
    }
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
