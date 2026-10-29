import type { FeedItem } from "./types";

/** Normalises Arabic and Latin text so "إضافة" matches "اضافه" and "MCP" matches "mcp". */
export function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[ً-ٰٟـ]/g, "") // tashkeel + tatweel
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

const cache = new WeakMap<FeedItem, string>();

function haystack(item: FeedItem) {
  let h = cache.get(item);
  if (!h) {
    h = normalize(
      [item.title, item.summary, item.why, item.source, item.url, item.tags.join(" ")].join(" \n "),
    );
    cache.set(item, h);
  }
  return h;
}

/** Every word in the query must appear somewhere in the item. */
export function matches(item: FeedItem, query: string) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const h = haystack(item);
  return terms.every((t) => h.includes(t));
}
