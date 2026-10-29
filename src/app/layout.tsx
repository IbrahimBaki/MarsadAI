import type { Metadata, Viewport } from "next";
import { AUTHOR, dirOf, MESSAGES } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { LocaleProvider } from "@/components/LocaleProvider";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = MESSAGES[await getLocale()];
  return {
    title: t.app.name,
    description: t.app.tagline,
    applicationName: t.app.name,
    authors: [{ name: AUTHOR }],
    creator: AUTHOR,
    appleWebApp: { capable: true, title: t.app.name, statusBarStyle: "default" },
    icons: {
      icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef1f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1020" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Applies the saved theme before paint, so there is no flash.
const themeScript = `try{var t=localStorage.getItem("marsad-theme");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html lang={locale} dir={dirOf(locale)} suppressHydrationWarning>
      <head>
        <meta name="author" content={AUTHOR} />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh antialiased">
        <LocaleProvider initial={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
