"use client";

import Link from "next/link";
import { memo } from "react";
import { useLocale } from "./LocaleProvider";
import { useApp } from "./AppContext";
import type { FeedItem, RepoStats } from "@/lib/types";
import { BookmarkIcon, CheckIcon, ShareIcon } from "./icons";
import { CodeBox, PriceChip, RepoLine, secStyle } from "./bits";

type Props = {
  item: FeedItem;
  stats?: RepoStats;
  seen: boolean;
  fav: boolean;
  onSeen: (id: string, on: boolean) => void;
  onFav: (id: string, on: boolean) => void;
  onShare: (item: FeedItem) => void;
  /** Compact rows for the library list. */
  compact?: boolean;
};

function ItemCardBase({
  item,
  stats,
  seen,
  fav,
  onSeen,
  onFav,
  onShare,
  compact,
}: Props) {
  const { t, tx } = useLocale();
  const guest = useApp().user.guest;
  const section = tx.SECTION_BY_ID[item.section];
  const hot = item.importance === 3;
  const detail = `/item/${item.id}`;

  if (compact) {
    return (
      <article
        style={secStyle(item.section)}
        className={`card flex min-w-0 gap-3 p-3.5 ${seen ? "opacity-75" : ""}`}
      >
        <Link href={detail} className="flex min-w-0 flex-1 gap-3">
          <span
            className="sec-soft sec-fg grid size-11 shrink-0 place-items-center rounded-xl font-mono text-[14px] font-medium"
            aria-hidden
          >
            {(item.repo ?? item.title)
              .replace(/^.*\//, "")
              .slice(0, 2)
              .toLowerCase()}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[15.5px] font-bold leading-6">
                {item.title.split(":")[0]}
              </span>
              {hot && (
                <span className="rounded-full bg-star-soft px-2 py-px text-[11.5px] font-semibold text-star-ink">
                  {t.card.startHere}
                </span>
              )}
            </span>
            {item.repo && (
              <span className="ltr truncate text-start font-mono text-[12px] text-faint">
                {item.repo}
              </span>
            )}
            <span className="line-clamp-2 text-[13.5px] leading-[22px] text-muted">
              {item.summary}
            </span>
            <span className="mt-1.5 flex flex-wrap items-center gap-2">
              <PriceChip pricing={item.pricing} />
              <span className="text-[12px] text-faint">
                {tx.KIND_LABEL[item.kind] ?? item.kind}
              </span>
            </span>
          </span>
        </Link>
        {!guest && (
          <button
            type="button"
            onClick={() => onSeen(item.id, !seen)}
            aria-pressed={seen}
            aria-label={seen ? t.card.markUntried : t.card.markTried}
            title={seen ? t.card.tried : t.card.markTried}
            className={`grid size-8 shrink-0 place-items-center self-start rounded-full ${
              seen
                ? "bg-ink text-ground"
                : "shadow-[inset_0_0_0_1.5px_var(--line)] text-transparent hover:text-faint"
            }`}
          >
            <CheckIcon width={15} height={15} strokeWidth={2.4} />
          </button>
        )}
      </article>
    );
  }

  return (
    <article
      style={secStyle(item.section)}
      className={`card flex min-w-0 flex-col p-4 sm:p-5 ${seen ? "opacity-80" : ""}`}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[12.5px]">
        {!guest && (
          <button
            type="button"
            onClick={() => onSeen(item.id, !seen)}
            aria-label={seen ? t.card.markNew : t.card.markSeen}
            className="-m-2 grid size-6 place-items-center p-2"
          >
            <span
              className={`block size-2 rounded-full ${seen ? "shadow-[inset_0_0_0_1.5px_var(--faint)]" : "unseen-dot"}`}
            />
          </button>
        )}
        <span className="sec-fg font-semibold">{section?.short}</span>
        <span className="text-faint">
          {tx.KIND_LABEL[item.kind] ?? item.kind}
        </span>
        <PriceChip pricing={item.pricing} />
        {hot && (
          <span className="ms-auto rounded-full bg-star-soft px-2 py-0.5 font-semibold text-star-ink">
            {item.essential ? t.card.startHere : t.card.mustSee}
          </span>
        )}
      </div>

      {item.repo && (
        <div className="mt-3">
          <RepoLine repo={item.repo} stats={stats} />
        </div>
      )}

      <h3 className="mt-2.5 text-[17px] font-bold leading-[27px]">
        <Link
          href={detail}
          className="hover:underline decoration-line decoration-2 underline-offset-4"
        >
          {item.title}
        </Link>
      </h3>
      <p className="mt-1.5 text-[14.5px] leading-[24px] text-muted">
        {item.summary}
      </p>

      {item.why && (
        <p className="sec-soft mt-3 rounded-xl px-3.5 py-2.5 text-[14px] leading-[23px] text-ink-2">
          <b className="sec-fg font-semibold">{t.card.why}</b>
          {item.why}
        </p>
      )}

      {item.install?.[0] && (
        <div className="mt-3">
          <CodeBox cmd={item.install[0].cmd} />
        </div>
      )}

      <div className="min-h-3 flex-1" />
      <div className="flex items-center gap-1 border-t border-line pt-2.5">
        {!guest && (
          <>
            <button
              type="button"
              onClick={() => onSeen(item.id, !seen)}
              aria-pressed={seen}
              className={`inline-flex h-9 items-center gap-1.5 rounded-[10px] px-2.5 text-[13px] hover:bg-sunken ${
                seen ? "text-ink" : "text-muted"
              }`}
            >
              <CheckIcon width={17} height={17} />
              {seen ? t.card.seen : t.card.markSeen}
            </button>
            <button
              type="button"
              onClick={() => onFav(item.id, !fav)}
              aria-pressed={fav}
              aria-label={fav ? t.card.removeFav : t.card.addFav}
              className={`grid size-9 place-items-center rounded-[10px] hover:bg-sunken ${fav ? "text-star" : "text-muted"}`}
            >
              <BookmarkIcon filled={fav} width={18} height={18} />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => onShare(item)}
          aria-label={t.card.share}
          className="grid size-9 place-items-center rounded-[10px] text-muted hover:bg-sunken"
        >
          <ShareIcon width={17} height={17} />
        </button>
        <Link
          href={detail}
          className="ms-auto inline-flex h-9 items-center rounded-[10px] px-3 text-[13px] font-semibold text-accent hover:bg-accent-soft"
        >
          {t.card.details}
        </Link>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onSeen(item.id, true)}
          className="inline-flex h-9 items-center rounded-[10px] bg-ink px-3.5 text-[13px] font-semibold text-ground"
        >
          {t.card.open}
        </a>
      </div>
    </article>
  );
}

export const ItemCard = memo(ItemCardBase);
