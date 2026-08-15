---
title: "Setting up this whole pipeline"
date: 2026-08-13
excerpt: "For a while this site lived on GitHub Pages the old way — write a post, commit it, push, wait for the build. Fine for code. Miserable for a blog you actually want to update."
---

For a while this site lived on GitHub Pages the old way — write a post, commit it, push, wait for the build. Fine for code. Miserable for a blog you actually want to update.

So the whole thing got rebuilt around one idea: publishing should mean editing a database, not touching git.

# How it actually works

Every editable piece of this site — from the Interests table in the sidebar down to individual blog posts like this one — lives as a row in a single Notion database, tagged by what it is. Some tags are singletons (there's exactly one `Mood` row). Some are repeatable (each project is its own `Project` row). And some, like this post, are full pages tagged `Blog`, written in markdown right inside Notion.

When it's time to publish, Claude Code reads the database through the Notion MCP connector, figures out what's new, converts it, and pushes it straight to the repo. GitHub Pages picks up the build automatically from there.

# Why this over the old way

No commits for a typo fix. No context-switching into a code editor to write a paragraph. Notion is just... where I already write things down.
