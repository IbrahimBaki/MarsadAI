"use client";

import Link from "next/link";
import type { Block, Blueprint, Tool, Track, Verdict } from "@/lib/research";
import { VERDICTS } from "@/lib/research";
import { useLocale } from "../LocaleProvider";
import { BackIcon } from "../icons";
import { Bullets, Panel, ScoreBadge, VerdictChip } from "./parts";
import { NIGHT_COLOR } from "./Radar";

type ToolMap = Record<string, Pick<Tool, "id" | "name" | "category" | "fit" | "total" | "kind" | "license" | "strengths" | "weaknesses" | "summary">>;

const DECISION_TONE: Record<Block["decision"], string> = {
  adopt: "bg-lens text-white",
  build: "bg-signal text-[#2a1a00]",
  benchmark: "bg-ok text-ok-ink",
  later: "bg-sunken text-muted",
  compare: "bg-sunken text-muted",
};

export function DecisionBadge({ d }: { d: Block["decision"] }) {
  const { t } = useLocale();
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12.5px] font-bold ${DECISION_TONE[d]}`}>
      {t.research.bp.decision[d]}
    </span>
  );
}

function ToolChip({ tool, track, muted }: { tool?: ToolMap[string]; track: Track; muted?: boolean }) {
  if (!tool) return null;
  return (
    <Link
      href={`/research/${track.id}/${tool.id}`}
      dir="ltr"
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[13px] transition-colors ${
        muted ? "border-line text-muted hover:text-ink" : "border-ink/15 bg-surface font-semibold hover:border-lens"
      }`}
    >
      <span className="size-2 rounded-full" style={{ background: NIGHT_COLOR[tool.category] }} />
      {tool.name}
    </Link>
  );
}

