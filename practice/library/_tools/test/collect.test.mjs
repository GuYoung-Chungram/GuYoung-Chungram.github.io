import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRss, parseNiaBbs, toIsoDate, stripHtml } from '../lib/collect/parsers.mjs';
import { isAllowedByRobots } from '../lib/collect/robots.mjs';
import {
  normalizeUrl, feedIdFor, titleSimilarity, isRelevant, selectCandidates,
} from '../lib/collect/dedupe.mjs';
import { buildGeminiRequest, parseGeminiResult } from '../lib/collect/gemini.mjs';
import { toFeedItems, mergeFeed } from '../lib/collect/merge.mjs';
import { makeFeedItem } from './fixtures.mjs';

const NOW = new Date('2026-10-19T06:00:00+09:00');
const SOURCE = { id: 'mois', name: '행정안전부', sourceType: 'gov', rank: 1 };
const SOURCES = { mois: SOURCE, nia: { id: 'nia', name: 'NIA', sourceType: 'gov', rank: 2 } };

// --- 파서 ---

test('parseRss reads CDATA titles, links and dates', () => {
  const xml = `<rss><channel><title>보도자료</title>
    <item><title><![CDATA[생성형 AI 활용 지침 발표]]></title>
      <link><![CDATA[https://www.mois.go.kr/a?x=1&amp;y=2]]></link>
      <description><![CDATA[<p>요약 &amp; 설명</p>]]></description>
      <pubDate>MON, 19 OCT 2026 09:00:00 KST</pubDate></item>
    <item><title>둘째 &#39;제목&#39;</title><link>https://www.mois.go.kr/b</link><pubDate>2026-10-12T12:00:00+0900</pubDate></item>
  </channel></rss>`;
  const items = parseRss(xml);
  assert.equal(items.length, 2);
  assert.equal(items[0].title, '생성형 AI 활용 지침 발표');
  assert.equal(items[0].url, 'https://www.mois.go.kr/a?x=1&y=2');
  assert.equal(items[0].date, '2026-10-19');
  assert.equal(items[0].excerpt, '요약 & 설명');
  assert.equal(items[1].title, "둘째 '제목'");
  assert.equal(items[1].date, '2026-10-12');
});

test('parseRss uses content:encoded when description is missing', () => {
  const xml = '<rss><item><title>t</title><link>https://x.go.kr/1</link><content:encoded><![CDATA[본문 요약]]></content:encoded><pubDate><![CDATA[2026.10.15]]></pubDate></item></rss>';
  const [item] = parseRss(xml);
  assert.equal(item.excerpt, '본문 요약');
  assert.equal(item.date, '2026-10-15');
});

test('toIsoDate handles the date formats used by Korean ministries', () => {
  assert.equal(toIsoDate('MON, 19 OCT 2026 09:00:00 KST'), '2026-10-19');
  assert.equal(toIsoDate('2026-10-12T12:00:00+0900'), '2026-10-12');
  assert.equal(toIsoDate('2026.10.15'), '2026-10-15');
  assert.equal(toIsoDate('금, 16 10월 2026 10:00:00 KST'), '2026-10-16');
  assert.equal(toIsoDate('Mon, 19 Oct 2026 23:30:00 GMT'), '2026-10-20');
  assert.equal(toIsoDate('날짜 아님'), '');
});

test('stripHtml removes tags, comments and double-encoded entities', () => {
  assert.equal(stripHtml('&lt;span&gt;공무원 &amp;#39;건강&amp;#39;&lt;/span&gt;<!--[data-hwpjson]{}-->  주간'), "공무원 '건강' 주간");
});

