"use client";

import { useMemo, useState } from "react";
import { matches } from "@/lib/search";
import { useLocale } from "../LocaleProvider";
import type { RadarEntry } from "@/lib/types";
import { useApp } from "../AppContext";
import { FilterBar } from "../FilterBar";
import { useFilters } from "../useFilters";
import { useItemActions } from "../useItemActions";
import { Empty, Skeleton, secStyle } from "../bits";
import { CheckIcon, ExternalIcon, StarIcon } from "../icons";

const TYPES = ["all", "awesome", "release", "trending"] as const;
const PAGE = 80;

export function RadarPage() {
  const { feed, user } = useApp();
  const { t, f, tx } = useLocale();
  const { filters, update } = useFilters("all");
  const { onSeen, markAll } = useItemActions();
  const [limit, setLimit] = useState(PAGE);
  const type = filters.v;
  const radar = useMemo(() => feed?.radar ?? [], [feed]);
  const section = filters.s ? tx.SECTION_BY_ID[filters.s] : null;
  const unseenOnly = filters.hot;

  const visible = useMemo(
    () =>
      radar.filter(
        (r) =>
          (type === "all" || r.type === type) &&
          (!filters.s || r.section === filters.s) &&
          (!unseenOnly || !user.seen.has(r.id)) &&
          matches(r, filters.q),
      ),
    [radar, type, filters.s, filters.q, unseenOnly, user.seen],
  );

  const shown = visible.slice(0, limit);
  const days = useMemo(() => {
    const m = new Map<string, RadarEntry[]>();
    for (const r of shown) m.set(r.date, [...(m.get(r.date) ?? []), r]);
    return [...m.entries()];
  }, [shown]);

  const counts = useMemo(() => {
    const c = { all: 0, awesome: 0, release: 0, trending: 0 } as Record<string, number>;
    for (const r of radar) {
      if (filters.s && r.section !== filters.s) continue;
      if (user.seen.has(r.id)) continue;
      c.all++;
      c[r.type]++;
    }
    return c;
  }, [radar, filters.s, user.seen]);

  const tabs = (
    <div role="tablist" aria-label={t.radar.type} className="card no-scrollbar flex max-w-full overflow-x-auto !rounded-2xl p-1 text-[14px]">
      {TYPES.map((id) => (
        <button
          key={id}
          role="tab"
          type="button"
          aria-selected={type === id}
          onClick={() => {
            setLimit(PAGE);
            update({ v: id });
          }}
          className={`whitespace-nowrap rounded-xl px-3.5 py-2 ${type === id ? "bg-ink font-semibold text-ground" : "text-ink-2"}`}
        >
          {t.radar[id]}
          {counts[id] > 0 && <span className="ms-1.5 text-[12px] opacity-70">{f.num(counts[id])}</span>}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <header style={section ? secStyle(section.id) : undefined} className="px-1 pt-2">
        <div className="flex items-center gap-2.5">
          {section && <span className="sec-bg size-3 rounded-[4px]" />}
          <h1 className="text-[28px] font-bold leading-10">{t.radar.title}{section ? ` · ${section.name}` : ""}</h1>
        </div>
        <p className="mt-1 max-w-[72ch] text-[15px] leading-7 text-ink-2">{t.radar.intro}</p>
      </header>

      <FilterBar filters={filters} update={update} placeholder={t.radar.placeholder} showPrice={false} hotLabel={t.radar.unseen} tabs={tabs} />

      {!feed && <Skeleton />}
      {feed && visible.length === 0 && (
        <Empty title={t.radar.emptyTitle} body={radar.length ? t.radar.emptyFiltered : t.radar.emptyNone} />
      )}

      {days.map(([date, list]) => {
        const label = f.day(date);
        const lists = new Map<string, RadarEntry[]>();
        for (const r of list) {
          const key = r.type === "awesome" ? `awesome:${r.list}` : r.type;
          lists.set(key, [...(lists.get(key) ?? []), r]);
        }
        const unseen = list.filter((r) => !user.seen.has(r.id));
        return (
          <section key={date} className="flex flex-col gap-3">
            <header className="flex flex-wrap items-baseline gap-x-3 px-1">
              <h2 className="text-[24px] font-bold">{label.main}</h2>
              {label.sub && <span className="text-[14px] text-muted">{label.sub}</span>}
              {unseen.length > 0 && (
                <button type="button" onClick={() => markAll(unseen.map((r) => r.id))} className="ms-auto text-[13px] font-semibold text-accent">
                  {t.radar.markAll}
                </button>
              )}
            </header>
            {[...lists.entries()].map(([key, rows]) => (
              <div key={key} className="card overflow-hidden">
                <div className="flex items-center gap-2 border-b border-line bg-sunken/50 px-4 py-2.5 text-[13.5px]">
                  <span className="font-semibold">
                    {key === "release" ? t.radar.newReleases : key === "trending" ? t.radar.rising : t.radar.addedTo}
                  </span>
                  {key.startsWith("awesome:") && (
                    <a href={`https://github.com/${key.slice(8)}`} target="_blank" rel="noopener noreferrer" className="ltr font-mono text-[12.5px] text-accent">
                      {key.slice(8)}
                    </a>
                  )}
                  <span className="ms-auto text-faint">{f.num(rows.length)}</span>
                </div>
                <ul className="divide-y divide-line">
                  {rows.map((r) => (
                    <Row key={r.id} r={r} seen={user.seen.has(r.id)} onSeen={onSeen} />
                  ))}
                </ul>
              </div>
            ))}
          </section>
        );
      })}

      {visible.length > limit && (
        <button type="button" onClick={() => setLimit((l) => l + PAGE)} className="card mx-auto px-5 py-2.5 text-[14.5px] font-semibold">
          {t.radar.more(f.num(visible.length - limit))}
        </button>
      )}
    </div>
  );
}

function Row({ r, seen, onSeen }: { r: RadarEntry; seen: boolean; onSeen: (id: string, on: boolean) => void }) {
  const { t, f, tx } = useLocale();
  const section = tx.SECTION_BY_ID[r.section];
  const desc = r.desc || (r.previous ? t.radar.previous(r.previous) : "");
  return (
    <li style={secStyle(r.section)} className={`flex gap-3 px-4 py-3 ${seen ? "opacity-60" : ""}`}>
      <button
        type="button"
        onClick={() => onSeen(r.id, !seen)}
        aria-pressed={seen}
        aria-label={seen ? t.card.markNew : t.card.markSeen}
        className={`mt-1 grid size-6 shrink-0 place-items-center rounded-full ${seen ? "bg-ink text-ground" : "shadow-[inset_0_0_0_1.5px_var(--line)] text-transparent hover:text-faint"}`}
      >
        <CheckIcon width={13} height={13} strokeWidth={2.6} />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onSeen(r.id, true)}
            className="ltr font-mono text-[14px] font-medium hover:underline"
          >
            {r.title}
          </a>
          {r.stars !== undefined && (
            <span className="inline-flex items-center gap-1 text-[12.5px] text-star-ink">
              <StarIcon width={12} height={12} /> {f.count(r.stars)}
            </span>
          )}
          <span className="sec-fg text-[12px] font-semibold">{section?.short}</span>
          {r.heading && <span className="ltr text-[12px] text-faint">{r.heading}</span>}
        </div>
        {desc && (
          <p dir="auto" className="mt-0.5 line-clamp-2 text-[13.5px] leading-[22px] text-muted">
            {desc}
          </p>
        )}
      </div>
      <a href={r.url} target="_blank" rel="noopener noreferrer" aria-label={t.radar.open} className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-sunken">
        <ExternalIcon width={16} height={16} className="rtl:-scale-x-100" />
      </a>
    </li>
  );
}
