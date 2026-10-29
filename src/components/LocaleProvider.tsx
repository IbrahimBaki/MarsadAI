"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { dirOf, LOCALE_COOKIE, MESSAGES, type Locale, type Messages } from "@/lib/i18n";
import { formatters, type Formatters } from "@/lib/format";
import { taxonomy, type Taxonomy } from "@/lib/sections";

type LocaleValue = {
  locale: Locale;
  t: Messages;
  f: Formatters;
  tx: Taxonomy;
  setLocale: (l: Locale) => void;
};

const Ctx = createContext<LocaleValue | null>(null);

export function LocaleProvider({ initial, children }: { initial: Locale; children: ReactNode }) {
  const [locale, setState] = useState<Locale>(initial);
  const router = useRouter();

  const setLocale = useCallback(
    (l: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = l;
      document.documentElement.dir = dirOf(l);
      setState(l);
      // Server-rendered bits (page titles) pick up the new language.
      router.refresh();
    },
    [router],
  );

  const value = useMemo<LocaleValue>(
    () => ({ locale, t: MESSAGES[locale], f: formatters(locale), tx: taxonomy(locale), setLocale }),
    [locale, setLocale],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocale() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLocale outside LocaleProvider");
  return v;
}

/** Two-button EN / ع switch. */
export function LanguageSwitch({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();
  return (
    <div role="radiogroup" aria-label={t.lang.label} className={`flex rounded-[10px] bg-sunken p-[3px] text-[13px] ${className}`}>
      {(["en", "ar"] as const).map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={locale === l}
          lang={l}
          onClick={() => locale !== l && setLocale(l)}
          className={`rounded-lg px-2.5 py-1 ${locale === l ? "bg-surface font-semibold shadow-sm" : "text-muted"}`}
        >
          {t.lang[l]}
        </button>
      ))}
    </div>
  );
}
