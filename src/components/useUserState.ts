"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type List = "seen" | "fav";

const CACHE_KEY = "marsad-state-cache";
const PENDING_KEY = "marsad-pending";

type Op = { list: List; ids: string[]; on: boolean };

function readPending(): Op[] {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function writePending(ops: Op[]) {
  try {
    if (ops.length) localStorage.setItem(PENDING_KEY, JSON.stringify(ops));
    else localStorage.removeItem(PENDING_KEY);
  } catch {}
}

function send(op: Op) {
  return fetch("/api/state", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(op),
  }).then((r) => {
    if (!r.ok) throw new Error(String(r.status));
  });
}

/** Sends queued changes made while offline, in order. */
async function flushPending() {
  let ops = readPending();
  while (ops.length) {
    await send(ops[0]);
    ops = readPending().slice(1);
    writePending(ops);
  }
}

function readCache(): { seen: string[]; fav: string[] } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Seen / favourite ids for the signed-in user. Updates are optimistic and
 * written through to the server; a local copy keeps the app usable offline.
 */
export function useUserState() {
  const [seen, setSeen] = useState<Set<string>>(() => new Set());
  const [fav, setFav] = useState<Set<string>>(() => new Set());
  const [user, setUser] = useState<string | null>(null);
  const [persistent, setPersistent] = useState(true);
  const [ready, setReady] = useState(false);
  /** "offline" (using the cached copy) or "queued" (changes waiting to sync). */
  const [error, setError] = useState<"offline" | "queued" | null>(null);
  const latest = useRef({ seen, fav });
  useEffect(() => {
    latest.current = { seen, fav };
  }, [seen, fav]);

  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setSeen(new Set(cached.seen));
      setFav(new Set(cached.fav));
    }
    flushPending()
      .catch(() => {})
      .then(() => fetch("/api/state", { cache: "no-store" }))
      .then(async (r) => {
        if (r.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (!r.ok) throw new Error();
        const data = await r.json();
        const next = { seen: new Set<string>(data.seen), fav: new Set<string>(data.fav) };
        // Changes still waiting to be sent win over the server copy.
        for (const op of readPending()) {
          for (const id of op.ids) {
            if (op.on) next[op.list].add(id);
            else next[op.list].delete(id);
          }
        }
        setSeen(next.seen);
        setFav(next.fav);
        setUser(data.user);
        setPersistent(data.persistent);
      })
      .catch(() => setError("offline"))
      .finally(() => setReady(true));

    const onOnline = () =>
      flushPending()
        .then(() => setError(null))
        .catch(() => {});
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ seen: [...seen], fav: [...fav] }));
    } catch {}
  }, [seen, fav, ready]);

  const set = useCallback((list: List, ids: string[], on: boolean) => {
    const current = list === "seen" ? latest.current.seen : latest.current.fav;
    const changed = ids.filter((id) => current.has(id) !== on);
    if (changed.length === 0) return;
    const update = (prev: Set<string>) => {
      const next = new Set(prev);
      for (const id of changed) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    };
    if (list === "seen") setSeen(update);
    else setFav(update);

    const op: Op = { list, ids: changed, on };
    const queued = readPending();
    const job = queued.length ? Promise.reject(new Error("queued")) : send(op);
    job
      .then(() => setError(null))
      .catch(() => {
        writePending([...readPending(), op]);
        setError("queued");
      });
  }, []);

  return { seen, fav, user, persistent, ready, error, set };
}
