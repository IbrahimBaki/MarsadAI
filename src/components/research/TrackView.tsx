"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import type { Article, IndexItem, Synthesis, Tool, Track, Verdict } from "@/lib/research";
import { TABS, VERDICTS, type Tab } from "@/lib/research";
import { matches } from "@/lib/search";
import { useApp } from "../AppContext";
import { useLocale } from "../LocaleProvider";
import { DownloadIcon, ExternalIcon, SearchIcon } from "../icons";
import {
  Bullets,
  CategoryTag,
  CriteriaStrip,
  KindChip,
  Panel,
  ScoreBadge,
  TabLink,
  VerdictChip,
  catStyle,
} from "./parts";

type Stats = { tools: number; index: number; articles: number };

export function TrackHeader({
  track,
  tab,
  stats,
  checked,
  children,
}: {
  track: Track;
  tab: Tab;
  stats: Stats;
  checked: string;
  children?: ReactNode;
}) {
  const { t, locale, f } = useLocale();
  const r = t.research;
  const { feed } = useApp();
  const signals = useMemo(() => (feed?.radar ?? []).filter((x) => x.track === track.id).length, [feed, track.id]);
  const planned = track.status === "planned";
  const label = track.name[locale].split(" · ")[0];
  const items: [string, number][] = [
    [r.stats.tools, stats.tools],
    [r.stats.index, stats.index],
    [r.stats.articles, stats.articles],
    [r.stats.signals, signals],
  ];
  return (
    <header className="night-band -mx-3 overflow-hidden px-5 pt-6 sm:px-8 lg:mx-0 lg:rounded-[28px] lg:px-10 lg:pt-8">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13.5px] text-night-muted">
        <Link href="/research" className="hover:text-night-ink">
          {r.hubTitle}
        </Link>
        <span aria-hidden>/</span>
        <span className="text-night-ink">{label}</span>
        <span className="flex items-center gap-2 rounded-full border border-night-line px-2.5 py-0.5 text-[12.5px]">
          <span className={`size-1.5 rounded-full ${planned ? "bg-night-muted" : "animate-pulse bg-signal"}`} />
          {planned ? r.planned : r.active}
        </span>
        <span className="ms-auto hidden sm:inline">
          {r.checked}: {f.short(checked)}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-[720px]">
          <h1 className="font-display text-[38px] font-semibold leading-[1.05] tracking-[-0.025em] sm:text-[52px]">
            {track.short[locale]}
          </h1>
          <p dir="auto" className="mt-4 max-w-[62ch] text-[16px] leading-7 text-night-muted">
            {track.question}
          </p>
        </div>
        {!planned && (
          <a
            href={`/api/research/${track.id}/export`}
            title={r.exportHint}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-night-ink px-5 text-[14px] font-semibold text-night transition-transform hover:-translate-y-px"
          >
            <DownloadIcon width={17} height={17} />
            {r.export}
          </a>
        )}
      </div>

      {!planned && (
        <dl className="mt-8 grid grid-cols-2 gap-y-5 border-t border-night-line pt-6 sm:grid-cols-4">
          {items.map(([k, v], i) => (
            <div key={k} className={`${i % 2 ? "ps-5" : ""} ${i > 0 ? "sm:border-s sm:border-night-line sm:ps-6" : ""}`}>
              <dd className="font-display text-[34px] font-semibold leading-none tabular-nums">{f.num(v)}</dd>
              <dt className="mt-2 text-[13px] text-night-muted">{k}</dt>
            </div>
          ))}
        </dl>
      )}

      {children && <div className="mt-10 border-t border-night-line pt-8">{children}</div>}

      {!planned ? (
        <nav className="no-scrollbar -mx-1 mt-8 flex gap-6 overflow-x-auto px-1" aria-label={r.title}>
          {TABS.map((id) => (
            <TabLink key={id} href={`/research/${track.id}${id === "overview" ? "" : `?tab=${id}`}`} active={tab === id}>
              {r.tabs[id]}
            </TabLink>
          ))}
        </nav>
      ) : (
        <div className="h-8" />
      )}
    </header>
  );
}

