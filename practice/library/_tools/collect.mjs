// 주간 수집기. 사용법:
//   node _tools/collect.mjs            → 수집 후 _src/data/feed.json 갱신
//   node _tools/collect.mjs --dry-run  → 수집·판별만 하고 파일은 쓰지 않음
//   node _tools/collect.mjs --no-ai    → Gemini 없이 실행(수집·중복 점검만, 새 자료는 보류)
// 환경 변수: GEMINI_API_KEY(없으면 --no-ai와 같음), GEMINI_MODEL(선택)
import { writeFile, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { loadData, report, SRC_DIR } from './lib/io.mjs';
import { validateAll } from './lib/validate.mjs';
import { fetchText } from './lib/collect/fetch.mjs';
import { parseSource } from './lib/collect/parsers.mjs';
import { isAllowedByRobots } from './lib/collect/robots.mjs';
import { selectCandidates } from './lib/collect/dedupe.mjs';
import { buildGeminiRequest, parseGeminiResult, callGemini } from './lib/collect/gemini.mjs';
import { toFeedItems, mergeFeed } from './lib/collect/merge.mjs';
import {
  POLITE_DELAY_MS, MAX_NEW_PER_RUN, MAX_NEW_PER_SOURCE, FEED_MAX_ITEMS, RECENT_COMPARE_DAYS,
  GEMINI_DEFAULT_MODEL, GEMINI_MAX_CANDIDATES,
} from './lib/collect/config.mjs';

const DAY_MS = 24 * 60 * 60 * 1000;
const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const apiKey = args.has('--no-ai') ? '' : (process.env.GEMINI_API_KEY ?? '').trim();
const model = (process.env.GEMINI_MODEL ?? '').trim() || GEMINI_DEFAULT_MODEL;
const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

async function robotsAllows(url, cache) {
  const origin = new URL(url).origin;
  if (!cache.has(origin)) {
    // robots.txt가 없으면(404) 허용으로 본다. 네트워크 오류는 아래 수집 단계에서 다시 드러난다.
    cache.set(origin, await fetchText(`${origin}/robots.txt`).catch(() => ''));
  }
  return isAllowedByRobots(cache.get(origin), url);
}

async function collectSource(source, robotsCache) {
  if (!(await robotsAllows(source.url, robotsCache))) {
    throw new Error('robots.txt가 수집을 허용하지 않습니다.');
  }
  const items = parseSource(source, await fetchText(source.url));
  if (items.length === 0) throw new Error('항목을 하나도 읽지 못했습니다. 페이지 구조가 바뀌었는지 확인하세요.');
  return items.map((item) => ({ ...item, sourceId: source.id }));
}

async function collectAll(sources) {
  const robotsCache = new Map();
  const results = [];
  for (const source of sources) {
    try {
      const items = await collectSource(source, robotsCache);
      results.push({ source, items, error: null });
    } catch (error) {
      results.push({ source, items: [], error: error.message });
    }
    await sleep(POLITE_DELAY_MS);
  }
  return results;
}

async function summarize(candidates, pending, recent) {
  const targets = [...candidates.filter((c) => !c.duplicateOf), ...candidates.filter((c) => c.duplicateOf), ...pending]
    .slice(0, GEMINI_MAX_CANDIDATES);
  if (targets.length === 0) return { results: new Map(), note: '판별할 새 자료가 없습니다.' };
  if (!apiKey) return { results: new Map(), note: 'GEMINI_API_KEY가 없어 AI 판별을 못 했습니다. 새 자료는 올리지 않고 다음 실행으로 보류합니다.' };
  try {
    const payload = await callGemini({ apiKey, model, body: buildGeminiRequest(targets, recent) });
    const results = parseGeminiResult(payload, targets.map((t) => t.id), recent.map((r) => r.id));
    return { results, note: `Gemini(${model}) 판별 ${results.size}/${targets.length}건` };
  } catch (error) {
    return { results: new Map(), note: `Gemini 호출 실패로 새 자료를 다음 실행으로 보류합니다: ${error.message}` };
  }
}

function summaryMarkdown({ sourceResults, stats, aiNote, newItems, candidatesPrimary, dryRun: isDry }) {
  const rows = sourceResults.map(({ source, items, error }) => `| ${source.name} | ${error ? '❌ 실패' : '✅'} | ${items.length} | ${error ?? ''} |`);
  const added = newItems.filter((i) => !i.duplicateOf);
  return [
    `## AX 라이브러리 주간 수집${isDry ? ' (드라이런)' : ''}`,
    '', '| 기관 | 결과 | 읽은 항목 | 비고 |', '| --- | --- | --- | --- |', ...rows, '',
    `- 이미 있음 ${stats.known} · 기간 밖 ${stats.stale} · 키워드 무관 ${stats.irrelevant} · 같은 발표 묶음 ${stats.duplicates}`,
    `- ${aiNote}`,
    `- 새로 올린 자료 ${added.length}건${added.length ? ':' : ''}`,
    ...added.map((i) => `  - [${i.issuer}] ${i.title}${i.summaryPending ? ' (요약 대기)' : ''}`),
    `- 후보 ${stats.candidates}건 중 대표 자료 ${candidatesPrimary}건`,
    '',
  ].join('\n');
}

async function main() {
  const now = new Date();
  const data = await loadData();
  const sources = data.sources.items.filter((s) => s.enabled);
  const sourcesById = Object.fromEntries(data.sources.items.map((s) => [s.id, s]));
  const existing = data.feed.meta?.sample ? [] : data.feed.items;

  const sourceResults = await collectAll(sources);
  const { candidates, stats } = selectCandidates(sourceResults.flatMap((r) => r.items), {
    existing, libraryUrls: data.library.items.map((i) => i.url), sourcesById, now,
  });
  const recent = existing.filter((i) => !i.duplicateOf && now - Date.parse(i.collectedAt) <= RECENT_COMPARE_DAYS * DAY_MS);
  const pending = existing.filter((i) => i.summaryPending).map((i) => ({ ...i, excerpt: '' }));
  const { results: aiResults, note: aiNote } = await summarize(candidates, pending, recent);

  const newItems = toFeedItems(candidates, aiResults, { now, maxNew: MAX_NEW_PER_RUN, maxPerSource: MAX_NEW_PER_SOURCE });
  const merged = mergeFeed(data.feed, newItems, { now, summaries: aiResults, maxItems: FEED_MAX_ITEMS });
  const candidatesPrimary = candidates.filter((c) => !c.duplicateOf).length;
  const markdown = summaryMarkdown({ sourceResults, stats, aiNote, newItems, candidatesPrimary, dryRun });
  console.log(markdown);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, markdown);

  const validation = validateAll({ ...data, feed: merged });
  report(validation);
  if (validation.errors.length) {
    console.error('검증 오류가 있어 feed.json을 쓰지 않습니다.');
    return 1;
  }
  if (!dryRun) await writeFile(path.join(SRC_DIR, 'data', 'feed.json'), `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
  const allFailed = sourceResults.length > 0 && sourceResults.every((r) => r.error);
  if (allFailed) console.error('모든 수집 대상에서 실패했습니다. 접속 차단 여부를 확인하세요.');
  return allFailed ? 1 : 0;
}

main()
  .then((code) => { process.exitCode = code; })
  .catch((error) => { console.error(`❌ ${error.message}`); process.exitCode = 1; });
