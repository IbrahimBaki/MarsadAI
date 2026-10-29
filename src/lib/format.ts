import { intlLocale, MESSAGES, type Locale } from "./i18n";

export function localISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Two-letter monogram for a repo or product name. */
export function monogram(name: string) {
  const base = name.includes("/") ? name.split("/")[1] : name;
  const words = base.replace(/[^A-Za-z0-9؀-ۿ]+/g, " ").trim().split(/\s+/);
  if (words.length > 1) return (words[0][0] + words[1][0]).toLowerCase();
  return base.slice(0, 2).toLowerCase();
}

export type Formatters = ReturnType<typeof build>;

function build(locale: Locale) {
  const loc = intlLocale(locale);
  const nf = new Intl.NumberFormat(loc);
  const compact = new Intl.NumberFormat(loc, { notation: "compact", maximumFractionDigits: 1 });
  const dayFmt = new Intl.DateTimeFormat(loc, { weekday: "long", day: "numeric", month: "long" });
  const yearFmt = new Intl.DateTimeFormat(loc, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const shortFmt = new Intl.DateTimeFormat(loc, { day: "numeric", month: "short", year: "numeric" });
  const rel = new Intl.RelativeTimeFormat(loc, { numeric: "auto" });
  const words = MESSAGES[locale].dates;

  return {
    num: (n: number) => nf.format(n),
    count: (n: number) => (n >= 1000 ? compact.format(n) : nf.format(n)),
    day(iso: string) {
      const d = new Date(`${iso}T12:00:00`);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      if (iso === localISO(today)) return { main: words.today, sub: dayFmt.format(d) as string | null };
      if (iso === localISO(yesterday)) return { main: words.yesterday, sub: dayFmt.format(d) as string | null };
      const fmt = d.getFullYear() === today.getFullYear() ? dayFmt : yearFmt;
      return { main: fmt.format(d), sub: null as string | null };
    },
    short: (iso: string) => shortFmt.format(new Date(iso)),
    ago(iso: string) {
      const diff = (new Date(iso).getTime() - Date.now()) / 1000;
      const abs = Math.abs(diff);
      if (abs < 3600) return rel.format(Math.round(diff / 60), "minute");
      if (abs < 86400) return rel.format(Math.round(diff / 3600), "hour");
      if (abs < 86400 * 30) return rel.format(Math.round(diff / 86400), "day");
      if (abs < 86400 * 365) return rel.format(Math.round(diff / (86400 * 30)), "month");
      return rel.format(Math.round(diff / (86400 * 365)), "year");
    },
  };
}

const FORMATTERS: Record<Locale, Formatters> = { en: build("en"), ar: build("ar") };
export const formatters = (locale: Locale) => FORMATTERS[locale];
