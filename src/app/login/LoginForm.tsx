"use client";

import { useState, type FormEvent } from "react";

export function LoginForm() {
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
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "حصلت مشكلة، جرّب تاني.");
        return;
      }
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.href = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
    } catch {
      setError("مش قادر أوصل للسيرفر. اتأكد من النت.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "h-12 w-full rounded-xl border border-line bg-surface px-4 text-[16px] outline-none focus:border-[var(--focus)]";

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6">
      <label className="flex flex-col gap-1.5 text-[14.5px] font-medium">
        اسم المستخدم
        <input name="username" autoComplete="username" required dir="ltr" className={field} />
      </label>
      <label className="flex flex-col gap-1.5 text-[14.5px] font-medium">
        كلمة السر
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          dir="ltr"
          className={field}
        />
      </label>
      {error && (
        <p role="alert" className="rounded-lg bg-star-soft px-3 py-2 text-[14px]">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="mt-1 h-12 rounded-xl bg-ink text-[16px] font-medium text-sky disabled:opacity-60"
      >
        {busy ? "بيدخل…" : "ادخل"}
      </button>
    </form>
  );
}
