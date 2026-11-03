# Research guide (AI Champs tracks)

Marsad's research hub (`/research`) serves the three AI Champs tracks. The daily task keeps it current.
Goal: **never reinvent the wheel.** Anything that already does part of what a track needs must show up here,
with an honest verdict, before Azm builds it.

All research content is written in **English** (it is shared with the wider team and exported to Confluence).
UI labels are bilingual; Arabic UI text is Modern Standard Arabic. Never mention private people, internal
projects beyond the track names, or confidential details. squad-kit and azm-harness may be named.

## Files

| File | What |
| --- | --- |
| `research/tracks.json` | Tracks: question, scope, assumptions, categories, criteria (weights), verdicts, watch keywords. `status: active` or `planned`. |
| `research/<track>/tools/<category>.json` | Dossiers, one file per category. |
| `research/<track>/articles.json` | Articles, papers, case studies, lists. |
| `research/<track>/synthesis.json` | Bottom line, prior art, adopt-vs-build architecture, build list, phases, metrics, risks, decisions. |
| `research/<track>/index.json` | Every project found on the awesome lists (light entries). |
| `config/watch.json` | Repos/lists/topics the morning collector watches; entries with `"track"` feed the track's Radar tab. |

## Dossier schema

```json
{
  "id": "kebab-id", "name": "Display name", "category": "<category id from tracks.json>",
  "kind": "open-source | commercial | open-core", "vendor": "...", "repo": "owner/repo or null",
  "url": "https://...", "license": "SPDX or plain text", "pricing": "plain text with (Month YYYY) if a price",
  "status": "active | beta | caution | sunsetting", "version": "optional", "tier": "deep | brief",
  "summary": "2-3 sentences: what it is.",
  "how": "How it works, concretely.",
  "features": [], "strengths": [], "weaknesses": [], "gaps": ["what it lacks for Azm"],
  "fit": { "verdict": "adopt | adopt-part | benchmark | inspire | watch | avoid", "role": "its role for Azm, one or two sentences" },
  "scores": { "<criterion id>": 1-5 },
  "links": [["Label", "https://..."]], "sources": ["https://..."]
}
```

- `deep` dossiers need ≥4 features, ≥3 strengths, ≥2 weaknesses, ≥1 gap and ≥2 sources; read the README
  (and docs/blog) before writing. `brief` needs ≥1 of each list.
- Scores are judgments against the track's criteria; keep them consistent with similar tools.
- Verify license, latest release and last commit from the repo (`gh api repos/<repo>`, `gh release list`).
  Flag unmaintained repos (`status: "caution"`) and acquisitions.

## Daily research run

1. Read `research/tracks.json`. Work on every track with `status: "active"`.
2. **Radar**: run `npm run collect` (or use today's `signals/*.json`). For each signal with the track id,
   update the matching dossier (version, status, notable changes) or add a new dossier.
3. **Search** the web and GitHub with the track's `watch` keywords (last 7 days first, then broader):
   new tools, releases, acquisitions, benchmarks, papers, case studies ("we benchmarked…", "how we built…").
4. **Prior-art alert**: if something new overlaps what Azm plans to build (see `synthesis.json` →
   `architecture` rows with `decision: "build"` and `buildList`), add it as a dossier, add it to
   `synthesis.priorArt`, and adjust the recommendation if needed. Mention it first in the commit message.
5. Add useful articles to `articles.json` (`must` only for things that change decisions; include `why`).
6. Add newly found projects to `index.json`; give the important ones a dossier.
7. Update `checked` dates in every file you touched.
8. Run `npm run validate:research` and fix every error, then `npm run build`.
9. Commit as `research: <track> — <short summary>` and push to main.

Planned tracks (`status: "planned"`) are filled the same way when they become active: categories, criteria,
dossiers, articles, synthesis.
