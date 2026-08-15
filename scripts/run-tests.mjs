/**
 * Minimal test runner (this Node build's `node --test` glob is broken).
 * Run: node scripts/run-tests.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseResume, buildMarkdown, deriveExcerpt, slugify, transform, normalizeRow } from './mehhspace-update.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sample = JSON.parse(readFileSync(join(__dirname, 'fixtures', 'sample-notion.json'), 'utf8'));
const rawSql = JSON.parse(readFileSync(join(__dirname, 'fixtures', 'sample-raw-sql.json'), 'utf8'));

let pass = 0, fail = 0;
function test(name, fn) {
  try { fn(); pass++; console.log(`  ✓ ${name}`); }
  catch (err) { fail++; console.error(`  ✗ ${name}\n    ${err.message}`); }
}

test('slugify normalizes titles', () => {
  assert.equal(slugify("Zack's Cool Post!"), 'zacks-cool-post');
  assert.equal(slugify('  Multi   Word  '), 'multi-word');
});

test('deriveExcerpt skips headings and trims', () => {
  const md = '# Title\n\nThis is the first paragraph that should become the excerpt.\n\nSecond.';
  assert.equal(deriveExcerpt(md), 'This is the first paragraph that should become the excerpt.');
});

test('buildMarkdown emits valid frontmatter', () => {
  const row = { tag: 'Blog', title: 'Hello "World"', date: '2026-08-13', category: 'Web', content: 'Body text here.' };
  const md = buildMarkdown(row);
  assert.match(md, /^---\n/);
  assert.match(md, /title: "Hello \\"World\\""/);
  assert.match(md, /date: 2026-08-13/);
  assert.match(md, /category: "Web"/);
  assert.match(md, /\n---\n\nBody text here\.\n$/);
});

test('parseResume splits sections correctly', () => {
  const resumeRow = sample.rows.find((r) => r.tag === 'Resume');
  const r = parseResume(resumeRow.content, { pdf: resumeRow.pdf });
  assert.equal(r.headline, 'Zack — Software Engineer');
  assert.equal(r.tagline, 'Building systems, breaking them on purpose, and occasionally writing about it.');
  assert.equal(r.pdf, '/zack-resume.pdf');
  assert.equal(r.experience.length, 2);
  assert.equal(r.experience[0].title, 'Senior Software Engineer — Company Name');
  assert.equal(r.experience[0].meta, '2023 — Present · Location');
  assert.equal(r.experience[0].bullets.length, 3);
  assert.equal(r.experience[1].bullets.length, 2);
  assert.equal(r.skills.length, 3);
  assert.deepEqual(r.skills[0], { label: 'Languages', value: 'TypeScript, Python, Go, whatever the problem calls for' });
  assert.equal(r.education.length, 1);
  assert.equal(r.education[0].title, 'Degree, Major — University Name');
  assert.equal(r.education[0].meta, 'Graduated 20XX');
  assert.ok(!('bullets' in r.education[0]));
});

test('transform dry-run reports the full plan', () => {
  const plan = transform(sample, { dryRun: true });
  assert.equal(plan.profile.length, 14, 'all 14 singleton fields mapped');
  assert.equal(plan.projects, 4);
  assert.equal(plan.resume, true);
  assert.deepEqual(plan.pages.sort(), [
    'blog/setting-up-this-whole-pipeline.md',
    'fun/learning-to-actually-finish-a-song.md',
  ].sort());
});

test('transform refuses an empty fetch', () => {
  assert.throws(() => transform({ rows: [] }, { dryRun: true }), /0 published rows/);
});

test('transform drops non-Published rows', () => {
  const plan = transform({
    rows: [
      { tag: 'Mood', status: 'Published', content: 'ok' },
      { tag: 'Blog', status: 'Draft', title: 'Hidden', slug: 'hidden', content: 'x' },
    ],
  }, { dryRun: true });
  assert.equal(plan.pages.length, 0, 'draft blog excluded');
});

test('normalizeRow maps raw Notion SQL columns', () => {
  const blog = normalizeRow(rawSql.rows.find((r) => r.Tag === 'Blog' && r.Status === 'Published'));
  assert.equal(blog.tag, 'Blog');
  assert.equal(blog.title, 'Setting up this whole pipeline');
  assert.equal(blog.date, '2026-08-13');
  assert.match(blog.content, /# How it actually works/, 'page body attached as content');
  const music = normalizeRow(rawSql.rows.find((r) => r.Tag === 'Interest_Music'));
  assert.equal(music.content, "whatever's loud enough to code to", 'singleton value from Content column');
});

test('transform handles the raw SQL shape end-to-end (dry run)', () => {
  const plan = transform(rawSql, { dryRun: true });
  assert.equal(plan.profile.length, 2, 'Mood + Interest_Music');
  assert.equal(plan.projects, 1);
  assert.equal(plan.resume, true);
  assert.deepEqual(plan.pages.sort(), [
    'blog/setting-up-this-whole-pipeline.md',
    'fun/learning-to-actually-finish-a-song.md',
  ].sort(), 'draft blog excluded, published page rows routed');
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
