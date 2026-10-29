"use client";

import Link from "next/link";
import { useMemo } from "react";
import { SECTION_BY_ID } from "@/lib/sections";
import { matches } from "@/lib/search";
import { dayLabel, formatCount, nf } from "@/lib/format";
import type { FeedItem } from "@/lib/types";
import { useApp } from "../AppContext";
import { ItemCard } from "../ItemCard";
import { FilterBar } from "../FilterBar";
import { priceMatches, useFilters, type Filters } from "../useFilters";
import { useItemActions } from "../useItemActions";
import { Empty, Skeleton, secStyle } from "../bits";
import { StarIcon } from "../icons";

const VIEWS = [
  { id: "new", label: "جديد" },
  { id: "all", label: "الكل" },
] as const;

function passes(it: FeedItem, f: Filters) {
  return (
    (!f.s || it.section === f.s) &&
    (!f.k || it.kind === f.k) &&
    (!f.hot || it.importance === 3) &&
    priceMatches(it.pricing?.model, f.p) &&
    matches(it, f.q)
  );
}

export function FeedPage() {
  const { feed, loadError, user } = useApp();
  const { filters, update } = useFilters("new");
  const { onSeen, onFav, onShare, markAll } = useItemActions();
  const { seen, fav } = user;
  const v = filters.v;
  const isFavOrSeen = v === "fav" || v === "seen";

  const items = useMemo(() => feed?.items ?? [], [feed]);
  const essentials = useMemo(() => feed?.essentials ?? [], [feed]);
  const stats = feed?.stats ?? {};

  const pool = useMemo(() => (isFavOrSeen ? [...items, ...essentials] : items), [isFavOrSeen, items, essentials]);

  const visible = useMemo(
    () =>
      pool.filter((it) => {
        if (!passes(it, filters)) return false;
        if (v === "new") return !seen.has(it.id);
        if (v === "fav") return fav.has(it.id);
        if (v === "seen") return seen.has(it.id);
        return true;
      }),
    [pool, filters, v, seen, fav],
  );

  const kinds = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of pool) if (passes(it, { ...filters, k: null })) m.set(it.kind, (m.get(it.kind) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [pool, filters]);

  const groups = useMemo(() => {
    const byDay = new Map<string, FeedItem[]>();
    for (const it of visible) {
      const key = it.essential ? "essentials" : it.date;
      byDay.set(key, [...(byDay.get(key) ?? []), it]);
    }
    for (const list of byDay.values()) list.sort((a, b) => b.importance - a.importance);
    return [...byDay.entries()].sort(([a], [b]) => (a === "essentials" ? 1 : b === "essentials" ? -1 : b.localeCompare(a)));
  }, [visible]);

  const dayItems = useMemo(() => {
    const m = new Map<string, FeedItem[]>();
    for (const it of items) m.set(it.date, [...(m.get(it.date) ?? []), it]);
    return m;
  }, [items]);
  const headlineOf = useMemo(() => new Map(feed?.days.map((d) => [d.date, d.headline]) ?? []), [feed]);

  const unseenTotal = useMemo(() => items.filter((i) => !seen.has(i.id)).length, [items, seen]);
  const filtering = Boolean(filters.s || filters.k || filters.p || filters.hot || filters.q);
  const section = filters.s ? SECTION_BY_ID[filters.s] : null;

  const title = v === "fav" ? "المفضلة" : v === "seen" ? "شوفته أو جربته" : section ? section.name : null;

  const tabs = !isFavOrSeen ? (
    <div role="tablist" aria-label="العرض" className="card flex !rounded-2xl p-1 text-[14px]">
      {VIEWS.map((t) => (
        <button
          key={t.id}
          role="tab"
          type="button"
          aria-selected={v === t.id}
          onClick={() => update({ v: t.id })}
          className={`rounded-xl px-4 py-2 ${v === t.id ? "bg-ink font-semibold text-ground" : "text-ink-2"}`}
        >
          {t.label}
          {t.id === "new" && unseenTotal > 0 && <span className="ms-1.5 text-[12.5px] opacity-70">{nf.format(unseenTotal)}</span>}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <div className="flex gap-5">
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        {title && (
          <header style={section ? secStyle(section.id) : undefined} className="px-1 pt-2">
            <div className="flex items-center gap-2.5">
              {section && <span className="sec-bg size-3 rounded-[4px]" />}
              <h1 className="text-[26px] font-bold leading-9">{title}</h1>
            </div>
            {section && !isFavOrSeen && <p className="mt-0.5 text-[15px] text-muted">{section.hint}</p>}
          </header>
        )}

        <FilterBar
          filters={filters}
          update={update}
          placeholder="دوّر في الأخبار والأدوات والريبوز"
          kinds={kinds}
          hotLabel="المهم بس"
          tabs={tabs}
        />

        {!feed && !loadError && <Skeleton />}
        {loadError && (
          <Empty
            title="مقدرتش أحمّل المحتوى"
            body="اتأكد إن النت شغال وجرّب تاني."
            action={
              <button type="button" onClick={() => window.location.reload()} className="rounded-xl bg-ink px-4 py-2 text-[14.5px] font-semibold text-ground">
                حمّل تاني
              </button>
            }
          />
        )}

        {feed && groups.length === 0 && (
          <EmptyState v={v} filtering={filtering} clear={() => update({ s: null, k: null, p: null, hot: false, q: "" })} showAll={() => update({ v: "all" })} />
        )}

        {groups.map(([key, list]) => {
          if (key === "essentials") {
            return (
              <section key={key} className="flex flex-col gap-3">
                <h2 className="px-1 text-[22px] font-bold">من الأساسيات</h2>
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {list.map((item) => (
                    <ItemCard key={item.id} item={item} stats={item.repo ? stats[item.repo] : undefined} seen={seen.has(item.id)} fav={fav.has(item.id)} onSeen={onSeen} onFav={onFav} onShare={onShare} />
                  ))}
                </div>
              </section>
            );
          }
          const label = dayLabel(key);
          const all = dayItems.get(key) ?? [];
          const unseenCount = all.filter((i) => !seen.has(i.id)).length;
          const headline = headlineOf.get(key);
          return (
            <section key={key} aria-labelledby={`day-${key}`} className="flex flex-col gap-3">
              <header className="px-1">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <h2 id={`day-${key}`} className="text-[28px] font-bold leading-10">
                    {label.main}
                  </h2>
                  {label.sub && <span className="text-[14.5px] text-muted">{label.sub}</span>}
                </div>
                {headline && !filtering && !isFavOrSeen && (
                  <p className="mt-1 max-w-[70ch] text-[15px] leading-7 text-ink-2">{headline}</p>
                )}
                {!isFavOrSeen && (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunken" aria-hidden>
                      <div className="h-full rounded-full bg-ink" style={{ width: `${all.length ? ((all.length - unseenCount) / all.length) * 100 : 0}%` }} />
                    </div>
                    <span className="whitespace-nowrap text-[13px] text-muted">
                      {unseenCount === 0 ? "شوفت اليوم كله" : `${nf.format(unseenCount)} جديد من ${nf.format(all.length)}`}
                    </span>
                    {unseenCount > 0 && (
                      <button type="button" onClick={() => markAll(all.map((i) => i.id))} className="whitespace-nowrap rounded-lg px-1 py-1 text-[13px] font-semibold text-accent">
                        علّم الكل
                      </button>
                    )}
                  </div>
                )}
              </header>
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                {list.map((item) => (
                  <ItemCard key={item.id} item={item} stats={item.repo ? stats[item.repo] : undefined} seen={seen.has(item.id)} fav={fav.has(item.id)} onSeen={onSeen} onFav={onFav} onShare={onShare} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <Rail />
    </div>
  );
}

function Rail() {
  const { feed, user } = useApp();
  const trending = useMemo(() => (feed?.radar ?? []).filter((r) => r.type === "trending").sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0)).slice(0, 5), [feed]);
  const releases = useMemo(() => (feed?.radar ?? []).filter((r) => r.type === "release").slice(0, 6), [feed]);
  const next = useMemo(
    () => (feed?.essentials ?? []).filter((e) => e.importance === 3 && !user.seen.has(e.id)).slice(0, 6),
    [feed, user.seen],
  );
  if (!feed) return null;
  return (
    <aside aria-label="جانبي" className="sticky top-5 hidden max-h-[calc(100dvh-40px)] w-[300px] shrink-0 flex-col gap-4 overflow-y-auto 2xl:flex">
      {trending.length > 0 && (
        <section className="rounded-[20px] bg-code p-5 text-code-ink">
          <h2 className="text-[16px] font-bold text-white">صاعد على GitHub</h2>
          <p className="mb-2 text-[13px] text-code-muted">ريبوز جديدة بتجمع نجوم بسرعة</p>
          {trending.map((r) => (
            <Link key={r.id} href={`/radar?q=${encodeURIComponent(r.title)}`} className="flex items-center gap-2 border-t border-white/10 py-2.5">
              <span className="ltr min-w-0 flex-1 truncate text-start font-mono text-[12.5px]">{r.title}</span>
              <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-star">
                <StarIcon width={12} height={12} />
                {formatCount(r.stars ?? 0)}
              </span>
            </Link>
          ))}
        </section>
      )}
      {releases.length > 0 && (
        <section className="card p-5">
          <h2 className="mb-2 text-[16px] font-bold">إصدارات جديدة</h2>
          {releases.map((r) => (
            <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 border-t border-line py-2 text-[13px]">
              <span className="ltr min-w-0 flex-1 truncate text-start font-mono">{r.repo}</span>
              <span className="ltr font-mono text-muted">{r.tag}</span>
            </a>
          ))}
          <Link href="/radar" className="mt-2 inline-block text-[13px] font-semibold text-accent">
            كل الرادار
          </Link>
        </section>
      )}
      {next.length > 0 && (
        <section className="card p-5">
          <h2 className="mb-2 text-[16px] font-bold">كمّل الأساسيات</h2>
          {next.map((e) => (
            <Link key={e.id} href={`/item/${e.id}`} className="flex items-center gap-2 border-t border-line py-2.5 text-[14px]">
              <span className="min-w-0 flex-1 truncate">{e.title.split(":")[0]}</span>
              <span className={`text-[12px] ${e.pricing?.model === "paid" ? "text-paid-ink" : e.pricing?.model === "freemium" ? "text-star-ink" : "text-ok-ink"}`}>
                {e.pricing?.model === "paid" ? "مدفوع" : e.pricing?.model === "freemium" ? "فيه مجاني" : "مجاني"}
              </span>
            </Link>
          ))}
        </section>
      )}
    </aside>
  );
}

function EmptyState({ v, filtering, clear, showAll }: { v: string; filtering: boolean; clear: () => void; showAll: () => void }) {
  if (filtering)
    return (
      <Empty
        title="مفيش نتايج"
        body="مفيش حاجة بالفلاتر دي."
        action={<button type="button" onClick={clear} className="rounded-xl bg-ink px-4 py-2 text-[14.5px] font-semibold text-ground">امسح الفلاتر</button>}
      />
    );
  if (v === "new")
    return (
      <Empty
        title="خلّصت كل الجديد"
        body="مفيش حاجة لسه مشفتهاش. الملخص الجاي هيوصل بكرة الصبح، ولحد ما يوصل بص على الرادار أو الأساسيات."
        action={<button type="button" onClick={showAll} className="rounded-xl bg-ink px-4 py-2 text-[14.5px] font-semibold text-ground">اعرض الكل</button>}
      />
    );
  if (v === "fav") return <Empty title="مفيش مفضلة لسه" body="دوس على علامة الحفظ في أي حاجة عايز ترجعلها بعدين." />;
  if (v === "seen") return <Empty title="مشفتش حاجة لسه" body="اللي تعلّمه إنك شوفته أو جربته هيظهر هنا." />;
  return <Empty title="لسه مفيش ملخصات" body="أول ملخص هيوصل لما المهمة اليومية تشتغل." />;
}
