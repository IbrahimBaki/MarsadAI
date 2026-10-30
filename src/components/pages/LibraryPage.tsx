"use client";

import Link from "next/link";
import { useMemo } from "react";
import { matches } from "@/lib/search";
import { useLocale } from "../LocaleProvider";
import type { FeedItem } from "@/lib/types";
import { useApp } from "../AppContext";
import { ItemCard } from "../ItemCard";
import { FilterBar } from "../FilterBar";
import { priceMatches, useFilters, type Filters } from "../useFilters";
import { useItemActions } from "../useItemActions";
import { Empty, Skeleton, secStyle } from "../bits";

const PER_SECTION = 6;

function passes(it: FeedItem, f: Filters) {
  return (
    (!f.s || it.section === f.s) &&
    (!f.k || it.kind === f.k) &&
    (!f.hot || it.importance === 3) &&
    priceMatches(it.pricing?.model, f.p) &&
    matches(it, f.q)
  );
}

export function LibraryPage() {
  const { feed, user } = useApp();
  const { t, tx } = useLocale();
  const { filters, update } = useFilters("all");
  const { onSeen, onFav, onShare } = useItemActions();
  const { seen, fav, guest } = user;
  const essentials = useMemo(() => feed?.essentials ?? [], [feed]);
  const stats = feed?.stats ?? {};

  const visible = useMemo(
    () =>
      essentials
        .filter((it) => passes(it, filters))
        .sort((a, b) => b.importance - a.importance),
    [essentials, filters],
  );
  const kinds = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of essentials)
      if (passes(it, { ...filters, k: null }))
        m.set(it.kind, (m.get(it.kind) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [essentials, filters]);

  const narrowed = Boolean(filters.k || filters.p || filters.hot || filters.q);
  const section = filters.s ? tx.SECTION_BY_ID[filters.s] : null;
  const triedTotal = essentials.filter((e) => seen.has(e.id)).length;

  const card = (item: FeedItem) => (
    <ItemCard
      key={item.id}
      compact
      item={item}
      stats={item.repo ? stats[item.repo] : undefined}
      seen={seen.has(item.id)}
      fav={fav.has(item.id)}
      onSeen={onSeen}
      onFav={onFav}
      onShare={onShare}
    />
  );

  return (
    <div className="flex flex-col gap-5">
      {section ? (
        <header
          style={secStyle(section.id)}
          className="sec-solid mt-1 rounded-[24px] p-5 sm:p-6"
        >
          <h1 className="text-[24px] font-bold leading-9">{section.name}</h1>
          <p className="mt-1 text-[15px] text-white/85">{section.hint}</p>
          {!guest && (
            <Progress
              done={
                essentials.filter(
                  (e) => e.section === section.id && seen.has(e.id),
                ).length
              }
              total={essentials.filter((e) => e.section === section.id).length}
              light
            />
          )}
        </header>
      ) : (
        <header className="px-1 pt-2">
          <h1 className="text-[28px] font-bold leading-10">
            {t.library.title}
          </h1>
          <p className="mt-1 max-w-[70ch] text-[15px] leading-7 text-ink-2">
            {t.library.intro}
          </p>
          {essentials.length > 0 && !guest && (
            <Progress done={triedTotal} total={essentials.length} />
          )}
        </header>
      )}

      <FilterBar
        filters={filters}
        update={update}
        placeholder={t.library.placeholder}
        kinds={kinds}
        hotLabel={t.library.hot}
      />

      {!feed && <Skeleton />}
      {feed && visible.length === 0 && (
        <Empty
          title={t.empty.noResults}
          body={t.library.noResultsBody}
          action={
            <button
              type="button"
              onClick={() => update({ k: null, p: null, hot: false, q: "" })}
              className="rounded-xl bg-ink px-4 py-2 text-[14.5px] font-semibold text-ground"
            >
              {t.empty.clearFilters}
            </button>
          }
        />
      )}

      {section || narrowed ? (
        section ? (
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 2xl:grid-cols-3">
            {visible.map(card)}
          </div>
        ) : (
          tx.GROUPS.flatMap((g) => g.sections).map((s) => {
            const list = visible.filter((i) => i.section === s.id);
            if (!list.length) return null;
            return (
              <section
                key={s.id}
                style={secStyle(s.id)}
                className="flex flex-col gap-2.5"
              >
                <SectionHeader id={s.id} name={s.name} count={list.length} />
                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 2xl:grid-cols-3">
                  {list.map(card)}
                </div>
              </section>
            );
          })
        )
      ) : (
        tx.GROUPS.map((g) => {
          const sections = g.sections.filter((s) =>
            visible.some((i) => i.section === s.id),
          );
          if (!sections.length) return null;
          return (
            <div key={g.id} className="flex flex-col gap-6">
              <h2 className="px-1 text-[13.5px] font-semibold text-faint">
                {g.name}
              </h2>
              {sections.map((s) => {
                const all = visible.filter((i) => i.section === s.id);
                const done = all.filter((i) => seen.has(i.id)).length;
                return (
                  <section
                    key={s.id}
                    style={secStyle(s.id)}
                    className="-mt-2 flex flex-col gap-2.5"
                  >
                    <SectionHeader
                      id={s.id}
                      name={s.name}
                      hint={s.hint}
                      done={guest ? undefined : done}
                      count={all.length}
                      more={all.length > PER_SECTION}
                    />
                    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 2xl:grid-cols-3">
                      {all.slice(0, PER_SECTION).map(card)}
                    </div>
                  </section>
                );
              })}
            </div>
          );
        })
      )}
    </div>
  );
}

function SectionHeader({
  id,
  name,
  hint,
  done,
  count,
  more,
}: {
  id: string;
  name: string;
  hint?: string;
  done?: number;
  count: number;
  more?: boolean;
}) {
  const { t, f } = useLocale();
  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-1">
      <span className="sec-bg size-3 rounded-[4px]" />
      <h3 className="text-[19px] font-bold">{name}</h3>
      <span className="text-[13px] text-faint">
        {done !== undefined
          ? t.library.tried(f.num(done), f.num(count))
          : f.num(count)}
      </span>
      {more && (
        <Link
          href={`/library?s=${id}`}
          className="ms-auto text-[13.5px] font-semibold text-accent"
        >
          {t.library.showAll}
        </Link>
      )}
      {hint && <p className="w-full text-[14px] text-muted">{hint}</p>}
    </header>
  );
}

function Progress({
  done,
  total,
  light,
}: {
  done: number;
  total: number;
  light?: boolean;
}) {
  const { t, f } = useLocale();
  return (
    <div className="mt-3 flex items-center gap-3">
      <div
        className={`h-1.5 flex-1 overflow-hidden rounded-full ${light ? "bg-white/25" : "bg-sunken"}`}
        aria-hidden
      >
        <div
          className={`h-full rounded-full ${light ? "bg-white" : "bg-ink"}`}
          style={{ width: `${total ? (done / total) * 100 : 0}%` }}
        />
      </div>
      <span
        className={`whitespace-nowrap text-[13px] ${light ? "text-white/90" : "text-muted"}`}
      >
        {t.library.tried(f.num(done), f.num(total))}
      </span>
    </div>
  );
}