test('parseNiaBbs extracts view links, cleaned titles and dates', () => {
  const html = `<div class="board_type01"><ul>
    <li class=""><a href="#view" onclick="doBbsFView('90549','30078','16010100','30078');return false;"
      title="NIA, 제1회 AI 정부 포럼 개최(새 글)-첨부파일 있음"><span class="subject">x</span>
      <span class="src"></span><em>2026.10.19</em></a></li>
    <li class=""><a href="#view" onclick="doBbsFView('90549','30047','16010100','30047');return false;"
      title="K-AI 네트워크 사업 출격-첨부파일 있음"><em>2026.10.02</em></a></li>
  </ul></div>`;
  const items = parseNiaBbs(html);
  assert.equal(items.length, 2);
  assert.equal(items[0].title, 'NIA, 제1회 AI 정부 포럼 개최');
  assert.equal(items[0].url, 'https://www.nia.or.kr/site/nia_kor/ex/bbs/View.do?cbIdx=90549&bcIdx=30078&parentSeq=30078');
  assert.equal(items[0].date, '2026-10-19');
  assert.equal(items[1].title, 'K-AI 네트워크 사업 출격');
});

// --- robots.txt ---

test('isAllowedByRobots honours wildcard disallow rules and ignores other agents', () => {
  const robots = 'User-agent : Googlebot\nDisallow: /site/nia_kor/ex/bbs/\n\nUser-agent: *\nDisallow: /private/\nAllow: /private/open/';
  assert.equal(isAllowedByRobots(robots, 'https://x.kr/site/nia_kor/ex/bbs/List.do'), true);
  assert.equal(isAllowedByRobots(robots, 'https://x.kr/private/a'), false);
  assert.equal(isAllowedByRobots(robots, 'https://x.kr/private/open/a'), true);
  assert.equal(isAllowedByRobots('', 'https://x.kr/a'), true);
});

// --- 정규화·중복 ---

test('normalizeUrl drops tracking params, fragments and host case', () => {
  assert.equal(
    normalizeUrl('HTTPS://WWW.Mois.go.kr/a/?b=2&utm_source=x&a=1#top'),
    'https://www.mois.go.kr/a?a=1&b=2',
  );
});

test('feedIdFor is stable for equivalent urls', () => {
  assert.equal(feedIdFor('https://x.go.kr/a?b=1&a=2'), feedIdFor('https://X.go.kr/a?a=2&b=1#f'));
  assert.match(feedIdFor('https://x.go.kr/a'), /^f-[0-9a-f]{12}$/);
});

test('titleSimilarity treats bracket tags and spacing as noise', () => {
  assert.ok(titleSimilarity('[보도자료] 공공 AI 지침 발표', '공공AI 지침 발표') > 0.9);
  assert.ok(titleSimilarity('공공 AI 지침 발표', '재난 대응 훈련 실시') < 0.3);
});

test('isRelevant matches AI keywords without matching words that merely contain the letters', () => {
  assert.equal(isRelevant({ title: '생성형 AI 활용 지침', excerpt: '' }), true);
  assert.equal(isRelevant({ title: '인공지능 기본계획', excerpt: '' }), true);
  assert.equal(isRelevant({ title: 'MAIN 행사 안내', excerpt: '' }), false);
  assert.equal(isRelevant({ title: '재난 훈련', excerpt: '훈련에 AI 기반 상황판 도입' }), true);
});

function raw(overrides) {
  return { sourceId: 'mois', title: '생성형 AI 활용 지침', url: 'https://www.mois.go.kr/n/1', date: '2026-10-15', excerpt: '', ...overrides };
}

test('selectCandidates drops known, stale and irrelevant items', () => {
  const existing = [makeFeedItem({ id: feedIdFor('https://www.mois.go.kr/n/old'), url: 'https://www.mois.go.kr/n/old' })];
  const result = selectCandidates([
    raw({ url: 'https://www.mois.go.kr/n/old' }),
    raw({ url: 'https://www.mois.go.kr/n/stale', date: '2026-08-01', title: '오래된 AI 자료' }),
    raw({ url: 'https://www.mois.go.kr/n/off', title: '재난 대응 훈련' }),
    raw({ url: 'https://www.mois.go.kr/n/lib', title: '라이브러리 AI 자료' }),
    raw({ url: 'https://www.mois.go.kr/n/new', title: '새 AI 정책' }),
  ], { existing, libraryUrls: ['https://www.mois.go.kr/n/lib'], sourcesById: SOURCES, now: NOW });
  assert.deepEqual(result.candidates.map((c) => c.url), ['https://www.mois.go.kr/n/new']);
  assert.equal(result.stats.known, 2);
  assert.equal(result.stats.stale, 1);
  assert.equal(result.stats.irrelevant, 1);
});

