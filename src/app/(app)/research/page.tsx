import type { Metadata } from "next";
import { getLocale, pageTitle } from "@/lib/locale-server";
import { tracks, trackData } from "@/lib/research";
import { HubView } from "@/components/research/HubView";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle((t) => t.research.hubTitle) };
}

export default async function ResearchHub() {
  const locale = await getLocale();
  const cards = tracks(locale).map((track) => {
    const d = trackData(track.id, locale)!;
    return {
      track,
      tools: d.tools.length,
      index: d.index.items.length,
      articles: d.articles.length,
      headline: d.blueprint?.answer ?? null,
    };
  });
  return <HubView cards={cards} />;
}
