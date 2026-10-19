import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateAll } from '../lib/validate.mjs';
import { makeData, makeItem, makeFeedItem, makeSource, makeStages } from './fixtures.mjs';

const hasMessage = (list, fragment) => list.some((m) => m.includes(fragment));

test('accepts a fully valid data set with no errors', () => {
  const { errors } = validateAll(makeData());
  assert.deepEqual(errors, []);
});

test('reports missing required library fields with the item id', () => {
  const item = makeItem();
  delete item.summaryKo;
  const { errors } = validateAll(makeData({ library: { items: [item] } }));
  assert.ok(hasMessage(errors, 'gov-001'));
  assert.ok(hasMessage(errors, 'summaryKo'));
});

test('rejects unknown enum values such as sourceType', () => {
  const { errors } = validateAll(makeData({ library: { items: [makeItem({ sourceType: 'blog' })] } }));
  assert.ok(hasMessage(errors, 'sourceType'));
});

test('requires government-only fields only for gov items', () => {
  const consulting = makeItem({ id: 'con-001', sourceType: 'consulting' });
  delete consulting.issuerLevel;
  delete consulting.docType;
  delete consulting.status;
  const gov = makeItem({ id: 'gov-002' });
  delete gov.docType;
  const { errors } = validateAll(makeData({ library: { items: [consulting, gov] } }));
  assert.ok(!hasMessage(errors, 'con-001'));
  assert.ok(hasMessage(errors, 'gov-002'));
});

test('rejects duplicate item ids and duplicate question ids', () => {
  const a = makeItem();
  const b = makeItem();
  const { errors } = validateAll(makeData({ library: { items: [a, b] } }));
  assert.ok(hasMessage(errors, '중복 id'));
  assert.ok(hasMessage(errors, '중복 질문 id'));
});

test('requires exactly three questions per role and at least one unique question', () => {
  const item = makeItem();
  item.questions = { ...item.questions, leader: item.questions.leader.slice(0, 2) };
  const noUnique = makeItem({ id: 'gov-002' });
  noUnique.questions = Object.fromEntries(
    Object.entries(noUnique.questions).map(([role, qs]) => [role, qs.map(({ unique, ...q }) => q)]),
  );
  const { errors } = validateAll(makeData({ library: { items: [item, noUnique] } }));
  assert.ok(hasMessage(errors, 'leader'));
  assert.ok(hasMessage(errors, '고유 질문'));
});

test('fails when more than five reviewed items are marked must-read', () => {
  const items = Array.from({ length: 6 }, (_, i) => makeItem({ id: `gov-10${i}`, priority: 'must' }));
  const { errors } = validateAll(makeData({ library: { items } }));
  assert.ok(hasMessage(errors, '필독'));
});

test('does not count unreviewed must-read items toward the cap', () => {
  const items = Array.from({ length: 6 }, (_, i) => makeItem({
    id: `gov-10${i}`, priority: 'must', reviewedBy: i === 5 ? '' : '정구영',
  }));
  const { errors } = validateAll(makeData({ library: { items } }));
  assert.ok(!hasMessage(errors, '필독'));
});

test('fails when a role has more than five recommended items', () => {
  const items = Array.from({ length: 6 }, (_, i) => makeItem({
    id: `gov-20${i}`, priority: 'recommended', recommendedFor: ['staff'],
  }));
  const { errors } = validateAll(makeData({ library: { items } }));
  assert.ok(hasMessage(errors, '실무자'));
});

test('requires recommendedFor when priority is recommended', () => {
  const { errors } = validateAll(makeData({
    library: { items: [makeItem({ priority: 'recommended', recommendedFor: [] })] },
  }));
  assert.ok(hasMessage(errors, 'recommendedFor'));
});

test('rejects non-http urls and malformed dates', () => {
  const { errors } = validateAll(makeData({
    library: { items: [makeItem({ url: 'javascript:alert(1)', date: '2026/05/22' })] },
  }));
  assert.ok(hasMessage(errors, 'url'));
  assert.ok(hasMessage(errors, 'date'));
});

test('rejects stage numbers outside 1-10', () => {
  const { errors } = validateAll(makeData({ library: { items: [makeItem({ stage: [0, 11] })] } }));
  assert.ok(hasMessage(errors, 'stage'));
});

test('warns about unknown relatedPolicy references instead of failing', () => {
  const { errors, warnings } = validateAll(makeData({
    library: { items: [makeItem({ relatedPolicy: ['gov-999'] })] },
  }));
  assert.deepEqual(errors, []);
  assert.ok(hasMessage(warnings, 'gov-999'));
});

test('rejects feed items whose sourceId is not registered', () => {
  const { errors } = validateAll(makeData({ feed: { items: [makeFeedItem({ sourceId: 'unknown' })] } }));
  assert.ok(hasMessage(errors, 'sourceId'));
});

test('rejects feed AI summaries longer than 80 characters', () => {
  const { errors } = validateAll(makeData({
    feed: { items: [makeFeedItem({ summaryAi: '가'.repeat(81) })] },
  }));
  assert.ok(hasMessage(errors, 'summaryAi'));
});

test('rejects feed duplicateOf pointing to a missing item', () => {
  const { errors } = validateAll(makeData({
    feed: { items: [makeFeedItem({ duplicateOf: 'f-404' })] },
  }));
  assert.ok(hasMessage(errors, 'duplicateOf'));
});

test('requires exactly ten stages and warns about undefined drafts', () => {
  const stages = makeStages();
  stages[7] = { n: 8, name: '', nameKo: '', question: '', draft: true };
  const { errors, warnings } = validateAll(makeData({ stages: { items: stages } }));
  assert.deepEqual(errors, []);
  assert.ok(hasMessage(warnings, '⑧'));

  const { errors: missing } = validateAll(makeData({ stages: { items: stages.slice(0, 9) } }));
  assert.ok(hasMessage(missing, '10개'));
});

test('warns when a data file is marked as sample data', () => {
  const { warnings } = validateAll(makeData({ feed: { meta: { sample: true }, items: [makeFeedItem()] } }));
  assert.ok(hasMessage(warnings, '샘플'));
});

test('allows an empty feed summary only while summaryPending is true', () => {
  const pending = validateAll(makeData({ feed: { items: [makeFeedItem({ summaryAi: '', summaryPending: true })] } }));
  assert.deepEqual(pending.errors, []);
  const missing = validateAll(makeData({ feed: { items: [makeFeedItem({ summaryAi: '' })] } }));
  assert.ok(hasMessage(missing.errors, 'summaryAi'));
});

test('allows disabled list sources without a parser', () => {
  const { errors } = validateAll(makeData({ sources: { items: [makeSource({ method: 'list', enabled: false })] } }));
  assert.deepEqual(errors, []);
});

test('requires a known parser for enabled list-type sources', () => {
  const { errors } = validateAll(makeData({ sources: { items: [makeSource({ method: 'list' })] } }));
  assert.ok(hasMessage(errors, 'parser'));
  const ok = validateAll(makeData({ sources: { items: [makeSource({ method: 'list', parser: 'nia-bbs' })] } }));
  assert.deepEqual(ok.errors, []);
});
