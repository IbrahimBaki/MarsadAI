"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { FeedItem, FeedPayload } from "@/lib/types";
import { useUserState } from "./useUserState";

type UserState = ReturnType<typeof useUserState>;

type AppValue = {
  feed: FeedPayload | null;
  loadError: boolean;
  byId: Map<string, FeedItem>;
  user: UserState;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  toast: { text: string; undo?: () => void } | null;
  showToast: (text: string, undo?: () => void) => void;
};

const Ctx = createContext<AppValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [feed, setFeed] = useState<FeedPayload | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<AppValue["toast"]>(null);
  const user = useUserState();

  useEffect(() => {
    fetch("/api/items")
      .then((r) => {
        if (r.status === 401) {
          window.location.href = "/login";
          return null;
        }
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => data && setFeed(data))
      .catch(() => setLoadError(true));

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const byId = useMemo(() => {
    const m = new Map<string, FeedItem>();
    feed?.essentials.forEach((i) => m.set(i.id, i));
    feed?.items.forEach((i) => m.set(i.id, i));
    return m;
  }, [feed]);

  const value = useMemo<AppValue>(
    () => ({
      feed,
      loadError,
      byId,
      user,
      drawerOpen,
      setDrawerOpen,
      toast,
      showToast: (text, undo) =>
        setToast({
          text,
          undo: undo
            ? () => {
                undo();
                setToast(null);
              }
            : undefined,
        }),
    }),
    [feed, loadError, byId, user, drawerOpen, toast],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp outside AppProvider");
  return v;
}
