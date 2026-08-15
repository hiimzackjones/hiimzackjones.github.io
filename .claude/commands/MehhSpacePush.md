---
description: Commit the current MehhSpace working tree and push to GitHub main, triggering the Pages deploy.
allowed-tools: Bash(git:*), Bash(npm:*), Bash(gh:*)
---

# MehhSpacePush

Ships whatever `/MehhSpaceUpdate` produced. Commits the working tree and pushes to
`main`; the `.github/workflows/deploy.yml` Action then builds with `withastro/action`
and deploys to GitHub Pages automatically. Run this AFTER an Update, once the site
looks right locally.

## Steps

1. **Sanity build** — never push a broken tree:
   ```bash
   npm run build
   ```
   If it fails, stop and report.

2. **Show what changed:**
   ```bash
   git status --short
   git --no-pager diff --stat
   ```
   If there is nothing to commit, say so and stop.

3. **Commit.** Stage everything and commit with a message summarizing the publish
   (e.g. what Notion content changed — new post slug, updated Mood, etc.):
   ```bash
   git add -A
   git commit -m "Publish: <summary of what changed>"
   ```

4. **Push to main:**
   ```bash
   git push origin main
   ```

5. **Confirm the deploy kicked off** (optional, if `gh` is authenticated):
   ```bash
   gh run list --workflow=deploy.yml --limit 1
   ```
   Report the run URL so the deploy can be watched. GitHub Pages serves the result
   at https://mehhspace.com (and at https://hiimzackjones.github.io/).

## Where this deploys
Repo: **hiimzackjones/hiimzackjones.github.io** — the GitHub *user site*, so it serves
from the root URL with no `base` needed in `astro.config.mjs`. The `origin` remote
already points here; `main` is the default branch and the deploy trigger.

The old 2020 Jekyll blog still lives on the **`master`** branch of the same repo —
untouched, and the reason nothing was lost in the swap. Don't delete that branch.

DNS, the custom domain and HTTPS are all done — see `DEPLOY.md`. `public/CNAME`
pins `mehhspace.com` across deploys; leave it in place.
