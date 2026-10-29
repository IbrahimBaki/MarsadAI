"use client";

import { useState, type FormEvent } from "react";
import { LanguageSwitch, useLocale } from "@/components/LocaleProvider";
import { Mark } from "@/components/icons";

export function LoginView() {
  const { t } = useLocale();
  return (
    <main className="flex min-h-dvh flex-col px-5 py-6">
      <div className="flex justify-end">
        <LanguageSwitch />
      </div>
      <div className="grid flex-1 place-items-center py-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            <Mark size={56} />
            <h1 className="mt-4 text-[32px] font-bold leading-10">{t.app.name}</h1>
            <p className="mt-1 text-[15px] text-muted">{t.app.tagline}</p>
          </div>
          <LoginForm />
        </div>
      </div>
      <p className="text-center text-[13px] text-faint">
        {t.app.name} · <span lang="en">{t.app.by}</span>
      </p>
    </main>
  );
}

function LoginForm() {
  const { t } = useLocale();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error === "missing" ? t.login.missing : data.error === "invalid" ? t.login.invalid : t.login.generic);
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
        <input name="username" autoComplete="username" required dir="ltr" className={field} />
      </label>
      <label className="flex flex-col gap-1.5 text-[14.5px] font-medium">
        {t.login.password}
        <input name="password" type="password" autoComplete="current-password" required dir="ltr" className={field} />
      </label>
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
        {busy ? t.login.busy : t.login.submit}
      </button>
    </form>
  );
}
