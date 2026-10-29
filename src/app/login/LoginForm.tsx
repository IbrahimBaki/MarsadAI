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
    "h-12 w-full rounded-2xl bg-ground px-4 text-[16px] outline-none shadow-[inset_0_0_0_1px_var(--line)] focus:shadow-[inset_0_0_0_2px_var(--accent)]";

  return (
    <form onSubmit={submit} className="card flex flex-col gap-4 !rounded-[24px] p-6">
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
        <p role="alert" className="rounded-xl bg-paid px-3 py-2 text-[14px] text-paid-ink">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="mt-1 h-12 rounded-2xl bg-ink text-[16px] font-semibold text-ground disabled:opacity-60"
      >
        {busy ? "بيدخل…" : "ادخل"}
      </button>
    </form>
  );
}
