// AI Champs research hub data. Everything lives in research/ as JSON so the daily
// research task can update it with plain file edits. Every text is bilingual: English
// at the top level and an `ar` block (Modern Standard Arabic) next to it. Pages call
// `trackData(id, locale)`, which returns the data already in the visitor's language.

import tracksFile from "../../research/tracks.json";
import t3Eval from "../../research/t3/tools/eval.json";
import t3Sdlc from "../../research/t3/tools/sdlc.json";
import t3Runtime from "../../research/t3/tools/runtime.json";
import t3Sandbox from "../../research/t3/tools/sandbox.json";
import t3Ops from "../../research/t3/tools/ops.json";
import t3Cloud from "../../research/t3/tools/cloud.json";
import t3Articles from "../../research/t3/articles.json";
import t3Synthesis from "../../research/t3/synthesis.json";
import t3Blueprint from "../../research/t3/blueprint.json";
import t3Index from "../../research/t3/index.json";
import type { Locale } from "./i18n";

export type L10n = { en: string; ar: string };

export const TABS = ["overview", "matrix", "plan", "articles", "radar", "index"] as const;
export type Tab = (typeof TABS)[number];

export type Verdict = "adopt" | "adopt-part" | "benchmark" | "inspire" | "watch" | "avoid";
export const VERDICTS: Verdict[] = ["adopt", "adopt-part", "benchmark", "inspire", "watch", "avoid"];

export type Criterion = { id: string; name: L10n; weight: number; desc: L10n };
export type Category = { id: string; name: L10n; desc: L10n };

type RawTrack = Omit<Track, "question" | "scope" | "assumptions"> & {
  question: L10n;
  scope: L10n[];
  assumptions: L10n[];
};

/** A track with its texts in one language (labels such as names stay bilingual). */
export type Track = {
  id: string;
  order: number;
  status: "active" | "planned";
  name: L10n;
  short: L10n;
  question: string;
  scope: string[];
  assumptions: string[];
  categories: Category[];
  criteria: Criterion[];
  verdicts: Record<string, L10n>;
  watch: string[];
};

type ToolText = {
  summary: string;
  how: string;
  features: string[];
  strengths: string[];
  weaknesses: string[];
  gaps: string[];
  role: string;
  pricing: string;
};

export type Tool = {
  id: string;
  name: string;
  category: string;
  kind: "open-source" | "commercial" | "open-core";
  vendor: string;
  repo: string | null;
  url: string;
  license: string;
  pricing: string;
  status: string;
  version?: string;
  tier: "deep" | "brief";
  summary: string;
  how: string;
  features: string[];
  strengths: string[];
  weaknesses: string[];
  gaps: string[];
  fit: { verdict: Verdict; role: string };
  scores: Record<string, number>;
  links: [string, string][];
  sources: string[];
  /** Weighted 0–100 score over the track's criteria. */
  total: number;
};
type RawTool = Omit<Tool, "total"> & { ar?: ToolText };

export type Article = {
  id: string;
  title: string;
  source: string;
  date?: string;
  url: string;
  type: string;
  tags: string[];
  priority: "must" | "read" | "reference";
  summary: string;
  why?: string;
};
type RawArticle = Article & { ar?: { summary: string; why?: string } };

export type IndexItem = {
  name: string;
  repo: string | null;
  url: string;
  category: string;
  group: string;
  stars: number | null;
  tags: string[];
  summary: string;
  lists: string[];
  dossier?: string;
};
type RawIndexItem = IndexItem & { ar?: { summary: string; group: string } };

type RawSynthesis = typeof t3Synthesis;
export type Synthesis = Omit<RawSynthesis, "ar">;

type Row = { label: L10n; values: L10n[] };
type RawCompare = { title?: L10n; tools: string[]; rows: Row[] };
type RawMode = { id: string; name: L10n; desc: L10n; tools: string[]; pros: L10n[]; cons: L10n[]; use: L10n };
type RawBlock = {
  id: string;
  order: number;
  categories: string[];
  name: L10n;
  need: L10n;
  decision: string;
  plan: L10n;
  pick: string[];
  alternatives: string[];
  compare: RawCompare;
  compare2?: RawCompare;
  modes?: RawMode[];
};

