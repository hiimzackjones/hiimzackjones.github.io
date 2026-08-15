# MehhSpace

An early-2000s SpaceHey-style personal site for Zack, built with **Astro** and
published to **GitHub Pages** at [mehhspace.com](https://mehhspace.com). Content is
driven from a single **Notion** database — no git commit per post.

## How it works

```
Notion "MehhSpace Content" DB
        │  /MehhSpaceUpdate  (Claude Code CLI — has Notion MCP)
        ▼
  scripts/mehhspace-update.mjs   ← deterministic transform (unit-tested)
        │  writes
        ▼
  src/data/*.json  +  src/content/{blog,fun,lab}/*.md
        │  /MehhSpacePush  →  git push main
        ▼
  .github/workflows/deploy.yml (withastro/action) → GitHub Pages
```

- **Singleton fields** (Mood, Interests, Details, About, URL) → `src/data/profile.json`
- **Projects** → `src/data/projects.json`
- **Resume** (strict markdown format) → parsed into `src/data/resume.json`
- **Blog / Lab / Fun posts** → markdown files in `src/content/<collection>/`

## Local development

```bash
npm install
npm run dev        # LAN-accessible (astro dev --host) → http://<lan-ip>:4321
npm run dev:local  # localhost only
npm run build      # production build to dist/
npm run preview    # serve the build over the LAN
```

## The publish pipeline (two Claude Code workflows)

Both live in `.claude/commands/` and run in the **Claude Code CLI** (where the
Notion MCP + git live):

- **`/MehhSpaceUpdate`** — queries the Notion DB, fetches page bodies, and runs the
  transform to regenerate site data/content. Does not push.
- **`/MehhSpacePush`** — sanity-builds, commits, and pushes to `main`, triggering the
  GitHub Pages deploy.

The transform is split out into `scripts/mehhspace-update.mjs` so it can be tested
offline against fixtures without Notion:

```bash
node scripts/run-tests.mjs                              # unit tests
node scripts/mehhspace-update.mjs --dry-run <rows.json> # preview a run
```

See `personal-site-build-plan.md` for the full spec (kept in `unzipped/`, gitignored).
