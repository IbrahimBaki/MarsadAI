import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, pageTitle } from "@/lib/locale-server";
import { Radar } from "@/components/research/Radar";
import { TABS, TRACKS, trackData, type Tab } from "@/lib/research";
import {
  ArticlesTab,
  IndexTab,
  MatrixTab,
  OverviewTab,
  PlanTab,
  PlannedTrack,
  RadarTab,
  TrackHeader,
  ContentNote,
} from "@/components/research/TrackView";

type Props = {
  params: Promise<{ track: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function generateStaticParams() {
  return TRACKS.map((t) => ({ track: t.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { track } = await params;
  const d = trackData(track);
  const locale = await getLocale();
  return { title: await pageTitle((t) => d?.track.name[locale] ?? t.research.title) };
}

export default async function TrackPage({ params, searchParams }: Props) {
  const { track: id } = await params;
  const d = trackData(id);
  if (!d) notFound();
  const raw = (await searchParams).tab;
  const tab: Tab = TABS.includes(raw as Tab) ? (raw as Tab) : "overview";
  const { track, tools, articles, synthesis, index } = d;
  const stats = { tools: tools.length, index: index.items.length, articles: articles.length };
  const planned = track.status === "planned" || !synthesis;

  return (
    <div className="flex flex-col gap-5">
      <TrackHeader track={track} tab={tab} stats={stats} checked={d.checked}>
        {!planned && tab === "overview" ? <Radar track={track} tools={tools} /> : null}
      </TrackHeader>
      {!planned && <ContentNote />}
      {planned ? (
        <PlannedTrack track={track} />
      ) : tab === "matrix" ? (
        <MatrixTab track={track} tools={tools} />
      ) : tab === "plan" ? (
        <PlanTab s={synthesis} />
      ) : tab === "articles" ? (
        <ArticlesTab articles={articles} />
      ) : tab === "radar" ? (
        <RadarTab track={track} />
      ) : tab === "index" ? (
        <IndexTab track={track} items={index.items} sources={index.sources} />
      ) : (
        <OverviewTab track={track} s={synthesis} tools={tools} />
      )}
    </div>
  );
}
