#!/usr/bin/env node
/**
 * MehhSpace — Notion → site transform.
 *
 * This is the DETERMINISTIC half of the MehhSpaceUpdate workflow. It takes a
 * JSON dump of Notion rows (the "contract" below) and writes them into the
 * Astro site: singleton fields → src/data/profile.json, contact links → the
 * `contact` array in that same file, projects → projects.json,
 * Resume → resume.json, and Blog/Lab/Personal/Classes pages → src/content/<coll>/<slug>.md.
 *
 * The NON-deterministic half (querying Notion via MCP and assembling the JSON)
 * lives in .claude/commands/MehhSpaceUpdate.md and runs in Claude Code, where
 * the Notion MCP server is connected. Keeping the transform here means it can be
 * unit-tested offline with sample data — see scripts/mehhspace-update.test.mjs.
 *
 * Input contract (JSON, via file arg or stdin):
 *   { "rows": [ Row, ... ] }
 *
 * Rows are accepted in EITHER shape — the raw Notion SQL row (capitalized
 * columns) or the normalized lowercase shape — so the CLI can pass query
 * results through with minimal massaging. normalizeRow() maps them:
 *   tag      ← "tag" | "Tag"
 *   title    ← "title" | "Name" | "name"
 *   content  ← "body" | "content" | "Content"   (fetched page markdown wins)
 *   slug     ← "slug" | "Slug"
 *   category ← "category" | "Category"
 *   status   ← "status" | "Status"   (defaults "Published")
 *   order    ← "order" | "Order"
 *   date     ← "date" | "date:Date:start" | "Date"
 *   url      ← "url" | "URL"
 *   image?, pdf?, excerpt?  (optional)
 *
 * IMPORTANT (per build plan): the SQL query returns Content=null for
 * Blog/Lab/Personal/Classes/Resume rows — their real markdown lives in the Notion PAGE BODY
 * and must be fetched per-page and attached as `body` (or `content`) before
 * calling this transform. Singletons and Project rows carry their value in the
 * Content column already.
 *
 * Usage:
 *   node scripts/mehhspace-update.mjs path/to/rows.json
 *   cat rows.json | node scripts/mehhspace-update.mjs
 *   node scripts/mehhspace-update.mjs --dry-run rows.json   # print plan, write nothing
 */

