"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { Criterion, Tool, Track, Verdict } from "@/lib/research";
import { useLocale } from "../LocaleProvider";

export const CATEGORY_COLOR: Record<string, string> = {
  sdlc: "#2f5bff",
  runtime: "#7c4dff",
  eval: "#e8590c",
  sandbox: "#0c8599",
  ops: "#2b8a3e",
  cloud: "#868e96",
  context: "#c2255c",
  standards: "#e67700",
};
export const catStyle = (id: string) =>
  ({ "--c": CATEGORY_COLOR[id] ?? "#5c7cfa" }) as CSSProperties;

const VERDICT_TONE: Record<Verdict, string> = {
  adopt: "bg-ok text-ok-ink",
  "adopt-part": "bg-accent-soft text-accent-ink",
  benchmark: "bg-star-soft text-star-ink",
  inspire: "bg-sunken text-ink-2",
  watch: "bg-sunken text-muted",
  avoid: "bg-paid text-paid-ink",
};

export function VerdictChip({ track, verdict, long }: { track: Track; verdict: Verdict; long?: boolean }) {
  const { locale } = useLocale();
  const label = track.verdicts[verdict]?.[locale] ?? verdict;
  return (
    <span
      title={label}
      className={`inline-flex items-center whitespace-nowrap rounded-md px-2 py-px text-[12.5px] font-semibold ${VERDICT_TONE[verdict]}`}
    >
      {long ? label : verdictShort(verdict, locale)}
    </span>
  );
}

export function verdictShort(v: Verdict, locale: "en" | "ar") {
  const en: Record<Verdict, string> = {
    adopt: "Adopt",
    "adopt-part": "Reuse part",
    benchmark: "Benchmark",
    inspire: "Learn from",
    watch: "Watch",
    avoid: "Avoid",
  };
  const ar: Record<Verdict, string> = {
    adopt: "نعتمده",
    "adopt-part": "نأخذ جزءًا",
    benchmark: "نقارنه",
    inspire: "نتعلم منه",
    watch: "نراقبه",
    avoid: "نتجنبه",
  };
  return (locale === "ar" ? ar : en)[v];
}

export function KindChip({ kind }: { kind: Tool["kind"] }) {
  const { t } = useLocale();
  const tone =
    kind === "commercial" ? "bg-paid text-paid-ink" : kind === "open-core" ? "bg-star-soft text-star-ink" : "bg-ok text-ok-ink";
  return (
    <span className={`inline-flex whitespace-nowrap rounded-md px-2 py-px text-[12px] font-semibold ${tone}`}>
      {t.research.kind[kind]}
    </span>
  );
}

export function CategoryTag({ track, id }: { track: Track; id: string }) {
  const { locale } = useLocale();
  const c = track.categories.find((x) => x.id === id);
  return (
    <span style={catStyle(id)} className="sec-fg inline-flex items-baseline gap-1.5 text-[12.5px] font-medium leading-5">
      <span className="sec-bg size-2 shrink-0 translate-y-[1px] rounded-full" />
      {c ? c.name[locale] : id}
    </span>
  );
}

export function ScoreBadge({ total }: { total: number }) {
  const { f } = useLocale();
  const tone = total >= 75 ? "text-ok-ink" : total >= 55 ? "text-ink" : "text-muted";
  return <span className={`font-display text-[18px] font-semibold tabular-nums ${tone}`}>{f.num(total)}</span>;
}

/** A ring gauge for a 0–100 score. */
export function ScoreDial({ total, size = 120, night }: { total: number; size?: number; night?: boolean }) {
  const { f } = useLocale();
  const r = 44;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-label={`${total}/100`} role="img">
      <circle cx="50" cy="50" r={r} fill="none" stroke={night ? "rgb(255 255 255 / 0.12)" : "var(--sunken)"} strokeWidth="7" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="var(--signal)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${(total / 100) * c} ${c}`}
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="56" textAnchor="middle" fontSize="26" fontWeight="600" fill="currentColor" style={{ fontFamily: "var(--font-display)" }}>
        {f.num(total)}
      </text>
    </svg>
  );
}

export function CriteriaBars({ criteria, scores }: { criteria: Criterion[]; scores: Record<string, number> }) {
  const { locale, f } = useLocale();
  return (
    <ul className="flex flex-col gap-2.5">
      {criteria.map((c) => {
        const v = scores[c.id] ?? 0;
        return (
          <li key={c.id} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
            <span className="text-[13.5px] text-ink-2">
              {c.name[locale]} <span className="text-faint">×{f.num(c.weight)}</span>
            </span>
            <span className="text-[13px] font-semibold tabular-nums">{f.num(v)}/5</span>
            <span className="col-span-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= v ? "bg-accent" : "bg-sunken"}`} />
              ))}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function Panel({ title, children, className = "", aside }: { title?: ReactNode; children: ReactNode; className?: string; aside?: ReactNode }) {
  return (
    <section className={`rounded-[22px] border border-line bg-surface p-5 sm:p-7 ${className}`}>
      {title && (
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="font-display text-[19px] font-semibold tracking-[-0.01em]">{title}</h2>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

/** Seven cells, one per criterion, shaded by the 1–5 score. */
export function CriteriaStrip({ criteria, scores }: { criteria: Criterion[]; scores: Record<string, number> }) {
  const { locale } = useLocale();
  return (
    <span className="inline-flex gap-[3px]" aria-hidden>
      {criteria.map((c) => {
        const v = scores[c.id] ?? 0;
        return (
          <span
            key={c.id}
            title={`${c.name[locale]}: ${v}/5`}
            className="h-4 w-3 rounded-[3px]"
            style={{ background: `color-mix(in oklab, var(--lens) ${v * 20}%, var(--sunken))` }}
          />
        );
      })}
    </span>
  );
}

/** A bulleted list of English research text (direction follows the text). */
export function Bullets({ items, tone = "dot" }: { items: string[]; tone?: "dot" | "plus" | "minus" | "gap" }) {
  const mark = { dot: "bg-faint", plus: "bg-ok-ink", minus: "bg-paid-ink", gap: "bg-star" }[tone];
  return (
    <ul className="flex flex-col gap-2">
      {items.map((x, i) => (
        <li key={i} dir="auto" className="flex gap-2.5 text-[14.5px] leading-6 text-ink-2">
          <span className={`mt-[9px] size-1.5 shrink-0 rounded-full ${mark}`} />
          <span>{x}</span>
        </li>
      ))}
    </ul>
  );
}

export function TabLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={`relative whitespace-nowrap px-1 pb-3.5 pt-2 text-[14.5px] transition-colors ${
        active ? "font-semibold text-night-ink" : "text-night-muted hover:text-night-ink"
      }`}
    >
      {children}
      {active && <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-t-full bg-signal" />}
    </Link>
  );
}
