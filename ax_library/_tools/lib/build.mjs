// 빌드용 순수 함수. 파일 입출력은 _tools/build.mjs가 맡는다.
import { isReviewed } from './validate.mjs';
import {
  FEED_RECENT_DAYS, NEW_BADGE_DAYS, SOURCE_TYPE_LABELS, ROLE_LABELS, STORAGE_PREFIX,
} from './schema.mjs';

const DAY_MS = 24 * 60 * 60 * 1000;
const PLACEHOLDERS = { styles: '/*@STYLES*/', data: '/*@DATA*/', app: '/*@APP*/' };

export function selectLibrary(items, { includeUnreviewed }) {
  return items
    .filter((item) => includeUnreviewed || isReviewed(item))
    .map((item) => ({ ...item, isPreview: !isReviewed(item) }));
}

const byNewest = (a, b) => Date.parse(b.collectedAt) - Date.parse(a.collectedAt)
  || String(b.date).localeCompare(String(a.date));

export function splitFeed(items, now) {
  const cutoff = now.getTime() - FEED_RECENT_DAYS * DAY_MS;
  const unique = items.filter((item) => !item.duplicateOf).sort(byNewest);
  return {
    recent: unique.filter((item) => Date.parse(item.collectedAt) >= cutoff),
    archive: unique.filter((item) => Date.parse(item.collectedAt) < cutoff),
  };
}

function isWithinDays(dateText, now, days) {
  const time = Date.parse(dateText);
  return !Number.isNaN(time) && now.getTime() - time <= days * DAY_MS;
}

export function buildPayload(data, { now, preview }) {
  const library = selectLibrary(data.library.items, { includeUnreviewed: preview })
    .map((item) => ({ ...item, isNew: isWithinDays(item.reviewedAt, now, NEW_BADGE_DAYS) }));
  return {
    meta: {
      builtAt: now.toISOString(),
      preview,
      storagePrefix: STORAGE_PREFIX,
      sourceTypeLabels: SOURCE_TYPE_LABELS,
      roleLabels: ROLE_LABELS,
    },
    stages: data.stages.items,
    library,
    feed: splitFeed(data.feed.items, now),
  };
}

// </script> 등으로 스크립트 블록을 빠져나가지 못하게 <, >, & 를 유니코드 이스케이프한다.
export function embedJson(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function renderPage(template, parts) {
  return Object.entries(PLACEHOLDERS).reduce((html, [key, marker]) => {
    if (!html.includes(marker)) throw new Error(`템플릿에 ${marker.replace(/[/*]/g, '')} 자리표시자가 없습니다.`);
    // 치환 문자열의 $ 패턴이 해석되지 않도록 함수형 치환을 쓴다.
    return html.replace(marker, () => parts[key]);
  }, template);
}
