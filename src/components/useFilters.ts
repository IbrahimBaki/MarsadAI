"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { SECTION_BY_ID, type SectionId } from "@/lib/sections";
import type { PricingModel } from "@/lib/types";

export type Filters = {
  /** feed view: new | all | fav | seen */
  v: string;
  s: SectionId | null;
  /** kind */
  k: string | null;
  /** pricing: "free" means oss + free */
  p: "free" | "freemium" | "paid" | null;
  hot: boolean;
  q: string;
};

export function priceMatches(model: PricingModel | undefined, p: Filters["p"]) {
  if (!p) return true;
  if (!model) return false;
  if (p === "free") return model === "oss" || model === "free";
  return model === p;
}

/** Filters live in the URL, so they survive reloads and can be shared. */
export function useFilters(defaultView = "new") {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters = useMemo<Filters>(() => {
    const s = params.get("s") as SectionId | null;
    const p = params.get("p");
    return {
      v: params.get("v") ?? defaultView,
      s: s && SECTION_BY_ID[s] ? s : null,
      k: params.get("k"),
      p: p === "free" || p === "freemium" || p === "paid" ? p : null,
      hot: params.get("hot") === "1",
      q: params.get("q") ?? "",
    };
  }, [params, defaultView]);

  const update = useCallback(
    (patch: Partial<Filters>) => {
      const next = { ...filters, ...patch };
      const qs = new URLSearchParams();
      if (next.v && next.v !== defaultView) qs.set("v", next.v);
      if (next.s) qs.set("s", next.s);
      if (next.k) qs.set("k", next.k);
      if (next.p) qs.set("p", next.p);
      if (next.hot) qs.set("hot", "1");
      if (next.q.trim()) qs.set("q", next.q.trim());
      const str = qs.toString();
      router.replace(str ? `${pathname}?${str}` : pathname, { scroll: false });
    },
    [filters, router, pathname, defaultView],
  );

  return { filters, update };
}
