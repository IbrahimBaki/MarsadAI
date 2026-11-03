// Small, client-safe list of research tracks for the menu (the full data stays on the server).
import tracksFile from "../../research/tracks.json";

type L10n = { en: string; ar: string };
export type NavTrack = { id: string; status: string; name: L10n; short: L10n };

export const NAV_TRACKS: NavTrack[] = tracksFile.tracks
  .slice()
  .sort((a, b) => a.order - b.order)
  .map((t) => ({ id: t.id, status: t.status, name: t.name, short: t.short }));
