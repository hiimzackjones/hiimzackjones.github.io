# MehhSpace — Deploy State

**Live: https://mehhspace.com** — HTTPS enforced, cert issued. Setup is finished;
this file is now a reference, not a checklist.

## Where it lives

| | |
|---|---|
| Repo | `hiimzackjones/hiimzackjones.github.io` (GitHub **user site**) |
| Branch | `main` — every push builds + deploys via `.github/workflows/deploy.yml` |
| Pages | Source: GitHub Actions (`build_type=workflow`), custom domain `mehhspace.com` |
| Old blog | preserved on the **`master`** branch of the same repo — the archive, don't delete |

Serving from the user site is why `astro.config.mjs` needs no `base` — the site is at
the domain root. `public/CNAME` pins the custom domain across deploys.

## DNS (done — recorded for reference)

GoDaddy, apex `@` → four A records `185.199.108–111.153`; `www` → CNAME
`hiimzackjones.github.io.`. The NS, SOA, `_domainconnect` and `_dmarc` records are
GoDaddy's and were left alone.

## Publishing

```
Notion edit  →  /MehhSpaceUpdate  →  check the build  →  /MehhSpacePush
```

`.claude/commands/MehhSpaceUpdate.md` documents the Notion query and contract;
`MehhSpacePush.md` documents the commit/push side. Both are the authoritative docs.

## Profile picture

**Local asset, not Notion-driven** — by choice, and because Notion couldn't do it
anyway (its MCP returns workspace uploads as opaque `file://` refs with no way to
reach the bytes).

Currently `public/profile-pic.gif`, an animated GIF committed like any other asset.
To change it: drop a new file at that path (or ask Claude to), then `/MehhSpacePush`.
If the extension changes, point `src/data/profile.json` → `profilePic` at the new
filename.

The `Profile_Pic` row in Notion is inert — `/MehhSpaceUpdate` passes it through and
the transform preserves whatever picture is already there.

## Open loose ends (none block anything)

- **Resume PDF** — no `public/zack-resume.pdf`; the "↓ Download PDF Resume" link 404s.
- **Contact links** — `src/data/profile.json` still has placeholders (`hi@mehhspace.com`,
  bare `github.com/`, `linkedin.com/`). Not Notion-driven; edit the file directly.
- **`ArticleLayout.astro:18`** — the `160x160`→`100x100` swap was a placehold.co trick
  and is now a no-op. Harmless; CSS caps the display size.
- **Node 20 actions** — `checkout`/`setup-node`/`upload-artifact`/`deploy-pages` target
  Node 20 and are force-run on Node 24. Worth a version bump eventually.
