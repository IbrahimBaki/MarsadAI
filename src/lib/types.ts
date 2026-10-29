import type { SectionId } from "./sections";

/** 3 = لازم تشوفه / ابدأ بيه, 2 = مفيد, 1 = للعلم */
export type Importance = 1 | 2 | 3;

export type ItemKind =
  | "release"
  | "repo"
  | "skill"
  | "plugin"
  | "mcp"
  | "library"
  | "tool"
  | "model"
  | "article"
  | "video";

export type PricingModel = "oss" | "free" | "freemium" | "paid";

export type Item = {
  id: string;
  section: SectionId;
  kind: ItemKind;
  title: string;
  summary: string;
  why: string;
  url: string;
  source: string;
  importance: Importance;
  tags: string[];
  /** "owner/name" when the item is (or lives in) a GitHub repo — stats come from it. */
  repo?: string;
  pricing?: { model: PricingModel; note?: string };
  /** Full explanation for the details page; paragraphs separated by a blank line. */
  about?: string;
  features?: string[];
  install?: { label: string; cmd: string }[];
  /** Example prompts or short usage notes. */
  usage?: string[];
  requirements?: string[];
  /** Ids of related items (or plain names). */
  alternatives?: string[];
  links?: { label: string; url: string }[];
};

export type Digest = {
  date: string; // YYYY-MM-DD
  headline: string;
  items: Item[];
};

/** Item as served to the client, with its digest date attached ("" for essentials). */
export type FeedItem = Item & { date: string; essential: boolean };

/** Raw signal from the collector: a new awesome-list entry, release or trending repo. */
export type RadarEntry = {
  id: string;
  type: "awesome" | "release" | "trending";
  section: SectionId;
  date: string;
  title: string;
  url: string;
  desc: string;
  list?: string;
  heading?: string;
  repo?: string;
  tag?: string;
  stars?: number;
};

export type RepoStats = {
  stars: number;
  forks?: number;
  language: string | null;
  license: string | null;
  pushedAt: string;
  archived?: boolean;
  release: { tag: string; date: string } | null;
};

export type FeedPayload = {
  days: { date: string; headline: string }[];
  items: FeedItem[];
  essentials: FeedItem[];
  radar: RadarEntry[];
  stats: Record<string, RepoStats>;
  statsUpdated: string | null;
};

export type UserState = {
  seen: string[];
  fav: string[];
};
