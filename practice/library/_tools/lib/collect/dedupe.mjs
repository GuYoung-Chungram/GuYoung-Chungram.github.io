// 수집 결과 정리: 이미 있는 자료·오래된 자료·무관한 자료를 빼고, 같은 발표는 대표 1건으로 묶는다.
import { createHash } from 'node:crypto';
import {
  LOOKBACK_DAYS, TITLE_SIMILARITY_THRESHOLD, RECENT_COMPARE_DAYS, KO_KEYWORDS, EN_KEYWORDS, ACRONYMS,
} from './config.mjs';

const DAY_MS = 24 * 60 * 60 * 1000;
const TRACKING_PARAM = /^(utm_|fbclid$|gclid$)/i;
const ACRONYM_RE = new RegExp(`(^|[^A-Za-z])(${ACRONYMS.join('|')})(?![A-Za-z])`);

export function normalizeUrl(url) {
  const parsed = new URL(url);
  const params = new URLSearchParams(
    [...parsed.searchParams].filter(([key]) => !TRACKING_PARAM.test(key)),
  );
  params.sort();
  const path = parsed.pathname.length > 1 ? parsed.pathname.replace(/\/+$/, '') : parsed.pathname;
  const query = params.toString();
  return `${parsed.protocol}//${parsed.host}${path}${query ? `?${query}` : ''}`;
}

export function feedIdFor(url) {
  return `f-${createHash('sha1').update(normalizeUrl(url)).digest('hex').slice(0, 12)}`;
}

function normalizeTitle(title) {
  return String(title ?? '')
    .replace(/\[[^\]]*\]|【[^】]*】|<[^>]*>/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');
}

function bigrams(text) {
  const grams = new Map();
  for (let i = 0; i < text.length - 1; i += 1) {
    const gram = text.slice(i, i + 2);
    grams.set(gram, (grams.get(gram) ?? 0) + 1);
  }
  return grams;
}

// 정규화한 제목의 글자 2-gram 다이스 계수 (0~1)
export function titleSimilarity(a, b) {
  const left = normalizeTitle(a);
  const right = normalizeTitle(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  const leftGrams = bigrams(left);
  const rightGrams = bigrams(right);
  let overlap = 0;
  leftGrams.forEach((count, gram) => { overlap += Math.min(count, rightGrams.get(gram) ?? 0); });
  const total = (left.length - 1) + (right.length - 1);
  return total > 0 ? (2 * overlap) / total : 0;
}

export function isRelevant({ title, excerpt }) {
  const text = `${title ?? ''} ${excerpt ?? ''}`;
  const lower = text.toLowerCase();
  return ACRONYM_RE.test(text)
    || KO_KEYWORDS.some((k) => text.includes(k))
    || EN_KEYWORDS.some((k) => lower.includes(k));
}

function isHttpUrl(url) {
  try { return /^https?:$/.test(new URL(url).protocol); } catch { return false; }
}

function findSimilar(title, pool) {
  return pool.find((other) => titleSimilarity(title, other.title) >= TITLE_SIMILARITY_THRESHOLD);
}

export function selectCandidates(rawItems, { existing, libraryUrls, sourcesById, now }) {
  const stats = { fetched: rawItems.length, known: 0, stale: 0, irrelevant: 0, duplicates: 0, candidates: 0 };
  const knownIds = new Set(existing.map((item) => item.id));
  const knownUrls = new Set([...existing.map((i) => i.url), ...libraryUrls].filter(isHttpUrl).map(normalizeUrl));
  const cutoff = new Date(now.getTime() - LOOKBACK_DAYS * DAY_MS).toISOString().slice(0, 10);
  const fresh = [];

  rawItems.forEach((raw) => {
    if (!isHttpUrl(raw.url)) { stats.irrelevant += 1; return; }
    const id = feedIdFor(raw.url);
    if (knownIds.has(id) || knownUrls.has(normalizeUrl(raw.url))) { stats.known += 1; return; }
    if (!raw.date || raw.date < cutoff) { stats.stale += 1; return; }
    if (!isRelevant(raw)) { stats.irrelevant += 1; return; }
    knownIds.add(id);
    const source = sourcesById[raw.sourceId];
    fresh.push({
      id, sourceId: raw.sourceId, sourceType: source.sourceType, issuer: source.name,
      title: raw.title, url: raw.url, date: raw.date, excerpt: raw.excerpt ?? '', rank: source.rank ?? 99,
    });
  });

  const recentCutoff = now.getTime() - RECENT_COMPARE_DAYS * DAY_MS;
  const recentExisting = existing.filter((i) => !i.duplicateOf && Date.parse(i.collectedAt) >= recentCutoff);
  const ordered = [...fresh].sort((a, b) => a.rank - b.rank || b.date.localeCompare(a.date));
  const primaries = [];
  const candidates = ordered.map(({ rank, ...item }) => {
    const twin = findSimilar(item.title, primaries) ?? findSimilar(item.title, recentExisting);
    if (twin) { stats.duplicates += 1; return { ...item, duplicateOf: twin.id }; }
    primaries.push(item);
    return item;
  });
  stats.candidates = candidates.length;
  return { candidates, stats };
}
