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
   at https://hiimzackjones.github.io/ (and at https://mehhspace.com once DNS is cut over).

## Where this deploys
Repo: **hiimzackjones/hiimzackjones.github.io** — the GitHub *user site*, so it serves
from the root URL with no `base` needed in `astro.config.mjs`. The `origin` remote
already points here; `main` is the default branch and the deploy trigger.

The old 2020 Jekyll blog still lives on the **`master`** branch of the same repo —
untouched, and the reason nothing was lost in the swap. Don't delete that branch.

## Remaining one-time step: DNS cutover for mehhspace.com
Not done yet — `mehhspace.com` still resolves to GoDaddy parking. To finish:
- Restore the CNAME pin: recreate `public/CNAME` containing `mehhspace.com`, then set
  the custom domain under **Settings → Pages**. (It was removed deliberately: while
  present, GitHub 301s the root URL to the still-parked apex.)
- GoDaddy DNS for `mehhspace.com`:
  - Apex `@` — four **A** records → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
  - `www` — **CNAME** → `hiimzackjones.github.io`
  - HTTPS (Let's Encrypt) is issued automatically once DNS resolves; tick
    "Enforce HTTPS" in Pages settings after it goes green.
