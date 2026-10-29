"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { APP } from "@/lib/config";
import { SECTIONS, SECTION_BY_ID, type SectionId } from "@/lib/sections";
import { matches } from "@/lib/search";
import type { FeedItem, FeedPayload } from "@/lib/types";
import { ItemRow } from "./ItemRow";
import { useUserState } from "./useUserState";
import { CloseIcon, LogoutIcon, Mark, MoonIcon, SearchIcon, SunIcon } from "./icons";

type View = "new" | "all" | "fav" | "seen";
type Filters = { view: View; section: SectionId | null; hot: boolean; q: string };

const VIEWS: { id: View; label: string }[] = [
  { id: "new", label: "جديد" },
  { id: "all", label: "الكل" },
  { id: "fav", label: "المفضلة" },
  { id: "seen", label: "شوفته" },
];

const nf = new Intl.NumberFormat("ar-EG");
const dayFmt = new Intl.DateTimeFormat("ar-EG", { weekday: "long", day: "numeric", month: "long" });
const yearFmt = new Intl.DateTimeFormat("ar-EG", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

function localISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayLabel(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (iso === localISO(today)) return { main: "النهارده", sub: dayFmt.format(d) };
  if (iso === localISO(yesterday)) return { main: "امبارح", sub: dayFmt.format(d) };
  const fmt = d.getFullYear() === today.getFullYear() ? dayFmt : yearFmt;
  return { main: fmt.format(d), sub: null };
}

function readFilters(): Filters {
  const p = new URLSearchParams(window.location.search);
  const view = (p.get("v") as View) ?? "new";
  const section = p.get("s") as SectionId | null;
  return {
    view: VIEWS.some((v) => v.id === view) ? view : "new",
    section: section && SECTION_BY_ID[section] ? section : null,
    hot: p.get("hot") === "1",
    q: p.get("q") ?? "",
  };
}

function writeFilters(f: Filters) {
  const p = new URLSearchParams();
  if (f.view !== "new") p.set("v", f.view);
  if (f.section) p.set("s", f.section);
  if (f.hot) p.set("hot", "1");
  if (f.q.trim()) p.set("q", f.q.trim());
  const qs = p.toString();
  window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
}

type Toast = { text: string; undo?: () => void } | null;

export function Feed() {
  const [feed, setFeed] = useState<FeedPayload | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [filters, setFilters] = useState<Filters>({ view: "new", section: null, hot: false, q: "" });
  const [query, setQuery] = useState(""); // what's typed; filters.q follows it
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  // Items marked while looking at a list stay put until the filters change,
  // so the row you just touched doesn't vanish under your finger.
  const [pinned, setPinned] = useState<Set<string>>(() => new Set());
  const searchRef = useRef<HTMLInputElement>(null);
  const state = useUserState();

  useEffect(() => {
    const f = readFilters();
    setFilters(f);
    setQuery(f.q);
    setTheme((document.documentElement.dataset.theme as "light" | "dark") ?? null);

    fetch("/api/items")
      .then((r) => {
        if (r.status === 401) {
          window.location.href = "/login";
          return null;
        }
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => data && setFeed(data))
      .catch(() => setLoadError(true));

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Debounce search typing into the filters.
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => (f.q === query ? f : { ...f, q: query })), 150);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    writeFilters(filters);
    setPinned(new Set());
  }, [filters]);

  // "/" focuses search, Escape clears it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "Escape" && document.activeElement === searchRef.current) {
        setQuery("");
        searchRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const { seen, fav, set } = state;
  const items = useMemo(() => feed?.items ?? [], [feed]);

  const unseenBySection = useMemo(() => {
    const counts = new Map<SectionId | "all", number>([["all", 0]]);
    for (const it of items) {
      if (seen.has(it.id)) continue;
      counts.set(it.section, (counts.get(it.section) ?? 0) + 1);
      counts.set("all", (counts.get("all") ?? 0) + 1);
    }
    return counts;
  }, [items, seen]);

  const visible = useMemo(() => {
    return items.filter((it) => {
      if (filters.section && it.section !== filters.section) return false;
      if (filters.hot && it.importance < 3) return false;
      if (!matches(it, filters.q)) return false;
      if (pinned.has(it.id)) return true;
      switch (filters.view) {
        case "new":
          return !seen.has(it.id);
        case "fav":
          return fav.has(it.id);
        case "seen":
          return seen.has(it.id);
        default:
          return true;
      }
    });
  }, [items, filters, seen, fav, pinned]);

  const groups = useMemo(() => {
    const byDay = new Map<string, FeedItem[]>();
    for (const it of visible) {
      const list = byDay.get(it.date) ?? [];
      list.push(it);
      byDay.set(it.date, list);
    }
    for (const list of byDay.values()) list.sort((a, b) => b.importance - a.importance);
    return [...byDay.entries()];
  }, [visible]);

  const dayItems = useMemo(() => {
    const m = new Map<string, FeedItem[]>();
    for (const it of items) m.set(it.date, [...(m.get(it.date) ?? []), it]);
    return m;
  }, [items]);

  const headlineOf = useMemo(
    () => new Map(feed?.days.map((d) => [d.date, d.headline]) ?? []),
    [feed],
  );

  const pin = useCallback((ids: string[]) => {
    setPinned((p) => {
      const n = new Set(p);
      ids.forEach((id) => n.add(id));
      return n;
    });
  }, []);

  const onSeen = useCallback(
    (id: string, on: boolean) => {
      pin([id]);
      set("seen", [id], on);
    },
    [set, pin],
  );
  const onFav = useCallback(
    (id: string, on: boolean) => {
      pin([id]);
      set("fav", [id], on);
    },
    [set, pin],
  );
  const onTag = useCallback((tag: string) => {
    setQuery(tag);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  const onShare = useCallback(async (item: FeedItem) => {
    const data = { title: item.title, text: item.summary, url: item.url };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(item.url);
      setToast({ text: "اتنسخ اللينك." });
    } catch {}
  }, []);

  const markAllSeen = (ids: string[]) => {
    const fresh = ids.filter((id) => !seen.has(id));
    if (fresh.length === 0) return;
    pin(fresh);
    set("seen", fresh, true);
    setToast({
      text: `علّمت ${nf.format(fresh.length)} حاجة إنك شوفتها.`,
      undo: () => set("seen", fresh, false),
    });
  };

  const toggleTheme = () => {
    const current =
      theme ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("marsad-theme", next);
    } catch {}
    setTheme(next);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    try {
      localStorage.removeItem("marsad-state-cache");
    } catch {}
    window.location.href = "/login";
  };

  const totalUnseen = unseenBySection.get("all") ?? 0;
  const filtering = filters.section || filters.hot || filters.q;
  const update = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));

  const sectionButton = (id: SectionId | null, name: string, count: number, compact: boolean) => {
    const active = filters.section === id;
    const hue = id ? SECTION_BY_ID[id].hue : null;
    return (
      <button
        key={id ?? "all"}
        type="button"
        onClick={() => update({ section: id })}
        aria-pressed={active}
        style={hue !== null ? ({ "--h": hue } as CSSProperties) : undefined}
        className={
          compact
            ? `inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-[14px] ${
                active ? "border-ink bg-ink text-sky" : "border-line bg-surface text-ink"
              }`
            : `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-[14.5px] ${
                active ? "bg-surface font-medium shadow-[0_0_0_1px_var(--line)]" : "hover:bg-surface/60"
              }`
        }
      >
        {hue !== null ? (
          <span className="sec-bg size-2 shrink-0 rounded-full" />
        ) : (
          <span className="size-2 shrink-0 rounded-full bg-ink" />
        )}
        <span className={compact ? "" : "flex-1"}>{name}</span>
        {count > 0 && (
          <span className={`tabular-nums text-[12.5px] ${active && compact ? "text-sky/80" : "text-faint"}`}>
            {nf.format(count)}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="mx-auto w-full max-w-6xl lg:grid lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-10 lg:px-6">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:block">
        <div className="sticky top-0 flex max-h-dvh flex-col gap-6 overflow-y-auto py-6">
          <div className="flex items-center gap-2.5">
            <Mark size={32} />
            <div>
              <div className="text-[22px] font-semibold leading-7">{APP.name}</div>
              <div className="text-[12.5px] leading-5 text-muted">{APP.tagline}</div>
            </div>
          </div>

          <nav aria-label="الأقسام" className="flex flex-col gap-0.5">
            {sectionButton(null, "كل الأقسام", totalUnseen, false)}
            {SECTIONS.map((s) => sectionButton(s.id, s.name, unseenBySection.get(s.id) ?? 0, false))}
          </nav>

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-[14.5px] hover:bg-surface/60">
            المهم بس
            <input
              type="checkbox"
              checked={filters.hot}
              onChange={(e) => update({ hot: e.target.checked })}
              className="size-4 accent-[var(--star)]"
            />
          </label>

          <div className="mt-auto flex items-center gap-1 border-t border-line pt-4 text-[13.5px] text-muted">
            <span className="flex-1 truncate">{state.user ? `أهلاً ${state.user}` : ""}</span>
            <button type="button" onClick={toggleTheme} className="rounded-lg p-2 hover:bg-surface" aria-label="غيّر الثيم">
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
            <button type="button" onClick={logout} className="rounded-lg p-2 hover:bg-surface" aria-label="خروج">
              <LogoutIcon className="-scale-x-100" />
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 pb-24">
        {/* Top bar */}
        <div className="sticky top-0 z-20 bg-sky/90 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-md lg:px-0 lg:pt-6">
          <div className="mb-3 flex items-center gap-2.5 lg:hidden">
            <Mark size={28} />
            <span className="text-[20px] font-semibold">{APP.name}</span>
            <span className="flex-1" />
            <button type="button" onClick={toggleTheme} className="rounded-lg p-2 text-muted" aria-label="غيّر الثيم">
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
            <button type="button" onClick={logout} className="rounded-lg p-2 text-muted" aria-label="خروج">
              <LogoutIcon className="-scale-x-100" />
            </button>
          </div>

          <div className="relative">
            <SearchIcon className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-faint" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="دوّر في كل حاجة اتجمعت…"
              aria-label="بحث"
              enterKeyHint="search"
              className="h-12 w-full rounded-xl border border-line bg-surface pe-11 ps-11 text-[15.5px] outline-none placeholder:text-faint focus:border-[var(--focus)] [&::-webkit-search-cancel-button]:hidden"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute end-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted hover:bg-sunken"
                aria-label="امسح البحث"
              >
                <CloseIcon width={18} height={18} />
              </button>
            ) : (
              <kbd className="absolute end-3 top-1/2 hidden -translate-y-1/2 rounded border border-line px-1.5 text-[12px] text-faint sm:block">
                /
              </kbd>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div role="tablist" aria-label="العرض" className="flex rounded-xl bg-sunken p-1">
              {VIEWS.map((v) => {
                const active = filters.view === v.id;
                const count =
                  v.id === "new" ? totalUnseen : v.id === "fav" ? fav.size : null;
                return (
                  <button
                    key={v.id}
                    role="tab"
                    aria-selected={active}
                    type="button"
                    onClick={() => update({ view: v.id })}
                    className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[14px] sm:px-4 ${
                      active ? "bg-surface font-medium text-ink shadow-[0_1px_2px_rgb(0_0_0/0.08)]" : "text-muted"
                    }`}
                  >
                    {v.label}
                    {count ? <span className="ms-1.5 tabular-nums text-faint">{nf.format(count)}</span> : null}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => update({ hot: !filters.hot })}
              aria-pressed={filters.hot}
              className={`ms-auto whitespace-nowrap rounded-xl border px-3 py-2 text-[13.5px] lg:hidden ${
                filters.hot ? "border-star bg-star-soft text-ink" : "border-line text-muted"
              }`}
            >
              المهم بس
            </button>
          </div>
        </div>

        {/* Section chips (mobile / tablet) */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
          {sectionButton(null, "الكل", totalUnseen, true)}
          {SECTIONS.map((s) => sectionButton(s.id, s.name, unseenBySection.get(s.id) ?? 0, true))}
        </div>

        {state.error && (
          <p role="status" className="mx-4 mb-3 rounded-lg bg-star-soft px-3.5 py-2.5 text-[14px] lg:mx-0">
            {state.error}
          </p>
        )}
        {!state.persistent && state.ready && (
          <p className="mx-4 mb-3 rounded-lg bg-sunken px-3.5 py-2.5 text-[13.5px] text-muted lg:mx-0">
            التخزين مش متوصل، فالـ Seen والمفضلة هيضيعوا مع أي deploy جديد. ضيف Upstash Redis من Vercel.
          </p>
        )}

        {/* Feed */}
        {!feed && !loadError && <Skeleton />}
        {loadError && (
          <Empty
            title="مقدرتش أحمّل المحتوى"
            body="اتأكد إن النت شغال وجرّب تاني."
            action={{ label: "حمّل تاني", run: () => window.location.reload() }}
          />
        )}

        {feed && groups.length === 0 && (
          <EmptyFor
            filters={filters}
            hasItems={items.length > 0}
            clear={() => {
              setQuery("");
              setFilters({ view: "all", section: null, hot: false, q: "" });
            }}
            showAll={() => update({ view: "all" })}
          />
        )}

        <div className="flex flex-col gap-8 px-2 sm:px-4 lg:px-0">
          {groups.map(([date, list]) => {
            const label = dayLabel(date);
            const all = dayItems.get(date) ?? [];
            const unseenCount = all.filter((i) => !seen.has(i.id)).length;
            const headline = headlineOf.get(date);
            return (
              <section key={date} aria-labelledby={`day-${date}`}>
                <header className="mb-3 px-2 sm:px-1">
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <h2 id={`day-${date}`} className="text-[21px] font-semibold leading-8">
                      {label.main}
                    </h2>
                    {label.sub && <span className="text-[14px] text-muted">{label.sub}</span>}
                  </div>
                  {headline && !filtering && (
                    <p className="mt-1 max-w-[68ch] text-[15px] leading-7 text-muted">{headline}</p>
                  )}
                  <div className="mt-2.5 flex items-center gap-3">
                    <div
                      className="flex min-w-0 flex-1 flex-wrap gap-[5px]"
                      role="img"
                      aria-label={`${nf.format(unseenCount)} من ${nf.format(all.length)} لسه مشفتهمش`}
                    >
                      {all.map((i) => (
                        <span
                          key={i.id}
                          className={`block size-[7px] rounded-full ${seen.has(i.id) ? "star-dim" : "star-lit !shadow-none"}`}
                        />
                      ))}
                    </div>
                    <span className="whitespace-nowrap text-[13px] tabular-nums text-faint">
                      {unseenCount === 0
                        ? "شوفت اليوم كله"
                        : `${nf.format(unseenCount)} من ${nf.format(all.length)} لسه`}
                    </span>
                    {unseenCount > 0 && (
                      <button
                        type="button"
                        onClick={() => markAllSeen(all.map((i) => i.id))}
                        className="whitespace-nowrap rounded-lg px-2.5 py-1 text-[13px] text-muted hover:bg-surface hover:text-ink"
                      >
                        علّم اليوم كله
                      </button>
                    )}
                  </div>
                </header>

                <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                  {list.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      seen={seen.has(item.id)}
                      fav={fav.has(item.id)}
                      onSeen={onSeen}
                      onFav={onFav}
                      onTag={onTag}
                      onShare={onShare}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      {toast && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-[max(16px,env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-md items-center gap-3 rounded-xl bg-ink px-4 py-3 text-[14.5px] text-sky shadow-lg"
        >
          <span className="flex-1">{toast.text}</span>
          {toast.undo && (
            <button
              type="button"
              onClick={() => {
                toast.undo?.();
                setToast(null);
              }}
              className="rounded-lg px-2 py-1 font-medium text-star"
            >
              تراجع
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 lg:px-0" aria-hidden>
      <div className="h-7 w-40 animate-pulse rounded-lg bg-sunken" />
      <div className="h-[420px] animate-pulse rounded-2xl bg-surface" />
    </div>
  );
}

function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { label: string; run: () => void };
}) {
  return (
    <div className="mx-4 mt-6 flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-14 text-center lg:mx-0">
      <Mark size={40} />
      <h2 className="mt-4 text-[18px] font-semibold">{title}</h2>
      <p className="mt-1 max-w-sm text-[15px] text-muted">{body}</p>
      {action && (
        <button
          type="button"
          onClick={action.run}
          className="mt-5 rounded-xl bg-ink px-4 py-2 text-[14.5px] font-medium text-sky"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

function EmptyFor({
  filters,
  hasItems,
  clear,
  showAll,
}: {
  filters: Filters;
  hasItems: boolean;
  clear: () => void;
  showAll: () => void;
}) {
  if (!hasItems)
    return (
      <Empty
        title="لسه مفيش ملخصات"
        body="أول ملخص هيوصل هنا لما المهمة اليومية تشتغل."
      />
    );
  if (filters.q || filters.section || filters.hot)
    return (
      <Empty
        title="مفيش نتايج"
        body={filters.q ? `مفيش حاجة فيها «${filters.q}» بالفلاتر دي.` : "مفيش حاجة بالفلاتر دي."}
        action={{ label: "امسح الفلاتر", run: clear }}
      />
    );
  if (filters.view === "new")
    return (
      <Empty
        title="خلّصت كل الجديد"
        body="مفيش حاجة لسه مشفتهاش. الملخص الجاي هيوصل بكرة الصبح."
        action={{ label: "اعرض الكل", run: showAll }}
      />
    );
  if (filters.view === "fav")
    return <Empty title="مفيش مفضلة لسه" body="دوس على «مفضلة» في أي حاجة عايز ترجعلها بعدين." />;
  return <Empty title="مشفتش حاجة لسه" body="اللي تعلّمه إنك شوفته هيظهر هنا." />;
}
