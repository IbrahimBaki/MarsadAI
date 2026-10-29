"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import type { SectionId } from "@/lib/sections";
import { useApp } from "./AppContext";
import { LanguageSwitch, useLocale } from "./LocaleProvider";
import { BookmarkIcon, CheckIcon, ClockIcon, CloseIcon, LibraryIcon, LogoutIcon, Mark, MenuIcon, RadarIcon } from "./icons";

type Theme = "light" | "dark" | "auto";

function useTheme() {
  const [theme, setTheme] = useState<Theme>("auto");
  useEffect(() => {
    const t = document.documentElement.dataset.theme;
    setTheme(t === "light" || t === "dark" ? t : "auto");
  }, []);
  const set = (t: Theme) => {
    if (t === "auto") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = t;
    try {
      if (t === "auto") localStorage.removeItem("marsad-theme");
      else localStorage.setItem("marsad-theme", t);
    } catch {}
    setTheme(t);
  };
  return [theme, set] as const;
}

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const { feed, user } = useApp();
  const { t, f, tx } = useLocale();
  const nf = { format: f.num };
  const pathname = usePathname();
  const params = useSearchParams();
  const [theme, setTheme] = useTheme();
  const seen = user.seen;

  const base = pathname.startsWith("/library") ? "/library" : pathname.startsWith("/radar") ? "/radar" : "/";
  const view = params.get("v");
  const activeSection = params.get("s");

  // Unseen counts per section for whatever list is being browsed.
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    const list: { id: string; section: string }[] =
      base === "/library" ? feed?.essentials ?? [] : base === "/radar" ? feed?.radar ?? [] : feed?.items ?? [];
    for (const it of list) if (!seen.has(it.id)) m.set(it.section, (m.get(it.section) ?? 0) + 1);
    return m;
  }, [feed, seen, base]);

  const unseenNews = useMemo(() => (feed?.items ?? []).filter((i) => !seen.has(i.id)).length, [feed, seen]);
  const unseenRadar = useMemo(() => (feed?.radar ?? []).filter((i) => !seen.has(i.id)).length, [feed, seen]);
  const favCount = user.fav.size;

  const main = [
    { href: "/", label: t.nav.latest, icon: ClockIcon, count: unseenNews, active: pathname === "/" && !view, badge: true },
    { href: "/radar", label: t.nav.radar, hint: t.nav.radarHint, icon: RadarIcon, count: unseenRadar, active: base === "/radar" },
    { href: "/library", label: t.nav.library, icon: LibraryIcon, count: feed?.essentials.length ?? 0, active: base === "/library" },
    { href: "/?v=fav", label: t.nav.favorites, icon: BookmarkIcon, count: favCount, active: pathname === "/" && view === "fav" },
    { href: "/?v=seen", label: t.nav.seen, icon: CheckIcon, count: 0, active: pathname === "/" && view === "seen" },
  ];

  const sectionHref = (id: SectionId | null) => {
    const qs = new URLSearchParams(base === "/" && view ? { v: view } : {});
    if (id) qs.set("s", id);
    const s = qs.toString();
    return s ? `${base}?${s}` : base;
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    try {
      localStorage.removeItem("marsad-state-cache");
    } catch {}
    window.location.href = "/login";
  };

  return (
    <div className="flex min-h-full flex-col">
      <nav aria-label={t.nav.views} className="flex flex-col gap-0.5 px-3">
        {main.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            onClick={onNavigate}
            aria-current={m.active ? "page" : undefined}
            className={`flex h-11 items-center gap-3 rounded-[14px] px-3 text-[15px] ${
              m.active ? "bg-ink font-semibold text-ground" : "hover:bg-sunken"
            }`}
          >
            <m.icon width={19} height={19} />
            <span className="flex-1">{m.label}</span>
            {m.count > 0 &&
              (m.badge ? (
                <span className="rounded-full bg-star px-2 text-[12.5px] font-bold text-[#10162a]">{nf.format(m.count)}</span>
              ) : (
                <span className={`text-[13px] tabular-nums ${m.active ? "text-ground/70" : "text-faint"}`}>
                  {nf.format(m.count)}
                </span>
              ))}
          </Link>
        ))}
      </nav>

      <div className="mx-5 my-3 h-px bg-line" />

      <nav aria-label={t.nav.sections} className="flex flex-col px-3">
        <Link
          href={sectionHref(null)}
          onClick={onNavigate}
          className={`flex h-10 items-center gap-3 rounded-xl px-3 text-[14.5px] ${
            !activeSection ? "bg-sunken font-semibold" : "hover:bg-sunken"
          }`}
        >
          <span className="size-2.5 rounded-[3px] bg-ink" />
          <span className="flex-1">{t.nav.allSections}</span>
        </Link>
        {tx.GROUPS.map((g) => (
          <div key={g.id} className="mt-3">
            <div className="px-3 pb-1 text-[12.5px] text-faint">{g.name}</div>
            {g.sections.map((s) => {
              const active = activeSection === s.id;
              const count = counts.get(s.id) ?? 0;
              return (
                <Link
                  key={s.id}
                  href={sectionHref(s.id)}
                  onClick={onNavigate}
                  style={{ "--c": s.color } as React.CSSProperties}
                  className={`flex h-10 items-center gap-3 rounded-xl px-3 text-[14.5px] ${
                    active ? "sec-soft font-semibold" : "hover:bg-sunken"
                  }`}
                >
                  <span className="sec-bg size-2.5 shrink-0 rounded-[3px]" />
                  <span className="flex-1 truncate">{s.name}</span>
                  {count > 0 && <span className={`text-[12.5px] tabular-nums ${active ? "sec-fg" : "text-faint"}`}>{nf.format(count)}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-3 border-t border-line px-5 pb-6 pt-4">
        <div className="flex items-center gap-3 text-[14px]">
          <span className="flex-1">{t.lang.label}</span>
          <LanguageSwitch />
        </div>
        <div className="flex items-center gap-3 text-[14px]">
          <span className="flex-1">{t.nav.theme}</span>
          <div role="radiogroup" aria-label={t.nav.theme} className="flex rounded-[10px] bg-sunken p-[3px] text-[13px]">
            {(
              [
                ["light", t.nav.light],
                ["dark", t.nav.dark],
                ["auto", t.nav.auto],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={theme === mode}
                onClick={() => setTheme(mode)}
                className={`rounded-lg px-2.5 py-1 ${theme === mode ? "bg-surface font-semibold shadow-sm" : "text-muted"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <button type="button" onClick={logout} className="flex h-9 items-center gap-2.5 text-[14px] text-paid-ink">
          <LogoutIcon width={18} height={18} />
          {t.nav.logout}
          {user.user ? ` (${user.user})` : ""}
        </button>
        <p className="text-[12px] text-faint">
          {t.app.name} · <span lang="en">{t.app.by}</span>
        </p>
      </div>
    </div>
  );
}

function ShellInner({ children }: { children: ReactNode }) {
  const { drawerOpen, setDrawerOpen, user, toast } = useApp();
  const { t } = useLocale();
  const pathname = usePathname();
  const params = useSearchParams();

  // Close the drawer whenever the route changes.
  useEffect(() => setDrawerOpen(false), [pathname, params, setDrawerOpen]);
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen, setDrawerOpen]);

  return (
    <div className={drawerOpen ? "drawer-open" : ""}>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center gap-2 bg-ground/90 px-3 pb-2 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label={t.nav.openMenu}
          aria-expanded={drawerOpen}
          className="card grid size-11 place-items-center !rounded-[14px]"
        >
          <MenuIcon width={22} height={22} />
        </button>
        <Link href="/" className="flex flex-1 items-center gap-2">
          <Mark size={26} />
          <span className="text-[21px] font-bold">{t.app.name}</span>
        </Link>
        <span
          aria-label={user.user ?? ""}
          className="grid size-9 place-items-center rounded-full bg-accent text-[15px] font-semibold text-white"
        >
          {(user.user ?? "?").slice(0, 1).toUpperCase()}
        </span>
      </header>

      {/* Mobile drawer */}
      <div className="lg:hidden" aria-hidden={!drawerOpen}>
        <div className="drawer-scrim fixed inset-0 z-40 bg-[var(--scrim)]" onClick={() => setDrawerOpen(false)} />
        <aside
          aria-label={t.nav.menu}
          className="drawer-panel fixed inset-y-0 start-0 z-50 flex w-[86vw] max-w-[330px] flex-col overflow-y-auto rounded-e-[24px] bg-surface shadow-2xl"
          inert={!drawerOpen}
        >
          <div className="flex items-center gap-3 px-5 pb-3 pt-[max(20px,env(safe-area-inset-top))]">
            <Mark size={30} />
            <div className="flex flex-1 flex-col">
              <span className="text-[17px] font-bold">{t.app.name}</span>
              <span className="text-[12.5px] text-muted">{t.app.tagline}</span>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label={t.nav.closeMenu}
              className="grid size-10 place-items-center rounded-xl bg-sunken"
            >
              <CloseIcon width={18} height={18} />
            </button>
          </div>
          <NavContent onNavigate={() => setDrawerOpen(false)} />
        </aside>
      </div>

      <div className="mx-auto flex w-full max-w-[1480px] gap-5 lg:px-5 lg:py-5">
        {/* Desktop sidebar */}
        <aside className="card sticky top-5 hidden max-h-[calc(100dvh-40px)] w-[268px] shrink-0 flex-col overflow-y-auto !rounded-[24px] py-4 lg:flex">
          <Link href="/" className="mb-3 flex items-center gap-2.5 px-6 pt-1">
            <Mark size={30} />
            <span className="text-[22px] font-bold">{t.app.name}</span>
          </Link>
          <NavContent />
        </aside>

        <main className="min-w-0 flex-1 px-3 pb-24 lg:px-0">{children}</main>
      </div>

      {toast && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-[max(16px,env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-[14.5px] text-ground shadow-lg"
        >
          <span className="flex-1">{toast.text}</span>
          {toast.undo && (
            <button type="button" onClick={toast.undo} className="rounded-lg px-2 py-1 font-semibold text-star">
              {t.nav.undo}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Suspense>
      <ShellInner>{children}</ShellInner>
    </Suspense>
  );
}
