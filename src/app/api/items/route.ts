import { loadFeed } from "@/lib/content";

// Built once per deploy: every push of a new digest triggers a new build.
export const dynamic = "force-static";

export async function GET() {
  return Response.json(await loadFeed());
}
