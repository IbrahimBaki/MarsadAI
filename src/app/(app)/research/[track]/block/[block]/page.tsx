import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, pageTitle } from "@/lib/locale-server";
import { TRACK_IDS, trackData } from "@/lib/research";
import { toolMap } from "@/lib/research-server";
import { BlockHeader, BlockView } from "@/components/research/Blueprint";

type Props = { params: Promise<{ track: string; block: string }> };

export function generateStaticParams() {
  return TRACK_IDS.flatMap((t) => (trackData(t)?.blueprint?.blocks ?? []).map((b) => ({ track: t, block: b.id })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { track, block } = await params;
  const locale = await getLocale();
  const b = trackData(track, locale)?.blueprint?.blocks.find((x) => x.id === block);
  return { title: await pageTitle((t) => b?.name ?? t.research.title) };
}

export default async function BlockPage({ params }: Props) {
  const { track: tid, block: bid } = await params;
  const locale = await getLocale();
  const d = trackData(tid, locale);
  const blocks = d?.blueprint?.blocks ?? [];
  const i = blocks.findIndex((b) => b.id === bid);
  if (!d || i < 0) notFound();
  return (
    <div className="flex flex-col gap-5">
      <BlockHeader track={d.track} block={blocks[i]} total={blocks.length} />
      <BlockView track={d.track} block={blocks[i]} tools={toolMap(d.tools)} prev={blocks[i - 1]} next={blocks[i + 1]} />
    </div>
  );
}