export function BigPicture({ track, bp, tools }: { track: Track; bp: Blueprint; tools: ToolMap }) {
  const { t, locale } = useLocale();
  const r = t.research;
  const blockOf = (id: string) => bp.blocks.find((b) => b.id === id);
  return (
    <div className="flex flex-col gap-5">
      <section className="grid gap-6 rounded-[22px] border border-line bg-surface p-5 sm:p-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-10">
        <div>
          <h2 className="mb-3 text-[14px] font-semibold text-muted">{r.bp.goal}</h2>
          <p dir="auto" className="font-display text-[21px] font-medium leading-[1.5] tracking-[-0.01em] sm:text-[24px]">
            {bp.goal}
          </p>
        </div>
        <div className="rounded-2xl border-s-[3px] border-signal bg-signal/[0.07] p-5">
          <h2 className="mb-2 text-[14px] font-semibold text-muted">{r.bp.answer}</h2>
          <p dir="auto" className="text-[15.5px] leading-7">
            {bp.answer}
          </p>
        </div>
      </section>

      <Panel title={r.bp.flow}>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:gap-0">
          {bp.flow.map((f, i) => {
            const b = blockOf(f.id);
            return (
              <li key={f.id} className="relative flex lg:flex-col">
                <Link
                  href={b ? `/research/${track.id}/block/${b.id}` : "#"}
                  className="group flex flex-1 gap-3 rounded-2xl p-3 hover:bg-sunken lg:flex-col lg:gap-2 lg:pe-5"
                >
                  <span className="relative flex items-center lg:w-full">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-night font-display text-[15px] font-semibold text-night-ink">
                      {i + 1}
                    </span>
                    {i < bp.flow.length - 1 && (
                      <span aria-hidden className="ms-2 hidden h-px flex-1 bg-line lg:block" />
                    )}
                  </span>
                  <span>
                    <span className="block font-display text-[15.5px] font-semibold group-hover:text-accent-ink">{f.name}</span>
                    <span dir="auto" className="mt-0.5 block text-[13.5px] leading-5 text-muted">
                      {f.desc}
                    </span>
                    {b && (
                      <span className="mt-2 inline-block">
                        <DecisionBadge d={b.decision} />
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </Panel>

      <section>
        <div className="mb-3 px-1">
          <h2 className="font-display text-[22px] font-semibold tracking-[-0.01em]">{r.bp.blocks}</h2>
          <p className="mt-1 max-w-[75ch] text-[14.5px] leading-6 text-muted">{r.bp.blocksIntro}</p>
        </div>
        <ol className="flex flex-col gap-3">
          {bp.blocks.map((b) => (
            <li key={b.id}>
              <article
                className={`grid gap-x-8 gap-y-4 rounded-[22px] border bg-surface p-5 sm:p-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] ${
                  b.decision === "build" ? "border-signal/50" : "border-line"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-display text-[15px] font-semibold tabular-nums text-faint">{b.order}</span>
                    <h3 className="font-display text-[20px] font-semibold tracking-[-0.01em]">{b.name}</h3>
                    <DecisionBadge d={b.decision} />
                  </div>
                  <p className="mt-3 text-[12.5px] font-semibold text-muted">{r.bp.need}</p>
                  <p dir="auto" className="mt-1 text-[14.5px] leading-6 text-ink-2">
                    {b.need}
                  </p>
                </div>
                <div className="flex min-w-0 flex-col gap-3">
                  {b.pick.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-[12.5px] font-semibold text-muted">{r.bp.pick}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {b.pick.map((id) => (
                          <ToolChip key={id} tool={tools[id]} track={track} />
                        ))}
                      </div>
                    </div>
                  )}
                  {b.alternatives.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-[12.5px] font-semibold text-muted">{r.bp.alternatives}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {b.alternatives.map((id) => (
                          <ToolChip key={id} tool={tools[id]} track={track} muted />
                        ))}
                      </div>
                    </div>
                  )}
                  <Link
                    href={`/research/${track.id}/block/${b.id}`}
                    className="mt-auto inline-flex w-fit items-center rounded-full bg-night px-4 py-2 text-[13.5px] font-semibold text-night-ink hover:bg-night-2"
                  >
                    {r.bp.open}
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </section>

      <Panel title={r.bp.verdictKey}>
        <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {VERDICTS.map((v: Verdict) => (
            <li key={v} className="flex items-center gap-2.5 text-[14px]">
              <VerdictChip track={track} verdict={v} />
              <span className="text-ink-2">{track.verdicts[v][locale]}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

export function BlockHeader({ track, block, total }: { track: Track; block: Block; total: number }) {
  const { t, locale } = useLocale();
  const r = t.research;
  return (
    <header className="night-band -mx-3 px-5 pb-8 pt-6 sm:px-8 lg:mx-0 lg:rounded-[28px] lg:px-10 lg:pt-8">
      <Link href={`/research/${track.id}`} className="inline-flex items-center gap-1.5 text-[13.5px] text-night-muted hover:text-night-ink">
        <BackIcon width={16} height={16} className="rtl:rotate-180" />
        {track.short[locale]} · {r.bp.back}
      </Link>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="font-display text-[15px] text-night-muted">
          {block.order} / {total}
        </span>
        <DecisionBadge d={block.decision} />
      </div>
      <h1 className="mt-2 font-display text-[34px] font-semibold leading-[1.08] tracking-[-0.025em] sm:text-[46px]">{block.name}</h1>
      <p dir="auto" className="mt-4 max-w-[70ch] text-[16px] leading-7 text-night-muted">
        {block.need}
      </p>
    </header>
  );
}

export function BlockView({ track, block, tools, prev, next }: { track: Track; block: Block; tools: ToolMap; prev?: Block; next?: Block }) {
  const { t } = useLocale();
  const r = t.research;
  const compared = [...new Set(block.compares.flatMap((c) => c.tools))].map((id) => tools[id]).filter(Boolean);
  return (
    <div className="flex flex-col gap-5">
      <section className="grid gap-6 rounded-[22px] border border-line bg-surface p-5 sm:p-7 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div>
          <h2 className="text-[14px] font-semibold text-muted">{r.bp.plan}</h2>
          <p dir="auto" className="mt-2 font-display text-[18px] font-medium leading-8">
            {block.plan}
          </p>
        </div>
        <div className="flex flex-col gap-4">
          {block.pick.length > 0 && (
            <div>
              <p className="mb-1.5 text-[12.5px] font-semibold text-muted">{r.bp.pick}</p>
              <div className="flex flex-wrap gap-1.5">
                {block.pick.map((id) => (
                  <ToolChip key={id} tool={tools[id]} track={track} />
                ))}
              </div>
            </div>
          )}
          {block.alternatives.length > 0 && (
            <div>
              <p className="mb-1.5 text-[12.5px] font-semibold text-muted">{r.bp.alternatives}</p>
              <div className="flex flex-wrap gap-1.5">
                {block.alternatives.map((id) => (
                  <ToolChip key={id} tool={tools[id]} track={track} muted />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {block.modes.length > 0 && (
        <section>
          <h2 className="mb-3 px-1 font-display text-[22px] font-semibold">{r.bp.modes}</h2>
          <ol className="grid gap-3 lg:grid-cols-3">
            {block.modes.map((m, i) => (
              <li key={m.id} className="flex flex-col gap-3 rounded-[22px] border border-line bg-surface p-5">
                <div className="flex items-center gap-3">
                  <span className="grid size-8 place-items-center rounded-full bg-night font-display text-[14px] font-semibold text-night-ink">{i + 1}</span>
                  <h3 className="font-display text-[18px] font-semibold">{m.name}</h3>
                </div>
                <p dir="auto" className="text-[14px] leading-6 text-ink-2">
                  {m.desc}
                </p>
                <div>
                  <p className="mb-1 text-[12.5px] font-semibold text-ok-ink">{r.bp.pros}</p>
                  <Bullets items={m.pros} tone="plus" />
                </div>
                <div>
                  <p className="mb-1 text-[12.5px] font-semibold text-paid-ink">{r.bp.cons}</p>
                  <Bullets items={m.cons} tone="minus" />
                </div>
                <div className="rounded-xl bg-sunken p-3">
                  <p className="text-[12.5px] font-semibold text-muted">{r.bp.bestFor}</p>
                  <p dir="auto" className="mt-0.5 text-[14px] leading-6">
                    {m.use}
                  </p>
                </div>
                <div className="mt-auto flex flex-wrap gap-1.5">
                  {m.tools.map((id) => (
                    <ToolChip key={id} tool={tools[id]} track={track} muted />
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {block.compares.map((c, ci) => (
        <section key={ci} className="overflow-hidden rounded-[22px] border border-line bg-surface">
          <h2 className="px-5 pt-5 font-display text-[19px] font-semibold sm:px-6">{c.title ?? r.bp.compare}</h2>
          <div className="overflow-x-auto px-2 pb-3 pt-3 sm:px-3">
            <table className="w-full min-w-[720px] border-separate border-spacing-0 text-[14px]">
              <thead>
                <tr>
                  <th className="sticky start-0 z-10 w-[170px] bg-surface p-3" />
                  {c.tools.map((id) => {
                    const x = tools[id];
                    return (
                      <th key={id} className="min-w-[150px] border-b border-line p-3 text-start align-bottom font-normal">
                        {x && (
                          <Link href={`/research/${track.id}/${id}`} className="group flex flex-col gap-1.5">
                            <span className="flex items-center gap-1.5">
                              <span className="size-2 shrink-0 rounded-full" style={{ background: NIGHT_COLOR[x.category] }} />
                              <span dir="ltr" className="font-display text-[15.5px] font-semibold group-hover:text-accent-ink">
                                {x.name}
                              </span>
                            </span>
                            <span className="flex items-center gap-2">
                              <VerdictChip track={track} verdict={x.fit.verdict} />
                              <ScoreBadge total={x.total} />
                            </span>
                          </Link>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {c.rows.map((row) => (
                  <tr key={row.label} className="align-top">
                    <th
                      scope="row"
                      className="sticky start-0 z-10 border-b border-line bg-surface p-3 text-start text-[13px] font-semibold text-muted"
                    >
                      {row.label}
                    </th>
                    {row.values.map((v, i) => (
                      <td key={i} dir="auto" className="border-b border-line p-3 leading-6 text-ink-2">
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {compared.length > 0 && (
        <section>
          <h2 className="mb-3 px-1 font-display text-[22px] font-semibold">{r.bp.prosCons}</h2>
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {compared.map((x) => (
              <li key={x.id} className="flex flex-col gap-3 rounded-[22px] border border-line bg-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/research/${track.id}/${x.id}`} dir="ltr" className="font-display text-[17px] font-semibold hover:text-accent-ink">
                    {x.name}
                  </Link>
                  <ScoreBadge total={x.total} />
                </div>
                <VerdictChip track={track} verdict={x.fit.verdict} long />
                <div>
                  <p className="mb-1 text-[12.5px] font-semibold text-ok-ink">{r.strengths}</p>
                  <Bullets items={x.strengths.slice(0, 3)} tone="plus" />
                </div>
                <div>
                  <p className="mb-1 text-[12.5px] font-semibold text-paid-ink">{r.weaknesses}</p>
                  <Bullets items={x.weaknesses.slice(0, 3)} tone="minus" />
                </div>
                <Link href={`/research/${track.id}/${x.id}`} className="mt-auto text-[13.5px] font-semibold text-accent-ink hover:underline">
                  {r.bp.dossier}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav className="grid gap-3 sm:grid-cols-2">
        {prev ? (
          <Link href={`/research/${track.id}/block/${prev.id}`} className="rounded-[22px] border border-line bg-surface p-5 hover:border-lens/50">
            <span className="text-[12.5px] text-muted">{prev.order}</span>
            <span className="block font-display text-[17px] font-semibold">{prev.name}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/research/${track.id}/block/${next.id}`} className="rounded-[22px] border border-line bg-surface p-5 text-end hover:border-lens/50">
            <span className="text-[12.5px] text-muted">{next.order}</span>
            <span className="block font-display text-[17px] font-semibold">{next.name}</span>
          </Link>
        )}
      </nav>
    </div>
  );
}

export type { ToolMap };
