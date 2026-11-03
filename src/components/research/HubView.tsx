"use client";

import Link from "next/link";
import type { Track } from "@/lib/research";
import { useLocale } from "../LocaleProvider";
import { FlaskIcon } from "../icons";

type Card = { track: Track; tools: number; index: number; articles: number; headline: string | null };

export function HubView({ cards }: { cards: Card[] }) {
  const { t, locale, f } = useLocale();
  const r = t.research;
  return (
    <div className="flex flex-col gap-5 pt-2 lg:pt-1">
      <header className="card overflow-hidden !rounded-[24px]">
        <div className="flex flex-col gap-3 bg-ink p-6 text-ground sm:p-8">
          <span className="grid size-11 place-items-center rounded-2xl bg-ground/10">
            <FlaskIcon width={22} height={22} />
          </span>
          <h1 className="text-[28px] font-bold leading-tight sm:text-[32px]">{r.hubTitle}</h1>
          <p className="max-w-3xl text-[15.5px] leading-7 text-ground/80">{r.hubIntro}</p>
        </div>
      </header>
      <ul className="grid gap-4 lg:grid-cols-3">
        {cards.map(({ track, tools, index, articles, headline }) => {
          const planned = track.status === "planned";
          return (
            <li key={track.id}>
              <Link
                href={`/research/${track.id}`}
                className={`card flex h-full flex-col gap-3 p-5 transition-shadow hover:shadow-md ${planned ? "" : "ring-2 ring-accent/40"}`}
              >
                <span
                  className={`w-fit rounded-md px-2 py-px text-[12.5px] font-semibold ${planned ? "bg-sunken text-muted" : "bg-star-soft text-star-ink"}`}
                >
                  {planned ? r.planned : r.active}
                </span>
                <h2 className="text-[19px] font-bold leading-snug">{track.name[locale]}</h2>
                <p dir="auto" className="line-clamp-5 text-[14px] leading-6 text-ink-2">
                  {headline ?? track.question}
                </p>
                {!planned && (
                  <dl className="mt-auto grid grid-cols-3 gap-2 border-t border-line pt-3">
                    {(
                      [
                        [r.stats.tools, tools],
                        [r.stats.index, index],
                        [r.stats.articles, articles],
                      ] as const
                    ).map(([k, v]) => (
                      <div key={k}>
                        <dd className="text-[19px] font-bold tabular-nums">{f.num(v)}</dd>
                        <dt className="text-[12px] leading-4 text-muted">{k}</dt>
                      </div>
                    ))}
                  </dl>
                )}
                <span className="text-[14px] font-semibold text-accent-ink">{r.open} →</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
