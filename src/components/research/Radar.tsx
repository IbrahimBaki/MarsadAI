"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Tool, Track, Verdict } from "@/lib/research";
import { useLocale } from "../LocaleProvider";
import { verdictShort } from "./parts";

// Rings, centre outwards. "Learn from" and "Watch" share a ring.
const RINGS: Verdict[][] = [["adopt"], ["adopt-part"], ["benchmark"], ["inspire", "watch"], ["avoid"]];
const RADII = [0, 72, 134, 190, 242, 284];
export const NIGHT_COLOR: Record<string, string> = {
  sdlc: "#7b95ff",
  runtime: "#b993ff",
  eval: "#ff9152",
  sandbox: "#3fcbdc",
  ops: "#63d693",
  cloud: "#aeb7cf",
};

const ringOf = (v: Verdict) => RINGS.findIndex((r) => r.includes(v));
const rad = (deg: number) => (deg * Math.PI) / 180;
const polar = (r: number, deg: number) => [r * Math.cos(rad(deg)), r * Math.sin(rad(deg))] as const;

function arcPath(r0: number, r1: number, a0: number, a1: number) {
  const [x0, y0] = polar(r1, a0);
  const [x1, y1] = polar(r1, a1);
  const [x2, y2] = polar(r0, a1);
  const [x3, y3] = polar(r0, a0);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${x0},${y0} A${r1},${r1} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${r0},${r0} 0 ${large} 0 ${x3},${y3}Z`;
}

type Blip = { tool: Tool; x: number; y: number; angle: number; ring: number };

function layout(tools: Tool[], cats: string[]): Blip[] {
  const span = 360 / cats.length;
  const out: Blip[] = [];
  cats.forEach((cat, s) => {
    RINGS.forEach((_, ring) => {
      const cell = tools
        .filter((t) => t.category === cat && ringOf(t.fit.verdict) === ring)
        .sort((a, b) => b.total - a.total);
      const n = cell.length;
      const r0 = RADII[ring] + (ring === 0 ? 24 : 12);
      const r1 = RADII[ring + 1] - 12;
      const a0 = -90 + s * span + 7;
      const a1 = -90 + (s + 1) * span - 7;
      cell.forEach((tool, k) => {
        const t = (k + 0.5) / n;
        const f = (k * 0.618 + 0.35) % 1; // golden-ratio spread across the ring's depth
        const r = r0 + (r1 - r0) * (n === 1 ? 0.5 : f);
        const angle = a0 + (a1 - a0) * t;
        const [x, y] = polar(r, angle);
        out.push({ tool, x, y, angle, ring });
      });
    });
  });
  return out;
}

export function Radar({ track, tools }: { track: Track; tools: Tool[] }) {
  const { locale, t, f } = useLocale();
  const router = useRouter();
  const cats = useMemo(() => track.categories.map((c) => c.id), [track.categories]);
  const blips = useMemo(() => layout(tools, cats), [tools, cats]);
  const [hover, setHover] = useState<string | null>(null);
  const [focusCat, setFocusCat] = useState<string | null>(null);
  const span = 360 / cats.length;
  const active = blips.find((b) => b.tool.id === hover) ?? null;
  const shortlist = [...tools.filter((x) => x.fit.verdict === "adopt"), ...tools.filter((x) => x.fit.verdict === "adopt-part")].slice(0, 9);
  const href = (id: string) => `/research/${track.id}/${id}`;

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_330px]">
      <div className="relative mx-auto w-full max-w-[700px]">
        <svg viewBox="-300 -300 600 600" className="block w-full" role="img" aria-label={t.research.radarTitle}>
          <defs>
            <radialGradient id="radar-glow">
              <stop offset="0%" stopColor="#5b7cff" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#5b7cff" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="sweep-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f5a524" stopOpacity="0" />
              <stop offset="100%" stopColor="#f5a524" stopOpacity="0.55" />
            </linearGradient>
          </defs>
          <circle r={RADII[5]} fill="url(#radar-glow)" />
          {cats.map((cat, s) =>
            RINGS.map((_, ring) => (
              <path
                key={`${cat}-${ring}`}
                d={arcPath(RADII[ring], RADII[ring + 1], -90 + s * span, -90 + (s + 1) * span)}
                fill={NIGHT_COLOR[cat]}
                fillOpacity={(focusCat && focusCat !== cat ? 0.01 : 0.035) + (ring === 0 ? 0.05 : ring === 1 ? 0.025 : 0)}
                stroke="rgb(255 255 255 / 0.09)"
                strokeWidth="1"
              />
            )),
          )}
          {RINGS.map((vs, ring) => (
            <text
              key={ring}
              x={4}
              y={-(RADII[ring] + RADII[ring + 1]) / 2 + 4}
              fill="rgb(238 241 251 / 0.55)"
              stroke="#0f1b3d"
              strokeWidth="4"
              paintOrder="stroke"
              fontSize="10.5"
              fontWeight="500"
              style={{ fontFamily: "var(--font-display)" }}
              textAnchor="start"
            >
              {vs.map((v) => verdictShort(v, locale)).join(" / ")}
            </text>
          ))}
          <g className="radar-sweep">
            <path d={`M0,0 L${RADII[5]},0 A${RADII[5]},${RADII[5]} 0 0 0 ${polar(RADII[5], -38)[0]},${polar(RADII[5], -38)[1]} Z`} fill="url(#sweep-grad)" transform="rotate(-90)" />
          </g>
          {blips.map((b) => {
            const dim = (focusCat && b.tool.category !== focusCat) || (hover && hover !== b.tool.id);
            const deep = b.tool.tier === "deep";
            const delay = ((b.angle + 90 + 360) % 360) / 360 * 1.4;
            return (
              <a
                key={b.tool.id}
                href={href(b.tool.id)}
                aria-label={`${b.tool.name}: ${track.verdicts[b.tool.fit.verdict][locale]}, ${b.tool.total}/100`}
                onClick={(e) => {
                  e.preventDefault();
                  router.push(href(b.tool.id));
                }}
                onMouseEnter={() => setHover(b.tool.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(b.tool.id)}
                onBlur={() => setHover(null)}
                className="cursor-pointer outline-none"
              >
                <g
                  className="radar-blip"
                  style={{ animationDelay: `${delay}s`, opacity: dim ? 0.22 : 1, transition: "opacity 160ms" }}
                >
                  <circle cx={b.x} cy={b.y} r="13" fill="transparent" />
                  {deep && <circle cx={b.x} cy={b.y} r="9" fill="none" stroke={NIGHT_COLOR[b.tool.category]} strokeOpacity="0.45" />}
                  <circle cx={b.x} cy={b.y} r={deep ? 5.5 : 4} fill={NIGHT_COLOR[b.tool.category]} />
                  {hover === b.tool.id && <circle cx={b.x} cy={b.y} r="12" fill="none" stroke="#f5a524" strokeWidth="2" />}
                </g>
              </a>
            );
          })}
          <circle r="3" fill="#f5a524" />
        </svg>

        {active && (
          <div
            className="pointer-events-none absolute z-10 w-[220px] rounded-xl border border-night-line bg-night/95 p-3 text-night-ink shadow-2xl backdrop-blur"
            style={{
              left: `${((active.x + 300) / 600) * 100}%`,
              top: `${((active.y + 300) / 600) * 100}%`,
              transform: `translate(-50%, ${active.y > 120 ? "calc(-100% - 18px)" : "18px"})`,
            }}
          >
            <p className="font-display text-[15px] font-semibold leading-5" dir="ltr">
              {active.tool.name}
            </p>
            <p className="mt-1 flex items-center gap-2 text-[12.5px] text-night-muted">
              <span className="size-2 rounded-full" style={{ background: NIGHT_COLOR[active.tool.category] }} />
              {track.categories.find((c) => c.id === active.tool.category)?.name[locale]}
            </p>
            <p className="mt-2 flex items-baseline justify-between text-[12.5px]">
              <span className="font-semibold text-signal">{track.verdicts[active.tool.fit.verdict][locale]}</span>
              <span className="font-display text-[17px] font-semibold tabular-nums">{f.num(active.tool.total)}</span>
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <p className="mb-2.5 text-[13px] text-night-muted">{t.research.radarLegend}</p>
          <ul className="flex flex-wrap gap-1.5">
            {track.categories.map((c) => {
              const on = focusCat === c.id;
              const n = tools.filter((x) => x.category === c.id).length;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => setFocusCat(on ? null : c.id)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] transition-colors ${
                      on ? "border-night-ink bg-night-ink text-night" : "border-night-line text-night-ink hover:border-night-muted"
                    }`}
                  >
                    <span className="size-2 rounded-full" style={{ background: NIGHT_COLOR[c.id] }} />
                    {c.name[locale]}
                    <span className={`tabular-nums ${on ? "text-night/60" : "text-night-muted"}`}>{f.num(n)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-[13px] text-night-muted">{t.research.shortlist}</p>
          <ol className="flex flex-col">
            {shortlist.map((x) => (
              <li key={x.id}>
                <Link
                  href={href(x.id)}
                  onMouseEnter={() => setHover(x.id)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(x.id)}
                  onBlur={() => setHover(null)}
                  className={`flex items-center gap-3 border-b border-night-line py-2 text-[14px] ${hover === x.id ? "text-signal" : "text-night-ink"}`}
                >
                  <span className="size-2 shrink-0 rounded-full" style={{ background: NIGHT_COLOR[x.category] }} />
                  <span className="min-w-0 flex-1 truncate" dir="ltr">
                    {x.name}
                  </span>
                  <span className={`text-[12px] ${x.fit.verdict === "adopt" ? "text-signal" : "text-night-muted"}`}>
                    {verdictShort(x.fit.verdict, locale)}
                  </span>
                  <span className="w-7 text-end font-display text-[14px] font-semibold tabular-nums">{f.num(x.total)}</span>
                </Link>
              </li>
            ))}
          </ol>
          <Link href={`/research/${track.id}?tab=matrix`} className="mt-3 inline-flex text-[13.5px] font-semibold text-signal hover:underline">
            {t.research.tabs.matrix} ({f.num(tools.length)})
          </Link>
        </div>
        <p className="text-[12.5px] leading-5 text-night-muted">{t.research.ringsNote}</p>
      </div>
    </div>
  );
}
