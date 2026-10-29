import type { MetadataRoute } from "next";
import { APP } from "@/lib/config";
import { MESSAGES } from "@/lib/i18n";

export default function manifest(): MetadataRoute.Manifest {
  const t = MESSAGES.en;
  return {
    name: `${APP.latinName} · ${APP.arabicName}`,
    short_name: APP.latinName,
    description: `${t.app.tagline} — ${t.app.by}`,
    lang: "en",
    dir: "auto",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#eef1f7",
    theme_color: "#eef1f7",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: t.nav.latest, url: "/" },
      { name: t.nav.radar, url: "/radar" },
      { name: t.nav.library, url: "/library" },
      { name: t.nav.favorites, url: "/?v=fav" },
    ],
  };
}
