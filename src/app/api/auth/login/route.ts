import { NextResponse } from "next/server";
import { checkPassword } from "@/lib/auth";
import { SESSION_COOKIE, createSession, sessionCookieOptions } from "@/lib/session";

export async function POST(request: Request) {
  const { username, password } = (await request.json().catch(() => ({}))) as {
    username?: string;
    password?: string;
  };
  if (!username || !password) {
    return NextResponse.json({ error: "missing" }, { status: 400 });
  }
  const name = checkPassword(username, password);
  if (!name) {
    // Small delay to slow down guessing.
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSession(name), sessionCookieOptions);
  return res;
}
