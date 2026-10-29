"use client";

import { useCallback } from "react";
import { nf } from "@/lib/format";
import { useApp } from "./AppContext";

type Shareable = { title: string; url: string; summary?: string; desc?: string };

export function useItemActions() {
  const { user, showToast } = useApp();
  const set = user.set;

  const onSeen = useCallback((id: string, on: boolean) => set("seen", [id], on), [set]);
  const onFav = useCallback(
    (id: string, on: boolean) => {
      set("fav", [id], on);
      showToast(on ? "اتضاف للمفضلة." : "اتشال من المفضلة.", () => set("fav", [id], !on));
    },
    [set, showToast],
  );
  const onShare = useCallback(
    async (item: Shareable) => {
      try {
        if (navigator.share) {
          await navigator.share({ title: item.title, text: item.summary ?? item.desc, url: item.url });
          return;
        }
        await navigator.clipboard.writeText(item.url);
        showToast("اتنسخ اللينك.");
      } catch {}
    },
    [showToast],
  );
  const markAll = useCallback(
    (ids: string[]) => {
      const fresh = ids.filter((id) => !user.seen.has(id));
      if (!fresh.length) return;
      set("seen", fresh, true);
      showToast(`علّمت ${nf.format(fresh.length)} حاجة إنك شوفتها.`, () => set("seen", fresh, false));
    },
    [set, showToast, user.seen],
  );

  return { onSeen, onFav, onShare, markAll };
}
