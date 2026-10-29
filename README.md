# Marsad · مرصد

**by Ibrahim Baghdadi**

Everything new in AI for developers, filtered day by day: Claude, skills, MCP, developer tools, models, Laravel, video editing and design. The app is bilingual — **English (default) and Arabic** — switchable from the sidebar or the login page.

- **Daily digest**: a scheduled task researches every section and writes `content/YYYY-MM-DD.json` following [DIGEST_GUIDE.md](DIGEST_GUIDE.md), in Arabic and English, then pushes. Vercel deploys automatically.
- **Essentials**: `content/essentials/` holds the must-know tools in every section, each with a full details page.
- **Radar**: `scripts/collect.mjs` runs every morning in a GitHub Action (`.github/workflows/collect.yml`) and collects new awesome-list additions, new releases, rising repos and GitHub stars. Settings live in `config/watch.json`.
- **Sections**: `config/sections.json` defines each section (names in both languages), its scope, keywords and the sources the daily task searches.
- **Per-user state** (seen / favorites): Upstash Redis from the Vercel Marketplace.
- **Sign-in**: simple users from the `AUTH_USERS` environment variable.
- **PWA**: install it on your phone; it opens the last content it loaded even offline.

## Deploy on Vercel (once)

1. On Vercel: **Add New → Project**, then import this repo. The default settings are fine.
2. In **Settings → Environment Variables** add:
   - `AUTH_SECRET`: a long random string (`openssl rand -base64 32`)
   - `AUTH_USERS`: for example `ibrahim:a-strong-password`
3. In **Storage → Marketplace** choose **Upstash → Redis**, create it and connect it to the project. Its env vars are added automatically.
4. **Redeploy** so the new variables take effect.

## Adding a user

Add them to `AUTH_USERS`, separating users with `;`:

```
ibrahim:pass1;sara:pass2
```

To avoid storing the password in plain text:

```bash
npm run hash-password -- sara "her-password"
# sara:scrypt.<salt>.<hash>  ← put this line in place of sara:pass2
```

Redeploy after changing any variable.

## Local development

```bash
npm install
npm run dev        # http://localhost:3000 — user demo, password demo
npm run validate   # checks the content files (including the English versions)
npm run known      # every URL already published
npm run collect    # collects radar signals (additions and releases); stars need GITHUB_TOKEN
```

Without Redis, seen and favorites are kept in memory and are lost when the server stops.

## Languages

- UI strings: `src/lib/i18n.ts` (`en` and `ar`). The language is stored in the `marsad-lang` cookie; English is the default.
- Content: each item is written in Arabic at the top level, with its English version in an `en` block (see DIGEST_GUIDE.md). `npm run validate` rejects items without it.
- Section, kind and pricing names: `config/sections.json` (`{ "en": …, "ar": … }`).

## Sections

Defined in `config/sections.json`. If you add a section, also add its id to `SectionId` in `src/lib/sections.ts`.

---

## بالعربي

مرصد بيجمع لك كل جديد في عالم الـ AI للمبرمجين يوم بيوم. التطبيق بقى بلغتين، والإنجليزي هو الافتراضي، وتقدر تحوّل للعربي من القايمة الجانبية أو من صفحة الدخول. خطوات النشر على Vercel فوق: اعمل Import للريبو، وضيف `AUTH_SECRET` و`AUTH_USERS`، واربط Upstash Redis، وبعدين Redeploy.

© Ibrahim Baghdadi
