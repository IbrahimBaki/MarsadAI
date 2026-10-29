#!/usr/bin/env node
// Collects "signals" for the daily digest and repo stats for the app.
//
//  1. awesome lists  — links newly added to each list in config/watch.json since the last run
//  2. releases       — new tags of watched repos
//  3. trending       — new fast-growing repos per GitHub topic   (needs GITHUB_TOKEN)
//  4. stats          — stars / language / license / latest release for every repo the app shows
//                                                                 (needs GITHUB_TOKEN)
//
// 1 and 2 only use git, so they run anywhere. 3 and 4 use the GitHub REST API and run in
// the GitHub Action (.github/workflows/collect.yml), which provides GITHUB_TOKEN.
//
// Output: signals/YYYY-MM-DD.json (what's new today), signals/state.json (where we left off),
//         content/stats.json (repo stats used by the app).
//
// Usage: npm run collect             (everything possible in this environment)
//        npm run collect -- --since 14   (first run: report awesome additions of the last 14 days)
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const watch = JSON.parse(readFileSync(path.join(root, "config/watch.json"), "utf8"));
const cacheDir = path.join(root, ".cache/watch");
const signalsDir = path.join(root, "signals");
const statePath = path.join(signalsDir, "state.json");
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
const args = process.argv.slice(2);
const firstRunDays = Number(args[args.indexOf("--since") + 1]) || 14;

mkdirSync(cacheDir, { recursive: true });
mkdirSync(signalsDir, { recursive: true });

const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
const state = existsSync(statePath)
  ? JSON.parse(readFileSync(statePath, "utf8"))
  : { awesome: {}, releases: {}, trending: {} };
state.awesome ??= {};
state.releases ??= {};
state.trending ??= {};

const git = (cwd, ...a) =>
  execFileSync("git", a, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 << 20 });
const log = (...m) => console.error("[collect]", ...m);
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

// ---------- 1. awesome lists ----------

const LINK = /\[([^\]]{1,200})\]\((https?:\/\/[^)\s]+)\)/g;

// Strips emoji, markdown emphasis and extra spaces.
const clean = (t) =>
  t
    .replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\uFE0F\u200D]/gu, "")
    .replace(/[*_`#[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();

function linksIn(markdown) {
  // url -> { name, desc, heading }
  const out = new Map();
  let heading = "";
  for (const raw of markdown.split("\n")) {
    const line = raw.trim();
    const h = line.match(/^#{1,6}\s+(.*)$/);
    if (h) {
      heading = clean(h[1].replace(/<[^>]+>/g, "").replace(/\(.*?\)/g, ""));
      continue;
    }
    if (!/^([-*+]|\d+\.|\|)/.test(line)) continue; // list items and table rows only
    const m = [...line.matchAll(LINK)];
    if (!m.length) continue;
    const [, name, url] = m[0];
    if (/shields\.io|badge|img\.|\.svg|\.png|#/.test(url)) continue;
    const key = url.replace(/\/+$/, "").replace(/^http:/, "https:").toLowerCase();
    if (out.has(key)) continue;
    const desc = clean(line
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[\s*\]\([^)]*\)/g, "")
      .replace(LINK, "$1")
      .replace(/^([-*+]|\d+\.)\s*/, "")
      .replace(/\|/g, " ")
      .replace(/[*_`]/g, "")
    ).slice(0, 400);
    out.set(key, { name: name.replace(/[*_`]/g, "").trim(), url, desc, heading });
  }
  return out;
}

function readmeAt(dir, rev) {
  const files = git(dir, "ls-tree", "--name-only", rev)
    .split("\n")
    .filter((f) => /^readme(\.[a-z]+)?$/i.test(f));
  return files.length ? git(dir, "show", `${rev}:${files[0]}`) : "";
}

function collectAwesome() {
  const found = [];
  for (const { repo, section } of watch.awesome) {
    const dir = path.join(cacheDir, repo.replace("/", "__"));
    const prev = state.awesome[repo];
    const since = prev?.date ?? daysAgo(firstRunDays);
    const shallowSince = new Date(new Date(since).getTime() - 3 * 86400000).toISOString();
    try {
      if (!existsSync(dir)) {
        git(cacheDir, "clone", "--bare", "--filter=blob:none", `--shallow-since=${shallowSince}`,
          `https://github.com/${repo}.git`, dir);
      } else {
        git(dir, "fetch", "--filter=blob:none", `--shallow-since=${shallowSince}`, "origin", "+HEAD:HEAD");
      }
    } catch {
      // A list with no commits in the window can't be shallow-cloned by date: fall back to depth 1.
      try {
        if (!existsSync(dir))
          git(cacheDir, "clone", "--bare", "--filter=blob:none", "--depth=1", `https://github.com/${repo}.git`, dir);
      } catch (e2) {
        log(`skip ${repo}: ${String(e2.stderr || e2.message).split("\n")[0]}`);
        continue;
      }
    }
    const head = git(dir, "rev-parse", "HEAD").trim();
    let base = prev?.sha;
    if (base) {
      try {
        git(dir, "cat-file", "-e", `${base}^{commit}`);
      } catch {
        base = null;
      }
    }
    if (!base) {
      base = git(dir, "rev-list", "-1", `--before=${since}`, "HEAD").trim() ||
        git(dir, "rev-list", "--max-parents=0", "HEAD").trim().split("\n").pop();
    }
    if (base && base !== head) {
      const before = linksIn(readmeAt(dir, base));
      const after = linksIn(readmeAt(dir, head));
      let n = 0;
      for (const [key, link] of after) {
        if (before.has(key)) continue;
        found.push({ list: repo, section, ...link });
        n++;
      }
      log(`${repo}: ${n} new link(s)`);
    } else {
      log(`${repo}: no changes`);
    }
    state.awesome[repo] = { sha: head, date: new Date().toISOString() };
  }
  return found;
}

