import { cookies } from "next/headers";
import { SESSION_COOKIE, readSession } from "@/lib/session";
import { getState, setMembership, storeIsPersistent, type ListName } from "@/lib/store";

async function user() {
  const jar = await cookies();
  return readSession(jar.get(SESSION_COOKIE)?.value);
}

export async function GET() {
  const session = await user();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });
  const state = await getState(session.sub);
  return Response.json({ ...state, user: session.name, persistent: storeIsPersistent });
}

type Body = { list?: string; ids?: unknown; on?: unknown };

export async function POST(request: Request) {
  const session = await user();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Body;
  const list = body.list;
  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === "string") : [];
  if ((list !== "seen" && list !== "fav") || typeof body.on !== "boolean" || ids.length > 2000) {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  await setMembership(session.sub, list as ListName, ids, body.on);
  return Response.json({ ok: true });
}
