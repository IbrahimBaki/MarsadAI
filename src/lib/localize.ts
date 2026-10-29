import type { Locale } from "./i18n";
import type { FeedItem, FeedPayload, Item } from "./types";

/**
 * Content files are written in Arabic at the top level, with an `en` block holding the
 * English version of every text field. English is the default UI language, so for "en"
 * the `en` block wins wherever it has a value; anything missing falls back to Arabic.
 */
export function localizeItem<T extends Item>(item: T, locale: Locale): T {
  const en = item.en;
  if (locale !== "en" || !en) return item;
  return {
    ...item,
    title: en.title || item.title,
    summary: en.summary || item.summary,
    why: en.why || item.why,
    about: en.about ?? item.about,
    features: en.features?.length ? en.features : item.features,
    usage: en.usage?.length ? en.usage : item.usage,
    requirements: en.requirements?.length ? en.requirements : item.requirements,
    install: item.install?.map((step, i) => ({ ...step, label: en.install?.[i] || step.label })),
    links: item.links?.map((l, i) => ({ ...l, label: en.links?.[i] || l.label })),
    pricing: item.pricing && { ...item.pricing, note: en.pricingNote ?? item.pricing.note },
  };
}

export function localizeFeed(feed: FeedPayload, locale: Locale): FeedPayload {
  if (locale !== "en") return feed;
  return {
    ...feed,
    days: feed.days.map((d) => ({ ...d, headline: d.headline_en || d.headline })),
    items: feed.items.map((i) => localizeItem<FeedItem>(i, locale)),
    essentials: feed.essentials.map((i) => localizeItem<FeedItem>(i, locale)),
  };
}
