"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { SECTION_META, type SectionId } from "@/lib/sections";
import type { Item, RepoStats } from "@/lib/types";
import { monogram } from "@/lib/format";
import { useLocale } from "./LocaleProvider";
import { CheckIcon, CopyIcon, StarIcon } from "./icons";

export const secStyle = (id: SectionId) => ({ "--c": SECTION_META[id]?.color ?? "#5c7cfa" }) as CSSProperties;

export function PriceChip({ pricing, size = "sm" }: { pricing: Item["pricing"]; size?: "sm" | "md" }) {
  const { t, tx } = useLocale();
  if (!pricing) return null;
  const tone =
    pricing.model === "paid"
      ? "bg-paid text-paid-ink"
      : pricing.model === "freemium"
        ? "bg-star-soft text-star-ink"
        : "bg-ok text-ok-ink";
  const label =
    pricing.model === "oss" ? t.price.ossFull : tx.PRICING_LABEL[pricing.model] ?? pricing.model;
  return (
    <span
      className={`inline-flex items-center rounded-md font-semibold whitespace-nowrap ${tone} ${
        size === "md" ? "px-2.5 py-1 text-[13.5px]" : "px-2 py-px text-[12px]"
      }`}
    >
      {label}
    </span>
  );
}

export function CodeBox({ cmd, label }: { cmd: string; label?: string }) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };
  const multiline = cmd.includes("\n");
  return (
    <div>
      {label && <p className="mb-1.5 text-[13.5px] text-muted">{label}</p>}
      <div className="ltr flex items-start gap-2 rounded-xl bg-code px-3 py-2.5 text-code-ink">
        {!multiline && <span className="font-mono text-[13px] leading-6 text-code-muted">$</span>}
        <code
          className={`min-w-0 flex-1 font-mono text-[12.5px] leading-6 ${
            multiline ? "whitespace-pre overflow-x-auto" : "break-all"
          }`}
        >
          {cmd}
        </code>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? t.code.copied : t.code.copy}
          className="grid size-7 shrink-0 place-items-center rounded-lg bg-code-btn text-code-ink/80 hover:text-code-ink"
        >
          {copied ? <CheckIcon width={15} height={15} /> : <CopyIcon width={15} height={15} />}
        </button>
      </div>
    </div>
  );
}

export function RepoLine({ repo, stats, size = "sm" }: { repo: string; stats?: RepoStats; size?: "sm" | "lg" }) {
  const { f } = useLocale();
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`sec-soft sec-fg grid shrink-0 place-items-center font-mono font-medium ${
          size === "lg" ? "size-14 rounded-2xl text-[18px]" : "size-9 rounded-[10px] text-[13px]"
        }`}
        aria-hidden
      >
        {monogram(repo)}
      </span>
      <div className="min-w-0">
        <div className={`ltr truncate text-start font-mono font-medium ${size === "lg" ? "text-[14px] text-muted" : "text-[14px]"}`}>
          {repo}
        </div>
        {stats && size === "sm" && (
          <div className="flex flex-wrap items-center gap-x-3 text-[12.5px] text-muted">
            <span className="inline-flex items-center gap-1">
              <StarIcon width={13} height={13} /> {f.count(stats.stars)}
            </span>
            {stats.language && <span className="ltr">{stats.language}</span>}
            {stats.release && <span className="ltr">{stats.release.tag}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-line px-6 py-14 text-center">
      <svg width="48" height="48" viewBox="0 0 64 64" aria-hidden>
        <path
          d="M5 32C13.5 18.5 22.5 13 32 13s18.5 5.5 27 19c-8.5 13.5-17.5 19-27 19S13.5 45.5 5 32Z"
          fill="none"
          stroke="var(--faint)"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <circle cx="32" cy="32" r="11" fill="var(--faint)" opacity="0.5" />
        <circle cx="37.5" cy="26.5" r="3.6" fill="var(--star)" />
      </svg>
      <h2 className="mt-4 text-[18px] font-semibold">{title}</h2>
      <p className="mt-1 max-w-sm text-[15px] text-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      <div className="h-8 w-44 animate-pulse rounded-lg bg-sunken" />
      <div className="h-48 animate-pulse rounded-[20px] bg-surface" />
      <div className="h-48 animate-pulse rounded-[20px] bg-surface" />
    </div>
  );
}