// ---------- 2. releases (tags) ----------

function versionKey(tag) {
  const m = tag.match(/(\d+)\.(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!m) return null;
  const pre = /-(alpha|beta|rc|canary|next|dev|pre|nightly|insiders|preview)/i.test(tag);
  return { parts: [m[1], m[2], m[3] ?? 0, m[4] ?? 0].map(Number), pre };
}
const cmp = (a, b) => {
  for (let i = 0; i < 4; i++) if (a.parts[i] !== b.parts[i]) return a.parts[i] - b.parts[i];
  return 0;
};

function collectReleases() {
  const found = [];
  for (const { repo, section, tags: tagPattern } of watch.releases) {
    const accept = new RegExp(tagPattern ?? "^v?\\d+\\.\\d+");
    let out;
    try {
      out = execFileSync("git", ["ls-remote", "--tags", "--refs", `https://github.com/${repo}.git`], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 60000,
        maxBuffer: 256 << 20,
      });
    } catch (e) {
      log(`skip ${repo}: ${String(e.stderr || e.message).split("\n")[0]}`);
      continue;
    }
    const tags = out
      .split("\n")
      .map((l) => l.split("refs/tags/")[1])
      .filter((t) => t && accept.test(t))
      .map((t) => ({ tag: t, v: versionKey(t) }))
      .filter((t) => t.v && !t.v.pre);
    if (!tags.length) continue;
    tags.sort((a, b) => cmp(b.v, a.v));
    const latest = tags[0].tag;
    const prev = state.releases[repo];
    if (prev !== latest) {
      found.push({ repo, section, tag: latest, previous: prev ?? null, url: `https://github.com/${repo}/releases/tag/${encodeURIComponent(latest)}` });
      state.releases[repo] = latest;
    }
  }
  log(`releases: ${found.length} new`);
  return found;
}

// ---------- 3 & 4. GitHub REST (token only) ----------

async function gh(pathname) {
  const res = await fetch(`https://api.github.com${pathname}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "marsad-collector",
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${pathname}: HTTP ${res.status}`);
  return res.json();
}

async function pool(items, size, fn) {
  const results = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (i < items.length) {
        const idx = i++;
        try {
          results[idx] = await fn(items[idx]);
        } catch (e) {
          log(String(e.message));
        }
      }
    }),
  );
  return results;
}