export type Compare = { title?: string; tools: string[]; rows: { label: string; values: string[] }[] };
export type Mode = { id: string; name: string; desc: string; tools: string[]; pros: string[]; cons: string[]; use: string };
export type Block = {
  id: string;
  order: number;
  categories: string[];
  name: string;
  need: string;
  decision: "adopt" | "build" | "benchmark" | "later" | "compare";
  plan: string;
  pick: string[];
  alternatives: string[];
  compares: Compare[];
  modes: Mode[];
};
export type Blueprint = {
  goal: string;
  answer: string;
  flow: { id: string; name: string; desc: string }[];
  blocks: Block[];
};

export type TrackData = {
  track: Track;
  tools: Tool[];
  articles: Article[];
  synthesis: Synthesis | null;
  blueprint: Blueprint | null;
  index: { note: string; sources: { name: string; url: string }[]; items: IndexItem[] };
  checked: string;
};

const RAW_TRACKS = (tracksFile.tracks as unknown as RawTrack[]).slice().sort((a, b) => a.order - b.order);
export const TRACK_IDS = RAW_TRACKS.map((t) => t.id);

function weighted(scores: Record<string, number>, criteria: Criterion[]) {
  let got = 0;
  let max = 0;
  for (const c of criteria) {
    got += (scores[c.id] ?? 0) * c.weight;
    max += 5 * c.weight;
  }
  return max ? Math.round((got / max) * 100) : 0;
}

const pick = (v: L10n, locale: Locale) => v[locale] || v.en;

function localTrack(t: RawTrack, locale: Locale): Track {
  return {
    ...t,
    question: pick(t.question, locale),
    scope: t.scope.map((s) => pick(s, locale)),
    assumptions: t.assumptions.map((s) => pick(s, locale)),
  };
}

function localTool(t: RawTool, criteria: Criterion[], locale: Locale): Tool {
  const { ar, ...rest } = t;
  const base: Tool = { ...rest, total: weighted(t.scores, criteria) };
  if (locale !== "ar" || !ar) return base;
  return {
    ...base,
    summary: ar.summary,
    how: ar.how,
    features: ar.features,
    strengths: ar.strengths,
    weaknesses: ar.weaknesses,
    gaps: ar.gaps,
    pricing: ar.pricing || base.pricing,
    fit: { ...base.fit, role: ar.role },
  };
}

function localSynthesis(s: RawSynthesis, locale: Locale): Synthesis {
  const { ar, ...en } = s;
  if (locale !== "ar") return en;
  return {
    ...en,
    headline: ar.headline,
    bottomLine: ar.bottomLine,
    priorArt: en.priorArt.map((p, i) => ({ ...p, name: ar.names[i] ?? p.name, ...ar.priorArt[i] })),
    architecture: en.architecture.map((a, i) => ({ ...a, ...ar.architecture[i] })),
    buildList: ar.buildList,
    phases: ar.phases,
    metrics: ar.metrics,
    risks: ar.risks,
    decisions: ar.decisions,
  };
}

function localBlueprint(b: typeof t3Blueprint, locale: Locale): Blueprint {
  const L = (v: L10n) => pick(v, locale);
  const cmp = (c: RawCompare): Compare => ({
    title: c.title ? L(c.title) : undefined,
    tools: c.tools,
    rows: c.rows.map((r) => ({ label: L(r.label), values: r.values.map(L) })),
  });
  return {
    goal: L(b.goal),
    answer: L(b.answer),
    flow: b.flow.map((f) => ({ id: f.id, name: L(f.name), desc: L(f.desc) })),
    blocks: (b.blocks as RawBlock[]).map((x) => ({
      id: x.id,
      order: x.order,
      categories: x.categories,
      name: L(x.name),
      need: L(x.need),
      decision: x.decision as Block["decision"],
      plan: L(x.plan),
      pick: x.pick,
      alternatives: x.alternatives,
      compares: [x.compare, ...(x.compare2 ? [x.compare2] : [])].map(cmp),
      modes: (x.modes ?? []).map((m) => ({
        id: m.id,
        name: L(m.name),
        desc: L(m.desc),
        tools: m.tools,
        pros: m.pros.map(L),
        cons: m.cons.map(L),
        use: L(m.use),
      })),
    })),
  };
}

