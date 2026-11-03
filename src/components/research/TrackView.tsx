"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Article, IndexItem, Synthesis, Tool, Track, Verdict } from "@/lib/research";
import { TABS, VERDICTS, type Tab } from "@/lib/research";
import { matches } from "@/lib/search";
import { useApp } from "../AppContext";
import { useLocale } from "../LocaleProvider";
import { DownloadIcon, ExternalIcon, SearchIcon } from "../icons";
import {
  Bullets,
  CategoryTag,
  KindChip,
  Panel,
  ScoreBadge,
  TabLink,
  VerdictChip,
  catStyle,
} from "./parts";


type Stats = { tools: number; index: number; articles: number };

export function TrackHeader({ track, tab, stats, checked }: { track: Track; tab: Tab; stats: Stats; checked: string }) {
  const { t, locale, f } = useLocale();
  const r = t.research;
  const { feed } = useApp();
  const signals = useMemo(() => (feed?.radar ?? []).filter((x) => x.track === track.id).length, [feed, track.id]);
  const planned = track.status === "planned";
  const items: [string, number][] = [
    [r.stats.tools, stats.tools],
    [r.stats.index, stats.index],
    [r.stats.articles, stats.articles],
    [r.stats.signals, signals],
  ];
  return (
    <header className="flex flex-col gap-4 pt-2 lg:pt-1">
      <nav className="text-[13.5px] text-muted">
        <Link href="/research" className="hover:text-ink">
          {r.hubTitle}
        </Link>
      </nav>
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span
              className={`whitespace-nowrap rounded-md px-2 py-px text-[12.5px] font-semibold ${planned ? "bg-sunken text-muted" : "bg-star-soft text-star-ink"}`}
            >
              {planned ? r.planned : r.active}
            </span>
            <span className="text-[12.5px] text-faint">
              {r.checked}: {f.short(checked)}
            </span>
          </div>
          <h1 className="text-[26px] font-bold leading-tight sm:text-[30px]">{track.name[locale]}</h1>
        </div>
        {!planned && (
          <a
            href={`/api/research/${track.id}/export`}
            title={r.exportHint}
            className="card inline-flex h-10 items-center gap-2 !rounded-xl px-3.5 text-[14px] font-semibold"
          >
            <DownloadIcon width={17} height={17} />
            {r.export}
          </a>
        )}
      </div>
      <p dir="auto" className="max-w-3xl text-[15.5px] leading-7 text-ink-2">
        {track.question}
      </p>
      {!planned && (
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {items.map(([k, v]) => (
            <div key={k} className="card !rounded-2xl px-4 py-3">
              <dt className="text-[12.5px] text-muted">{k}</dt>
              <dd className="text-[22px] font-bold tabular-nums">{f.num(v)}</dd>
            </div>
          ))}
        </dl>
      )}
      {!planned && (
        <div className="card no-scrollbar flex max-w-full overflow-x-auto !rounded-2xl p-1" role="navigation">
          {TABS.map((id) => (
            <TabLink key={id} href={`/research/${track.id}${id === "overview" ? "" : `?tab=${id}`}`} active={tab === id}>
              {r.tabs[id]}
            </TabLink>
          ))}
        </div>
      )}
      {locale === "ar" && !planned && <p className="text-[13px] text-muted">{r.contentNote}</p>}
    </header>
  );
}