export function ContentNote() {
  const { t, locale } = useLocale();
  if (locale !== "ar") return null;
  return <p className="text-[13px] text-muted">{t.research.contentNote}</p>;
}

export function PlannedTrack({ track }: { track: Track }) {
  const { t } = useLocale();
  const r = t.research;
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <Panel title={r.plannedTitle}>
        <p className="text-[15px] leading-7 text-ink-2">{r.plannedBody}</p>
      </Panel>
      <Panel title={r.scope}>
        <Bullets items={track.scope} />
      </Panel>
    </div>
  );
}

export function OverviewTab({ track, s, tools }: { track: Track; s: Synthesis; tools: Tool[] }) {
  const { t } = useLocale();
  const r = t.research;
  return (
    <div className="flex flex-col gap-5">
      <section className="grid gap-6 rounded-[22px] border border-line bg-surface p-5 sm:p-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-10">
        <div className="border-s-[3px] border-signal ps-5">
          <h2 className="mb-3 text-[14px] font-semibold text-muted">{r.bottomLine}</h2>
          <p dir="auto" className="font-display text-[21px] font-medium leading-[1.45] tracking-[-0.01em] sm:text-[24px]">
            {s.headline}
          </p>
        </div>
        <Bullets items={s.bottomLine} />
      </section>

      <Panel title={r.priorArt}>
        <ul className="flex flex-col">
          {s.priorArt.map((a) => {
            const tool = tools.find((x) => x.id === a.ref);
            return (
              <li key={a.name} dir="ltr" className="grid gap-x-6 gap-y-1 border-t border-line py-4 first:border-t-0 first:pt-0 md:grid-cols-[220px_1fr_1fr]">
                <span className="font-display text-[15.5px] font-semibold">
                  {tool ? (
                    <Link className="underline decoration-line decoration-2 underline-offset-4 hover:decoration-lens" href={`/research/${track.id}/${tool.id}`}>
                      {a.name}
                    </Link>
                  ) : (
                    a.name
                  )}
                </span>
                <span className="text-[14px] leading-6 text-ink-2">
                  <span className="me-1.5 font-semibold text-ok-ink">+</span>
                  {a.takes}
                </span>
                <span className="text-[14px] leading-6 text-muted">
                  <span className="me-1.5 font-semibold text-paid-ink">−</span>
                  {a.lacks}
                </span>
              </li>
            );
          })}
        </ul>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={r.scope}>
          <Bullets items={track.scope} />
        </Panel>
        <Panel title={r.assumptions}>
          <Bullets items={track.assumptions} />
        </Panel>
      </div>
    </div>
  );
}

