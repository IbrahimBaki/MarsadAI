"use client";

import { useCallback } from "react";
import { useApp } from "./AppContext";
import { useLocale } from "./LocaleProvider";

type Shareable = { title: string; url: string; summary?: string; desc?: string };

export function useItemActions() {
  const { user, showToast } = useApp();
  const { t, f } = useLocale();
  const set = user.set;

  const onSeen = useCallback((id: string, on: boolean) => set("seen", [id], on), [set]);
  const onFav = useCallback(
    (id: string, on: boolean) => {
      set("fav", [id], on);
      showToast(on ? t.toast.favAdded : t.toast.favRemoved, () => set("fav", [id], !on));
    },
    [set, showToast, t],
  );
  const onShare = useCallback(
    async (item: Shareable) => {
      try {
        if (navigator.share) {
          await navigator.share({ title: item.title, text: item.summary ?? item.desc, url: item.url });
          return;
        }
        await navigator.clipboard.writeText(item.url);
        showToast(t.toast.linkCopied);
      } catch {}
    },
    [showToast, t],
  );
  const markAll = useCallback(
    (ids: string[]) => {
      const fresh = ids.filter((id) => !user.seen.has(id));
      if (!fresh.length) return;
      set("seen", fresh, true);
      showToast(t.toast.markedSeen(f.num(fresh.length)), () => set("seen", fresh, false));
    },
    [set, showToast, user.seen, t, f],
  );

  return { onSeen, onFav, onShare, markAll };
}
