import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pageTitle } from "@/lib/locale-server";
import { findTool, trackData, TRACKS } from "@/lib/research";
import { ToolView } from "@/components/research/ToolView";

type Props = { params: Promise<{ track: string; tool: string }> };

export function generateStaticParams() {
  return TRACKS.flatMap((t) => (trackData(t.id)?.tools ?? []).map((x) => ({ track: t.id, tool: x.id })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { track, tool } = await params;
  const x = findTool(track, tool);
  return { title: await pageTitle((t) => x?.name ?? t.research.title) };
}

export default async function ToolPage({ params }: Props) {
  const { track: tid, tool: id } = await params;
  const d = trackData(tid);
  const tool = findTool(tid, id);
  if (!d || !tool) notFound();
  const related = d.tools.filter((x) => x.category === tool.category && x.id !== tool.id).slice(0, 8);
  return <ToolView track={d.track} tool={tool} related={related} />;
}
