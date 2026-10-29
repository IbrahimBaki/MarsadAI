# Daily digest guide

This file is the brief for the scheduled task that writes Marsad's daily digest.
Follow it exactly. The output is one new file, `content/YYYY-MM-DD.json`, committed and pushed to `main`.
Vercel deploys automatically on push.

## Reader

Ibrahim, a Laravel developer (modular ERP, nwidart modules, Spatie) who works daily in
Claude Code CLI on Linux, plus a few friends with similar interests. He also cares about
AI video editing, audio and image/design tools. He wants to know **what's new, whether it's
worth his time, and why** — not a news dump.

## Steps

1. `npm ci` (first run only, if `node_modules` is missing).
2. Run `npm run known -- 30` to see what was already published in the last 30 days.
   Never repeat a URL, and don't re-publish the same news under a different link
   unless there is a genuinely new development (then say what's new in the title).
3. Research what appeared **since the previous digest** (normally the last 24–48 hours;
   if the last digest is older, cover the whole gap). Check, at minimum:
   - Claude Code releases: https://github.com/anthropics/claude-code/releases
   - Anthropic news and docs changes (anthropic.com/news, claude.com, platform.claude.com release notes)
   - New Claude skills / plugins / agent harnesses (GitHub topics `claude-skills`, `claude-code`, `agent-skills`)
   - New or notable MCP servers (GitHub topic `mcp-server`, official registries, vendor launches)
   - GitHub Trending and Hacker News front page — only AI-for-developers items
   - Major model launches and API changes (OpenAI, Google, Meta, Mistral, DeepSeek, etc.)
   - Laravel / PHP + AI: laravel-news.com, laravel.com/blog, packagist new AI packages
   - AI video, editing, audio and voice tools (Kling, Runway, Veo, Seedance, ElevenLabs, CapCut, etc.)
   - AI image and design tools (Figma, Canva, FLUX, Midjourney, Recraft, etc.)
   Open the primary source for every item you keep; don't rely on search snippets.
4. Pick **8–18 items**. Quality over quantity: skip rumours, listicles, SEO posts,
   minor patch releases, and anything you couldn't verify from a primary or reputable source.
   On a slow day fewer items is fine; never pad.
5. Write `content/YYYY-MM-DD.json` (today's date in Africa/Cairo) using the schema below.
6. Run `npm run validate -- YYYY-MM-DD` and fix every error.
7. Commit with message `digest: YYYY-MM-DD (N items)` and push to `main`.
   If the push is rejected, `git pull --rebase origin main` and push again.

If today's file already exists, stop — the digest already ran.

## Essentials library

`content/essentials.json` holds the evergreen "must know" tools and references per section
(the app's «الأساسيات» view). `npm run known` lists them with `essentials` instead of a date.

- Don't add an essential to the daily digest just because it exists. Only report it when
  something genuinely new happened to it (a major release, a pricing change), and say what's new.
- Leave `essentials.json` alone in the daily run, unless a tool has clearly become a standard
  in its section. Then add it there (id starting with `ess-`, same item schema) and bump `updated`.

## Schema

```json
{
  "date": "2026-10-29",
  "headline": "One or two sentences in Arabic: the 2–3 things that matter most today.",
  "items": [
    {
      "id": "kebab-case-unique-id",
      "section": "claude | skills | mcp | repos | models | laravel | video | design",
      "kind": "release | repo | skill | mcp | model | tool | article | video",
      "title": "Short Arabic title; product names stay in English",
      "summary": "2–3 sentences in Arabic: what it is and what's new. ≤ 420 chars.",
      "why": "1–2 sentences in Arabic: why it matters to this reader / what to do. ≤ 300 chars.",
      "url": "https://primary-source",
      "source": "domain.com",
      "importance": 3,
      "tags": ["up to 6 short tags"]
    }
  ]
}
```

### Sections

| id | What goes there |
|---|---|
| `claude` | Claude Code, Claude apps, Anthropic API, models and docs |
| `skills` | Skills, plugins, subagents, agent harnesses and workflows for Claude Code and similar agents |
| `mcp` | MCP servers, connectors, MCP spec changes |
| `repos` | Developer tools and repos with real traction (not Claude-specific) |
| `models` | New models and major API/pricing changes from any lab |
| `laravel` | Laravel / PHP + AI packages, SDK releases, tutorials worth reading |
| `video` | AI video generation, editing, audio, voice, subtitles |
| `design` | AI image generation, UI/UX design tools, branding |

### Importance

- `3` — must see: affects his daily tools, a big launch, or a time-limited deal.
- `2` — useful: worth a look this week.
- `1` — for awareness.

Aim for at most 3–4 items at importance 3 per day.

## Writing style

- Arabic, light Egyptian register, clear and direct (like explaining to a developer friend).
  Keep product, library and technical names in English.
- No hype words, no exclamation marks, no emojis.
- Put numbers and dates in the text when they matter (prices, limits, deadlines).
- `why` must be specific to the reader (his Laravel/ERP work, Claude Code workflow,
  video editing, or design) — never generic ("this is useful for developers").
- Never invent facts. If a detail is unclear, leave it out.
