import { trackData, trackMarkdown } from "@/lib/research";

export async function GET(_req: Request, { params }: { params: Promise<{ track: string }> }) {
  const { track } = await params;
  const d = trackData(track);
  if (!d) return new Response("Not found", { status: 404 });
  return new Response(trackMarkdown(track), {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": `attachment; filename="marsad-${track}-research-${d.checked}.md"`,
    },
  });
}