test('selectCandidates marks near-identical titles as duplicates of the higher-ranked source', () => {
  const result = selectCandidates([
    raw({ sourceId: 'nia', url: 'https://www.nia.or.kr/v/1', title: '[보도자료] AI 챔피언 고급과정 선발' }),
    raw({ sourceId: 'mois', url: 'https://www.mois.go.kr/n/9', title: 'AI 챔피언 고급과정 선발' }),
  ], { existing: [], libraryUrls: [], sourcesById: SOURCES, now: NOW });
  const primary = result.candidates.find((c) => !c.duplicateOf);
  const dup = result.candidates.find((c) => c.duplicateOf);
  assert.equal(primary.sourceId, 'mois');
  assert.equal(dup.duplicateOf, primary.id);
});

test('selectCandidates links a new item to a similar recent feed item', () => {
  const existing = [makeFeedItem({ id: 'f-old', title: 'AI 챔피언 고급과정 선발', collectedAt: '2026-10-12T06:00:00+09:00' })];
  const result = selectCandidates([raw({ title: 'AI 챔피언 고급과정 선발 결과' })], {
    existing, libraryUrls: [], sourcesById: SOURCES, now: NOW,
  });
  assert.equal(result.candidates[0].duplicateOf, 'f-old');
});

// --- Gemini ---

test('buildGeminiRequest sends candidates as data with a JSON response schema', () => {
  const body = buildGeminiRequest([{ id: 'f-1', title: '제목', issuer: '행안부', excerpt: '내용' }], [{ id: 'f-old', title: '이전' }]);
  const text = body.contents[0].parts[0].text;
  assert.ok(text.includes('"f-1"'));
  assert.ok(text.includes('"f-old"'));
  assert.equal(body.generationConfig.responseMimeType, 'application/json');
});

test('Gemini instructions exclude cooperation, investment and event-only announcements', () => {
  const text = buildGeminiRequest([], []).contents[0].parts[0].text;
  ['국제협력', '투자', '행사'].forEach((word) => assert.ok(text.includes(word), word));
});

test('parseGeminiResult keeps only well-formed entries for known ids', () => {
  const payload = {
    candidates: [{ content: { parts: [{ text: JSON.stringify({ items: [
      { id: 'f-1', relevant: true, summary: '가'.repeat(120), stages: [2, 11, 4], sameAs: 'f-old' },
      { id: 'f-2', relevant: false, summary: '', stages: [] },
      { id: 'f-hack', relevant: true, summary: '모르는 id', stages: [1] },
      { id: 'f-3', relevant: true, summary: '정상 요약', stages: [9], sameAs: 'f-unknown' },
    ] }) }] } }],
  };
  const map = parseGeminiResult(payload, ['f-1', 'f-2', 'f-3'], ['f-old']);
  assert.equal(map.size, 3);
  assert.equal(map.get('f-1').summary.length, 80);
  assert.deepEqual(map.get('f-1').stages, [2, 4]);
  assert.equal(map.get('f-1').sameAs, 'f-old');
  assert.equal(map.get('f-2').relevant, false);
  assert.equal(map.get('f-3').sameAs, null);
  assert.equal(map.has('f-hack'), false);
});

test('parseGeminiResult returns an empty map for malformed output', () => {
  assert.equal(parseGeminiResult({ candidates: [{ content: { parts: [{ text: 'not json' }] } }] }, ['f-1'], []).size, 0);
  assert.equal(parseGeminiResult({}, ['f-1'], []).size, 0);
});

// --- 병합 ---

function candidate(overrides) {
  return {
    id: 'f-1', sourceId: 'mois', sourceType: 'gov', issuer: '행정안전부', title: '새 AI 정책',
    url: 'https://www.mois.go.kr/n/1', date: '2026-10-15', excerpt: '', ...overrides,
  };
}