export function PlanTab({ s }: { s: Synthesis }) {
  const { t } = useLocale();
  const r = t.research;
  const adopt = s.architecture.filter((a) => a.decision !== "build").length;
  return (
    <div className="flex flex-col gap-5">
      <Panel
        title={r.architecture}
        aside={
          <span className="flex items-center gap-4 text-[13px] text-muted">
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-[3px] bg-lens" />
              {r.adopt} {adopt}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="hatch size-3 rounded-[3px] border border-signal" />
              {r.build} {s.architecture.length - adopt}
            </span>
          </span>
        }
      >
        <ol className="flex flex-col gap-2">
          {s.architecture.map((a) => {
            const build = a.decision === "build";
            return (
              <li
                key={a.layer}
                dir="ltr"
                className={`grid gap-x-6 gap-y-1 rounded-2xl p-4 sm:grid-cols-[190px_1fr] ${
                  build ? "hatch border border-signal/60" : "border border-lens/25 bg-lens/[0.07]"
                }`}
              >
                <div className="flex items-center gap-2 sm:flex-col sm:items-start sm:gap-1.5">
                  <span className="font-display text-[16px] font-semibold">{a.layer}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold ${build ? "bg-signal text-[#2a1a00]" : "bg-lens text-white"}`}
                  >
                    {build ? "Build" : "Adopt"}
                  </span>
                </div>
                <div>
                  <p className="text-[14.5px] font-semibold">{a.use}</p>
                  <p className="text-[14px] leading-6 text-ink-2">{a.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </Panel>

      <Panel title={r.phases}>
        <ol className="relative grid gap-6 md:grid-cols-4 md:gap-4">
          <span aria-hidden className="absolute inset-x-4 top-[15px] hidden h-px bg-line md:block" />
          {s.phases.map((p, i) => (
            <li key={p.name} className="relative">
              <span className={`relative grid size-8 place-items-center rounded-full font-display text-[14px] font-semibold ${i === 0 ? "bg-signal text-[#2a1a00]" : "border border-line bg-surface"}`}>
                {i + 1}
              </span>
              <h3 dir="auto" className="mb-2 mt-3 font-display text-[15.5px] font-semibold">
                {p.name}
              </h3>
              <Bullets items={p.items} />
            </li>
          ))}
        </ol>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={r.buildList}>
          <Bullets items={s.buildList} tone="gap" />
        </Panel>
        <Panel title={r.metrics}>
          <ul className="flex flex-wrap gap-2" dir="ltr">
            {s.metrics.map((m) => (
              <li key={m} className="rounded-full border border-line px-3 py-1 text-[13.5px]">
                {m}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title={r.risks}>
          <Bullets items={s.risks} tone="minus" />
        </Panel>
        <Panel title={r.decisions} className="border-signal/50 bg-signal/[0.06]">
          <Bullets items={s.decisions} tone="gap" />
        </Panel>
      </div>
    </div>
  );
}

function Select({ value, onChange, children, label }: { value: string; onChange: (v: string) => void; children: React.ReactNode; label: string }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 rounded-full border border-line bg-surface px-4 text-[14px]"
    >
      {children}
    </select>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="flex h-11 min-w-[220px] flex-1 items-center gap-2 rounded-full border border-line bg-surface px-4 focus-within:border-lens">
      <SearchIcon width={17} height={17} className="text-faint" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[14.5px] outline-none placeholder:text-faint"
      />
    </label>
  );
}


export function MatrixTab({ track, tools }: { track: Track; tools: Tool[] }) {
  const { t, locale, f } = useLocale();
  const r = t.research;
  const [cat, setCat] = useState("all");
  const [kind, setKind] = useState("all");
  const [verdict, setVerdict] = useState("all");
  const [q, setQ] = useState("");
  const list = tools.filter(
    (x) =>
      (cat === "all" || x.category === cat) &&
      (kind === "all" || x.kind === kind) &&
      (verdict === "all" || x.fit.verdict === verdict) &&
      matches({ title: x.name, summary: `${x.summary} ${x.vendor} ${x.fit.role}` }, q),
  );
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <SearchBox value={q} onChange={setQ} placeholder={r.indexSearch} />
        <Select value={cat} onChange={setCat} label={r.category}>
          <option value="all">{r.allCategories}</option>
          {track.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name[locale]}
            </option>
          ))}
        </Select>
        <Select value={kind} onChange={setKind} label={r.type}>
          <option value="all">{r.allKinds}</option>
          {(["open-source", "open-core", "commercial"] as const).map((k) => (
            <option key={k} value={k}>
              {r.kind[k]}
            </option>
          ))}
        </Select>
        <Select value={verdict} onChange={setVerdict} label={r.verdict}>
          <option value="all">{r.allVerdicts}</option>
          {VERDICTS.map((v) => (
            <option key={v} value={v}>
              {track.verdicts[v][locale]}
            </option>
          ))}
        </Select>
      </div>
      <p className="text-[13px] text-muted">
        {r.results(list.length)}. {r.scoringNote}
      </p>

      <div className="overflow-hidden rounded-[22px] border border-line bg-surface">
        <div className="hidden grid-cols-[minmax(0,2.4fr)_minmax(0,1.1fr)_minmax(0,1fr)_120px_118px_56px] gap-4 border-b border-line px-5 py-3 text-[12.5px] text-muted md:grid">
          <span>{r.tool}</span>
          <span>{r.category}</span>
          <span>{r.type}</span>
          <span>{r.verdict}</span>
          <span title={track.criteria.map((c) => c.name[locale]).join(", ")}>{r.criteriaStrip}</span>
          <span className="text-end">{r.score}</span>
        </div>
        <ul>
          {list.map((x) => (
            <li key={x.id} className="border-b border-line last:border-b-0">
              <Link
                href={`/research/${track.id}/${x.id}`}
                className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:bg-sunken/60 md:grid-cols-[minmax(0,2.4fr)_minmax(0,1.1fr)_minmax(0,1fr)_120px_118px_56px] md:items-center"
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-display text-[16px] font-semibold" dir="ltr">
                      {x.name}
                    </span>
                    {x.tier === "deep" && <span className="size-1.5 shrink-0 rounded-full bg-signal" title={r.deep} />}
                  </span>
                  <span dir="auto" className="mt-0.5 line-clamp-2 block text-[13px] leading-5 text-muted">
                    {x.fit.role}
                  </span>
                </span>
                <span className="text-end md:hidden">
                  <ScoreBadge total={x.total} />
                </span>
                <span className="col-span-2 flex flex-wrap items-center gap-2 md:contents">
                  <span>
                    <CategoryTag track={track} id={x.category} />
                  </span>
                  <span className="flex flex-col items-start gap-1">
                    <KindChip kind={x.kind} />
                    <span dir="ltr" className="hidden max-w-full truncate text-[12px] text-faint md:block" title={x.license}>
                      {x.license}
                    </span>
                  </span>
                  <span>
                    <VerdictChip track={track} verdict={x.fit.verdict} />
                  </span>
                  <span className="hidden md:block">
                    <CriteriaStrip criteria={track.criteria} scores={x.scores} />
                  </span>
                </span>
                <span className="hidden text-end md:block">
                  <ScoreBadge total={x.total} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {!list.length && <p className="p-8 text-center text-muted">{r.noResults}</p>}
      </div>
      <p className="text-[12.5px] text-faint">
        {r.criteriaStrip}: {track.criteria.map((c) => `${c.name[locale]} ×${f.num(c.weight)}`).join(locale === "ar" ? "، " : ", ")}
      </p>
    </div>
  );
}

export function ArticlesTab({ articles }: { articles: Article[] }) {
  const { t } = useLocale();
  const r = t.research;
  const groups = (["must", "read", "reference"] as const).map((p) => [p, articles.filter((a) => a.priority === p)] as const);
  return (
    <div className="flex flex-col gap-6">
      {groups.map(([p, list]) =>
        list.length ? (
          <section key={p}>
            <h2 className="mb-3 font-display text-[20px] font-semibold">
              {r[p]} <span className="text-[14px] font-normal text-faint">{list.length}</span>
            </h2>
            <ul className={`grid gap-3 ${p === "must" ? "lg:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3"}`}>
              {list.map((a) => (
                <li key={a.id} className="flex flex-col gap-2 rounded-[22px] border border-line bg-surface p-5 transition-colors hover:border-lens/40">
                  <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted" dir="ltr">
                    <span className="font-semibold text-ink-2">{a.source}</span>
                    {a.date && <span>· {a.date}</span>}
                    <span className="rounded bg-sunken px-1.5 py-px">{a.type}</span>
                  </div>
                  <a href={a.url} target="_blank" rel="noreferrer" dir="auto" className="flex items-start gap-1.5 text-[15.5px] font-semibold leading-6 hover:underline">
                    <span className="flex-1">{a.title}</span>
                    <ExternalIcon width={15} height={15} className="mt-1 shrink-0 text-faint" />
                  </a>
                  <p dir="auto" className="text-[14px] leading-6 text-ink-2">
                    {a.summary}
                  </p>
                  {a.why && (
                    <p dir="auto" className="rounded-xl bg-star-soft px-3 py-2 text-[13.5px] leading-6 text-star-ink">
                      {a.why}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ) : null,
      )}
    </div>
  );
}

export function RadarTab({ track }: { track: Track }) {
  const { feed } = useApp();
  const { t, f } = useLocale();
  const r = t.research;
  const list = useMemo(() => (feed?.radar ?? []).filter((x) => x.track === track.id), [feed, track.id]);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[14.5px] text-ink-2">{r.radarIntro}</p>
      {!list.length ? (
        <div className="rounded-[22px] border border-dashed border-line p-10 text-center text-muted">{feed ? r.radarEmpty : "…"}</div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {list.map((x) => (
            <li key={x.id}>
              <a href={x.url} target="_blank" rel="noreferrer" className="flex flex-col gap-1 rounded-2xl border border-line bg-surface p-4 hover:border-lens/40">
                <div className="flex items-center gap-2 text-[12.5px] text-muted">
                  <span className="rounded bg-sunken px-1.5 py-px font-semibold">{t.radar[x.type]}</span>
                  <span>{f.short(x.date)}</span>
                </div>
                <span dir="auto" className="font-semibold">
                  {x.title}
                </span>
                {x.desc && (
                  <span dir="auto" className="line-clamp-2 text-[13.5px] text-muted">
                    {x.desc}
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const IDX_PAGE = 60;

export function IndexTab({ track, items, sources }: { track: Track; items: IndexItem[]; sources: { name: string; url: string }[] }) {
  const { t, f } = useLocale();
  const r = t.research;
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [limit, setLimit] = useState(IDX_PAGE);
  const cats = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of items) m.set(i.category, (m.get(i.category) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);
  const list = useMemo(
    () =>
      items
        .filter((i) => (cat === "all" || i.category === cat) && matches({ title: i.name, summary: `${i.summary} ${i.tags.join(" ")} ${i.group}` }, q))
        .sort((a, b) => Number(!!b.dossier) - Number(!!a.dossier) || (b.stars ?? 0) - (a.stars ?? 0)),
    [items, cat, q],
  );
  const name = (id: string) => track.categories.find((c) => c.id === id) ?? null;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14px] text-ink-2">
        {r.indexNote}{" "}
        {sources.map((s, i) => (
          <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="text-accent-ink hover:underline" dir="ltr">
            {i ? " · " : ""}
            {s.name}
          </a>
        ))}
      </p>
      <div className="flex flex-wrap gap-2">
        <SearchBox value={q} onChange={(v) => { setQ(v); setLimit(IDX_PAGE); }} placeholder={r.indexSearch} />
        <Select value={cat} onChange={(v) => { setCat(v); setLimit(IDX_PAGE); }} label={r.category}>
          <option value="all">{r.allCategories} ({f.num(items.length)})</option>
          {cats.map(([id, n]) => (
            <option key={id} value={id}>
              {(name(id)?.name.en ?? id)} ({f.num(n)})
            </option>
          ))}
        </Select>
      </div>
      <p className="text-[13px] text-muted">{r.results(list.length)}</p>
      <ul className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
        {list.slice(0, limit).map((i) => (
          <li key={i.url} className="flex flex-col gap-1.5 rounded-2xl border border-line bg-surface p-4" style={catStyle(i.category)}>
            <div className="flex items-center gap-2">
              <span className="sec-bg size-2 shrink-0 rounded-[3px]" />
              <a href={i.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate font-semibold hover:underline" dir="ltr">
                {i.name}
              </a>
              {i.stars ? (
                <span className="text-[12px] tabular-nums text-faint">★ {f.count(i.stars)}</span>
              ) : null}
            </div>
            <p dir="auto" className="line-clamp-3 text-[13.5px] leading-5 text-ink-2">
              {i.summary}
            </p>
            <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1 text-[11.5px] text-muted" dir="ltr">
              <span className="sec-fg font-medium">{i.group}</span>
              {i.dossier && (
                <Link href={`/research/${track.id}/${i.dossier}`} className="ms-auto rounded bg-accent-soft px-1.5 py-px font-semibold text-accent-ink">
                  {r.hasDossier}
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
      {list.length > limit && (
        <button type="button" onClick={() => setLimit(limit + IDX_PAGE)} className="mx-auto h-11 rounded-full border border-line bg-surface px-6 text-[14px] font-semibold">
          +{f.num(Math.min(IDX_PAGE, list.length - limit))}
        </button>
      )}
    </div>
  );
}

export type { Verdict };
