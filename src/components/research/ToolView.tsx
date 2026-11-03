"use client";

import Link from "next/link";
import type { Tool, Track } from "@/lib/research";
import { useLocale } from "../LocaleProvider";
import { BackIcon, ExternalIcon } from "../icons";
import { Bullets, CategoryTag, CriteriaBars, KindChip, Panel, ScoreBadge, VerdictChip } from "./parts";

export function ToolView({ track, tool, related }: { track: Track; tool: Tool; related: Tool[] }) {
  const { t, locale } = useLocale();
  const r = t.research;
  const facts: [string, string | undefined][] = [
    [r.vendor, tool.vendor],
    [r.license, tool.license],
    [r.pricing, tool.pricing],
    [r.version, tool.version],
    [r.status, tool.status],
  ];
  return (
    <article className="flex flex-col gap-4 pt-2 lg:pt-1">
      <Link href={`/research/${track.id}?tab=matrix`} className="inline-flex w-fit items-center gap-1.5 text-[14px] text-muted hover:text-ink">
        <BackIcon width={17} height={17} className="rtl:rotate-180" />
        {r.back}: {track.short[locale]}
      </Link>

      <header className="card flex flex-col gap-3 p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryTag track={track} id={tool.category} />
          <KindChip kind={tool.kind} />
          {tool.tier === "deep" && (
            <span className="rounded-md bg-accent-soft px-2 py-px text-[12px] font-semibold text-accent-ink">{r.deep}</span>
          )}
        </div>
        <h1 className="text-[28px] font-bold leading-tight" dir="ltr">
          {tool.name}
        </h1>
        <p dir="auto" className="text-[16px] leading-7 text-ink-2">
          {tool.summary}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {tool.links.map(([name, url]) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-sunken px-3 text-[13.5px] font-semibold hover:bg-line"
              dir="ltr"
            >
              {name}
              <ExternalIcon width={14} height={14} />
            </a>
          ))}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <section className="card overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 bg-ink px-5 py-3 text-ground sm:px-6">
              <span className="text-[13px] font-semibold text-ground/70">{r.fit}</span>
              <VerdictChip track={track} verdict={tool.fit.verdict} long />
            </div>
            <p dir="auto" className="p-5 text-[15px] leading-7 sm:px-6">
              {tool.fit.role}
            </p>
          </section>
          <Panel title={r.how}>
            <p dir="auto" className="text-[14.5px] leading-7 text-ink-2">
              {tool.how}
            </p>
          </Panel>
          <Panel title={r.features}>
            <Bullets items={tool.features} />
          </Panel>
          <div className="grid gap-4 md:grid-cols-2">
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
              <ul className="flex flex-col gap-1.5" dir="ltr">
                {tool.sources.map((s) => (
                  <li key={s} className="truncate text-[13.5px]">
                    <a href={s} target="_blank" rel="noreferrer" className="text-accent-ink hover:underline">
                      {s.replace(/^https?:\/\/(www\.)?/, "")}
                    </a>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <Panel>
            <dl className="flex flex-col gap-3 text-[14px]">
              {facts
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[12.5px] text-muted">{k}</dt>
                    <dd dir="auto" className="leading-6">
                      {v}
                    </dd>
                  </div>
                ))}
            </dl>
          </Panel>
          <Panel
            title={
              <span className="flex items-center justify-between gap-2">
                {r.scoring} <ScoreBadge total={tool.total} />
              </span>
            }
          >
            <CriteriaBars criteria={track.criteria} scores={tool.scores} />
            <p className="mt-3 text-[12.5px] leading-5 text-faint">{r.scoringNote}</p>
          </Panel>
          {related.length > 0 && (
            <Panel title={<CategoryTag track={track} id={tool.category} />}>
              <ul className="flex flex-col gap-2">
                {related.map((x) => (
                  <li key={x.id} className="flex items-center gap-2">
                    <Link href={`/research/${track.id}/${x.id}`} className="flex-1 truncate text-[14px] font-medium hover:underline" dir="ltr">
                      {x.name}
                    </Link>
                    <VerdictChip track={track} verdict={x.fit.verdict} />
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
