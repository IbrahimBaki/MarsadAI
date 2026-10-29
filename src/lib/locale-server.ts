import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, MESSAGES, type Locale } from "./i18n";

export async function getLocale(): Promise<Locale> {
  const v = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : DEFAULT_LOCALE;
}

export async function getMessages() {
  return MESSAGES[await getLocale()];
}

/** "Page | Marsad" in the visitor's language. */
export async function pageTitle(pick: (t: (typeof MESSAGES)["en"]) => string) {
  const t = await getMessages();
  return `${pick(t)} | ${t.app.name}`;
}
