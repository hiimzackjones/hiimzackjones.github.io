#!/usr/bin/env node
/**
 * MehhSpace — Notion → site transform.
 *
 * This is the DETERMINISTIC half of the MehhSpaceUpdate workflow. It takes a
 * JSON dump of Notion rows (the "contract" below) and writes them into the
 * Astro site: singleton fields → src/data/profile.json, projects → projects.json,
 * Resume → resume.json, and Blog/Lab/Fun pages → src/content/<coll>/<slug>.md.
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
 * Blog/Lab/Fun/Resume rows — their real markdown lives in the Notion PAGE BODY
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
};

/**
 * Singletons that must never be cleared by an empty Notion value.
 * Profile_Pic is the case that matters: the row exists permanently, but its File
 * property is empty except on the runs where the photo is actually changed.
 * Without this guard every ordinary publish would blank out the picture.
 */
const PRESERVE_IF_EMPTY = new Set(['Profile_Pic']);

const PAGE_COLLECTIONS = { Blog: 'blog', Lab: 'lab', Fun: 'fun' };

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
  };
}

export function slugify(s) {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Derive a short excerpt from a markdown body (first real paragraph). */
export function deriveExcerpt(md, max = 200) {
  const firstPara = String(md)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .find((p) => p && !p.startsWith('#'));
  if (!firstPara) return '';
  const flat = firstPara.replace(/\s+/g, ' ').replace(/[*_`>#]/g, '').trim();
  return flat.length > max ? flat.slice(0, max - 1).trimEnd() + '…' : flat;
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
      else if (type === 'paragraph' && prev === 'paragraph') needBlank = true;
    }
    if (needBlank) out.push('');
    out.push(line);
    prev = type;
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
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
  const body = normalizeBlocks(row.content ?? '');
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

export function transform(input, { dryRun = false } = {}) {
  const rows = (input.rows ?? [])
    .map(normalizeRow)
    .filter((r) => r.tag && r.status === 'Published');
  if (rows.length === 0) {
    throw new Error('Refusing to write: 0 published rows received (likely a failed/empty Notion fetch).');
  }

  const plan = { profile: [], projects: 0, pages: [], resume: false };

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

  // --- content collections (blog / lab / fun) ---
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
  if (projects) writeFileSync(join(DATA_DIR, 'projects.json'), JSON.stringify(projects, null, 2) + '\n');
  if (resume) writeFileSync(join(DATA_DIR, 'resume.json'), JSON.stringify(resume, null, 2) + '\n');
  for (const { dir, files } of pageWrites) {
    clearMarkdown(dir);
    // keep .gitkeep so empty collections (e.g. lab) still have a tracked dir
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

// --- CLI entry ---
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const fileArg = args.find((a) => !a.startsWith('--'));
  const raw = fileArg ? readFileSync(fileArg, 'utf8') : readFileSync(0, 'utf8');
  const input = JSON.parse(raw);
  const pic = await materializeProfilePic(input, { dryRun });
  const plan = transform(input, { dryRun });
  if (pic?.path) {
    console.log(`MehhSpace profile picture: ${pic.path}${pic.bytes ? ` (${Math.round(pic.bytes / 1024)} KB)` : ''}`);
  }
  const label = dryRun ? 'DRY RUN — would update' : 'Updated';
  console.log(`MehhSpace ${label}:`);
  console.log(`  profile.json fields: ${plan.profile.length ? plan.profile.join(', ') : '(none)'}`);
  console.log(`  projects: ${plan.projects}`);
  console.log(`  resume: ${plan.resume ? 'yes' : plan.resumeSkipped ? 'SKIPPED (empty/malformed body — kept existing resume.json)' : 'no'}`);
  console.log(`  pages: ${plan.pages.length ? plan.pages.join(', ') : '(none)'}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => { console.error(`MehhSpaceUpdate failed: ${err.message}`); process.exit(1); });
}