import { readFileSync, writeFileSync, readdirSync, unlinkSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA_DIR = join(ROOT, 'src', 'data');
const CONTENT_DIR = join(ROOT, 'src', 'content');

/** Singleton Tag → path inside profile.json. */
export const SINGLETON_MAP = {
  Interest_General: ['interests', 'General'],
  Interest_Music: ['interests', 'Music'],
  Interest_Movies: ['interests', 'Movies'],
  Interest_Television: ['interests', 'Television'],
  Interest_Books: ['interests', 'Books'],
  Interest_Heroes: ['interests', 'Heroes'],
  Details_Status: ['details', 'Status'],
  Details_HereFor: ['details', 'Here For'],
  Details_Occupation: ['details', 'Occupation'],
  Details_Stack: ['details', 'Stack'],
  URL_Box: ['url'],
  About_Me: ['about'],
  Who_Meet: ['whoMeet'],
  Mood: ['mood'],
  Profile_Pic: ['profilePic'],
  Featured_Heading: ['featured', 'heading'],
  Featured_ViewAll: ['featured', 'viewAll'],
  Blog_Intro: ['pageIntros', 'blog'],
  Lab_Intro: ['pageIntros', 'lab'],
  Classes_Intro: ['pageIntros', 'classes'],
  Personal_Intro: ['pageIntros', 'personal'],
};

/**
 * Singletons that must never be cleared by an empty Notion value.
 * Profile_Pic is the case that matters: the row exists permanently, but its File
 * property is empty except on the runs where the photo is actually changed.
 * Without this guard every ordinary publish would blank out the picture.
 *
 * About_Me is here for a different reason: unlike the other singletons it reads
 * from the Notion PAGE BODY, which needs its own fetch. Every singleton that
 * comes back in the one bulk SQL call is all-or-nothing with the rest of the
 * pull, but a single page fetch can fail on its own — and without this guard
 * that one failure would silently blank the About me blurb.
 *
 * The *_Intro singletons (the top-of-page blurbs for Blog/Lab/Classes/Personal)
 * are guarded too: an intentionally-blank Notion cell should keep the existing
 * blurb rather than wipe the section header to nothing.
 */
const PRESERVE_IF_EMPTY = new Set([
  'Profile_Pic', 'Featured_Heading', 'Featured_ViewAll', 'About_Me',
  'Blog_Intro', 'Lab_Intro', 'Classes_Intro', 'Personal_Intro',
]);

const PAGE_COLLECTIONS = { Blog: 'blog', Lab: 'lab', Personal: 'personal', Classes: 'classes' };

/** Accept raw Notion SQL rows or the normalized shape; produce the internal row. */
export function normalizeRow(r) {
  const pick = (...keys) => {
    for (const k of keys) if (r[k] !== undefined && r[k] !== null && r[k] !== '') return r[k];
    return undefined;
  };
  return {
    tag: pick('tag', 'Tag'),
    title: pick('title', 'Name', 'name'),
    content: pick('body', 'content', 'Content'), // fetched page body wins for page rows
    slug: pick('slug', 'Slug'),
    category: pick('category', 'Category'),
    status: pick('status', 'Status') ?? 'Published',
    order: pick('order', 'Order'),
    date: pick('date', 'date:Date:start', 'Date'),
    url: pick('url', 'URL'),
    image: pick('image', 'Image'),
    pdf: pick('pdf', 'Resume PDF', 'ResumePDF'),
    excerpt: pick('excerpt', 'Excerpt'),
    fileUrl: pick('fileUrl', 'File', 'file'),
    featured: truthyCheckbox(pick('featured', 'Featured')),
  };
}

/**
 * Notion's SQL layer returns checkboxes as the strings "__YES__" / "__NO__"
 * (NULL meaning unchecked), while a hand-written fixture uses a real boolean.
 * Accept both, and treat anything unrecognized as unchecked.
 */
export function truthyCheckbox(v) {
  if (v === true) return true;
  if (typeof v !== 'string') return false;
  const t = v.trim().toLowerCase();
  return t === '__yes__' || t === 'true' || t === 'yes';
}

export function slugify(s) {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Derive a short excerpt from a markdown body (first real paragraph).
 *
 * Tags are stripped rather than skipped, because a post that opens with a
 * callout or a bookmark card still has readable prose inside it — but a block
 * that is ONLY markup (a card's wrapper, a lone icon) has no words to lend and
 * is passed over, so the blog index never shows a fragment of HTML.
 */
export function deriveExcerpt(md, max = 200) {
  const flatten = (p) => p
    .replace(/<[^>]*>/g, ' ')
    .replace(/[*_`>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const firstPara = String(md)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p && !p.startsWith('#'))
    .map(flatten)
    .find((p) => /[\p{L}\p{N}]/u.test(p));
  if (!firstPara) return '';
  return firstPara.length > max ? firstPara.slice(0, max - 1).trimEnd() + '…' : firstPara;
}

/**
 * Notion returns page-body markdown with NO blank lines between blocks, so
 * consecutive paragraph blocks collapse into one <p>. Re-insert the blank lines
 * that block-level separation requires — WITHOUT splitting list items, code
 * fences, tables, or blockquotes (which are meant to stay contiguous).
 */
export function normalizeBlocks(md) {
  const src = String(md).replace(/\r\n?/g, '\n').split('\n');
  const fenceRe = /^\s*(```|~~~)/;
  const classify = (line) => {
    if (/^\s*$/.test(line)) return 'blank';
    if (/^#{1,6}\s/.test(line)) return 'heading';
    if (/^\s*([-*+]\s+|\d+[.)]\s+)/.test(line)) return 'list';
    if (/^\s*>/.test(line)) return 'quote';
    if (/^\s*\|/.test(line)) return 'table';
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) return 'hr';
    if (/^\s*<\/?[a-z][a-z0-9-]*(\s|\/?>)/i.test(line)) return 'html';
    return 'paragraph';
  };
  const out = [];
  let inFence = false;
  let prev = null; // type of last emitted non-blank line
  const lastIsBlank = () => out.length === 0 || out[out.length - 1].trim() === '';

  for (const line of src) {
    if (fenceRe.test(line)) {
      if (!inFence) {
        if (!lastIsBlank()) out.push('');
        out.push(line);
        inFence = true;
        prev = 'fence';
      } else {
        out.push(line);
        inFence = false;
        prev = 'closedFence';
      }
      continue;
    }
    if (inFence) { out.push(line); continue; }

    const type = classify(line);
    if (type === 'blank') { if (!lastIsBlank()) out.push(''); continue; }

    let needBlank = false;
    if (!lastIsBlank() && prev) {
      if (type === 'heading' || prev === 'heading' || prev === 'closedFence') needBlank = true;
      else if (type === 'list' && prev !== 'list') needBlank = true;
      else if (type !== 'list' && prev === 'list') needBlank = true;
      else if (type === 'quote' && prev !== 'quote') needBlank = true;
      else if (type !== 'quote' && prev === 'quote') needBlank = true;
      else if (type === 'table' && prev !== 'table') needBlank = true;
      else if (type !== 'table' && prev === 'table') needBlank = true;
      else if (type === 'hr' || prev === 'hr') needBlank = true;
      else if (type === 'html' && prev !== 'html') needBlank = true;
      else if (type !== 'html' && prev === 'html') needBlank = true;
      else if (type === 'paragraph' && prev === 'paragraph') needBlank = true;
    }
    if (needBlank) out.push('');
    out.push(line);
    prev = type;
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

/**
 * ---- Notion block tags → site markdown ---------------------------------
 *
 * The Notion MCP page fetch does NOT return plain markdown. It returns
 * "Notion-flavored Markdown", which is markdown for the ordinary things
 * (headings, bold, lists, fences) but falls back to XML-ish tags for every
 * block markdown has no syntax for — callouts, toggles, tables, unsupported
 * blocks. Pasted through untouched those tags render as literal text in the
 * post AND poison the derived excerpt.
 *
 * So the conversion lives here, in the transform, rather than being done by
 * hand on the way in: it is the same every run, it is testable, and a Notion
 * block type nobody has used yet degrades to something readable instead of
 * leaking angle brackets onto the page.
 *
 * The publish step should therefore hand this function the page's <content>
 * block VERBATIM. Running it twice is harmless — see the idempotency test.
 */

/** Notion's nine block colors, each also available as a `_bg` variant. */
const NOTION_HUES = ['gray', 'brown', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'red'];

/**
 * Notion color token → CSS class suffix. `red` and `red_bg` collapse to the same
 * tint: on the site a callout is always a filled box, so the distinction Notion
 * draws (colored text vs. colored background) has nothing to express here.
 */
export function notionColorSuffix(color) {
  const hue = String(color ?? '').trim().toLowerCase().replace(/_bg$/, '');
  return NOTION_HUES.includes(hue) ? hue : 'default';
}

/**
 * Notion's code-block language list → Shiki language ids.
 *
 * Only the ones that differ or would otherwise throw are listed; anything else
 * passes through when it looks like a plain identifier. An unrecognized language
 * becomes `text` rather than reaching Shiki, because an unknown id fails the
 * BUILD — and a mislabelled code block must never be able to block a publish.
 */
const SHIKI_LANGS = {
  'plain text': 'text', plaintext: 'text', plain: 'text', txt: 'text', text: 'text',
  'c++': 'cpp', 'c#': 'csharp', 'f#': 'fsharp', 'objective-c': 'objc',
  'visual basic': 'vb', 'vb.net': 'vb', 'basic': 'vb',
  assembly: 'asm', docker: 'dockerfile', shell: 'shellscript', bash: 'bash', sh: 'shellscript',
  'java/c/c++/c#': 'java', markup: 'html', 'protobuf': 'proto',
};
const SAFE_LANG_RE = /^[a-z0-9][a-z0-9+#._-]*$/;
const KNOWN_SAFE = new Set([
  'astro', 'bash', 'c', 'clojure', 'coffee', 'cpp', 'csharp', 'css', 'diff', 'docker',
  'dockerfile', 'elixir', 'elm', 'erlang', 'fsharp', 'go', 'graphql', 'groovy', 'haskell',
  'html', 'ini', 'java', 'javascript', 'js', 'json', 'json5', 'jsx', 'julia', 'kotlin',
  'latex', 'less', 'lisp', 'lua', 'makefile', 'markdown', 'matlab', 'md', 'mdx', 'mermaid',
  'nginx', 'nix', 'objc', 'ocaml', 'perl', 'php', 'powershell', 'prisma', 'proto', 'ps1',
  'python', 'r', 'ruby', 'rust', 'sass', 'scala', 'scss', 'shellscript', 'sql', 'svelte',
  'swift', 'text', 'toml', 'ts', 'tsx', 'typescript', 'vb', 'vue', 'xml', 'yaml', 'yml',
]);

/** Map a Notion fence language onto one Shiki is guaranteed to know. */
export function shikiLang(raw) {
  const lang = String(raw ?? '').trim().toLowerCase();
  if (!lang) return '';
  const mapped = SHIKI_LANGS[lang];
  if (mapped) return mapped;
  if (SAFE_LANG_RE.test(lang) && KNOWN_SAFE.has(lang)) return lang;
  return 'text';
}

/** Escape a string for use as HTML text or an attribute value. */
export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * The few inline marks worth honouring inside a <summary>, where the markdown
 * parser never reaches because the whole <details> is a raw HTML block.
 */
export function inlineMdToHtml(s) {
  return escapeHtml(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>');
}

/** Strip one level of leading indentation (Notion nests children with tabs). */
function dedent(lines) {
  const unit = lines.some((l) => l.startsWith('\t')) ? '\t' : '    ';
  return lines.map((l) => (l.startsWith(unit) ? l.slice(unit.length) : l.replace(/^\s{1,4}/, '')));
}

/**
 * Parse a trailing Notion attribute list — `{color="red" toggle="true"}` — off
 * the end of a block's first line. Deliberately strict about the shape so a
 * sentence that merely ends in a brace is left alone.
 */
const ATTR_LIST_RE = /\s*\{((?:\s*[a-z_-]+="[^"]*")+)\s*\}\s*$/i;
export function splitAttrList(line) {
  const m = String(line).match(ATTR_LIST_RE);
  if (!m) return { text: String(line), attrs: {} };
  const attrs = {};
  for (const [, k, v] of m[1].matchAll(/([a-z_-]+)="([^"]*)"/gi)) attrs[k.toLowerCase()] = v;
  return { text: String(line).slice(0, m.index), attrs };
}

/** Read the attributes off an opening XML-ish tag like `<callout icon="💡">`. */
function tagAttrs(tag) {
  const attrs = {};
  for (const [, k, v] of String(tag).matchAll(/([a-z_:-]+)="([^"]*)"/gi)) attrs[k.toLowerCase()] = v;
  return attrs;
}

/** Wrap already-converted markdown as the blank-line-delimited body of an HTML box. */
function htmlBox(open, inner, close) {
  const body = inner.trim();
  return body ? `${open}\n\n${body}\n\n${close}` : `${open}\n\n${close}`;
}

/**
 * Convert one Notion <content> block into markdown this site can render.
 *
 * `warn` collects human-readable notes about anything that could not be carried
 * over faithfully, so the publish step can tell you what to author differently
 * instead of silently dropping it.
 */
export function notionToMarkdown(src, warn = []) {
  const lines = String(src ?? '').replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let i = 0;

  const collectUntilClose = (closeTag) => {
    const body = [];
    let depth = 1;
    const openRe = new RegExp(`^\\s*<${closeTag}\\b`, 'i');
    const closeRe = new RegExp(`^\\s*</${closeTag}>\\s*$`, 'i');
    while (i < lines.length) {
      const l = lines[i];
      if (closeRe.test(l)) { depth--; i++; if (!depth) break; body.push(l); continue; }
      if (openRe.test(l)) depth++;
      body.push(l);
      i++;
    }
    return body;
  };

  /** Lines indented under the block that just opened — a toggle's children. */
  const collectIndented = () => {
    const body = [];
    while (i < lines.length && (/^[\t ]/.test(lines[i]) || /^\s*$/.test(lines[i]))) {
      if (/^\s*$/.test(lines[i]) && !/^[\t ]/.test(lines[i + 1] ?? '')) break;
      body.push(lines[i]);
      i++;
    }
    return body;
  };

  while (i < lines.length) {
    const line = lines[i];

    // Code fences pass through untouched apart from the language id — the whole
    // point of a fence is that its contents are literal.
    const fence = line.match(/^(\s*)(```+|~~~+)\s*(.*)$/);
    if (fence) {
      const [, indent, ticks, info] = fence;
      const lang = shikiLang(info);
      if (info.trim() && lang !== info.trim().toLowerCase()) {
        warn.push(`code block language "${info.trim()}" → "${lang}" (Shiki has no "${info.trim()}")`);
      }
      out.push(`${indent}${ticks}${lang}`);
      i++;
      const closeRe = new RegExp(`^\\s*${ticks[0]}{${ticks.length},}\\s*$`);
      while (i < lines.length && !closeRe.test(lines[i])) out.push(lines[i++]);
      if (i < lines.length) out.push(lines[i++]);
      continue;
    }

    // Notion's explicit blank line. Blocks are spaced by normalizeBlocks, so it
    // carries no information here.
    if (/^\s*<empty-block\s*\/>\s*$/i.test(line)) { i++; continue; }

    // A block type the Notion API does not expose. The tag carries no usable
    // target — for a bookmark the url attribute points back at the block itself
    // — so there is nothing to render and the best we can do is say so.
    const unknown = line.match(/^\s*<unknown\b([^>]*)\/>\s*$/i);
    if (unknown) {
      const alt = tagAttrs(unknown[1]).alt || 'block';
      warn.push(
        `dropped an unsupported Notion "${alt}" block — the API does not expose its target. ` +
        `For a link card, paste the URL on its own line and choose "Dismiss" instead of "Create bookmark".`,
      );
      i++;
      continue;
    }

    // Callout → a bordered, tinted box carrying its Notion colour and icon.
    const callout = line.match(/^\s*<callout\b([^>]*)>\s*$/i);
    if (callout) {
      const { icon, color } = tagAttrs(callout[1]);
      i++;
      const inner = notionToMarkdown(dedent(collectUntilClose('callout')).join('\n'), warn);
      const cls = `callout callout--${notionColorSuffix(color)}`;
      const iconEl = icon ? `\n<span class="callout-icon" aria-hidden="true">${escapeHtml(icon)}</span>` : '';
      out.push(htmlBox(
        `<aside class="${cls}">${iconEl}\n<div class="callout-body">`,
        inner,
        '</div>\n</aside>',
      ));
      continue;
    }

    // Toggle heading: `## Title {toggle="true"}` followed by indented children.
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const { text, attrs } = splitAttrList(heading[2]);
      if (attrs.toggle === 'true') {
        const level = heading[1].length;
        i++;
        const inner = notionToMarkdown(dedent(collectIndented()).join('\n'), warn);
        out.push(htmlBox(
          `<details class="toggle toggle--h${level}">\n<summary>${inlineMdToHtml(text.trim())}</summary>`,
          inner,
          '</details>',
        ));
        continue;
      }
      out.push(`${heading[1]} ${applyInline(text.trim(), attrs)}`);
      i++;
      continue;
    }

    // A plain toggle. Already-converted output is passed straight through so the
    // conversion stays idempotent.
    const details = line.match(/^\s*<details\b([^>]*)>\s*$/i);
    if (details) {
      const attrs = tagAttrs(details[1]);
      if (/class="toggle/i.test(details[1])) { out.push(line); i++; continue; }
      i++;
      const body = collectUntilClose('details');
      const sumIdx = body.findIndex((l) => /<summary>/i.test(l));
      let summary = '';
      if (sumIdx !== -1) {
        summary = body[sumIdx].replace(/^\s*<summary>/i, '').replace(/<\/summary>\s*$/i, '');
        body.splice(sumIdx, 1);
      }
      const cls = `toggle toggle--${notionColorSuffix(attrs.color)}`;
      out.push(htmlBox(
        `<details class="${cls}">\n<summary>${inlineMdToHtml(summary.trim())}</summary>`,
        notionToMarkdown(dedent(body).join('\n'), warn),
        '</details>',
      ));
      continue;
    }

    // Quote — markdown already, but it may carry a colour attribute list.
    const quote = line.match(/^(\s*>\s?)(.*)$/);
    if (quote) {
      const { text, attrs } = splitAttrList(quote[2]);
      out.push(`${quote[1]}${applyInline(text, attrs)}`);
      i++;
      continue;
    }

    const { text, attrs } = splitAttrList(line);
    out.push(applyInline(text, attrs));
    i++;
  }

  return out.join('\n');
}

/**
 * Inline rich-text conversions plus an optional block colour, which becomes a
 * span class rather than an inline style so the palette stays in the stylesheet.
 */
function applyInline(text, attrs = {}) {
  let s = String(text)
    .replace(/<span\s+underline="true"\s*>([\s\S]*?)<\/span>/gi, '<u>$1</u>')
    .replace(/<span\s+color="([a-z_]+)"\s*>([\s\S]*?)<\/span>/gi,
      (_m, c, inner) => `<span class="nc nc--${notionColorSuffix(c)}">${inner}</span>`);
  if (attrs.color && s.trim()) s = `<span class="nc nc--${notionColorSuffix(attrs.color)}">${s.trim()}</span>`;
  return s;
}

/** Quote a scalar for YAML frontmatter. */
function yamlString(v) {
  return `"${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/** Build a markdown file (frontmatter + body) for a page row. */
export function buildMarkdown(row) {
  const fm = [];
  fm.push(`title: ${yamlString(row.title ?? 'Untitled')}`);
  const date = row.date ? new Date(row.date) : null;
  const iso = date && !isNaN(date) ? date.toISOString().slice(0, 10) : new Date(0).toISOString().slice(0, 10);
  fm.push(`date: ${iso}`);
  if (row.category) fm.push(`category: ${yamlString(row.category)}`);
  const body = normalizeBlocks(notionToMarkdown(row.content ?? ''));
  const excerpt = row.excerpt || deriveExcerpt(body);
  if (excerpt) fm.push(`excerpt: ${yamlString(excerpt)}`);
  return `---\n${fm.join('\n')}\n---\n\n${body.trim()}\n`;
}

/**
 * Parse a Resume-tagged markdown body into structured sections.
 * Section headers are `## Headline|Tagline|Experience|Skills|Education`.
 * Under Experience/Education each `### ` starts an entry; the next non-bullet
 * line is its meta; `- ` lines are bullets. Skills are `- Label: value` bullets.
 */
export function parseResume(md, { pdf } = {}) {
  const out = { headline: '', tagline: '', pdf: pdf ?? '#', experience: [], skills: [], education: [] };
  const lines = String(md).replace(/\r/g, '').split('\n');
  let section = null;
  let entry = null;
  const flush = () => { if (entry && section) { out[section === 'experience' ? 'experience' : 'education'].push(entry); entry = null; } };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      flush();
      const name = h2[1].trim().toLowerCase();
      section = ['headline', 'tagline', 'experience', 'skills', 'education'].includes(name) ? name : null;
      continue;
    }
    if (!section) continue;
    const trimmed = line.trim();

    if (section === 'headline') { if (trimmed) out.headline ||= trimmed; continue; }
    if (section === 'tagline') { if (trimmed) out.tagline ||= trimmed; continue; }

    if (section === 'skills') {
      const m = trimmed.match(/^[-*]\s+(.+?):\s*(.+)$/);
      if (m) out.skills.push({ label: m[1].trim(), value: m[2].trim() });
      continue;
    }

    // experience | education
    const h3 = trimmed.match(/^###\s+(.+)$/);
    if (h3) { flush(); entry = { title: h3[1].trim(), meta: '', bullets: [] }; continue; }
    if (!entry) continue;
    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (bullet) { entry.bullets.push(bullet[1].trim()); continue; }
    if (trimmed && !entry.meta) entry.meta = trimmed;
  }
  flush();

  // Education entries don't carry bullets in the template.
  out.education = out.education.map(({ title, meta }) => ({ title, meta }));

  // No long dashes on the resume page. The owner wants plain hyphens here, and
  // Notion smart-punctuation keeps producing em/en dashes (date ranges, "Title —
  // Company"). Scrubbing at this single choke point — every resume string flows
  // through parseResume — makes it stick across every future /MehhSpaceUpdate,
  // without editing the Notion source. " — " → " - "; regular hyphens untouched.
  const deDash = (s) => (typeof s === 'string' ? s.replace(/\s*[—–]\s*/g, ' - ').trim() : s);
  out.headline = deDash(out.headline);
  out.tagline = deDash(out.tagline);
  out.experience = out.experience.map((e) => ({
    ...e,
    title: deDash(e.title),
    meta: deDash(e.meta),
    bullets: e.bullets.map(deDash),
  }));
  out.education = out.education.map((e) => ({ title: deDash(e.title), meta: deDash(e.meta) }));
  out.skills = out.skills.map((s) => ({ label: deDash(s.label), value: deDash(s.value) }));
  return out;
}

function setPath(obj, path, value) {
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) {
    cur[path[i]] ??= {};
    cur = cur[path[i]];
  }
  cur[path[path.length - 1]] = value;
}

function clearMarkdown(dir) {
  if (!existsSync(dir)) { mkdirSync(dir, { recursive: true }); return; }
  for (const f of readdirSync(dir)) {
    if (f.endsWith('.md')) unlinkSync(join(dir, f));
  }
}

/**
 * Build the ordered `profile.contact` array from Contact-tagged rows.
 * One Notion row per link: Name is the label, Content is the href, Order sorts.
 *
 * Returns null when the pull contained no Contact rows — the caller keeps the
 * links already in profile.json rather than emptying the whole box, on the same
 * reasoning as PRESERVE_IF_EMPTY: a partial fetch must not silently delete a
 * section of the profile.
 */
export function contactLinks(rows) {
  const contactRows = rows
    .filter((r) => r.tag === 'Contact')
    .sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9));
  if (!contactRows.length) return null;
  return contactRows.map((r, i) => ({
    label: r.title ?? `link ${i + 1}`,
    href: (r.content ?? '').trim() || '#',
  }));
}

/**
 * Where a featured row points. Page rows link to the markdown file the same run
 * writes, so the slug is derived exactly as buildMarkdown's is — otherwise a
 * featured tile would 404. `Link` rows are pure outbound links to someone else's
 * site and carry their href in Content, like Contact rows do. `Project` rows
 * carry theirs in Slug. Anything else isn't linkable and never reaches the box.
 */
export function featuredHref(row) {
  const coll = PAGE_COLLECTIONS[row.tag];
  if (coll) return `/${coll}/${(row.slug && slugify(row.slug)) || slugify(row.title ?? 'untitled')}`;
  if (row.tag === 'Link') return (row.content ?? '').trim() || null;
  if (row.tag === 'Project') return row.slug || '#';
  return null;
}

/** True for a tile that leaves the site — rendered with an outbound marker. */
export function isExternal(href) {
  return /^https?:\/\//i.test(String(href ?? ''));
}

/** Placeholder tile art, so a row with no Image still renders a square. */
const TILE_COLORS = ['1D4ED8', '60A5FA', '1E40AF', 'ED0707', '7C3AED', '059669', 'D97706', 'BE185D'];

/**
 * Build the Top Stuff tiles from every Published row with the Featured checkbox
 * ticked, whatever its Tag — your own posts, projects, and outbound `Link` rows
 * all mix freely in one box. Ordered by `Order`, then newest first, then title,
 * so an un-numbered row still lands somewhere stable.
 *
 * Returns null when nothing is featured — the caller then keeps the existing
 * featured.json, for the same partial-fetch reason as contactLinks().
 */
export function featuredItems(rows) {
  const featured = rows
    .filter((r) => r.featured && featuredHref(r))
    .sort((a, b) => {
      const ao = a.order ?? 1e9, bo = b.order ?? 1e9;
      if (ao !== bo) return ao - bo;
      const ad = a.date ? Date.parse(a.date) : 0, bd = b.date ? Date.parse(b.date) : 0;
      if (ad !== bd) return bd - ad; // newest first
      return String(a.title ?? '').localeCompare(String(b.title ?? ''));
    });
  if (!featured.length) return null;
  return featured.map((r, i) => {
    const href = featuredHref(r);
    return {
      title: r.title ?? `item ${i + 1}`,
      href,
      external: isExternal(href),
      image: r.image || `https://placehold.co/95x95/${TILE_COLORS[i % TILE_COLORS.length]}/FFFFFF?text=${i + 1}`,
    };
  });
}

export function transform(input, { dryRun = false } = {}) {
  const rows = (input.rows ?? [])
    .map(normalizeRow)
    .filter((r) => r.tag && r.status === 'Published');
  if (rows.length === 0) {
    throw new Error('Refusing to write: 0 published rows received (likely a failed/empty Notion fetch).');
  }

  const plan = { profile: [], projects: 0, contact: 0, featured: 0, pages: [], resume: false };

  // --- profile.json (merge singletons into existing) ---
  const profilePath = join(DATA_DIR, 'profile.json');
  const profile = existsSync(profilePath) ? JSON.parse(readFileSync(profilePath, 'utf8')) : {};
  for (const row of rows) {
    const target = SINGLETON_MAP[row.tag];
    if (!target) continue;
    const value = (row.content ?? '').trim();
    if (!value && PRESERVE_IF_EMPTY.has(row.tag)) continue; // keep what's already there
    setPath(profile, target, value);
    plan.profile.push(row.tag);
  }

  // --- contact links (profile.contact) ---
  const contact = contactLinks(rows);
  if (contact) {
    profile.contact = contact;
    plan.contact = contact.length;
  }

  // --- featured.json (the Top Stuff box) ---
  const featured = featuredItems(rows);
  if (featured) plan.featured = featured.length;

  // --- projects.json ---
  const projectRows = rows.filter((r) => r.tag === 'Project')
    .sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9));
  let projects = null;
  if (projectRows.length) {
    const existing = existsSync(join(DATA_DIR, 'projects.json'))
      ? JSON.parse(readFileSync(join(DATA_DIR, 'projects.json'), 'utf8')) : {};
    projects = {
      featuredCount: projectRows.length,
      items: projectRows.map((r, i) => ({
        title: r.title ?? `project ${i + 1}`,
        slug: r.slug || '#',
        image: r.image || existing.items?.[i]?.image || `https://placehold.co/95x95/1D4ED8/FFFFFF?text=${i + 1}`,
      })),
    };
    plan.projects = projectRows.length;
  }

  // --- resume.json ---
  const resumeRow = rows.find((r) => r.tag === 'Resume');
  let resume = null;
  if (resumeRow) {
    const existing = existsSync(join(DATA_DIR, 'resume.json'))
      ? JSON.parse(readFileSync(join(DATA_DIR, 'resume.json'), 'utf8')) : {};
    const parsed = parseResume(resumeRow.content ?? '', { pdf: resumeRow.pdf ?? existing.pdf });
    // Empty-resume guard: a malformed/empty body must not clobber a good resume.json.
    const looksEmpty = !parsed.headline && parsed.experience.length === 0
      && parsed.skills.length === 0 && parsed.education.length === 0;
    if (looksEmpty) {
      plan.resumeSkipped = true;
    } else {
      resume = parsed;
      plan.resume = true;
    }
  }

  // --- content collections (blog / lab / personal / classes) ---
  const pageWrites = [];
  for (const [tag, coll] of Object.entries(PAGE_COLLECTIONS)) {
    const collRows = rows.filter((r) => r.tag === tag);
    const dir = join(CONTENT_DIR, coll);
    const files = collRows.map((r) => {
      const slug = (r.slug && slugify(r.slug)) || slugify(r.title ?? 'untitled');
      return { path: join(dir, `${slug}.md`), contents: buildMarkdown(r), slug };
    });
    pageWrites.push({ dir, files });
    for (const f of files) plan.pages.push(`${coll}/${f.slug}.md`);
  }

  if (dryRun) return plan;

  // --- write everything ---
  writeFileSync(profilePath, JSON.stringify(profile, null, 2) + '\n');
  if (featured) writeFileSync(join(DATA_DIR, 'featured.json'), JSON.stringify({ items: featured }, null, 2) + '\n');
  if (projects) writeFileSync(join(DATA_DIR, 'projects.json'), JSON.stringify(projects, null, 2) + '\n');
  if (resume) writeFileSync(join(DATA_DIR, 'resume.json'), JSON.stringify(resume, null, 2) + '\n');
  for (const { dir, files } of pageWrites) {
    clearMarkdown(dir);
    // keep .gitkeep so empty collections (e.g. lab, classes) still have a tracked dir
    const gk = join(dir, '.gitkeep');
    if (!existsSync(gk)) writeFileSync(gk, '');
    for (const f of files) writeFileSync(f.path, f.contents);
  }
  return plan;
}

const PIC_BASENAME = 'profile-pic';
const ALLOWED_PIC_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif']);

/** Map a Content-Type back to a file extension, for URLs that carry no usable suffix. */
function extFromContentType(ct = '') {
  const t = ct.split(';')[0].trim().toLowerCase();
  return { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif',
    'image/webp': 'webp', 'image/avif': 'avif' }[t];
}

/**
 * Download the Profile_Pic row's attachment into public/ and rewrite the row's
 * content to the resulting site-absolute path.
 *
 * Why download rather than link: Notion serves attachments from presigned S3 URLs
 * that expire in roughly an hour, so storing the Notion URL would give a picture
 * that works right after publishing and 403s by the next morning.
 *
 * Failure here is deliberately non-fatal — a broken photo must not block a
 * content publish, so we warn and leave the existing picture in place.
 */
export async function materializeProfilePic(input, { dryRun = false } = {}) {
  const raw = (input.rows ?? []).find((r) => normalizeRow(r).tag === 'Profile_Pic');
  if (!raw) return null;
  const row = normalizeRow(raw);
  const src = row.fileUrl;
  if (!src) return null;

  // An explicit http(s) URL in Content is passed through untouched — it needs no hosting.
  if (!/^https?:\/\//i.test(src)) return null;

  let ext = (new URL(src).pathname.split('.').pop() || '').toLowerCase();
  if (dryRun) return { src, path: `/${PIC_BASENAME}.${ALLOWED_PIC_EXT.has(ext) ? ext : 'png'}`, dryRun: true };

  try {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (!ALLOWED_PIC_EXT.has(ext)) ext = extFromContentType(res.headers.get('content-type')) ?? 'png';
    const bytes = Buffer.from(await res.arrayBuffer());
    if (!bytes.length) throw new Error('empty response body');

    const publicDir = join(ROOT, 'public');
    if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });
    // Drop older extensions so switching png→jpg can't leave two files behind.
    for (const f of readdirSync(publicDir)) {
      if (f.startsWith(`${PIC_BASENAME}.`)) unlinkSync(join(publicDir, f));
    }
    const outPath = join(publicDir, `${PIC_BASENAME}.${ext}`);
    writeFileSync(outPath, bytes);
    raw.Content = `/${PIC_BASENAME}.${ext}`;
    raw.body = undefined;
    return { src, path: `/${PIC_BASENAME}.${ext}`, bytes: bytes.length };
  } catch (err) {
    console.warn(`  ! profile picture download failed (${err.message}) — keeping the existing one`);
    raw.Content = '';
    return { error: err.message };
  }
}

/**
 * ---- Top Stuff tile art -------------------------------------------------
 *
 * A tile looks bad empty, and hand-picking a square for every row is exactly the
 * chore this pipeline exists to avoid. So the image is discovered, in order:
 *
 *   1. the row's own Image column, if set (an explicit override always wins)
 *   2. for your own posts — the first image in the post body
 *   3. for an outbound Link — the site's og:image, then twitter:image, then its
 *      apple-touch-icon, then /favicon.ico
 *   4. nothing found → the numbered placeholder tile
 *
 * Whatever is found is DOWNLOADED into public/featured/ and referenced by a local
 * path, for the same reason the profile picture is: a remote URL that works today
 * is a broken image in six months, and og:images get re-cut all the time.
 *
 * Every failure here is non-fatal. A site being down, slow, or hostile to scrapers
 * must never block a publish — the tile falls back to whatever it had before, or
 * to a placeholder.
 */

const FEATURED_DIR_NAME = 'featured';
const BODY_MEDIA_DIR_NAME = 'media';
const FETCH_TIMEOUT_MS = 8000;
// Some sites 403 an unadorned fetch; a plain desktop UA is enough for most.
const UA = 'Mozilla/5.0 (compatible; MehhSpaceBot/1.0; +https://mehhspace.com)';

/** First markdown image URL in a post body, if it has one. */
export function firstMarkdownImage(md) {
  const m = String(md ?? '').match(/!\[[^\]]*\]\(\s*<?([^\s)>]+)>?(?:\s+["'][^"']*["'])?\s*\)/);
  return m ? m[1] : null;
}

/**
 * Best representative image declared by a page's HTML.
 * Open Graph first (it's what the page chose to show when shared), then Twitter's
 * equivalent, then touch icons, and finally the conventional favicon path.
 */
export function pickImageFromHtml(html, baseUrl) {
  const patterns = [
    /<meta[^>]+(?:property|name)=["']og:image(?::url|:secure_url)?["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']og:image(?::url|:secure_url)?["']/i,
    /<meta[^>]+(?:name|property)=["']twitter:image(?::src)?["'][^>]*content=["']([^"']+)["']/i,
    /<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]+rel=["'][^"']*\bicon\b[^"']*["'][^>]*href=["']([^"']+)["']/i,
  ];
  for (const re of patterns) {
    const m = String(html).match(re);
    if (!m) continue;
    try { return new URL(m[1], baseUrl).href; } catch { /* malformed, try the next */ }
  }
  try { return new URL('/favicon.ico', baseUrl).href; } catch { return null; }
}

function timedFetch(url, extraHeaders = {}) {
  return fetch(url, {
    headers: { 'user-agent': UA, ...extraHeaders },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    redirect: 'follow',
  });
}

/** Ask an external page what image represents it. Returns null if it won't say. */
async function discoverImageForSite(href) {
  const res = await timedFetch(href, { accept: 'text/html,application/xhtml+xml' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get('content-type') ?? '';
  if (!/html/i.test(type)) throw new Error(`not HTML (${type.split(';')[0] || 'unknown'})`);
  // og:/link tags all live in <head>; no need to hold a whole page in memory.
  return pickImageFromHtml((await res.text()).slice(0, 200_000), res.url || href);
}

/** Download a resolved image into public/featured/ and return its site path. */
async function downloadTile(src, basename, publicDir, dirName = FEATURED_DIR_NAME) {
  const res = await timedFetch(src, { accept: 'image/*' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  if (!bytes.length) throw new Error('empty response body');

  let ext = (new URL(src).pathname.split('.').pop() || '').toLowerCase();
  if (!ALLOWED_PIC_EXT.has(ext)) {
    ext = extFromContentType(res.headers.get('content-type')) ?? (ext === 'ico' ? 'ico' : 'png');
  }
  const dir = join(publicDir, dirName);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  // Drop other extensions for this tile so a format change can't leave two files.
  for (const f of readdirSync(dir)) {
    if (f.startsWith(`${basename}.`)) unlinkSync(join(dir, f));
  }
  writeFileSync(join(dir, `${basename}.${ext}`), bytes);
  return { path: `/${dirName}/${basename}.${ext}`, bytes: bytes.length };
}

/** An already-downloaded tile from a previous run, if one survives in public/. */
function existingTile(basename, publicDir, dirName = FEATURED_DIR_NAME) {
  const dir = join(publicDir, dirName);
  if (!existsSync(dir)) return null;
  const hit = readdirSync(dir).find((f) => f.startsWith(`${basename}.`));
  return hit ? `/${dirName}/${hit}` : null;
}

/**
 * Download every remote image embedded in a page body into public/media/<slug>/
 * and rewrite the markdown to that local path.
 *
 * Why: an image dragged into a Notion page is served from a presigned S3 URL that
 * expires in minutes and is re-signed on every fetch, so passing it through would
 * publish a link that is already dead by the time the site deploys. Any other
 * remote host rots the same way, more slowly. Same philosophy as the tile and
 * bookmark passes: fetch once at publish time, keep the bytes in the repo.
 *
 * Runs after materializeBookmarks (so it sees finished body markdown) and before
 * the tile pass (so a post's first image is already a local path). Rewrites
 * `raw.body` in place; every failure is non-fatal and leaves that one URL as-is.
 */
export async function materializeBodyImages(input, { dryRun = false } = {}) {
  const report = [];
  const publicDir = join(ROOT, 'public');
  const IMG = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g;

  for (const raw of input.rows ?? []) {
    const row = normalizeRow(raw);
    if (!PAGE_COLLECTIONS[row.tag] || row.status !== 'Published') continue;
    let md = row.content ?? '';
    const matches = md ? [...md.matchAll(IMG)] : [];
    if (!matches.length) continue;

    const slug = slugify(row.slug ?? row.title ?? 'post') || 'post';
    const dirName = `${BODY_MEDIA_DIR_NAME}/${slug}`;
    const kept = new Set();
    let index = 0;
    let allOk = true;

    for (const [whole, alt, src] of matches) {
      index += 1;
      const basename = String(index).padStart(2, '0');
      if (dryRun) {
        report.push({ post: row.title, src, path: `(would download to /${dirName}/${basename}.<ext>)`, dryRun: true });
        continue;
      }
      try {
        const { path, bytes } = await downloadTile(src, basename, publicDir, dirName);
        md = md.replace(whole, `![${alt}](${path})`);
        kept.add(path.split('/').pop());
        report.push({ post: row.title, src, path, bytes });
      } catch (err) {
        allOk = false;
        console.warn(`  ! "${row.title}": body image ${index} could not be downloaded (${err.message}) — left the remote URL in place`);
      }
    }

    // Prune images a previous run left behind that this post no longer uses — but
    // only when every download succeeded, so a partial failure can never delete a
    // file the published markdown still points at.
    if (!dryRun && allOk) {
      const dir = join(publicDir, dirName);
      if (existsSync(dir)) for (const f of readdirSync(dir)) {
        if (!kept.has(f)) unlinkSync(join(dir, f));
      }
    }

    if (!dryRun) {
      raw.body = md;
      raw.Content = undefined;
      raw.content = undefined;
    }
  }
  return report;
}

/**
 * Resolve tile art for every featured row and rewrite each row's Image column to
 * the local path, so the sync transform downstream just sees a normal image URL.
 */
export async function materializeFeaturedImages(input, { dryRun = false } = {}) {
  const raws = (input.rows ?? []).filter((raw) => {
    const r = normalizeRow(raw);
    return r.featured && r.status === 'Published' && featuredHref(r);
  });
  if (!raws.length) return [];

  const publicDir = join(ROOT, 'public');
  const report = [];

  for (const raw of raws) {
    const row = normalizeRow(raw);
    const basename = slugify(row.title ?? featuredHref(row) ?? 'tile') || 'tile';
    const label = row.title ?? basename;

    // 1. explicit override, already local — nothing to fetch
    if (row.image && !/^https?:\/\//i.test(row.image)) {
      report.push({ label, path: row.image, source: 'Image column' });
      continue;
    }

    let src = row.image ?? null;
    let source = src ? 'Image column' : null;
    const href = featuredHref(row);

    try {
      if (!src && PAGE_COLLECTIONS[row.tag]) {
        src = firstMarkdownImage(row.content);
        if (src) {
          source = 'first image in the post';
          // A post image that already lives in public/ needs no download.
          if (!/^https?:\/\//i.test(src)) {
            raw.Image = src;
            report.push({ label, path: src, source });
            continue;
          }
        }
      }
      if (!src && isExternal(href)) {
        src = await discoverImageForSite(href);
        source = 'the site itself';
      }
      if (!src) throw new Error('no image found');
      if (dryRun) {
        report.push({ label, path: `(would download from ${source})`, source, dryRun: true });
        continue;
      }
      const { path, bytes } = await downloadTile(src, basename, publicDir);
      raw.Image = path;
      report.push({ label, path, source, bytes });
    } catch (err) {
      if (dryRun) { report.push({ label, error: err.message, dryRun: true }); continue; }
      const kept = existingTile(basename, publicDir);
      if (kept) {
        raw.Image = kept;
        report.push({ label, path: kept, source: 'kept from a previous run', error: err.message });
      } else {
        console.warn(`  ! no tile image for "${label}" (${err.message}) — using a placeholder`);
        report.push({ label, error: err.message });
      }
    }
  }
  return report;
}

/**
 * ---- Bookmark cards ----------------------------------------------------
 *
 * Notion's own /bookmark block is a dead end here: the API returns it as
 * `<unknown alt="bookmark"/>` whose url attribute points back at the block
 * itself, so the site it bookmarked is simply not knowable. notionToMarkdown
 * drops it and says so.
 *
 * What DOES survive the API is an ordinary link. So a paragraph whose entire
 * content is one link becomes the card instead — paste a URL into Notion and
 * pick "Dismiss" rather than "Create bookmark". The card is filled in by asking
 * the destination how it describes itself (og:title / og:description / og:image,
 * with the usual fallbacks), which is the same trick the Top Stuff tiles use.
 *
 * The thumbnail is downloaded into public/bookmarks/ for the same reason tile
 * art is: a hotlinked og:image is a broken image six months from now.
 *
 * Every failure is non-fatal and degrades one step at a time — no image, then no
 * description, then a bare card showing just the host. A slow or hostile site
 * must never be able to block a publish.
 */

const BOOKMARK_DIR_NAME = 'bookmarks';

/**
 * A line that is nothing but a single link. Bare URL, autolink, or a markdown
 * link whose text is just the URL again — all three are what Notion emits for a
 * pasted-and-dismissed link. A link with real link TEXT is left alone: the
 * author wrote that inline on purpose.
 */
const LINK_ONLY_RE = /^\s*(?:<(https?:\/\/[^\s>]+)>|\[([^\]]*)\]\(\s*<?(https?:\/\/[^\s)>]+)>?\s*\)|(https?:\/\/[^\s]+))\s*$/;
export function linkOnlyHref(line) {
  const m = String(line).match(LINK_ONLY_RE);
  if (!m) return null;
  const [, angle, text, mdHref, bare] = m;
  const href = angle ?? mdHref ?? bare;
  // `[Read the docs](url)` is deliberate inline prose, not a card. But Notion
  // labels a pasted-and-dismissed link with the address itself — sometimes the
  // full URL, sometimes just the domain — so a label that IS the destination
  // still counts as a bare link.
  if (mdHref && text && text.trim() && !labelsItsOwnUrl(text.trim(), mdHref)) return null;
  return href ?? null;
}

/** Does this link's visible text just restate where it points? */
function labelsItsOwnUrl(text, href) {
  const strip = (u) => String(u)
    .trim().toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '');
  const bare = strip(href);
  const label = strip(text);
  if (label === bare) return true;
  try { return label === strip(new URL(href).host); } catch { return false; }
}

/** Pull the card fields a page publishes about itself. */
export function pickMetaFromHtml(html, baseUrl) {
  const first = (...patterns) => {
    for (const re of patterns) {
      const m = String(html).match(re);
      // The quote-matching patterns capture the delimiter first, so the value is
      // whichever trailing group actually matched.
      const value = m && (m[2] ?? m[1]);
      if (value && value.trim()) return decodeEntities(value.trim());
    }
    return '';
  };
  // The closing quote must match the opening one — a double-quoted description
  // containing an apostrophe is completely ordinary and must not truncate there.
  const meta = (name) => [
    new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=(["'])([\\s\\S]*?)\\1`, 'i'),
    new RegExp(`<meta[^>]+content=(["'])([\\s\\S]*?)\\1[^>]*(?:property|name)=["']${name}["']`, 'i'),
  ];
  return {
    title: first(...meta('og:title'), ...meta('twitter:title'), /<title[^>]*>([\s\S]*?)<\/title>/i),
    description: first(...meta('og:description'), ...meta('twitter:description'), ...meta('description')),
    image: pickImageFromHtml(html, baseUrl),
  };
}

/**
 * Decode the entities a scraped <title> or description realistically contains.
 *
 * Sites write their og: tags for HTML, so a title arrives holding things like
 * `&mdash;` and `&#8217;`. Those have to be resolved to real characters here —
 * bookmarkCard escapes the result on the way out, so anything left encoded would
 * be double-escaped and show up literally on the page.
 */
const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  mdash: '—', ndash: '–', hellip: '…', middot: '·', bull: '•',
  lsquo: '\u2018', rsquo: '\u2019', ldquo: '\u201C', rdquo: '\u201D',
  laquo: '«', raquo: '»', copy: '©', reg: '®', trade: '™', deg: '°',
  eacute: 'é', egrave: 'è', uuml: 'ü', ouml: 'ö', auml: 'ä', ccedil: 'ç',
};
function decodeEntities(s) {
  return String(s)
    .replace(/&#x([0-9a-f]+);/gi, (_m, h) => safeCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_m, d) => safeCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, name) => NAMED_ENTITIES[name.toLowerCase()] ?? m)
    .replace(/\s+/g, ' ').trim();
}

/** A malformed numeric entity must yield nothing, not throw mid-publish. */
function safeCodePoint(n) {
  try { return String.fromCodePoint(n); } catch { return ''; }
}

function clamp(s, max) {
  const t = String(s ?? '').trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t;
}

/** Render one card. Kept on contiguous lines so markdown passes it through raw. */
export function bookmarkCard({ href, title, description, image }) {
  let host = href;
  try { host = new URL(href).host.replace(/^www\./, ''); } catch { /* keep the raw string */ }
  const heading = clamp(title || host, 120);
  const parts = [
    `<a class="bookmark" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">`,
    '<span class="bookmark-info">',
    `<span class="bookmark-title">${escapeHtml(heading)}</span>`,
  ];
  if (description) parts.push(`<span class="bookmark-desc">${escapeHtml(clamp(description, 220))}</span>`);
  // When the site told us nothing the heading already IS the host; printing it
  // again just gives the card the same word twice.
  if (heading !== host) parts.push(`<span class="bookmark-host">${escapeHtml(host)}</span>`);
  parts.push('</span>');
  if (image) parts.push(`<img class="bookmark-thumb" src="${escapeHtml(image)}" alt="" loading="lazy" />`);
  parts.push('</a>');
  return parts.join('\n');
}

/**
 * Turn every standalone link in every page body into a bookmark card, resolving
 * each destination's metadata and caching its thumbnail locally.
 *
 * Runs before transform() and rewrites the row in place, exactly like the
 * profile picture and tile art passes, so the synchronous transform downstream
 * only ever sees finished markdown.
 */
export async function materializeBookmarks(input, { dryRun = false } = {}) {
  const report = [];
  const publicDir = join(ROOT, 'public');
  const seen = new Map(); // one fetch per URL even if it is linked from several posts

  for (const raw of input.rows ?? []) {
    const row = normalizeRow(raw);
    if (!PAGE_COLLECTIONS[row.tag] || row.status !== 'Published') continue;
    const warn = [];
    const md = notionToMarkdown(row.content ?? '', warn);
    for (const w of warn) console.warn(`  ! "${row.title}": ${w}`);
    if (!md.trim()) continue;

    const lines = md.split('\n');
    let touched = false;
    for (let i = 0; i < lines.length; i++) {
      const href = linkOnlyHref(lines[i]);
      if (!href) continue;
      if (!seen.has(href)) seen.set(href, await resolveBookmark(href, publicDir, { dryRun }));
      const card = seen.get(href);
      lines[i] = bookmarkCard(card);
      touched = true;
      report.push({ post: row.title, href, ...card, card: undefined });
    }
    // Always write the converted markdown back: the conversion is the point, the
    // cards are a bonus. Leaving the raw tags in place on a no-bookmark post
    // would be a regression.
    raw.body = lines.join('\n');
    raw.Content = undefined;
    raw.content = undefined;
    if (touched) { /* reported above */ }
  }
  return report;
}

/** Ask one destination to describe itself, and cache its thumbnail. */
async function resolveBookmark(href, publicDir, { dryRun = false } = {}) {
  const basename = slugify(href.replace(/^https?:\/\//, '')) || 'bookmark';
  try {
    const res = await timedFetch(href, { accept: 'text/html,application/xhtml+xml' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = res.headers.get('content-type') ?? '';
    if (!/html/i.test(type)) throw new Error(`not HTML (${type.split(';')[0] || 'unknown'})`);
    const meta = pickMetaFromHtml((await res.text()).slice(0, 200_000), res.url || href);

    let image = existingTile(basename, publicDir, BOOKMARK_DIR_NAME);
    if (meta.image && !dryRun) {
      try {
        image = (await downloadTile(meta.image, basename, publicDir, BOOKMARK_DIR_NAME)).path;
      } catch (err) {
        console.warn(`  ! bookmark thumbnail for ${href} failed (${err.message})${image ? ' — kept the cached one' : ''}`);
      }
    }
    return { href, title: meta.title, description: meta.description, image };
  } catch (err) {
    console.warn(`  ! bookmark ${href} could not be read (${err.message}) — showing a bare card`);
    return { href, title: '', description: '', image: existingTile(basename, publicDir, BOOKMARK_DIR_NAME) };
  }
}

// --- CLI entry ---
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const fileArg = args.find((a) => !a.startsWith('--'));
  const raw = fileArg ? readFileSync(fileArg, 'utf8') : readFileSync(0, 'utf8');
  const input = JSON.parse(raw);
  const pic = await materializeProfilePic(input, { dryRun });
  // Bookmarks first: it rewrites each page body to finished markdown, which the
  // tile pass then scans for a post's first image.
  const bookmarks = await materializeBookmarks(input, { dryRun });
  // Localize body images before the tile pass, so a post's first image is a local
  // path the tile pass can adopt without a second download.
  const bodyImages = await materializeBodyImages(input, { dryRun });
  const tiles = await materializeFeaturedImages(input, { dryRun });
  const plan = transform(input, { dryRun });
  if (pic?.path) {
    console.log(`MehhSpace profile picture: ${pic.path}${pic.bytes ? ` (${Math.round(pic.bytes / 1024)} KB)` : ''}`);
  }
  const label = dryRun ? 'DRY RUN — would update' : 'Updated';
  console.log(`MehhSpace ${label}:`);
  console.log(`  profile.json fields: ${plan.profile.length ? plan.profile.join(', ') : '(none)'}`);
  console.log(`  projects: ${plan.projects}`);
  console.log(`  contact links: ${plan.contact || '(none — kept existing)'}`);
  console.log(`  featured tiles: ${plan.featured || '(none — kept existing)'}`);
  for (const t of tiles) {
    const detail = t.error && !t.path ? `placeholder (${t.error})` : `${t.path} — from ${t.source}`;
    console.log(`    · ${t.label}: ${detail}`);
  }
  if (bookmarks.length) {
    console.log(`  bookmark cards: ${bookmarks.length}`);
    for (const b of bookmarks) {
      const detail = b.title ? `"${b.title}"${b.image ? ` + thumbnail` : ' (no thumbnail)'}` : 'bare card (site unreadable)';
      console.log(`    · ${b.post}: ${b.href} → ${detail}`);
    }
  }
  if (bodyImages.length) {
    console.log(`  body images: ${bodyImages.length}`);
    for (const im of bodyImages) {
      const detail = im.dryRun ? im.path : `${im.path}${im.bytes ? ` (${Math.round(im.bytes / 1024)} KB)` : ''}`;
      console.log(`    · ${im.post}: ${detail}`);
    }
  }
  console.log(`  resume: ${plan.resume ? 'yes' : plan.resumeSkipped ? 'SKIPPED (empty/malformed body — kept existing resume.json)' : 'no'}`);
  console.log(`  pages: ${plan.pages.length ? plan.pages.join(', ') : '(none)'}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => { console.error(`MehhSpaceUpdate failed: ${err.message}`); process.exit(1); });
}
