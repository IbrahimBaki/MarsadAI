"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocale } from "./LocaleProvider";
import type { Filters } from "./useFilters";
import { BoltIcon, CloseIcon, SearchIcon } from "./icons";

type Props = {
  filters: Filters;
  update: (patch: Partial<Filters>) => void;
  placeholder: string;
  /** Kinds present in the current list, with counts. */
  kinds?: [string, number][];
  showPrice?: boolean;
  hotLabel?: string;
  tabs?: ReactNode;
};

export function FilterBar({ filters, update, placeholder, kinds, showPrice = true, hotLabel, tabs }: Props) {
  const { t, f, tx } = useLocale();
  const [q, setQ] = useState(filters.q);
  const ref = useRef<HTMLInputElement>(null);
  const latest = useRef(filters.q);

  // Keep the box in sync when the URL changes from elsewhere (e.g. a tag click).
  useEffect(() => {
    if (filters.q !== latest.current) {
      latest.current = filters.q;
      setQ(filters.q);
    }
  }, [filters.q]);

  useEffect(() => {
    if (q === latest.current) return;
    const t = setTimeout(() => {
      latest.current = q;
      update({ q });
    }, 200);
    return () => clearTimeout(t);
  }, [q, update]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const chip = (active: boolean) =>
    `inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] px-3 text-[13.5px] whitespace-nowrap ${
      active ? "bg-accent-soft font-semibold text-accent-ink" : "card !rounded-[10px] text-ink-2"
    }`;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <label className="card flex h-12 min-w-0 flex-[1_1_320px] items-center gap-2.5 !rounded-2xl px-4 text-faint focus-within:shadow-[0_0_0_2px_var(--accent)]">
          <SearchIcon />
          <input
            ref={ref}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setQ("")}
            placeholder={placeholder}
            aria-label={t.filter.search}
            enterKeyHint="search"
            className="min-w-0 flex-1 bg-transparent text-[15.5px] text-ink outline-none placeholder:text-faint [&::-webkit-search-cancel-button]:hidden"
          />
          {q ? (
            <button type="button" onClick={() => setQ("")} aria-label={t.filter.clear} className="rounded-lg p-1 hover:bg-sunken">
              <CloseIcon width={18} height={18} />
            </button>
          ) : (
            <kbd className="hidden rounded-md px-1.5 text-[12px] shadow-[inset_0_0_0_1px_var(--line)] sm:block">/</kbd>
          )}
        </label>
        {tabs}
      </div>

      <div className="no-scrollbar -mx-3 flex items-center gap-1.5 overflow-x-auto px-3 lg:mx-0 lg:flex-wrap lg:px-0">
        {hotLabel && (
          <button type="button" onClick={() => update({ hot: !filters.hot })} aria-pressed={filters.hot} className={chip(filters.hot)}>
            <BoltIcon width={15} height={15} className={filters.hot ? "" : "text-star"} />
            {hotLabel}
          </button>
        )}
        {showPrice && (
          <>
            {(
              [
                ["free", t.filter.free],
                ["freemium", t.filter.freemium],
                ["paid", t.filter.paid],
              ] as const
            ).map(([p, label]) => (
              <button
                key={p}
                type="button"
                onClick={() => update({ p: filters.p === p ? null : p })}
                aria-pressed={filters.p === p}
                className={chip(filters.p === p)}
              >
                {label}
              </button>
            ))}
            {kinds && kinds.length > 1 && <span className="mx-1 h-5 w-px shrink-0 bg-line" aria-hidden />}
          </>
        )}
        {kinds &&
          kinds.length > 1 &&
          kinds.map(([k, n]) => (
            <button
              key={k}
              type="button"
              onClick={() => update({ k: filters.k === k ? null : k })}
              aria-pressed={filters.k === k}
              className={chip(filters.k === k)}
            >
              {tx.KIND_LABEL[k] ?? k}
              <span className="text-[12px] text-faint">{f.num(n)}</span>
            </button>
          ))}
      </div>
    </div>
  );
}
