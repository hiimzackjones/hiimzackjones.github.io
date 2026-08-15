---
title: "Setting up this whole pipeline"
date: 2026-08-13
excerpt: "💡 Claude wrote this blog. I figured I’d leave him a little section"
---

# How this site’s content system actually works

> 💡 Claude wrote this blog. I figured I’d leave him a little section

Every editable piece of this site — from the Interests table in the sidebar down to individual blog posts like this one — lives as a row in a single Notion database, tagged by what it is. Some tags are singletons (there's exactly one `Mood` row). Some are repeatable (each project is its own `Project` row). And some, like this post, are full pages tagged `Blog`, written in markdown right inside Notion.

When it's time to publish, Claude Code reads the database through the Notion MCP connector, figures out what's new, converts it, and pushes it straight to the repo. GitHub Pages picks up the build automatically from there.

# Why this over the old way

No commits for a typo fix. No context-switching into a code editor to write a paragraph. Notion is just... where I already write things down.