function build(locale: Locale): Record<string, TrackData> {
  const out: Record<string, TrackData> = {};
  for (const raw of RAW_TRACKS) {
    const track = localTrack(raw, locale);
    if (raw.id !== "t3") {
      out[raw.id] = {
        track,
        tools: [],
        articles: [],
        synthesis: null,
        blueprint: null,
        index: { note: "", sources: [], items: [] },
        checked: tracksFile.updated,
      };
      continue;
    }
    const tools = [t3Sdlc, t3Runtime, t3Eval, t3Sandbox, t3Ops, t3Cloud]
      .flatMap((f) => f.tools as unknown as RawTool[])
      .map((t) => localTool(t, raw.criteria, locale))
      .sort((a, b) => b.total - a.total);
    const byRepo = new Map(tools.filter((t) => t.repo).map((t) => [t.repo!.toLowerCase(), t.id]));
    const items = (t3Index.items as RawIndexItem[]).map(({ ar, ...i }) => ({
      ...i,
      summary: locale === "ar" && ar ? ar.summary : i.summary,
      group: locale === "ar" && ar ? ar.group : i.group,
      dossier: i.repo ? byRepo.get(i.repo.toLowerCase()) : undefined,
    }));
    const articles = (t3Articles.articles as RawArticle[]).map(({ ar, ...a }) =>
      locale === "ar" && ar ? { ...a, summary: ar.summary, why: ar.why ?? a.why } : a,
    );
    out[raw.id] = {
      track,
      tools,
      articles,
      synthesis: localSynthesis(t3Synthesis, locale),
      blueprint: localBlueprint(t3Blueprint, locale),
      index: {
        note: locale === "ar" ? t3Index.note_ar : t3Index.note,
        sources: t3Index.sources,
        items,
      },
      checked: t3Synthesis.checked,
    };
  }
  return out;
}

const DATA: Record<Locale, Record<string, TrackData>> = { en: build("en"), ar: build("ar") };

export const tracks = (locale: Locale) => TRACK_IDS.map((id) => DATA[locale][id].track);
export const trackData = (id: string, locale: Locale = "en"): TrackData | null => DATA[locale][id] ?? null;
export const findTool = (track: string, id: string, locale: Locale = "en") =>
  DATA[locale][track]?.tools.find((t) => t.id === id) ?? null;

