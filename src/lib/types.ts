import type { SectionId } from "./sections";

/** 3 = لازم تشوفه, 2 = مفيد, 1 = للعلم */
export type Importance = 1 | 2 | 3;

export type ItemKind =
  | "release"
  | "repo"
  | "skill"
  | "mcp"
  | "model"
  | "tool"
  | "article"
  | "video";

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
};

export type Digest = {
  date: string; // YYYY-MM-DD
  headline: string;
  items: Item[];
};

/** Item as served to the client, with its digest date attached. */
export type FeedItem = Item & { date: string };

export type FeedPayload = {
  days: { date: string; headline: string }[];
  items: FeedItem[];
};

export type UserState = {
  seen: string[];
  fav: string[];
};
