import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, pageTitle } from "@/lib/locale-server";
import { findTool, trackData, TRACK_IDS } from "@/lib/research";
import { ToolView } from "@/components/research/ToolView";

type Props = { params: Promise<{ track: string; tool: string }> };

export function generateStaticParams() {
  return TRACK_IDS.flatMap((t) => (trackData(t)?.tools ?? []).map((x) => ({ track: t, tool: x.id })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { track, tool } = await params;
  const x = findTool(track, tool);
  return { title: await pageTitle((t) => x?.name ?? t.research.title) };
}

export default async function ToolPage({ params }: Props) {
  const { track: tid, tool: id } = await params;
  const locale = await getLocale();
  const d = trackData(tid, locale);
  const tool = findTool(tid, id, locale);
  if (!d || !tool) notFound();
  const related = d.tools.filter((x) => x.category === tool.category && x.id !== tool.id).slice(0, 8);
  const blocks = (d.blueprint?.blocks ?? []).filter(
    (b) => b.pick.includes(id) || b.alternatives.includes(id) || b.compares.some((c) => c.tools.includes(id)),
  );
  return <ToolView track={d.track} tool={tool} related={related} blocks={blocks.map((b) => ({ id: b.id, name: b.name, order: b.order }))} />;
}
