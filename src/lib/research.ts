// AI Champs research hub data. Everything lives in research/ as JSON so the daily
// research task can update it with plain file edits. Research content is in English
// (it is shared with the wider team); UI labels around it are bilingual.

import tracksFile from "../../research/tracks.json";
import t3Eval from "../../research/t3/tools/eval.json";
import t3Sdlc from "../../research/t3/tools/sdlc.json";
import t3Runtime from "../../research/t3/tools/runtime.json";
import t3Sandbox from "../../research/t3/tools/sandbox.json";
import t3Ops from "../../research/t3/tools/ops.json";
import t3Cloud from "../../research/t3/tools/cloud.json";
import t3Articles from "../../research/t3/articles.json";
import t3Synthesis from "../../research/t3/synthesis.json";
import t3Index from "../../research/t3/index.json";
import type { Locale } from "./i18n";

type L10n = { en: string; ar: string };

export const TABS = ["overview", "matrix", "plan", "articles", "radar", "index"] as const;
export type Tab = (typeof TABS)[number];

export type Verdict = "adopt" | "adopt-part" | "benchmark" | "inspire" | "watch" | "avoid";
export const VERDICTS: Verdict[] = ["adopt", "adopt-part", "benchmark", "inspire", "watch", "avoid"];

export type Criterion = { id: string; name: L10n; weight: number; desc: L10n };
export type Category = { id: string; name: L10n; desc: L10n };

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

export type Synthesis = typeof t3Synthesis;

export type TrackData = {
  track: Track;
  tools: Tool[];
  articles: Article[];
  synthesis: Synthesis | null;
  index: { note: string; sources: { name: string; url: string }[]; items: IndexItem[] };
  checked: string;
};

export const TRACKS = (tracksFile.tracks as Track[]).slice().sort((a, b) => a.order - b.order);

function weighted(scores: Record<string, number>, criteria: Criterion[]) {
  let got = 0;
  let max = 0;
  for (const c of criteria) {
    got += (scores[c.id] ?? 0) * c.weight;
    max += 5 * c.weight;
  }
  return max ? Math.round((got / max) * 100) : 0;
}

function build(): Record<string, TrackData> {
  const t3 = TRACKS.find((t) => t.id === "t3")!;
  const raw = [t3Sdlc, t3Runtime, t3Eval, t3Sandbox, t3Ops, t3Cloud].flatMap(
    (f) => f.tools as unknown as Omit<Tool, "total">[],
  );
  const tools = raw
    .map((t) => ({ ...t, total: weighted(t.scores, t3.criteria) }) as Tool)
    .sort((a, b) => b.total - a.total);
  const byRepo = new Map(
    tools.filter((t) => t.repo).map((t) => [t.repo!.toLowerCase(), t.id]),
  );
  const items = (t3Index.items as IndexItem[]).map((i) => ({
    ...i,
    dossier: i.repo ? byRepo.get(i.repo.toLowerCase()) : undefined,
  }));
  const out: Record<string, TrackData> = {
    t3: {
      track: t3,
      tools,
      articles: t3Articles.articles as Article[],
      synthesis: t3Synthesis,
      index: { note: t3Index.note, sources: t3Index.sources, items },
      checked: t3Synthesis.checked,
    },
  };
  for (const t of TRACKS)
    if (!out[t.id])
      out[t.id] = {
        track: t,
        tools: [],
        articles: [],
        synthesis: null,
        index: { note: "", sources: [], items: [] },
        checked: tracksFile.updated,
      };
  return out;
}

const DATA = build();

export const trackData = (id: string): TrackData | null => DATA[id] ?? null;
export const findTool = (track: string, id: string) =>
  DATA[track]?.tools.find((t) => t.id === id) ?? null;

export const l = (v: L10n, locale: Locale) => v[locale];

/** Markdown export of a track, ready to paste into Confluence. */
export function trackMarkdown(id: string): string {
  const d = DATA[id];
  if (!d) return "";
  const { track, tools, synthesis: s, articles } = d;
  const cat = new Map(track.categories.map((c) => [c.id, c.name.en]));
  const lines: string[] = [];
  const p = (x = "") => lines.push(x);
  p(`# ${track.name.en}`);
  p();
  p(`_Marsad research · checked ${d.checked} · by Ibrahim Baghdadi_`);
  p();
  p(`**Question:** ${track.question}`);
  p();
  if (s) {
    p("## Bottom line");
    p();
    p(s.headline);
    p();
    for (const b of s.bottomLine) p(`- ${b}`);
    p();
    p("## Prior art");
    p();
    p("| What | Take from it | Missing |");
    p("| --- | --- | --- |");
    for (const a of s.priorArt) p(`| ${a.name} | ${a.takes} | ${a.lacks} |`);
    p();
    p("## Proposed architecture: adopt vs build");
    p();
    p("| Layer | Decision | Use | Detail |");
    p("| --- | --- | --- | --- |");
    for (const a of s.architecture)
      p(`| ${a.layer} | ${a.decision.toUpperCase()} | ${a.use} | ${a.detail} |`);
    p();
    p("## What Azm builds");
    p();
    for (const b of s.buildList) p(`- ${b}`);
    p();
    p("## Plan");
    p();
    for (const ph of s.phases) {
      p(`**${ph.name}**`);
      for (const i of ph.items) p(`- ${i}`);
      p();
    }
    p("## Metrics");
    p();
    p(s.metrics.map((m) => `- ${m}`).join("\n"));
    p();
    p("## Risks");
    p();
    for (const r of s.risks) p(`- ${r}`);
    p();
    p("## Decisions needed");
    p();
    for (const r of s.decisions) p(`- ${r}`);
    p();
  }
  if (tools.length) {
    p("## Landscape");
    p();
    p(
      `Scored 1–5 on: ${track.criteria.map((c) => `${c.name.en} (×${c.weight})`).join(", ")}. Total is weighted, out of 100.`,
    );
    p();
    p("| Tool | Category | Type | License | Verdict | Score | Role for Azm |");
    p("| --- | --- | --- | --- | --- | --- | --- |");
    for (const t of tools)
      p(
        `| [${t.name}](${t.url}) | ${cat.get(t.category) ?? t.category} | ${t.kind} | ${t.license} | ${track.verdicts[t.fit.verdict]?.en ?? t.fit.verdict} | ${t.total} | ${t.fit.role} |`,
      );
    p();
    p("## Dossiers");
    for (const t of tools.filter((t) => t.tier === "deep")) {
      p();
      p(`### ${t.name}`);
      p();
      p(`${t.vendor} · ${t.kind} · ${t.license} · ${t.pricing}${t.version ? ` · ${t.version}` : ""}`);
      p();
      p(t.summary);
      p();
      p(`**How it works.** ${t.how}`);
      p();
      p("**Strengths**");
      for (const x of t.strengths) p(`- ${x}`);
      p();
      p("**Weaknesses**");
      for (const x of t.weaknesses) p(`- ${x}`);
      p();
      p("**Missing for Azm**");
      for (const x of t.gaps) p(`- ${x}`);
      p();
      p(`**Verdict:** ${track.verdicts[t.fit.verdict]?.en}. ${t.fit.role}`);
      p();
      p(`Links: ${t.links.map(([n, u]) => `[${n}](${u})`).join(" · ")}`);
    }
    p();
  }
  if (articles.length) {
    p("## Reading list");
    p();
    for (const a of articles.filter((a) => a.priority !== "reference"))
      p(`- [${a.title}](${a.url}) — ${a.source}${a.date ? `, ${a.date}` : ""}. ${a.summary}`);
    p();
  }
  return lines.join("\n");
}
