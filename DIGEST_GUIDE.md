# Daily digest guide

This file is the brief for the scheduled task that writes Marsad's daily digest.
Follow it exactly. The output is one new file, `content/YYYY-MM-DD.json`, committed and pushed to `main`.
Vercel deploys automatically on push.

**The app is bilingual — English (default) and Arabic.** All Arabic is **Modern Standard Arabic (الفصحى)**,
never Egyptian or any other dialect. Every item is written in Arabic at the top
level *and* in English inside its `en` block. The validator rejects items without a complete `en` block.

## Reader

Marsad is shared with many people: developers of all kinds (backend, frontend, full-stack, DevOps),
people building with AI agents and coding tools, and creators who care about AI video, audio and
design tools. Write for **that audience**, never for one specific person.

Readers want to **follow everything relevant from inside the app**: what's new, whether it's worth
their time, and why. Each item's details page should tell them enough that they don't need to go
looking elsewhere.

**Never mention a specific person, company, internal project or private setup** (no project names,
no "you use X every day", no "your ERP"). Examples must be general and recognisable to any
developer: "a Laravel app", "an admin dashboard", "a SaaS", "a large modular codebase",
"an online store", "a team's CI pipeline".

## How the app is organised

- `config/sections.json` — the 17 sections, grouped (AI for developers / software engineering /
  automation & productivity / creative). **Each section has a `scope`, `keywords` and `sources`.**
  This is your checklist: you research section by section.
- `content/essentials/*.json` — the evergreen library ("Essentials" / "الأساسيات"): the must-know tools per section.
- `signals/YYYY-MM-DD.json` — raw signals collected every morning by `scripts/collect.mjs`
  (GitHub Action at 07:17 Cairo): links newly added to watched awesome lists, new releases of
  watched repos, and fast-growing new repos per topic. The app shows all of them raw in the Radar («الرادار»).
- `content/stats.json` — GitHub stars / releases for every repo the app references (also from the Action).

## Steps

1. `npm ci` (if `node_modules` is missing).
2. Run `npm run known -- 30` to see what was already published (last 30 days + essentials).
   Never repeat a URL; don't re-publish the same news under a different link. Essentials are
   already known — report one only when something genuinely new happened to it (major release,
   pricing change, shutdown) and say what's new in the title.
