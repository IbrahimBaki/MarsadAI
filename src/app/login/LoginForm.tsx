"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { LanguageSwitch, useLocale } from "@/components/LocaleProvider";
import { Mark } from "@/components/icons";

type Mode = "login" | "register";

export function AuthView({ mode, signup }: { mode: Mode; signup: boolean }) {
  const { t } = useLocale();
  const register = mode === "register";
  return (
    <main className="flex min-h-dvh flex-col px-5 py-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="text-[14px] font-semibold text-accent">
          {t.login.guest}
        </Link>
        <LanguageSwitch />
      </div>
      <div className="grid flex-1 place-items-center py-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            <Mark size={56} />
            <h1 className="mt-4 text-[32px] font-bold leading-10">{register ? t.register.title : t.app.name}</h1>
            <p className="mt-1 text-[15px] text-muted">{register ? t.register.intro : t.app.tagline}</p>
          </div>
          {register && !signup ? (
            <p className="card !rounded-[24px] p-6 text-center text-[15px] text-ink-2">{t.register.disabled}</p>
          ) : (
            <AuthForm mode={mode} />
          )}
          <p className="mt-5 text-center text-[14.5px] text-muted">
            {register ? (
              <>
                {t.register.haveAccount}{" "}
                <Link href="/login" className="font-semibold text-accent">
                  {t.register.signInLink}
                </Link>
              </>
            ) : (
              signup && (
                <>
                  {t.login.noAccount}{" "}
                  <Link href="/register" className="font-semibold text-accent">
                    {t.login.createLink}
                  </Link>
                </>
              )
            )}
          </p>
        </div>
      </div>
      <p className="text-center text-[13px] text-faint">
        {t.app.name} · <span lang="en">{t.app.by}</span>
      </p>
    </main>
  );
}

function AuthForm({ mode }: { mode: Mode }) {
  const { t } = useLocale();
  const register = mode === "register";
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const messages: Record<string, string> = {
    missing: t.login.missing,
    invalid: t.login.invalid,
    invalid_username: t.register.invalidUsername,
    weak_password: t.register.weakPassword,
    taken: t.register.taken,
    rate_limited: t.register.rateLimited,
    disabled: t.register.disabled,
  };

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const username = String(form.get("username") ?? "");
    const password = String(form.get("password") ?? "");
    if (register && password !== String(form.get("confirm") ?? "")) {
      setError(t.register.mismatch);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(register ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError((data.error && messages[data.error]) || t.login.generic);
        return;
      }
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.href = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
    } catch {
      setError(t.login.network);
    } finally {
      setBusy(false);
    }
  }

  const field =
    "h-12 w-full rounded-2xl bg-ground px-4 text-[16px] outline-none shadow-[inset_0_0_0_1px_var(--line)] focus:shadow-[inset_0_0_0_2px_var(--accent)]";

  return (
    <form onSubmit={submit} className="card flex flex-col gap-4 !rounded-[24px] p-6">
      <label className="flex flex-col gap-1.5 text-[14.5px] font-medium">
        {t.login.username}
        <input
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          dir="ltr"
          {...(register ? { minLength: 3, maxLength: 24, pattern: "[A-Za-z0-9][A-Za-z0-9._\\-]{2,23}" } : {})}
          className={field}
        />
        {register && <span className="text-[12.5px] font-normal text-faint">{t.register.rules}</span>}
      </label>
      <label className="flex flex-col gap-1.5 text-[14.5px] font-medium">
        {t.login.password}
        <input
          name="password"
          type="password"
          autoComplete={register ? "new-password" : "current-password"}
          required
          minLength={register ? 8 : undefined}
          dir="ltr"
          className={field}
        />
        {register && <span className="text-[12.5px] font-normal text-faint">{t.register.passwordRule}</span>}
      </label>
      {register && (
        <label className="flex flex-col gap-1.5 text-[14.5px] font-medium">
          {t.register.confirm}
          <input name="confirm" type="password" autoComplete="new-password" required minLength={8} dir="ltr" className={field} />
        </label>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-paid px-3 py-2 text-[14px] text-paid-ink">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="mt-1 h-12 rounded-2xl bg-ink text-[16px] font-semibold text-ground disabled:opacity-60"
      >
        {register ? (busy ? t.register.busy : t.register.submit) : busy ? t.login.busy : t.login.submit}
      </button>
    </form>
  );
}
