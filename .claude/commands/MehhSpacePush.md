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
   at https://mehhspace.com once the run finishes and DNS is live.

## First-run setup (only needed once, if the remote isn't configured yet)
GitHub user: **hiimzackjones**. Repo: **mehhspace**.
- Create the repo and push (from the repo root, `gh` must be authenticated):
  ```bash
  gh repo create hiimzackjones/mehhspace --public --source=. --remote=origin --push
  ```
  (or `git remote add origin git@github.com:hiimzackjones/mehhspace.git` then `git push -u origin main`).
- In the repo: **Settings → Pages → Source: GitHub Actions**.
- Add the custom domain `mehhspace.com` under Settings → Pages (the `public/CNAME`
  file already pins it across deploys).
- GoDaddy DNS for `mehhspace.com`:
  - Apex `@` — four **A** records → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
  - `www` — **CNAME** → `hiimzackjones.github.io`
  - HTTPS (Let's Encrypt) is issued automatically once DNS resolves; tick
    "Enforce HTTPS" in Pages settings after it goes green.
