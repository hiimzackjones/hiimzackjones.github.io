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
SELECT "Name", "Tag", "Content", "Slug", "Category", "Status", "Order", "Featured", "Image", "date:Date:start", "File", url
FROM "collection://cd6f8147-f900-45f2-9f4f-0d3e6a0862b6"
WHERE "Status" = ?
ORDER BY "Tag" ASC, "Order" ASC
```
params: `["Published"]`

This returns every publishable row across all tags in one pass, with routing
metadata. Expect ~34 rows (16 singletons + 4 `*_Intro` singletons + Profile_Pic +
5 Contact + 1 Link + 4 Projects + 1 Blog + 1 Personal + 1 Resume).

## Step 2 — Fetch page bodies (second pass, body-backed tags only)

**Critical gotcha:** for rows where `Tag` ∈ {`Blog`, `Lab`, `Personal`, `Classes`, `Resume`,
`About_Me`}, the query returns `Content: null`. Their real markdown body lives in the Notion **page
body (blocks)**, not the Content column. For each such row, fetch the page
individually (by its `url` / page ID) with the Notion MCP page-fetch tool and take
the markdown from the returned `<content>` block.

**Pass the `<content>` block through VERBATIM — do not convert anything by hand.**
Notion returns "Notion-flavored Markdown": ordinary markdown for headings, bold,
lists and fences, but XML-ish tags for every block markdown has no syntax for.
`notionToMarkdown()` in the transform handles all of it, deterministically and
under test — copy the block exactly as returned, curly apostrophes and all, and
let the script do the work. What it converts:

| Notion block | Becomes | Styled as |
|---|---|---|
| `<callout icon="X" color="C">` | `<aside class="callout callout--C">` | bordered, tinted box with the icon — **all nine Notion colors are mapped**, `_bg` and plain fold together |
| `> quote` | blockquote | rule + curly quote mark, italic |
| a line that is only a link | `<a class="bookmark">` card | title/description/thumbnail scraped from the destination |
| `# X {toggle="true"}` / `<details>` | `<details class="toggle">` | clickable bar that collapses |
| ` ```plain text ` | ` ```text ` | language normalized to a Shiki id — **an unknown language breaks the build**, so anything unrecognized falls back to `text` |
| `<empty-block/>` | dropped | — |
| `<unknown …/>` | dropped + warning | see the bookmark note below |
| `{color="…"}` attribute lists, `<span underline="true">`, `<span color="…">` | `<u>` / `<span class="nc nc--hue">` | site palette |
| `<table>` | passed through | site palette |

**Bookmarks.** Notion's `/bookmark` block cannot be published: the API returns it
as `<unknown alt="bookmark"/>` whose `url` points back at the block itself, so the
site it bookmarked is unknowable. The transform drops it and prints a warning
naming the post. To get a link card, paste the URL in Notion and choose
**"Dismiss"** rather than "Create bookmark" — a plain link on its own line becomes
the card, filled in from the destination's `og:` tags with its thumbnail cached
into `public/bookmarks/`. A link with real link text (`[the docs](…)`) stays inline
prose, as intended.

Every OTHER singleton, plus `Contact`, `Link`, and `Project` rows, already carries its
value in the `Content` column — no second fetch. `About_Me` is the one singleton
exception: it was moved to the page body (2026-08-18) so the blurb can be written and
edited as a real Notion page. Blank lines between its paragraphs are preserved and the
home page renders one `<p>` per paragraph, so write it as prose, not as one long line.
Keep it plain text — it renders as text, so `**bold**` would show up literally.

If that one fetch fails, pass the row through with **no** `body`/`Content` key rather
than an empty string: `About_Me` is in the transform's `PRESERVE_IF_EMPTY` set, so an
empty value keeps the existing blurb instead of blanking the box.

The body matters for more than the post itself: a featured post's tile art is the
first image in this markdown, so a page row that skips the second fetch also loses
its tile picture.

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
`date:Date:start` as-is. The only edit required: for each body-backed row (the Step 2
list), attach the fetched `<content>` **unmodified** under a **`body`** key.

```json
{
  "rows": [
    { "Name": "Mood", "Tag": "Mood", "Content": "currently debugging life", "Status": "Published" },
    { "Name": "About Me", "Tag": "About_Me", "Status": "Published",
      "body": "…fetched markdown from the page body — blank lines between paragraphs…" },
    { "Name": "Music", "Tag": "Interest_Music", "Content": "…", "Status": "Published" },
    { "Name": "LinkedIn", "Tag": "Contact", "Content": "https://www.linkedin.com/in/…", "Order": 2, "Status": "Published" },
    { "Name": "SpaceHey", "Tag": "Link", "Content": "https://spacehey.com", "Order": 10, "Featured": "__YES__", "Status": "Published" },
    { "Name": "project one", "Tag": "Project", "Slug": "#", "Order": 1, "Status": "Published" },
    { "Name": "Setting up this whole pipeline", "Tag": "Blog", "Slug": "setting-up-this-whole-pipeline",
      "Category": null, "date:Date:start": "2026-08-13", "Status": "Published",
      "body": "…fetched markdown from the page body…" },
    { "Name": "Learning to actually finish a song", "Tag": "Personal", "Slug": "…",
      "Category": "Music", "date:Date:start": "2026-08-12", "Status": "Published", "body": "…" },
    { "Name": "Resume", "Tag": "Resume", "Slug": "resume", "Status": "Published",
      "body": "## Headline\n…## Experience\n### …\n- bullet\n## Skills\n- Languages: …\n## Education\n### …" }
  ]
}
```

