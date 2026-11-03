"use client";

import Link from "next/link";
import type { Tool, Track } from "@/lib/research";
import { useLocale } from "../LocaleProvider";
import { BackIcon, ExternalIcon } from "../icons";
import { Bullets, CriteriaBars, Panel, ScoreDial, VerdictChip } from "./parts";
import { NIGHT_COLOR } from "./Radar";

export function ToolView({ track, tool, related }: { track: Track; tool: Tool; related: Tool[] }) {
  const { t, locale } = useLocale();
  const r = t.research;
  const cat = track.categories.find((c) => c.id === tool.category);
  const facts: [string, string | undefined][] = [
    [r.vendor, tool.vendor],
    [r.type, r.kind[tool.kind]],
    [r.license, tool.license],
    [r.pricing, tool.pricing],
    [r.version, tool.version],
    [r.status, tool.status],
  ];
  return (
    <article className="flex flex-col gap-5">
      <header className="night-band -mx-3 px-5 pb-8 pt-6 sm:px-8 lg:mx-0 lg:rounded-[28px] lg:px-10 lg:pt-8">
        <Link
          href={`/research/${track.id}?tab=matrix`}
          className="inline-flex items-center gap-1.5 text-[13.5px] text-night-muted hover:text-night-ink"
        >
          <BackIcon width={16} height={16} className="rtl:rotate-180" />
          {track.short[locale]}
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] text-night-muted">
              <span className="flex items-center gap-2 text-night-ink">
                <span className="size-2 rounded-full" style={{ background: NIGHT_COLOR[tool.category] }} />
                {cat?.name[locale]}
              </span>
              <span>{r.kind[tool.kind]}</span>
              {tool.tier === "deep" && <span className="text-signal">{r.deep}</span>}
            </p>
            <h1 dir="ltr" className="mt-3 text-start font-display text-[36px] font-semibold leading-[1.05] tracking-[-0.025em] sm:text-[50px] rtl:text-end">
              {tool.name}
            </h1>
            <p dir="auto" className="mt-4 max-w-[68ch] text-[16px] leading-7 text-night-muted">
              {tool.summary}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {tool.links.map(([name, url], i) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  dir="ltr"
                  className={`inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-semibold ${
                    i === 0 ? "bg-night-ink text-night" : "border border-night-line text-night-ink hover:border-night-muted"
                  }`}
                >
                  {name}
                  <ExternalIcon width={14} height={14} />
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-5 rounded-3xl border border-night-line bg-white/[0.03] p-5 lg:flex-col lg:items-start">
            <ScoreDial total={tool.total} size={112} night />
            <div>
              <p className="text-[12.5px] text-night-muted">{r.fit}</p>
              <p className="mt-1 max-w-[180px] font-display text-[18px] font-semibold leading-6 text-signal">
                {track.verdicts[tool.fit.verdict][locale]}
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="rounded-[22px] border border-signal/50 bg-signal/[0.06] p-5 sm:p-7">
        <h2 className="text-[14px] font-semibold text-muted">{r.role}</h2>
        <p dir="auto" className="mt-2 max-w-[75ch] font-display text-[19px] font-medium leading-8 sm:text-[21px]">
          {tool.fit.role}
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-5">
          <Panel title={r.how}>
            <p dir="auto" className="max-w-[75ch] text-[15px] leading-7 text-ink-2">
              {tool.how}
            </p>
          </Panel>
          <Panel title={r.features}>
            <Bullets items={tool.features} />
          </Panel>
          <div className="grid gap-5 md:grid-cols-2">
            <Panel title={r.strengths}>
              <Bullets items={tool.strengths} tone="plus" />
            </Panel>
            <Panel title={r.weaknesses}>
              <Bullets items={tool.weaknesses} tone="minus" />
            </Panel>
          </div>
          <Panel title={r.gaps}>
            <Bullets items={tool.gaps} tone="gap" />
          </Panel>
          {tool.sources.length > 0 && (
            <Panel title={r.sources}>
              <ul className="flex flex-col gap-2" dir="ltr">
                {tool.sources.map((s) => (
                  <li key={s} className="truncate text-[13.5px]">
                    <a href={s} target="_blank" rel="noreferrer" className="text-accent-ink underline decoration-line underline-offset-4 hover:decoration-accent">
                      {s.replace(/^https?:\/\/(www\.)?/, "")}
                    </a>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <aside className="flex flex-col gap-5">
          <Panel>
            <dl className="flex flex-col divide-y divide-line text-[14px]">
              {facts
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="py-3 first:pt-0 last:pb-0">
                    <dt className="text-[12.5px] text-muted">{k}</dt>
                    <dd dir="auto" className="mt-0.5 leading-6">
                      {v}
                    </dd>
                  </div>
                ))}
            </dl>
          </Panel>
          <Panel title={r.scoring}>
            <CriteriaBars criteria={track.criteria} scores={tool.scores} />
            <p className="mt-4 text-[12.5px] leading-5 text-faint">{r.scoringNote}</p>
          </Panel>
          {related.length > 0 && (
            <Panel title={cat?.name[locale]}>
              <ul className="flex flex-col">
                {related.map((x) => (
                  <li key={x.id}>
                    <Link
                      href={`/research/${track.id}/${x.id}`}
                      className="flex items-center gap-2 border-b border-line py-2.5 last:border-b-0 hover:text-accent-ink"
                    >
                      <span className="min-w-0 flex-1 truncate text-[14px] font-medium" dir="ltr">
                        {x.name}
                      </span>
                      <VerdictChip track={track} verdict={x.fit.verdict} />
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </aside>
      </div>
    </article>
  );
}
