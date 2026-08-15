---
description: Pull Published content from the MehhSpace Content Notion DB and regenerate the site's data + content files.
allowed-tools: Bash(node:*), Bash(npm:*), Write, Read
---

# MehhSpaceUpdate

Manually-triggered publish step. Runs in **Claude Code (CLI)**, where the Notion
MCP server `plugin:Notion:notion` (mcp.notion.com) is connected and authenticated
as Zachary Jones. Reads the **MehhSpace Content** database, then hands the rows to
the deterministic transform (`scripts/mehhspace-update.mjs`) which rewrites the site.

**Notion coordinates**
- Database title: `MehhSpace Content`
- Page ID (dashed): `7b044117-0f64-44ef-a387-4479b6932b73`
- Data source ID (query target): `cd6f8147-f900-45f2-9f4f-0d3e6a0862b6`

## Step 1 — Query all Published rows (single call)

Run this **exact** query via the Notion MCP SQL query tool (verified working live):

```sql
SELECT "Name", "Tag", "Content", "Slug", "Category", "Status", "Order", "date:Date:start", "File", url
FROM "collection://cd6f8147-f900-45f2-9f4f-0d3e6a0862b6"
WHERE "Status" = ?
ORDER BY "Tag" ASC, "Order" ASC
```
params: `["Published"]`

This returns every publishable row across all tags in one pass, with routing
metadata. Expect ~22 rows (14 singletons + Profile_Pic + 4 Projects + 1 Blog +
1 Fun + 1 Resume).

## Step 2 — Fetch page bodies (second pass, page tags only)

**Critical gotcha:** for rows where `Tag` ∈ {`Blog`, `Lab`, `Fun`, `Resume`}, the
query returns `Content: null`. Their real markdown body lives in the Notion **page
body (blocks)**, not the Content column. For each such row, fetch the page
individually (by its `url` / page ID) with the Notion MCP page-fetch tool and take
the markdown from the returned `<content>` block.

Singletons and `Project` rows already carry their value in the `Content` column —
no second fetch.

## Step 2b — Profile picture: skip it

The picture is **not** part of this pull. It's a plain committed asset at
`public/profile-pic.gif`, changed by dropping a new file at that path — Notion
uploads can't be reached (their MCP refs are opaque `file://`, no bytes).

So: pass the `Profile_Pic` row straight through with no `File` key, or leave it out
of the contract entirely. Either way the existing picture is preserved — the
transform never clears it on an empty value. Don't go hunting for an attachment URL.

## Step 3 — Assemble the contract JSON

Write `/tmp/mehhspace-notion.json`. You can pass the **raw SQL rows through almost
verbatim** — the transform's `normalizeRow()` accepts the capitalized columns and
`date:Date:start` as-is. The only edit required: for each page-tag row, attach the
fetched markdown under a **`body`** key.

```json
{
  "rows": [
    { "Name": "Mood", "Tag": "Mood", "Content": "currently debugging life", "Status": "Published" },
    { "Name": "Music", "Tag": "Interest_Music", "Content": "…", "Status": "Published" },
    { "Name": "project one", "Tag": "Project", "Slug": "#", "Order": 1, "Status": "Published" },
    { "Name": "Setting up this whole pipeline", "Tag": "Blog", "Slug": "setting-up-this-whole-pipeline",
      "Category": null, "date:Date:start": "2026-08-13", "Status": "Published",
      "body": "…fetched markdown from the page body…" },
    { "Name": "Learning to actually finish a song", "Tag": "Fun", "Slug": "…",
      "Category": "Music", "date:Date:start": "2026-08-12", "Status": "Published", "body": "…" },
    { "Name": "Resume", "Tag": "Resume", "Slug": "resume", "Status": "Published",
      "body": "## Headline\n…## Experience\n### …\n- bullet\n## Skills\n- Languages: …\n## Education\n### …" }
  ]
}
```

Field/routing notes the transform relies on:
- **Singletons** (`Mood`, `URL_Box`, `About_Me`, `Who_Meet`, `Interest_*`, `Details_*`)
  → value from `Content`. Mapped into `src/data/profile.json`. `Details_HereFor` →
  the "Here For" row. profile.json fields NOT in Notion (contact links, online flag)
  are preserved on merge.
- **`Profile_Pic`** → ignored; the picture is a local asset. See Step 2b.
- **`Project`** → `Name`+`Slug` (+ `Order`, optional `image`) → `src/data/projects.json`.
- **`Blog`/`Lab`/`Fun`** → `src/content/<coll>/<slug>.md` with frontmatter
  (title, date, category, excerpt-if-derivable). `Fun` keeps its `Category`.
- **`Resume`** → parsed into `src/data/resume.json`. The page body MUST follow the
  strict section format: `## Headline`, `## Tagline`, `## Experience` (each `### entry`
  followed by a meta line and `- bullets`), `## Skills` (`- Label: value`), `## Education`.

## Step 4 — Run the transform

```bash
node scripts/mehhspace-update.mjs /tmp/mehhspace-notion.json
```
Merges singletons into `profile.json`; rewrites `projects.json`, `resume.json`; and
regenerates `src/content/{blog,lab,fun}/*.md` (clears stale files first, so
unpublished/deleted rows disappear). **Refuses to write if 0 published rows** were
received — a guard against a failed fetch wiping the site. Tip: add `--dry-run` to
preview the plan without writing.

## Step 5 — Validate

```bash
npm run build
```
If it fails, report the error (most likely a content-collection schema mismatch,
e.g. a page row missing a `date`) and stop.

## Step 6 — Report, don't push

Report what changed: singleton fields updated, project count, whether the resume was
rebuilt, and the page files written. **Do not commit or push** — that's the separate
`/MehhSpacePush` step.

## If the schema doesn't match
If a property name differs from the query above, that's almost always a sharing
issue (Notion → database `•••` → Connections). A direct fetch by page ID
`7b044117-0f64-44ef-a387-4479b6932b73` works even when search doesn't. Report the
actual column names and I'll adjust the query — the transform only cares about the
JSON shape, not Notion's property names.
