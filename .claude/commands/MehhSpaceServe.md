---
description: Serve MehhSpace locally so changes can be checked in a browser before pushing to GitHub Pages.
argument-hint: "[build] [stop]"
allowed-tools: Bash(npm:*), Bash(lsof:*), Bash(kill:*), Bash(curl:*), Bash(ip:*), Bash(hostname:*), Bash(rm:*)
---

# MehhSpaceServe

Runs the site on **localhost:4321** so `/MehhSpaceUpdate` results can be eyeballed
before `/MehhSpacePush` ships them. Nothing here touches git or Notion.

Argument: `$ARGUMENTS`

| Argument | What it does |
|---|---|
| *(none)* | **Dev server** (`npm run dev`) — hot-reloads on every file change. The default; use it while iterating. |
| `build` | **Production preview** (`npm run build && npm run preview`) — serves the real `dist/` output, exactly what GitHub Pages will serve. Slower, no hot reload. Use it as the last look before pushing. |
| `stop` | Stops whatever is serving and exits. |

## Steps

1. **If the argument is `stop`**, kill the listener and report:
   ```bash
   lsof -ti:4321 | xargs -r kill
   ```
   Then stop — skip everything below.

2. **Check the port first.** Astro silently moves to 4322, 4323… when 4321 is taken,
   which is how you end up staring at a stale server wondering why an edit didn't
   show up:
   ```bash
   lsof -ti:4321
   ```
   If something is already listening, report that it's already running, give the URL,
   and stop — do NOT start a second one. Mention `/MehhSpaceServe stop` to restart.

3. **Start the server in the background** (it runs until stopped, so it must not
   block the session). Use the Bash tool's `run_in_background: true`:

   - no argument → `npm run dev`
   - `build` → `npm run build && npm run preview`

   If a `build` run fails to compile, report the error and stop — that same failure
   would break the deploy.

4. **Wait for it to be ready**, then confirm it actually answers:
   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://localhost:4321/
   ```
   Poll until it returns `200` (give it ~30s). A server that printed its banner but
   404s or hangs is a real failure — report it rather than handing over a dead URL.

5. **Report the URLs.** Both scripts pass `--host`, so the site is reachable from
   other devices on the LAN — worth having, since this design is worth checking on a
   phone:

   - Local: `http://localhost:4321/`
   - Network: `http://<lan-ip>:4321/` — read the actual address from the server's
     startup output rather than guessing it.

   Say which mode is running (dev/hot-reload vs. production preview) and that
   `/MehhSpaceServe stop` shuts it down.

## Notes

- **The dev server and `/MehhSpaceUpdate` work well together.** Leave this running,
  edit rows in Notion, run `/MehhSpaceUpdate`, and the browser refreshes itself —
  no restart needed, since the transform writes the files Astro is already watching.
- **`dev` and `build` can disagree.** Hot reload is more forgiving than a real build,
  so run `/MehhSpaceServe build` once before `/MehhSpacePush` when a change touched
  page templates, content-collection schemas, or anything in `src/data/`.
- **Tile images and the profile picture** are plain files in `public/`, served as-is
  locally. If a Top Stuff tile is broken locally it will be broken in production too.
- **Stale content warnings.** A `Duplicate id …` or content-cache warning after files
  are rewritten underneath a running server is a caching artifact, not a real
  duplicate. Confirm with `ls src/content/<coll>/`, then clear it:
  ```bash
  rm -rf .astro node_modules/.astro && npm run dev
  ```
  **Both** paths matter. Astro keeps a second content cache under
  `node_modules/.astro`, and clearing only `.astro` leaves it behind — a deleted
  post will keep rebuilding itself from that copy long after its markdown is gone.
