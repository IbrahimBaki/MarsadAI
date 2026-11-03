import { isLocale } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { trackData, trackMarkdown } from "@/lib/research";

export async function GET(req: Request, { params }: { params: Promise<{ track: string }> }) {
  const { track } = await params;
  const q = new URL(req.url).searchParams.get("lang");
  const locale = isLocale(q) ? q : await getLocale();
  const d = trackData(track, locale);
  if (!d) return new Response("Not found", { status: 404 });
  return new Response(trackMarkdown(track, locale), {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": `attachment; filename="marsad-${track}-research-${locale}-${d.checked}.md"`,
    },
  });
}
