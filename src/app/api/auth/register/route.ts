import { NextResponse } from "next/server";
import { registerUser } from "@/lib/auth";
import { SESSION_COOKIE, createSession, sessionCookieOptions } from "@/lib/session";

export async function POST(request: Request) {
  const { username, password } = (await request.json().catch(() => ({}))) as {
    username?: unknown;
    password?: unknown;
  };
  if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
    return NextResponse.json({ error: "missing" }, { status: 400 });
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const result = await registerUser(username, password, ip);
  if (!result.ok) {
    const status = result.error === "taken" ? 409 : result.error === "rate_limited" ? 429 : result.error === "disabled" ? 403 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSession(result.name), sessionCookieOptions);
  return res;
}
