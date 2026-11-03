import type { Metadata } from "next";
import { pageTitle } from "@/lib/locale-server";
import { TRACKS, trackData } from "@/lib/research";
import { HubView } from "@/components/research/HubView";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle((t) => t.research.hubTitle) };
}

export default function ResearchHub() {
  const cards = TRACKS.map((track) => {
    const d = trackData(track.id)!;
    return {
      track,
      tools: d.tools.length,
      index: d.index.items.length,
      articles: d.articles.length,
      headline: d.synthesis?.headline ?? null,
    };
  });
  return <HubView cards={cards} />;
}