/** Markdown export of a track in one language, ready to paste into Confluence. */
export function trackMarkdown(id: string, locale: Locale = "en"): string {
  const d = DATA[locale][id];
  if (!d) return "";
  const ar = locale === "ar";
  const T = (en: string, a: string) => (ar ? a : en);
  const { track, tools, synthesis: s, blueprint: b, articles } = d;
  const cat = new Map(track.categories.map((c) => [c.id, c.name[locale]]));
  const toolName = new Map(tools.map((t) => [t.id, t.name]));
  const lines: string[] = [];
  const p = (x = "") => lines.push(x);
  const esc = (x: string) => x.replace(/\|/g, "\\|");
  p(`# ${track.name[locale]}`);
  p();
  p(`_${T("Marsad research", "بحث مرصد")} · ${T("checked", "آخر مراجعة")} ${d.checked} · ${T("by", "إعداد")} Ibrahim Baghdadi_`);
  p();
  p(`**${T("Question", "السؤال")}:** ${track.question}`);
  p();
  if (b) {
    p(`## ${T("The big picture", "الصورة الكبيرة")}`);
    p();
    p(b.goal);
    p();
    p(`**${T("Short answer", "الإجابة المختصرة")}:** ${b.answer}`);
    p();
    p(b.flow.map((f, i) => `${i + 1}. **${f.name}**: ${f.desc}`).join("\n"));
    p();
    for (const x of b.blocks) {
      p(`### ${x.order}. ${x.name}`);
      p();
      p(`**${T("Why we need it", "لماذا نحتاجه")}:** ${x.need}`);
      p();
      p(`**${T("What we do", "ما سنفعله")}:** ${x.plan}`);
      p();
      if (x.pick.length) p(`**${T("Pick", "الاختيار")}:** ${x.pick.map((i) => toolName.get(i) ?? i).join(", ")}`);
      if (x.alternatives.length)
        p(`**${T("Alternatives", "البدائل")}:** ${x.alternatives.map((i) => toolName.get(i) ?? i).join(", ")}`);
      p();
      for (const m of x.modes) {
        p(`**${m.name}**: ${m.desc} ${T("Best for", "الأنسب لـ")}: ${m.use}`);
        p(`- ${T("Pros", "المزايا")}: ${m.pros.join("; ")}`);
        p(`- ${T("Cons", "العيوب")}: ${m.cons.join("; ")}`);
        p();
      }
      for (const c of x.compares) {
        if (c.title) p(`**${c.title}**`);
        p(`| | ${c.tools.map((i) => esc(toolName.get(i) ?? i)).join(" | ")} |`);
        p(`| --- | ${c.tools.map(() => "---").join(" | ")} |`);
        for (const r of c.rows) p(`| ${esc(r.label)} | ${r.values.map(esc).join(" | ")} |`);
        p();
      }
    }
  }
  if (s) {
    p(`## ${T("Plan", "الخطة")}`);
    p();
    for (const ph of s.phases) {
      p(`**${ph.name}**`);
      for (const i of ph.items) p(`- ${i}`);
      p();
    }
    p(`## ${T("Risks", "المخاطر")}`);
    p();
    for (const r of s.risks) p(`- ${r}`);
    p();
    p(`## ${T("Decisions needed", "قرارات مطلوبة")}`);
    p();
    for (const r of s.decisions) p(`- ${r}`);
    p();
  }
  if (tools.length) {
    p(`## ${T("All tools", "كل الأدوات")}`);
    p();
    p(`| ${T("Tool", "الأداة")} | ${T("Category", "الفئة")} | ${T("License", "الترخيص")} | ${T("Verdict", "التوصية")} | ${T("Score", "الدرجة")} | ${T("Role for Azm", "دورها في عزم")} |`);
    p("| --- | --- | --- | --- | --- | --- |");
    for (const t of tools)
      p(
        `| [${esc(t.name)}](${t.url}) | ${cat.get(t.category) ?? t.category} | ${esc(t.license)} | ${track.verdicts[t.fit.verdict]?.[locale] ?? t.fit.verdict} | ${t.total} | ${esc(t.fit.role)} |`,
      );
    p();
    p(`## ${T("Dossiers", "الملفات التفصيلية")}`);
    for (const t of tools.filter((t) => t.tier === "deep")) {
      p();
      p(`### ${t.name}`);
      p();
      p(`${t.vendor} · ${t.license} · ${t.pricing}${t.version ? ` · ${t.version}` : ""}`);
      p();
      p(t.summary);
      p();
      p(`**${T("How it works", "كيف تعمل")}.** ${t.how}`);
      p();
      p(`**${T("Strengths", "نقاط القوة")}**`);
      for (const x of t.strengths) p(`- ${x}`);
      p();
      p(`**${T("Weaknesses", "نقاط الضعف")}**`);
      for (const x of t.weaknesses) p(`- ${x}`);
      p();
      p(`**${T("Missing for Azm", "ما ينقصها لعزم")}**`);
      for (const x of t.gaps) p(`- ${x}`);
      p();
      p(`**${T("Verdict", "التوصية")}:** ${track.verdicts[t.fit.verdict]?.[locale]}. ${t.fit.role}`);
    }
    p();
  }
  if (articles.length) {
    p(`## ${T("Reading list", "قائمة القراءة")}`);
    p();
    for (const a of articles.filter((a) => a.priority !== "reference"))
      p(`- [${a.title}](${a.url}) — ${a.source}${a.date ? `, ${a.date}` : ""}. ${a.summary}`);
    p();
  }
  return lines.join("\n");
}
