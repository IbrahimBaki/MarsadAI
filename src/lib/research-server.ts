import "server-only";
import type { Tool } from "./research";

/** The few tool fields the comparison views need, keyed by id (keeps client payloads small). */
export function toolMap(tools: Tool[]) {
  return Object.fromEntries(
    tools.map((t) => [
      t.id,
      {
        id: t.id,
        name: t.name,
        category: t.category,
        fit: t.fit,
        total: t.total,
        kind: t.kind,
        license: t.license,
        strengths: t.strengths,
        weaknesses: t.weaknesses,
        summary: t.summary,
      },
    ]),
  );
}