async function collectTrending() {
  const found = [];
  const since = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
  for (const { topic, section } of watch.topics) {
    const data = await gh(
      `/search/repositories?q=${encodeURIComponent(`topic:${topic} created:>=${since}`)}&sort=stars&order=desc&per_page=10`,
    );
    for (const r of data?.items ?? []) {
      if (r.stargazers_count < 50) continue;
      const known = state.trending[r.full_name];
      found.push({
        repo: r.full_name,
        section,
        topic,
        url: r.html_url,
        description: r.description,
        stars: r.stargazers_count,
        created: r.created_at,
        language: r.language,
        new: !known,
      });
      state.trending[r.full_name] = today;
    }
  }
  log(`trending: ${found.length} repo(s)`);
  return found;
}

function reposInContent() {
  const dir = path.join(root, "content");
  const repos = new Set(watch.releases.map((r) => r.repo));
  const scan = (items) => items?.forEach((it) => it.repo && repos.add(it.repo));
  for (const f of readdirSync(dir)) {
    if (/^\d{4}-\d{2}-\d{2}\.json$/.test(f)) scan(JSON.parse(readFileSync(path.join(dir, f), "utf8")).items);
  }
  const essDir = path.join(dir, "essentials");
  if (existsSync(essDir)) {
    for (const f of readdirSync(essDir).filter((f) => f.endsWith(".json"))) {
      scan(JSON.parse(readFileSync(path.join(essDir, f), "utf8")).items);
    }
  }
  return [...repos];
}

async function collectStats() {
  const repos = reposInContent();
  const stats = {};
  await pool(repos, 6, async (full) => {
    const r = await gh(`/repos/${full}`);
    if (!r) return;
    const rel = await gh(`/repos/${full}/releases/latest`);
    stats[full] = {
      stars: r.stargazers_count,
      forks: r.forks_count,
      language: r.language,
      license: r.license?.spdx_id && r.license.spdx_id !== "NOASSERTION" ? r.license.spdx_id : null,
      pushedAt: r.pushed_at,
      archived: r.archived,
      release: rel ? { tag: rel.tag_name, date: rel.published_at } : null,
    };
  });
  const sorted = Object.fromEntries(Object.entries(stats).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(
    path.join(root, "content/stats.json"),
    JSON.stringify({ updated: new Date().toISOString(), repos: sorted }, null, 2) + "\n",
  );
  log(`stats: ${Object.keys(stats).length}/${repos.length} repo(s)`);
}

// ---------- run ----------

const signals = { date: today, generated: new Date().toISOString(), awesome: [], releases: [], trending: [] };
signals.awesome = collectAwesome();
signals.releases = collectReleases();
if (token) {
  // The REST part only works where the token is valid for the API (the GitHub Action).
  try {
    signals.trending = await collectTrending();
    await collectStats();
  } catch (e) {
    log(`GitHub API unavailable here, skipping trending and stats: ${e.message}`);
  }
} else {
  log("no GITHUB_TOKEN: skipping trending and stats (they run in the GitHub Action)");
}

const outPath = path.join(signalsDir, `${today}.json`);
if (existsSync(outPath)) {
  // Merge with an earlier run of the same day instead of losing it.
  const prev = JSON.parse(readFileSync(outPath, "utf8"));
  const merge = (a = [], b = [], key) => {
    const seen = new Set(a.map(key));
    return [...a, ...b.filter((x) => !seen.has(key(x)))];
  };
  signals.awesome = merge(prev.awesome, signals.awesome, (x) => x.url.toLowerCase());
  signals.releases = merge(prev.releases, signals.releases, (x) => x.repo + x.tag);
  signals.trending = signals.trending.length ? signals.trending : prev.trending ?? [];
}
writeFileSync(outPath, JSON.stringify(signals, null, 2) + "\n");
writeFileSync(statePath, JSON.stringify(state, null, 2) + "\n");
console.log(
  `✓ signals/${today}.json — ${signals.awesome.length} awesome addition(s), ${signals.releases.length} release(s), ${signals.trending.length} trending repo(s)`,
);
