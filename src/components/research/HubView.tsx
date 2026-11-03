"use client";

import Link from "next/link";
import type { Track } from "@/lib/research";
import { useLocale } from "../LocaleProvider";

type Card = { track: Track; tools: number; index: number; articles: number; headline: string | null };

export function HubView({ cards }: { cards: Card[] }) {
  const { t, locale, f } = useLocale();
  const r = t.research;
  return (
    <div className="night-band -mx-3 flex flex-col px-5 pb-8 pt-8 sm:px-8 lg:mx-0 lg:min-h-[calc(100dvh-40px)] lg:rounded-[28px] lg:px-12 lg:pt-12">
      <div className="max-w-[760px]">
        <h1 className="font-display text-[42px] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[64px]">
          {r.hubTitle}
        </h1>
        <p className="mt-5 max-w-[62ch] text-[16.5px] leading-7 text-night-muted">{r.hubIntro}</p>
      </div>

      <ol className="mt-12 flex flex-col border-t border-night-line lg:mt-auto">
        {cards.map(({ track, tools, index, articles, headline }) => {
          const planned = track.status === "planned";
          const num = track.name[locale].split(" · ")[0];
          return (
            <li key={track.id} className="border-b border-night-line">
              <Link
                href={`/research/${track.id}`}
                className="group grid gap-x-8 gap-y-3 py-7 sm:grid-cols-[150px_minmax(0,1fr)] lg:grid-cols-[170px_minmax(0,1fr)_280px] lg:items-start"
              >
                <div className="flex items-center gap-3 sm:flex-col sm:items-start">
                  <span className="text-[14px] text-night-muted">{num}</span>
                  <span
                    className={`flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-[12.5px] ${
                      planned ? "border-night-line text-night-muted" : "border-signal/60 text-signal"
                    }`}
                  >
                    <span className={`size-1.5 rounded-full ${planned ? "bg-night-muted" : "animate-pulse bg-signal"}`} />
                    {planned ? r.planned : r.active}
                  </span>
                </div>
                <div className="min-w-0">
                  <h2
                    className={`font-display text-[30px] font-semibold leading-tight tracking-[-0.02em] transition-colors sm:text-[38px] ${
                      planned ? "text-night-ink/70 group-hover:text-night-ink" : "group-hover:text-signal"
                    }`}
                  >
                    {track.short[locale]}
                  </h2>
                  <p dir="auto" className="mt-2 line-clamp-3 max-w-[68ch] text-[15px] leading-7 text-night-muted">
                    {headline ?? track.question}
                  </p>
                </div>
                {!planned ? (
                  <dl className="grid grid-cols-3 gap-4 sm:col-start-2 lg:col-start-auto">
                    {(
                      [
                        [r.stats.tools, tools],
                        [r.stats.index, index],
                        [r.stats.articles, articles],
                      ] as const
                    ).map(([k, v]) => (
                      <div key={k}>
                        <dd className="font-display text-[28px] font-semibold leading-none tabular-nums">{f.num(v)}</dd>
                        <dt className="mt-1.5 text-[12.5px] leading-4 text-night-muted">{k}</dt>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-[13.5px] text-night-muted sm:col-start-2 lg:col-start-auto">{r.plannedTitle}</p>
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