Field/routing notes the transform relies on:
- **Singletons** (`Mood`, `URL_Box`, `Who_Meet`, `Interest_*`, `Details_*`,
  `Blog_Intro`, `Lab_Intro`, `Classes_Intro`, `Personal_Intro`)
  → value from `Content`. **`About_Me` is the exception — its value comes from the
  page body** (see Step 2); everything else about it routes the same. Mapped into `src/data/profile.json`. `Details_HereFor` →
  the "Here For" row. profile.json fields NOT in Notion (`name`, the `online` flag)
  are preserved on merge.
  - **`*_Intro`** (`Blog_Intro`, `Lab_Intro`, `Classes_Intro`, `Personal_Intro`) →
    the top-of-page blurb under each section header, written to
    `profile.json → pageIntros.{blog,lab,classes,personal}` and read by the matching
    `src/pages/<section>/index.astro`. Guarded by `PRESERVE_IF_EMPTY`, so a blank
    Notion cell keeps the existing blurb rather than wiping it. `Blog_Intro` is blank
    by default — its paragraph is omitted entirely until you publish a value; the
    other three fall back to their original hardcoded copy if the field is missing.
- **`Contact`** → one row per link in the "Contacting Zack" box (and the resume's
  Quick Contact): `Name` is the visible label, **`Content` is the href**, `Order`
  sorts them. `Content` takes anything an `<a href>` accepts — `https://…`,
  `mailto:…`, `tel:…`. Adding/renaming/reordering a link means editing these rows;
  removing one means deleting the row or flipping it to `Draft`. If a pull returns
  **zero** Contact rows the existing links are kept, so a partial fetch can't empty
  the box. Note it is `Content`, not the `url` column — `url` is Notion's own page
  URL and is ignored here.
- **`Featured` checkbox** (on ANY row, any tag) → the "Top Stuff" box on the home
  page, written to `src/data/featured.json`. Ordered by `Order`, then newest first.
  A row only qualifies if it has somewhere to point: `Blog`/`Lab`/`Personal`/`Classes` link to the
  post, `Link` uses its `Content`, `Project` uses its `Slug`. A featured singleton
  is silently skipped. Zero featured rows keeps the existing tiles.
  - `Featured_Heading` → the box's title (default `"<name>'s Top Stuff"`).
  - `Featured_ViewAll` → the `[view all]` href; blank hides the link entirely.
- **`Link`** → an outbound link to someone else's site. `Name` is the label,
  `Content` is the URL. Only ever appears in the box, and only when `Featured` is
  ticked — an unticked `Link` row is just parked for later. Renders with a `↗` and
  opens in a new tab.
- **Tile art** is discovered automatically, in this order: the row's `Image` column
  → the first image in the post body → the linked site's `og:image` (then
  `twitter:image`, apple-touch-icon, `/favicon.ico`) → a numbered placeholder.
  Whatever is found is downloaded into `public/featured/` and referenced locally,
  because remote images rot. All failures here are non-fatal: the tile keeps its
  previous image, or falls back to a placeholder. Set `Image` by hand to override.
- **`Profile_Pic`** → ignored; the picture is a local asset. See Step 2b.
- **`Project`** → `Name`+`Slug` (+ `Order`, optional `Image`) → `src/data/projects.json`.
  Nothing renders that file since the home box became Top Stuff; projects now reach
  the page by ticking `Featured` like anything else. It's still written so a future
  /lab listing has it.
- **`Blog`/`Lab`/`Personal`/`Classes`** → `src/content/<coll>/<slug>.md` with
  frontmatter (title, date, category, excerpt-if-derivable).
  - **`Personal`** (was `Fun`, renamed 2026-08-18 — the tag, the route, and the
    collection are all `personal` now) groups by `Category` on `/personal`, so a
    Personal row **must** have one or the build fails its schema.
  - **`Classes`** groups by `Category` too, but there the category is the *class
    name* (`Networks`, `Malware Analysis`, …) and it is **optional** — a Classes
    row with no Category still builds and lands under an `Unsorted` heading.
    Add class names as `Category` options in Notion as you go.
- **`Resume`** → parsed into `src/data/resume.json`. The page body MUST follow the
  strict section format: `## Headline`, `## Tagline`, `## Experience` (each `### entry`
  followed by a meta line and `- bullets`), `## Skills` (`- Label: value`), `## Education`.

## Step 4 — Run the transform

```bash
node scripts/mehhspace-update.mjs /tmp/mehhspace-notion.json
```
Converts each page body out of Notion-flavored Markdown (Step 2 table), resolves
bookmark cards, merges singletons into `profile.json`; rewrites `projects.json`, `resume.json`; and
regenerates `src/content/{blog,lab,personal,classes}/*.md` (clears stale files first, so
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

Report what changed: singleton fields updated, contact links, featured tiles (and
where each tile's image came from — the transform prints this), bookmark cards
resolved, project count, whether the resume was rebuilt, and the page files written.
**Relay every `!` warning the transform prints** — those name the blocks that could
not be carried over and what to author instead. **Do not commit or push** — that's the separate
`/MehhSpacePush` step.

## If the schema doesn't match
If a property name differs from the query above, that's almost always a sharing
issue (Notion → database `•••` → Connections). A direct fetch by page ID
`7b044117-0f64-44ef-a387-4479b6932b73` works even when search doesn't. Report the
actual column names and I'll adjust the query — the transform only cares about the
JSON shape, not Notion's property names.
