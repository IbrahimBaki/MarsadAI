export const nf = new Intl.NumberFormat("ar-EG");
const compact = new Intl.NumberFormat("ar-EG", { notation: "compact", maximumFractionDigits: 1 });
const dayFmt = new Intl.DateTimeFormat("ar-EG", { weekday: "long", day: "numeric", month: "long" });
const yearFmt = new Intl.DateTimeFormat("ar-EG", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const shortFmt = new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "short", year: "numeric" });
const rel = new Intl.RelativeTimeFormat("ar-EG", { numeric: "auto" });

export const formatCount = (n: number) => (n >= 1000 ? compact.format(n) : nf.format(n));

export function localISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function dayLabel(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (iso === localISO(today)) return { main: "النهارده", sub: dayFmt.format(d) };
  if (iso === localISO(yesterday)) return { main: "امبارح", sub: dayFmt.format(d) };
  const fmt = d.getFullYear() === today.getFullYear() ? dayFmt : yearFmt;
  return { main: fmt.format(d), sub: null as string | null };
}

export function shortDate(iso: string) {
  return shortFmt.format(new Date(iso));
}

export function ago(iso: string) {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 3600) return rel.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rel.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return rel.format(Math.round(diff / 86400), "day");
  if (abs < 86400 * 365) return rel.format(Math.round(diff / (86400 * 30)), "month");
  return rel.format(Math.round(diff / (86400 * 365)), "year");
}

/** Two-letter monogram for a repo or product name. */
export function monogram(name: string) {
  const base = name.includes("/") ? name.split("/")[1] : name;
  const words = base.replace(/[^A-Za-z0-9؀-ۿ]+/g, " ").trim().split(/\s+/);
  if (words.length > 1) return (words[0][0] + words[1][0]).toLowerCase();
  return base.slice(0, 2).toLowerCase();
}