3. Read the newest `signals/*.json` files since the previous digest. If today's file is missing
   (the Action didn't run), run `npm run collect` yourself (git-only parts work without a token).
   Signals are **candidates**, not news by themselves:
   - **releases**: include a release only if it matters to the reader (Claude Code, Laravel/Boost/AI SDK,
     MCP servers he'd use, Playwright, major agent tools). Open the release notes and summarise what changed.
   - **awesome**: pick the genuinely useful additions (official vendor skills/MCP servers, tools with
     real traction, things relevant to Laravel/PHP, design, testing). Open each one's repo/README.
     Ignore low-effort or duplicate entries. Typically 2–6 per day.
   - **trending**: new repos growing fast. Include only after reading the README and judging it useful.
4. Go through **every section** in `config/sections.json` and research it using its `scope`,
   `keywords` and `sources` (web search + opening primary sources). Note what appeared since the
   previous digest. Skip a section if nothing worth reporting happened — never pad.
5. Pick **10–20 items** in total. Quality over quantity: skip rumours, listicles, SEO posts, minor
   patch releases, and anything you couldn't verify from a primary or reputable source.
   For GitHub items, read the README (clone with `git clone --depth 1 --filter=blob:none`) before
   writing — install commands must come from the README or official docs, never from memory.
   Check the README for "deprecated / archived / no longer maintained / moved" notices.
6. Write `content/YYYY-MM-DD.json` (today's date in Africa/Cairo) using the schema below, with the
   **full details** for each item (they power the details page), in Arabic **and** English (`en`),
   plus `headline_en`.
7. Run `npm run validate -- YYYY-MM-DD` and fix every error.
8. Commit with message `digest: YYYY-MM-DD (N items)` and push to `main`.
   If the push is rejected, `git pull --rebase origin main` and push again.

If today's file already exists, stop — the digest already ran.

## Schema

```json
{
  "date": "2026-10-29",
  "headline": "One or two sentences in Arabic: the 2–3 things that matter most today.",
  "headline_en": "The same headline in English.",
  "items": [
    {
      "id": "kebab-case-unique-id",
      "section": "one of the ids in config/sections.json",
      "kind": "release | repo | skill | plugin | mcp | library | tool | model | article | video",
      "title": "Short Arabic title; product names stay in English",
      "summary": "2–3 sentences in Arabic: what it is and what's new. ≤ 420 chars.",
      "why": "1–2 sentences in Arabic: the value it adds and who it's for, with a general example if useful. ≤ 320 chars.",
      "about": "REQUIRED. The full explanation for the details page: 2–4 short paragraphs separated by a blank line (\\n\\n). What it is, how it works, what changed, limits/caveats.",
      "features": ["3–5 short Arabic bullets of the main capabilities or changes"],
      "install": [{ "label": "Arabic label", "cmd": "exact command from the README/docs" }],
      "usage": ["optional example prompts or commands"],
      "requirements": ["optional, e.g. Node.js 18+"],
      "repo": "owner/name (when it lives on GitHub — stats come from it)",
      "pricing": { "model": "oss | free | freemium | paid", "note": "optional Arabic detail, e.g. خطة مجانية محدودة" },
      "alternatives": ["ids of related items, e.g. ess-playwright-mcp"],
      "links": [{ "label": "Arabic label", "url": "https://primary-source" }],
      "url": "https://primary-source",
      "source": "domain.com",
      "importance": 3,
      "tags": ["up to 6 short tags"],
      "en": {
        "title": "English title",
        "summary": "English summary, ≤ 480 chars",
        "why": "English why, ≤ 380 chars",
        "about": "English about, same paragraphs (\\n\\n)",
        "features": ["same number of entries as features, same order"],
        "usage": ["same count as usage (translate prompts; keep commands as-is)"],
        "requirements": ["same count as requirements"],
        "install": ["one English label per install step, same order (commands are shared)"],
        "links": ["one English label per link, same order (URLs are shared)"],
        "pricingNote": "English pricing.note, when pricing.note is set"
      }
    }
  ]
}
```

- `pricing` is required for every kind except `article`, `release` and `video`.
  `oss` = free and open source; `free` = free but not open source; `freemium` = free tier + paid;
  `paid` = no meaningful free tier (subscriptions, usage-based APIs).
- `install`, `usage`, `requirements`, `alternatives`, `links`, `repo` are optional but include them
  whenever they apply. Alternatives should point at essentials ids (`npm run known` lists them).

### Importance

- `3` — must see: affects tools many readers use daily, a big launch, a security issue, or a time-limited deal.
- `2` — useful: worth a look this week.
- `1` — for awareness.

Aim for at most 3–5 items at importance 3 per day.

## Essentials library

`content/essentials/NN-<section>.json` holds the evergreen "must know" tools per section.
In the daily run, leave essentials alone unless a tool has clearly become a standard in its
section (e.g. it keeps showing up in signals with strong traction). Then add it to the right
section file (id starting with `ess-`, same schema, `features` with at least 2 entries).

## Writing style

- Arabic: **Modern Standard Arabic (فصحى)** only — clear, simple and direct, like a good technical
  article. No Egyptian or other dialect words (no "بتاع، عشان، دلوقتي، كده، مش، إيه، اللي، هيعمل…";
  write "الخاص بـ، لأن/لكي، الآن، هكذا، ليس/لا، ماذا، الذي/التي، سيعمل…").
  Keep product, library and technical names in English; prefer common Arabic terms where they exist
  (مستودع، نموذج، مهارة، إضافة، الواجهة البرمجية، سطر الأوامر).
  Example — dialect: «لو بتستخدم Laravel، الباكدج ده بيوفّر عليك وقت كتير» →
  فصحى: «إذا كنت تستخدم Laravel، فهذه الحزمة توفّر عليك وقتًا كبيرًا».
- English (`en`, `headline_en`): plain, natural English with the same facts — a faithful
  translation, not a rewrite. Western digits, no Arabic letters. Same tone rules as below.
- No hype words, no exclamation marks, no emojis.
- Put numbers and dates in the text when they matter (prices, limits, deadlines, versions).
- `why` is the concrete value the item adds: what you can now do, save, avoid or improve, plus
  who it's for. Use a short general example when it helps ("e.g. run Pest after every edit",
  "e.g. a dashboard for live sales"). Never write it for one person or project, and never be vague
  ("this is useful for developers").
- Never invent facts, numbers or commands. If a detail is unclear, leave it out.
