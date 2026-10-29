"use client";

import { memo, type CSSProperties } from "react";
import { SECTION_BY_ID } from "@/lib/sections";
import type { FeedItem, ItemKind } from "@/lib/types";
import { CheckIcon, ExternalIcon, ShareIcon, StarIcon } from "./icons";

const KIND_LABEL: Record<ItemKind, string> = {
  release: "إصدار جديد",
  repo: "ريبو",
  skill: "Skill",
  mcp: "MCP",
  model: "موديل",
  tool: "أداة",
  article: "مقال",
  video: "فيديو",
};

type Props = {
  item: FeedItem;
  seen: boolean;
  fav: boolean;
  onSeen: (id: string, on: boolean) => void;
  onFav: (id: string, on: boolean) => void;
  onTag: (tag: string) => void;
  onShare: (item: FeedItem) => void;
};

function ItemRowBase({ item, seen, fav, onSeen, onFav, onTag, onShare }: Props) {
  const section = SECTION_BY_ID[item.section];
  const style = { "--h": section?.hue ?? 220 } as CSSProperties;
  const hot = item.importance === 3;

  return (
    <article
      id={`item-${item.id}`}
      style={style}
      className={`relative px-4 py-5 sm:px-6 ${seen ? "opacity-[0.72]" : ""}`}
      aria-label={item.title}
    >
      <div className="flex items-start gap-3.5">
        <button
          type="button"
          onClick={() => onSeen(item.id, !seen)}
          className="mt-2 grid size-6 shrink-0 place-items-center rounded-full"
          aria-label={seen ? "رجّعه جديد" : "علّمه إني شوفته"}
          title={seen ? "رجّعه جديد" : "علّمه إني شوفته"}
        >
          <span className={`block size-2.5 rounded-full ${seen ? "star-dim" : "star-lit"}`} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] leading-5">
            <span className="sec-fg font-medium">{section?.name}</span>
            <span className="text-faint">{KIND_LABEL[item.kind] ?? item.kind}</span>
            <span className="ltr-chunk text-faint" dir="ltr">
              {item.source}
            </span>
            {hot && (
              <span className="rounded-full bg-star-soft px-2 py-px text-[12px] font-medium text-ink">
                لازم تشوفه
              </span>
            )}
          </div>

          <h3 className={`text-[17px] leading-7 ${hot ? "font-semibold" : "font-medium"}`}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onSeen(item.id, true)}
              className="decoration-line decoration-2 underline-offset-4 hover:underline"
            >
              {item.title}
            </a>
          </h3>

          <p className="mt-1.5 max-w-[68ch] text-[15px] leading-7 text-muted">{item.summary}</p>

          {item.why && (
            <p className="sec-tint mt-3 max-w-[68ch] rounded-lg px-3.5 py-2.5 text-[14.5px] leading-7">
              <span className="sec-fg font-medium">ليه يهمك: </span>
              {item.why}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {item.tags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onTag(t)}
                dir="auto"
                className="rounded-md bg-sunken px-2 py-0.5 text-[12.5px] text-muted hover:text-ink"
              >
                #{t}
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-1 text-[13.5px]">
            <button
              type="button"
              onClick={() => onSeen(item.id, !seen)}
              aria-pressed={seen}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 hover:bg-sunken ${
                seen ? "text-ink" : "text-muted"
              }`}
            >
              <CheckIcon width={17} height={17} />
              {seen ? "شوفته" : "علّمه إني شوفته"}
            </button>
            <button
              type="button"
              onClick={() => onFav(item.id, !fav)}
              aria-pressed={fav}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 hover:bg-sunken ${
                fav ? "text-star" : "text-muted"
              }`}
            >
              <StarIcon filled={fav} width={17} height={17} />
              {fav ? "في المفضلة" : "مفضلة"}
            </button>
            <button
              type="button"
              onClick={() => onShare(item)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-muted hover:bg-sunken"
              aria-label="شارك اللينك"
            >
              <ShareIcon width={17} height={17} />
            </button>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onSeen(item.id, true)}
              className="ms-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium text-ink hover:bg-sunken"
            >
              افتح
              <ExternalIcon width={16} height={16} className="-scale-x-100" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

export const ItemRow = memo(ItemRowBase);
