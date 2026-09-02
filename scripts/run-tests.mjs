/**
 * Minimal test runner (this Node build's `node --test` glob is broken).
 * Run: node scripts/run-tests.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseResume, buildMarkdown, deriveExcerpt, slugify, transform, normalizeRow, normalizeBlocks, materializeProfilePic, contactLinks, SINGLETON_MAP,
  featuredHref, featuredItems, truthyCheckbox, isExternal, firstMarkdownImage, pickImageFromHtml,
  notionToMarkdown, notionColorSuffix, shikiLang, splitAttrList, linkOnlyHref, pickMetaFromHtml,
  bookmarkCard, escapeHtml } from './mehhspace-update.mjs';

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
  // Resume strings are de-dashed: em/en dashes → hyphens (see parseResume).
  assert.equal(r.headline, 'Zack - Software Engineer');
  assert.equal(r.tagline, 'Building systems, breaking them on purpose, and occasionally writing about it.');
  assert.equal(r.pdf, '/zack-resume.pdf');
  assert.equal(r.experience.length, 2);
  assert.equal(r.experience[0].title, 'Senior Software Engineer - Company Name');
  assert.equal(r.experience[0].meta, '2023 - Present · Location');
  assert.equal(r.experience[0].bullets.length, 3);
  assert.equal(r.experience[1].bullets.length, 2);
  assert.equal(r.skills.length, 3);
  assert.deepEqual(r.skills[0], { label: 'Languages', value: 'TypeScript, Python, Go, whatever the problem calls for' });
  assert.equal(r.education.length, 1);
  assert.equal(r.education[0].title, 'Degree, Major - University Name');
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
    'personal/learning-to-actually-finish-a-song.md',
  ].sort());
});

test('page-intro singletons map into profile.pageIntros', () => {
  const tags = ['Blog_Intro', 'Lab_Intro', 'Classes_Intro', 'Personal_Intro'];
  for (const t of tags) {
    assert.ok(SINGLETON_MAP[t], `${t} present in SINGLETON_MAP`);
    assert.equal(SINGLETON_MAP[t][0], 'pageIntros', `${t} routes into pageIntros`);
  }
  // A populated intro row is applied.
  const plan = transform({
    rows: [
      { tag: 'Mood', status: 'Published', content: 'ok' },
      { tag: 'Classes_Intro', status: 'Published', content: 'New classes blurb' },
      { tag: 'Blog_Intro', status: 'Published', content: 'New blog blurb' },
    ],
  }, { dryRun: true });
  assert.ok(plan.profile.includes('Classes_Intro'), 'populated Classes_Intro mapped');
  assert.ok(plan.profile.includes('Blog_Intro'), 'populated Blog_Intro mapped');

  // A blank intro row is preserved (skipped), never blanking the existing blurb.
  const guarded = transform({
    rows: [
      { tag: 'Mood', status: 'Published', content: 'ok' },
      { tag: 'Lab_Intro', status: 'Published', content: '' },
    ],
  }, { dryRun: true });
  assert.ok(!guarded.profile.includes('Lab_Intro'), 'blank Lab_Intro skipped, existing kept');
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
  assert.equal(plan.contact, 2, 'Contact rows picked up from the raw SQL shape');
  assert.equal(plan.resume, true);
  assert.deepEqual(plan.pages.sort(), [
    'blog/setting-up-this-whole-pipeline.md',
    'personal/learning-to-actually-finish-a-song.md',
    'classes/week-1-subnetting.md',
  ].sort(), 'draft blog excluded, published page rows routed');
});

test('Contact rows become an ordered profile.contact array', () => {
  const links = contactLinks([
    { tag: 'Contact', order: 3, title: 'TikTok', content: 'https://tiktok.com/@zack' },
    { tag: 'Contact', order: 1, title: 'Email', content: '  mailto:hi@mehhspace.com  ' },
    { tag: 'Contact', order: 2, title: 'LinkedIn', content: 'https://linkedin.com/in/zack' },
  ].map(normalizeRow));
  assert.deepEqual(links, [
    { label: 'Email', href: 'mailto:hi@mehhspace.com' },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/zack' },
    { label: 'TikTok', href: 'https://tiktok.com/@zack' },
  ], 'sorted by Order, hrefs trimmed');
});

test('Contact href comes from Content, not the Notion page url column', () => {
  const links = contactLinks([normalizeRow({
    Name: 'LinkedIn', Tag: 'Contact', Content: 'https://www.linkedin.com/in/example',
    Status: 'Published', Order: 1, url: 'https://notion.so/contact-linkedin',
  })]);
  assert.deepEqual(links, [{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/example' }]);
});

test('a pull with no Contact rows keeps the existing links', () => {
  assert.equal(contactLinks([normalizeRow({ tag: 'Mood', content: 'unchanged' })]), null,
    'null means "leave profile.contact alone"');
});

test('a Contact row with an empty Content falls back to #', () => {
  assert.deepEqual(
    contactLinks([normalizeRow({ tag: 'Contact', order: 1, title: 'Instagram', content: '   ' })]),
    [{ label: 'Instagram', href: '#' }]);
});

test('truthyCheckbox accepts Notion\'s __YES__ and a real boolean', () => {
  assert.equal(truthyCheckbox('__YES__'), true);
  assert.equal(truthyCheckbox(true), true);
  assert.equal(truthyCheckbox('__NO__'), false);
  assert.equal(truthyCheckbox(null), false);
  assert.equal(truthyCheckbox(undefined), false);
});

test('featuredHref routes each tag to the right link', () => {
  const href = (r) => featuredHref(normalizeRow(r));
  assert.equal(href({ tag: 'Blog', slug: 'my-post' }), '/blog/my-post');
  assert.equal(href({ tag: 'Personal', slug: 'Music-Test-Post' }), '/personal/music-test-post', 'slug matches the written file');
  assert.equal(href({ tag: 'Classes', slug: 'week-1-subnetting' }), '/classes/week-1-subnetting');
  assert.equal(href({ tag: 'Lab', title: 'No Slug Here' }), '/lab/no-slug-here', 'falls back to the title');
  assert.equal(href({ tag: 'Link', content: 'https://spacehey.com' }), 'https://spacehey.com');
  assert.equal(href({ tag: 'Project', slug: 'this-site' }), 'this-site');
  assert.equal(href({ tag: 'Mood', content: 'hi' }), null, 'a singleton is not linkable');
});

test('featuredItems collects any Featured row across tags, in Order', () => {
  const items = featuredItems([
    { tag: 'Link', Featured: '__YES__', order: 3, title: 'SpaceHey', content: 'https://spacehey.com' },
    { tag: 'Blog', Featured: '__YES__', order: 1, title: 'A Post', slug: 'a-post' },
    { tag: 'Personal', Featured: '__NO__', order: 2, title: 'Not Featured', slug: 'nope' },
    { tag: 'Project', Featured: true, order: 2, title: 'This Site', slug: 'this-site' },
  ].map(normalizeRow));
  assert.deepEqual(items.map((i) => i.title), ['A Post', 'This Site', 'SpaceHey']);
  assert.equal(items[0].href, '/blog/a-post');
  assert.equal(items[0].external, false);
  assert.equal(items[2].external, true, 'outbound link flagged');
  assert.ok(items[1].image, 'every tile gets an image, placeholder if nothing else');
});

test('featuredItems sorts un-numbered rows by date, newest first', () => {
  const items = featuredItems([
    { tag: 'Blog', Featured: '__YES__', title: 'Older', slug: 'older', date: '2026-01-01' },
    { tag: 'Blog', Featured: '__YES__', title: 'Newer', slug: 'newer', date: '2026-08-01' },
  ].map(normalizeRow));
  assert.deepEqual(items.map((i) => i.title), ['Newer', 'Older']);
});

test('featuredItems skips a Featured row that has nowhere to point', () => {
  assert.equal(featuredItems([normalizeRow({ tag: 'Contact', Featured: '__YES__', title: 'Email', content: 'mailto:x@y.z' })]), null);
  assert.equal(featuredItems([normalizeRow({ tag: 'Link', Featured: '__YES__', title: 'Empty' })]), null, 'a Link with no href is dropped');
});

test('nothing featured keeps the existing tiles', () => {
  assert.equal(featuredItems([normalizeRow({ tag: 'Mood', content: 'x' })]), null);
});

test('an explicit Image column overrides the discovered art', () => {
  const [item] = featuredItems([normalizeRow(
    { tag: 'Blog', Featured: '__YES__', title: 'A Post', slug: 'a-post', Image: 'https://example.com/pic.png' })]);
  assert.equal(item.image, 'https://example.com/pic.png');
});

test('isExternal only flags http(s)', () => {
  assert.equal(isExternal('https://spacehey.com'), true);
  assert.equal(isExternal('/blog/a-post'), false);
  assert.equal(isExternal(null), false);
});

test('firstMarkdownImage finds the first inline image in a body', () => {
  assert.equal(firstMarkdownImage('# Title\n\nWords.\n\n![alt](https://x.test/a.png)\n\n![b](https://x.test/b.png)'),
    'https://x.test/a.png');
  assert.equal(firstMarkdownImage('![shot](/local.jpg "a title")'), '/local.jpg', 'title attribute stripped');
  assert.equal(firstMarkdownImage('no images here'), null);
});

test('pickImageFromHtml prefers og:image, then falls back down the chain', () => {
  const base = 'https://example.com/post';
  assert.equal(
    pickImageFromHtml('<meta property="og:image" content="/og.png"><link rel="icon" href="/f.ico">', base),
    'https://example.com/og.png', 'og:image wins and is resolved against the page');
  assert.equal(
    pickImageFromHtml('<meta name="twitter:image" content="https://cdn.test/t.jpg">', base),
    'https://cdn.test/t.jpg');
  assert.equal(
    pickImageFromHtml('<link rel="apple-touch-icon" href="/touch.png">', base),
    'https://example.com/touch.png');
  assert.equal(
    pickImageFromHtml('<html><head><title>nothing</title></head></html>', base),
    'https://example.com/favicon.ico', 'conventional favicon is the last resort');
});

test('pickImageFromHtml handles reversed meta attribute order', () => {
  assert.equal(
    pickImageFromHtml('<meta content="https://cdn.test/og.png" property="og:image">', 'https://example.com/'),
    'https://cdn.test/og.png');
});

test('normalizeBlocks separates Notion blank-line-free paragraphs', () => {
  // Exactly the shape the CLI reported: no blank lines between blocks.
  const notion = [
    'First paragraph here.',
    'Second paragraph, wrongly merged today.',
    '# A heading',
    'Body under the heading.',
  ].join('\n');
  const md = normalizeBlocks(notion);
  assert.equal(md, [
    'First paragraph here.',
    '',
    'Second paragraph, wrongly merged today.',
    '',
    '# A heading',
    '',
    'Body under the heading.',
    '',
  ].join('\n'));
});

test('normalizeBlocks keeps list items and code fences contiguous', () => {
  const src = [
    'Intro line.',
    '- one',
    '- two',
    '- three',
    'After the list.',
    '```',
    'code line 1',
    '',
    'code line 2',
    '```',
    'Trailing paragraph.',
  ].join('\n');
  const md = normalizeBlocks(src);
  // list items stay together (no blank injected between them)
  assert.match(md, /- one\n- two\n- three/);
  // a blank precedes the list (para → list) and follows it (list → para)
  assert.match(md, /Intro line\.\n\n- one/);
  assert.match(md, /- three\n\nAfter the list\./);
  // the blank line INSIDE the fence is preserved verbatim
  assert.match(md, /```\ncode line 1\n\ncode line 2\n```/);
  // blank line after the closed fence
  assert.match(md, /```\n\nTrailing paragraph\./);
});

test('buildMarkdown excerpt is the first paragraph only (not merged)', () => {
  const row = { tag: 'Blog', title: 'X', date: '2026-08-13',
    content: 'Para one is the real excerpt.\nPara two should not leak in.' };
  const md = buildMarkdown(row);
  assert.match(md, /excerpt: "Para one is the real excerpt\."/);
  assert.match(md, /Para one is the real excerpt\.\n\nPara two should not leak in\./);
});

test('transform empty-resume guard skips instead of clobbering', () => {
  const plan = transform({
    rows: [
      { tag: 'Mood', status: 'Published', content: 'ok' },
      { tag: 'Resume', status: 'Published', content: 'just a stray sentence, no ## sections' },
    ],
  }, { dryRun: true });
  assert.equal(plan.resume, false);
  assert.equal(plan.resumeSkipped, true);
});

test('normalizeRow picks up the Notion File column', () => {
  assert.equal(normalizeRow({ Tag: 'Profile_Pic', File: 'https://x/y.png' }).fileUrl, 'https://x/y.png');
  assert.equal(normalizeRow({ tag: 'Profile_Pic', fileUrl: 'https://a/b.jpg' }).fileUrl, 'https://a/b.jpg');
});

test('Profile_Pic maps to profile.profilePic', () => {
  const plan = transform({
    rows: [{ tag: 'Profile_Pic', status: 'Published', content: '/profile-pic.png' }],
  }, { dryRun: true });
  assert.deepEqual(plan.profile, ['Profile_Pic']);
});

test('an empty Profile_Pic does not clear the existing picture', () => {
  // The row is permanent but its File is empty on every publish that isn't a
  // photo change — this guard is what stops those runs from blanking the pic.
  const plan = transform({
    rows: [
      { tag: 'Mood', status: 'Published', content: 'ok' },
      { tag: 'Profile_Pic', status: 'Published', content: '' },
    ],
  }, { dryRun: true });
  assert.deepEqual(plan.profile, ['Mood']);
});

test('About_Me takes its value from the page body', () => {
  // About_Me moved out of the Content column into the Notion page body, so the
  // pull attaches it under `body` like a post — same as any body-backed row.
  const plan = transform({
    rows: [{ Name: 'About Me', Tag: 'About_Me', Content: null, Status: 'Published',
             body: 'first paragraph\n\nsecond paragraph' }],
  }, { dryRun: true });
  assert.deepEqual(plan.profile, ['About_Me']);
  assert.equal(
    normalizeRow({ Tag: 'About_Me', Content: null, body: 'from the body' }).content,
    'from the body',
  );
});

test('an empty About_Me does not clear the existing blurb', () => {
  // Its value needs its own page fetch, and one failed fetch must not blank the
  // About me box the way it would for a Content-column singleton.
  const plan = transform({
    rows: [
      { tag: 'Mood', status: 'Published', content: 'ok' },
      { tag: 'About_Me', status: 'Published', content: '' },
    ],
  }, { dryRun: true });
  assert.deepEqual(plan.profile, ['Mood']);
});

await (async () => {
  const name = 'materializeProfilePic leaves rows alone when no file is attached';
  try {
    const input = { rows: [{ tag: 'Profile_Pic', status: 'Published', File: '' }] };
    assert.equal(await materializeProfilePic(input, { dryRun: true }), null);
    pass++; console.log(`  ✓ ${name}`);
  } catch (err) { fail++; console.error(`  ✗ ${name}\n    ${err.message}`); }
})();


// ---- Notion block tags → markdown ----

test('notionToMarkdown turns a callout into a tinted, icon-bearing box', () => {
  const md = notionToMarkdown('<callout icon="💡" color="gray_bg">\n\tHeads up **now**\n</callout>');
  assert.match(md, /<aside class="callout callout--gray">/);
  assert.match(md, /<span class="callout-icon" aria-hidden="true">💡<\/span>/);
  assert.match(md, /<div class="callout-body">\n\nHeads up \*\*now\*\*\n\n<\/div>\n<\/aside>/);
});

test('a callout with no colour or icon still renders as a callout', () => {
  const md = notionToMarkdown('<callout>\n\tplain\n</callout>');
  assert.match(md, /callout--default/);
  assert.doesNotMatch(md, /callout-icon/);
});

test('notionColorSuffix folds _bg variants and rejects junk', () => {
  assert.equal(notionColorSuffix('red_bg'), 'red');
  assert.equal(notionColorSuffix('red'), 'red');
  assert.equal(notionColorSuffix('chartreuse'), 'default');
  assert.equal(notionColorSuffix(undefined), 'default');
});

test('a toggle heading becomes a <details> keeping its heading level', () => {
  const md = notionToMarkdown('# Click me {toggle="true"}\n\tinside the toggle\nafter');
  assert.match(md, /<details class="toggle toggle--h1">\n<summary>Click me<\/summary>/);
  assert.match(md, /inside the toggle/);
  assert.match(md, /<\/details>/);
  assert.match(md, /\nafter$/);
});

test('an ordinary heading keeps its level and loses its attribute list', () => {
  assert.equal(notionToMarkdown('## Plain {color="red"}'),
    '## <span class="nc nc--red">Plain</span>');
  assert.equal(notionToMarkdown('### Untouched'), '### Untouched');
});

test('splitAttrList only strips a real attribute list', () => {
  assert.deepEqual(splitAttrList('Title {color="red"}'), { text: 'Title', attrs: { color: 'red' } });
  assert.deepEqual(splitAttrList('an object {like this}'), { text: 'an object {like this}', attrs: {} });
});

test('empty-block is dropped and an unsupported block is reported', () => {
  const warn = [];
  const md = notionToMarkdown('a\n<empty-block/>\n<unknown url="x" alt="bookmark"/>\nb', warn);
  assert.equal(md, 'a\nb');
  assert.equal(warn.length, 1);
  assert.match(warn[0], /bookmark/);
  assert.match(warn[0], /Dismiss/);
});

test('shikiLang maps Notion languages and never returns an unknown id', () => {
  assert.equal(shikiLang('plain text'), 'text');
  assert.equal(shikiLang('C++'), 'cpp');
  assert.equal(shikiLang('JavaScript'), 'javascript');
  assert.equal(shikiLang('brainfuck'), 'text');   // unknown → safe, build cannot break
  assert.equal(shikiLang(''), '');
});

test('a fence keeps its contents literally while its language is normalized', () => {
  const md = notionToMarkdown('```plain text\n<callout>not a real tag</callout>\n```');
  assert.equal(md, '```text\n<callout>not a real tag</callout>\n```');
});

test('inline underline and colour spans become site markup', () => {
  assert.equal(notionToMarkdown('<span underline="true">hi</span>'), '<u>hi</u>');
  assert.equal(notionToMarkdown('<span color="green_bg">hi</span>'),
    '<span class="nc nc--green">hi</span>');
});

test('notionToMarkdown is idempotent', () => {
  const src = [
    '# Head {toggle="true"}', '\tchild', '<callout icon="⚠️" color="red_bg">', '\tbe careful',
    '</callout>', '> quoted', '```plain text', 'code', '```', '---', 'tail',
  ].join('\n');
  const once = notionToMarkdown(src);
  assert.equal(notionToMarkdown(once), once);
});

test('buildMarkdown runs the conversion and keeps the excerpt tag-free', () => {
  const md = buildMarkdown({
    tag: 'Blog', title: 'T', date: '2026-08-20',
    content: '<callout icon="💡">\n\tA note\n</callout>\nReal first paragraph.',
  });
  assert.doesNotMatch(md, /<callout/);
  assert.match(md, /excerpt: "A note"/);
});

test('normalizeBlocks keeps a divider off the line above it', () => {
  // Without a blank line, `---` under text is a setext heading, not a rule.
  assert.match(normalizeBlocks('text above\n---\ntext below'), /text above\n\n---\n\ntext below/);
});

// ---- Bookmark cards ----

test('linkOnlyHref recognises the three shapes Notion emits', () => {
  assert.equal(linkOnlyHref('https://example.com/a'), 'https://example.com/a');
  assert.equal(linkOnlyHref('<https://example.com/a>'), 'https://example.com/a');
  assert.equal(linkOnlyHref('[https://example.com/a](https://example.com/a)'), 'https://example.com/a');
});

test('a link labelled with its own address is still a card', () => {
  // What Notion writes when you paste a URL and choose "Dismiss".
  assert.equal(linkOnlyHref('[newgrounds.com](http://newgrounds.com)'), 'http://newgrounds.com');
  assert.equal(linkOnlyHref('[www.example.com/a](https://www.example.com/a)'), 'https://www.example.com/a');
  assert.equal(linkOnlyHref('[example.com](https://example.com/deep/path)'), 'https://example.com/deep/path');
});

test('linkOnlyHref leaves deliberate inline links alone', () => {
  assert.equal(linkOnlyHref('[the docs](https://example.com)'), null);
  assert.equal(linkOnlyHref('see https://example.com for more'), null);
  assert.equal(linkOnlyHref('not a link at all'), null);
});

test('pickMetaFromHtml reads og tags and decodes entities', () => {
  const html = `<meta property="og:title" content="Ben &amp; Jerry&#39;s">
    <meta property="og:description" content="Ice cream">
    <meta property="og:image" content="/hero.png">`;
  const meta = pickMetaFromHtml(html, 'https://example.com/page');
  assert.equal(meta.title, "Ben & Jerry's");
  assert.equal(meta.description, 'Ice cream');
  assert.equal(meta.image, 'https://example.com/hero.png');
});

test('pickMetaFromHtml falls back to <title> when there are no og tags', () => {
  assert.equal(pickMetaFromHtml('<title>  Just a title </title>', 'https://example.com').title, 'Just a title');
});

test('a description containing an apostrophe is not truncated at it', () => {
  const html = `<meta property="og:description" content="It's a friendly place. Join free!">`;
  assert.equal(pickMetaFromHtml(html, 'https://example.com').description,
    "It's a friendly place. Join free!");
});

test('named and numeric entities are decoded, not passed through', () => {
  const html = `<meta property="og:title" content="SpaceHey &mdash; a space &#8212; for friends &#x2026;">`;
  assert.equal(pickMetaFromHtml(html, 'https://example.com').title,
    'SpaceHey — a space — for friends …');
});

test('an unrecognised entity survives rather than being mangled', () => {
  const html = `<meta property="og:title" content="A &weird; thing">`;
  assert.equal(pickMetaFromHtml(html, 'https://example.com').title, 'A &weird; thing');
});

test('bookmarkCard renders one contiguous HTML block', () => {
  const card = bookmarkCard({
    href: 'https://example.com/a', title: 'Title', description: 'Desc', image: '/bookmarks/x.png',
  });
  assert.ok(!/\n\s*\n/.test(card), 'a blank line would break the raw HTML block');
  assert.match(card, /^<a class="bookmark" href="https:\/\/example\.com\/a" target="_blank"/);
  assert.match(card, /<span class="bookmark-host">example\.com<\/span>/);
  assert.match(card, /<img class="bookmark-thumb" src="\/bookmarks\/x\.png"/);
});

test('a bookmark card degrades to the host when the site says nothing', () => {
  const card = bookmarkCard({ href: 'https://www.example.com/a' });
  assert.match(card, /<span class="bookmark-title">example\.com<\/span>/);
  assert.doesNotMatch(card, /bookmark-thumb|bookmark-desc/);
  // The heading is already the host — repeating it reads as a mistake.
  assert.doesNotMatch(card, /bookmark-host/);
});

test('scraped card text is escaped, not injected', () => {
  const card = bookmarkCard({ href: 'https://example.com', title: '<script>alert(1)</script>' });
  assert.doesNotMatch(card, /<script>/);
  assert.match(card, /&lt;script&gt;/);
  assert.equal(escapeHtml('a&b"c'), 'a&amp;b&quot;c');
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
