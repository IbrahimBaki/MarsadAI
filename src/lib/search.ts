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

type Searchable = Record<string, unknown>;
const cache = new WeakMap<object, string>();
const FIELDS = ["title", "summary", "why", "about", "source", "url", "repo", "desc", "list", "heading", "tag"];

function haystack(item: Searchable) {
  let h = cache.get(item);
  if (!h) {
    const parts: string[] = [];
    for (const f of FIELDS) if (typeof item[f] === "string") parts.push(item[f] as string);
    for (const f of ["tags", "features"]) if (Array.isArray(item[f])) parts.push((item[f] as string[]).join(" "));
    h = normalize(parts.join(" \n "));
    cache.set(item, h);
  }
  return h;
}

/** Every word in the query must appear somewhere in the item. */
export function matches(item: object, query: string) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const h = haystack(item as Searchable);
  return terms.every((t) => h.includes(t));
}
