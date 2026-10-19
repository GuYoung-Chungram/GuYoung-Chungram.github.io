// 수집 후보와 AI 결과를 feed.json 항목으로 만들고 기존 피드와 합친다. 입력은 바꾸지 않는다.

// AI 판별 결과가 없는 후보는 올리지 않고 보류한다. 수집 기간(LOOKBACK_DAYS) 안이면 다음 실행에서 다시 판별된다.
export function toFeedItems(candidates, aiResults, { now, maxNew, maxPerSource = Infinity }) {
  const judged = candidates.filter((c) => aiResults.get(c.id)?.relevant === true);
  const withDup = judged.map((c) => ({ ...c, duplicateOf: c.duplicateOf ?? aiResults.get(c.id)?.sameAs ?? undefined }));
  const batchIds = new Set(withDup.map((c) => c.id));
  const perSource = new Map();
  const kept = new Set();
  withDup.filter((c) => !c.duplicateOf)
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach((c) => {
      const count = perSource.get(c.sourceId) ?? 0;
      if (kept.size >= maxNew || count >= maxPerSource) return;
      perSource.set(c.sourceId, count + 1);
      kept.add(c.id);
    });
  return withDup
    .filter((c) => kept.has(c.id) || (c.duplicateOf && (kept.has(c.duplicateOf) || !batchIds.has(c.duplicateOf))))
    .map((c) => {
      const ai = aiResults.get(c.id);
      return {
        id: c.id,
        sourceId: c.sourceId,
        sourceType: c.sourceType,
        issuer: c.issuer,
        date: c.date,
        title: c.title,
        url: c.url,
        summaryAi: ai.summary,
        ...(ai.summary ? {} : { summaryPending: true }),
        ...(ai.stages.length ? { stageGuess: ai.stages } : {}),
        ...(c.duplicateOf ? { duplicateOf: c.duplicateOf } : {}),
        collectedAt: now.toISOString(),
        promoted: false,
      };
    });
}

function fillPending(item, summaries) {
  const ai = summaries.get(item.id);
  if (!item.summaryPending || !ai?.summary) return item;
  const { summaryPending, ...rest } = item;
  return { ...rest, summaryAi: ai.summary, ...(ai.stages?.length ? { stageGuess: ai.stages } : {}) };
}

export function mergeFeed(existing, newItems, { now, summaries, maxItems }) {
  const base = existing?.meta?.sample ? [] : (existing?.items ?? []);
  const combined = [...newItems, ...base.map((item) => fillPending(item, summaries))]
    .sort((a, b) => Date.parse(b.collectedAt) - Date.parse(a.collectedAt))
    .slice(0, maxItems);
  const ids = new Set(combined.map((item) => item.id));
  const items = combined.filter((item) => !item.duplicateOf || ids.has(item.duplicateOf));
  const { sample, note, ...meta } = existing?.meta ?? {};
  return {
    meta: { ...meta, note: '매주 자동 수집 결과입니다. 직접 고치지 마세요(승격 표시 promoted만 예외).', lastRunAt: now.toISOString() },
    items,
  };
}
