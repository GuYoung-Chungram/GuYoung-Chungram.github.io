import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectLibrary, splitFeed, embedJson, renderPage, buildPayload } from '../lib/build.mjs';
import { makeData, makeItem, makeFeedItem } from './fixtures.mjs';

const NOW = new Date('2026-10-18T00:00:00+09:00');

test('selectLibrary hides items without reviewedBy by default', () => {
  const items = [makeItem(), makeItem({ id: 'gov-002', reviewedBy: '' })];
  const result = selectLibrary(items, { includeUnreviewed: false });
  assert.deepEqual(result.map((i) => i.id), ['gov-001']);
});

test('selectLibrary keeps unreviewed items in preview mode and flags them', () => {
  const items = [makeItem({ reviewedBy: '' })];
  const [item] = selectLibrary(items, { includeUnreviewed: true });
  assert.equal(item.isPreview, true);
});

test('selectLibrary does not mutate the input items', () => {
  const items = [makeItem({ reviewedBy: '' })];
  const snapshot = JSON.stringify(items);
  selectLibrary(items, { includeUnreviewed: true });
  assert.equal(JSON.stringify(items), snapshot);
});

test('splitFeed separates recent items from the archive and drops duplicates', () => {
  const items = [
    makeFeedItem({ id: 'f-1', collectedAt: '2026-10-13T06:00:00+09:00' }),
    makeFeedItem({ id: 'f-2', collectedAt: '2026-09-01T06:00:00+09:00' }),
    makeFeedItem({ id: 'f-3', collectedAt: '2026-10-13T06:00:00+09:00', duplicateOf: 'f-1' }),
  ];
  const { recent, archive } = splitFeed(items, NOW);
  assert.deepEqual(recent.map((i) => i.id), ['f-1']);
  assert.deepEqual(archive.map((i) => i.id), ['f-2']);
});

test('splitFeed sorts newest first', () => {
  const items = [
    makeFeedItem({ id: 'old', date: '2026-10-01', collectedAt: '2026-10-06T06:00:00+09:00' }),
    makeFeedItem({ id: 'new', date: '2026-10-12', collectedAt: '2026-10-13T06:00:00+09:00' }),
  ];
  assert.deepEqual(splitFeed(items, NOW).recent.map((i) => i.id), ['new', 'old']);
});

test('embedJson escapes characters that could close the script tag', () => {
  const out = embedJson({ text: '</script><script>alert(1)</script>' });
  assert.ok(!out.includes('</script>'));
  assert.deepEqual(JSON.parse(out), { text: '</script><script>alert(1)</script>' });
});

test('renderPage replaces every placeholder', () => {
  const template = '<style>/*@STYLES*/</style><script id="ax-data" type="application/json">/*@DATA*/</script><script>/*@APP*/</script>';
  const html = renderPage(template, { styles: 'body{}', app: 'run()', data: '{"a":1}' });
  assert.equal(html, '<style>body{}</style><script id="ax-data" type="application/json">{"a":1}</script><script>run()</script>');
});

test('renderPage throws when a placeholder is missing from the template', () => {
  assert.throws(() => renderPage('<html></html>', { styles: '', app: '', data: '{}' }), /@STYLES/);
});

test('buildPayload marks new items and carries build metadata', () => {
  const data = makeData({
    library: { items: [makeItem({ reviewedAt: '2026-10-10' }), makeItem({ id: 'gov-002', reviewedAt: '2026-06-01' })] },
  });
  const payload = buildPayload(data, { now: NOW, preview: false });
  const byId = Object.fromEntries(payload.library.map((i) => [i.id, i]));
  assert.equal(byId['gov-001'].isNew, true);
  assert.equal(byId['gov-002'].isNew, false);
  assert.equal(payload.meta.preview, false);
  assert.equal(payload.meta.builtAt, NOW.toISOString());
  assert.equal(payload.stages.length, 10);
});

test('buildPayload carries a usage guide for every role', () => {
  const payload = buildPayload(makeData(), { now: NOW, preview: false });
  ['staff', 'leader', 'planner'].forEach((role) => {
    assert.ok(payload.meta.roleGuides[role]?.length > 10, role);
  });
});