test('toFeedItems applies AI results and holds items the AI has not judged', () => {
  const ai = new Map([
    ['f-1', { relevant: true, summary: '요약 1', stages: [1], sameAs: null }],
    ['f-2', { relevant: false, summary: '', stages: [], sameAs: null }],
    ['f-3', { relevant: true, summary: '요약 3', stages: [], sameAs: 'f-1' }],
    ['f-5', { relevant: true, summary: '', stages: [], sameAs: null }],
  ]);
  const items = toFeedItems(
    [candidate(), candidate({ id: 'f-2' }), candidate({ id: 'f-3' }), candidate({ id: 'f-4' }), candidate({ id: 'f-5' })],
    ai, { now: NOW, maxNew: 10 },
  );
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  assert.equal(byId['f-2'], undefined);
  assert.equal(byId['f-4'], undefined);
  assert.equal(byId['f-1'].summaryAi, '요약 1');
  assert.deepEqual(byId['f-1'].stageGuess, [1]);
  assert.equal(byId['f-3'].duplicateOf, 'f-1');
  assert.equal(byId['f-5'].summaryPending, true);
  assert.equal(byId['f-1'].collectedAt, NOW.toISOString());
  assert.equal(byId['f-1'].promoted, false);
  assert.equal('excerpt' in byId['f-1'], false);
});

const judgedAll = (ids) => new Map(ids.map((id) => [id, { relevant: true, summary: '요약', stages: [], sameAs: null }]));

test('toFeedItems caps primary items but keeps duplicates of kept items', () => {
  const items = toFeedItems(
    [candidate({ id: 'a', date: '2026-10-18' }), candidate({ id: 'b', date: '2026-10-17' }), candidate({ id: 'c', date: '2026-10-16', duplicateOf: 'a' })],
    judgedAll(['a', 'b', 'c']), { now: NOW, maxNew: 1 },
  );
  assert.deepEqual(items.map((i) => i.id).sort(), ['a', 'c']);
});

test('toFeedItems limits how many items one source can add per run', () => {
  const items = toFeedItems(
    [
      candidate({ id: 'm1', sourceId: 'msit', date: '2026-10-18' }),
      candidate({ id: 'm2', sourceId: 'msit', date: '2026-10-17' }),
      candidate({ id: 'm3', sourceId: 'msit', date: '2026-10-16' }),
      candidate({ id: 'n1', sourceId: 'nia', date: '2026-10-10' }),
    ],
    judgedAll(['m1', 'm2', 'm3', 'n1']), { now: NOW, maxNew: 10, maxPerSource: 2 },
  );
  assert.deepEqual(items.map((i) => i.id).sort(), ['m1', 'm2', 'n1']);
});

test('mergeFeed replaces sample data, fills pending summaries and keeps newest first', () => {
  const sample = { meta: { sample: true }, items: [makeFeedItem({ id: 'f-sample' })] };
  const merged = mergeFeed(sample, [makeFeedItem({ id: 'f-new' })], { now: NOW, summaries: new Map(), maxItems: 200 });
  assert.deepEqual(merged.items.map((i) => i.id), ['f-new']);
  assert.equal(merged.meta.sample, undefined);
  assert.equal(merged.meta.lastRunAt, NOW.toISOString());

  const pendingFeed = { meta: {}, items: [makeFeedItem({ id: 'f-p', summaryAi: '', summaryPending: true })] };
  const filled = mergeFeed(pendingFeed, [], {
    now: NOW, summaries: new Map([['f-p', { relevant: true, summary: '이제 요약', stages: [3], sameAs: null }]]), maxItems: 200,
  });
  assert.equal(filled.items[0].summaryAi, '이제 요약');
  assert.equal(filled.items[0].summaryPending, undefined);
  assert.equal(pendingFeed.items[0].summaryAi, '');
});

test('mergeFeed trims the oldest items beyond maxItems', () => {
  const existing = { meta: {}, items: [
    makeFeedItem({ id: 'old', collectedAt: '2026-01-01T00:00:00Z' }),
    makeFeedItem({ id: 'mid', collectedAt: '2026-05-01T00:00:00Z' }),
  ] };
  const merged = mergeFeed(existing, [makeFeedItem({ id: 'new', collectedAt: NOW.toISOString() })], {
    now: NOW, summaries: new Map(), maxItems: 2,
  });
  assert.deepEqual(merged.items.map((i) => i.id), ['new', 'mid']);
});