export function PlannedTrack({ track }: { track: Track }) {
  const { t } = useLocale();
  const r = t.research;
  return (
    <div className="flex flex-col gap-4">
      <Panel title={r.plannedTitle}>
        <p className="text-[14.5px] text-ink-2">{r.plannedBody}</p>
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
  const top = tools.filter((x) => x.fit.verdict === "adopt" || x.fit.verdict === "adopt-part").slice(0, 8);
  return (
    <div className="flex flex-col gap-4">
      <section className="card overflow-hidden !rounded-[24px]">
        <div className="bg-ink p-5 text-ground sm:p-7">
          <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-ground/60">{r.bottomLine}</h2>
          <p dir="auto" className="text-[17px] font-medium leading-8 sm:text-[18.5px]">
            {s.headline}
          </p>
        </div>
        <div className="p-5 sm:p-7">
          <Bullets items={s.bottomLine} />
        </div>
      </section>

      <Panel title={r.priorArt}>
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-x-1 text-[14px]" dir="ltr">
            <thead>
              <tr className="text-start text-[12.5px] text-muted">
                <th className="py-2 text-start font-medium">{r.tool}</th>
                <th className="py-2 text-start font-medium">{r.takes}</th>
                <th className="py-2 text-start font-medium">{r.lacks}</th>
              </tr>
            </thead>
            <tbody>
              {s.priorArt.map((a) => {
                const tool = tools.find((x) => x.id === a.ref);
                return (
                  <tr key={a.name} className="align-top">
                    <td className="border-t border-line py-3 pe-3 font-semibold">
                      {tool ? (
                        <Link className="text-accent-ink hover:underline" href={`/research/${track.id}/${tool.id}`}>
                          {a.name}
                        </Link>
                      ) : (
                        a.name
                      )}
                    </td>
                    <td className="border-t border-line py-3 pe-3 text-ink-2">{a.takes}</td>
                    <td className="border-t border-line py-3 text-ink-2">{a.lacks}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={r.tabs.plan}>
          <ul className="flex flex-col gap-2.5">
            {top.map((x) => (
              <li key={x.id} className="flex flex-wrap items-center gap-2">
                <Link href={`/research/${track.id}/${x.id}`} className="font-semibold hover:underline">
                  {x.name}
                </Link>
                <VerdictChip track={track} verdict={x.fit.verdict} />
                <span dir="auto" className="w-full text-[13.5px] leading-6 text-muted">
                  {x.fit.role}
                </span>
              </li>
            ))}
          </ul>
          <Link href={`/research/${track.id}?tab=plan`} className="mt-4 inline-block text-[14px] font-semibold text-accent-ink">
            {r.architecture} →
          </Link>
        </Panel>
        <Panel title={r.scope}>
          <Bullets items={track.scope} />
          <h3 className="mb-2 mt-5 text-[14.5px] font-bold">{r.assumptions}</h3>
          <Bullets items={track.assumptions} />
        </Panel>
      </div>
    </div>
  );
}

export function PlanTab({ s }: { s: Synthesis }) {
  const { t } = useLocale();
  const r = t.research;
  return (
    <div className="flex flex-col gap-4">
      <Panel title={r.architecture}>
        <ol className="flex flex-col">
          {s.architecture.map((a, i) => (
            <li key={a.layer} className="grid gap-x-4 gap-y-1 border-t border-line py-3.5 first:border-t-0 sm:grid-cols-[150px_1fr]">
              <div className="flex items-center gap-2 sm:flex-col sm:items-start">
                <span className="text-[12px] tabular-nums text-faint">{String(i + 1).padStart(2, "0")}</span>
                <span dir="auto" className="font-semibold">
                  {a.layer}
                </span>
                <span
                  className={`rounded-md px-2 py-px text-[12px] font-bold ${a.decision === "build" ? "bg-star-soft text-star-ink" : "bg-ok text-ok-ink"}`}
                >
                  {a.decision === "build" ? r.build : r.adopt}
                </span>
              </div>
              <div dir="auto">
                <p className="text-[14.5px] font-semibold text-ink">{a.use}</p>
                <p className="text-[14px] leading-6 text-ink-2">{a.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={r.buildList}>
          <Bullets items={s.buildList} tone="gap" />
        </Panel>
        <Panel title={r.metrics}>
          <div className="flex flex-wrap gap-2" dir="ltr">
            {s.metrics.map((m) => (
              <span key={m} className="rounded-lg bg-sunken px-2.5 py-1 text-[13.5px]">
                {m}
              </span>
            ))}
          </div>
        </Panel>
      </div>
      <Panel title={r.phases}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {s.phases.map((p, i) => (
            <div key={p.name} className="rounded-2xl bg-sunken p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-full bg-ink text-[12px] font-bold text-ground">{i + 1}</span>
                <h3 dir="auto" className="text-[14.5px] font-bold">
                  {p.name}
                </h3>
              </div>
              <Bullets items={p.items} />
            </div>
          ))}
        </div>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={r.risks}>
          <Bullets items={s.risks} tone="minus" />
        </Panel>
        <Panel title={r.decisions}>
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
      className="card h-10 !rounded-xl bg-surface px-3 text-[14px]"
    >
      {children}
    </select>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="card flex h-10 min-w-[200px] flex-1 items-center gap-2 !rounded-xl px-3">
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
        {r.results(list.length)} · {r.scoringNote}
      </p>

      {/* Desktop table */}
      <div className="card hidden overflow-hidden !rounded-[20px] md:block">
        <table className="w-full text-[14px]">
          <thead className="bg-sunken text-[12.5px] text-muted">
            <tr>
              <th className="px-4 py-2.5 text-start font-medium">{r.tool}</th>
              <th className="px-3 py-2.5 text-start font-medium">{r.category}</th>
              <th className="px-3 py-2.5 text-start font-medium">{r.type}</th>
              <th className="px-3 py-2.5 text-start font-medium">{r.verdict}</th>
              <th className="px-4 py-2.5 text-start font-medium">{r.score}</th>
            </tr>
          </thead>
          <tbody>
            {list.map((x) => (
              <tr key={x.id} className="border-t border-line align-top hover:bg-sunken/50">
                <td className="max-w-[460px] px-4 py-3">
                  <Link href={`/research/${track.id}/${x.id}`} className="font-semibold hover:underline">
                    {x.name}
                  </Link>
                  {x.tier === "deep" && (
                    <span className="ms-2 rounded bg-accent-soft px-1.5 py-px text-[11px] font-semibold text-accent-ink">{r.deep}</span>
                  )}
                  <p dir="auto" className="mt-0.5 line-clamp-2 text-[13px] leading-5 text-muted">
                    {x.fit.role}
                  </p>
                </td>
                <td className="px-3 py-3">
                  <CategoryTag track={track} id={x.category} />
                </td>
                <td className="px-3 py-3">
                  <KindChip kind={x.kind} />
                  <p dir="ltr" className="mt-1 max-w-[150px] truncate text-[12px] text-faint" title={x.license}>
                    {x.license}
                  </p>
                </td>
                <td className="px-3 py-3">
                  <VerdictChip track={track} verdict={x.fit.verdict} />
                </td>
                <td className="px-4 py-3">
                  <ScoreBadge total={x.total} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && <p className="p-6 text-center text-muted">{r.noResults}</p>}
      </div>

      {/* Mobile cards */}
      <ul className="flex flex-col gap-2.5 md:hidden">
        {list.map((x) => (
          <li key={x.id}>
            <Link href={`/research/${track.id}/${x.id}`} className="card flex flex-col gap-2 p-4">
              <div className="flex items-center gap-2">
                <span className="flex-1 font-semibold">{x.name}</span>
                <ScoreBadge total={x.total} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <CategoryTag track={track} id={x.category} />
                <KindChip kind={x.kind} />
                <VerdictChip track={track} verdict={x.fit.verdict} />
              </div>
              <p dir="auto" className="text-[13.5px] leading-5 text-muted">
                {x.fit.role}
              </p>
            </Link>
          </li>
        ))}
        {!list.length && <p className="p-6 text-center text-muted">{r.noResults}</p>}
      </ul>
      <p className="text-[12.5px] text-faint">
        {track.criteria.map((c) => `${c.name[locale]} ×${f.num(c.weight)}`).join(" · ")}
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
            <h2 className="mb-3 text-[17px] font-bold">
              {r[p]} <span className="text-[14px] font-normal text-faint">{list.length}</span>
            </h2>
            <ul className={`grid gap-3 ${p === "must" ? "lg:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3"}`}>
              {list.map((a) => (
                <li key={a.id} className="card flex flex-col gap-2 p-4 sm:p-5">
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
        <div className="card p-8 text-center text-muted">{feed ? r.radarEmpty : "…"}</div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {list.map((x) => (
            <li key={x.id}>
              <a href={x.url} target="_blank" rel="noreferrer" className="card flex flex-col gap-1 p-4 hover:bg-sunken/40">
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
          <li key={i.url} className="card flex flex-col gap-1.5 p-4" style={catStyle(i.category)}>
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
        <button type="button" onClick={() => setLimit(limit + IDX_PAGE)} className="card mx-auto h-10 !rounded-xl px-5 text-[14px] font-semibold">
          +{f.num(Math.min(IDX_PAGE, list.length - limit))}
        </button>
      )}
    </div>
  );
}

export type { Verdict };
