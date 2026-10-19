// 데이터 검증. 오류(errors)는 빌드를 멈추고, 경고(warnings)는 출력만 한다.
import {
  SOURCE_TYPES, FEED_SOURCE_TYPES, ROLES, ROLE_LABELS, PRIORITIES, MUST_LIMIT,
  RECOMMENDED_PER_ROLE_LIMIT, QUESTIONS_PER_ROLE, LEVELS, ISSUER_LEVELS, DOC_TYPES,
  STATUSES, SOURCE_METHODS, LIST_PARSERS, STAGE_COUNT, SUMMARY_LINES, FEED_SUMMARY_MAX,
} from './schema.mjs';

const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
const DATE_RE = /^\d{4}-\d{2}(-\d{2})?$/;

const LIBRARY_REQUIRED = [
  'id', 'sourceType', 'issuer', 'date', 'title', 'titleKo', 'url', 'stage', 'level',
  'minutes', 'summaryKo', 'frameworks', 'publicImplication', 'questions', 'priority',
];
const GOV_REQUIRED = ['issuerLevel', 'docType', 'status'];
const FEED_REQUIRED = [
  'id', 'sourceId', 'sourceType', 'issuer', 'date', 'title', 'url', 'summaryAi', 'collectedAt', 'promoted',
];
const SOURCE_REQUIRED = ['id', 'name', 'sourceType', 'method', 'url', 'enabled'];

export function isReviewed(item) {
  return typeof item.reviewedBy === 'string' && item.reviewedBy.trim() !== '';
}

function isBlank(value) {
  return value === undefined || value === null || value === ''
    || (Array.isArray(value) && value.length === 0);
}

function isHttpUrl(value) {
  try {
    const { protocol } = new URL(value);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

function checkRequired(item, fields, label) {
  return fields
    .filter((field) => isBlank(item[field]))
    .map((field) => `${label}: 필수 필드 ${field}가 비어 있습니다.`);
}

function checkEnum(value, allowed, field, label) {
  if (isBlank(value) || allowed.includes(value)) return [];
  return [`${label}: ${field} 값 "${value}"는 허용되지 않습니다 (${allowed.join(', ')}).`];
}

function checkUrlAndDate(item, label) {
  const errors = [];
  if (!isBlank(item.url) && !isHttpUrl(item.url)) errors.push(`${label}: url은 http(s) 주소여야 합니다.`);
  if (!isBlank(item.date) && !DATE_RE.test(item.date)) errors.push(`${label}: date는 YYYY-MM 또는 YYYY-MM-DD 형식이어야 합니다.`);
  return errors;
}

function findDuplicates(values) {
  const seen = new Set();
  return values.filter((v) => (seen.has(v) ? true : (seen.add(v), false)));
}

function checkQuestions(item, label) {
  const { questions } = item;
  if (isBlank(questions) || typeof questions !== 'object') return [];
  const errors = ROLES
    .filter((role) => !Array.isArray(questions[role]) || questions[role].length !== QUESTIONS_PER_ROLE)
    .map((role) => `${label}: questions.${role}는 ${QUESTIONS_PER_ROLE}문항이어야 합니다.`);
  const all = ROLES.flatMap((role) => (Array.isArray(questions[role]) ? questions[role] : []));
  const missingText = all.filter((q) => isBlank(q.id) || isBlank(q.text));
  if (missingText.length) errors.push(`${label}: 질문에는 id와 text가 모두 있어야 합니다.`);
  if (!all.some((q) => q.unique === true)) errors.push(`${label}: 자료별 고유 질문(unique: true)이 최소 1개 필요합니다.`);
  return errors;
}

function checkLibraryItem(item) {
  const label = `library ${item.id ?? '(id 없음)'}`;
  const errors = [
    ...checkRequired(item, LIBRARY_REQUIRED, label),
    ...checkEnum(item.sourceType, SOURCE_TYPES, 'sourceType', label),
    ...checkEnum(item.level, LEVELS, 'level', label),
    ...checkEnum(item.priority, PRIORITIES, 'priority', label),
    ...checkUrlAndDate(item, label),
    ...checkQuestions(item, label),
  ];
  if (item.sourceType === 'gov') {
    errors.push(
      ...checkRequired(item, GOV_REQUIRED, label),
      ...checkEnum(item.issuerLevel, ISSUER_LEVELS, 'issuerLevel', label),
      ...checkEnum(item.docType, DOC_TYPES, 'docType', label),
      ...checkEnum(item.status, STATUSES, 'status', label),
    );
  }
  if (Array.isArray(item.stage) && item.stage.some((n) => !Number.isInteger(n) || n < 1 || n > STAGE_COUNT)) {
    errors.push(`${label}: stage는 1~${STAGE_COUNT} 사이 정수여야 합니다.`);
  }
  if (!isBlank(item.minutes) && (!Number.isInteger(item.minutes) || item.minutes <= 0)) {
    errors.push(`${label}: minutes는 양의 정수여야 합니다.`);
  }
  if (Array.isArray(item.summaryKo) && item.summaryKo.length !== SUMMARY_LINES) {
    errors.push(`${label}: summaryKo는 ${SUMMARY_LINES}줄이어야 합니다.`);
  }
  if (item.priority === 'recommended') {
    const roles = Array.isArray(item.recommendedFor) ? item.recommendedFor : [];
    if (roles.length === 0) errors.push(`${label}: priority가 recommended이면 recommendedFor가 필요합니다.`);
    roles.filter((r) => !ROLES.includes(r))
      .forEach((r) => errors.push(`${label}: recommendedFor 값 "${r}"는 허용되지 않습니다.`));
  }
  return errors;
}

function checkPriorityCaps(items) {
  const reviewed = items.filter(isReviewed);
  const errors = [];
  const mustCount = reviewed.filter((i) => i.priority === 'must').length;
  if (mustCount > MUST_LIMIT) errors.push(`필독은 최대 ${MUST_LIMIT}건입니다 (현재 ${mustCount}건).`);
  ROLES.forEach((role) => {
    const count = reviewed
      .filter((i) => i.priority === 'recommended' && (i.recommendedFor ?? []).includes(role)).length;
    if (count > RECOMMENDED_PER_ROLE_LIMIT) {
      errors.push(`${ROLE_LABELS[role]} 추천은 최대 ${RECOMMENDED_PER_ROLE_LIMIT}건입니다 (현재 ${count}건).`);
    }
  });
  return errors;
}

function validateLibrary(items) {
  const errors = items.flatMap(checkLibraryItem);
  findDuplicates(items.map((i) => i.id)).forEach((id) => errors.push(`library: 중복 id ${id}`));
  const questionIds = items.flatMap((i) => ROLES.flatMap((r) => (i.questions?.[r] ?? []).map((q) => q.id)));
  findDuplicates(questionIds).forEach((id) => errors.push(`library: 중복 질문 id ${id}`));
  errors.push(...checkPriorityCaps(items));

  const ids = new Set(items.map((i) => i.id));
  const warnings = items.flatMap((i) => (i.relatedPolicy ?? [])
    .filter((ref) => !ids.has(ref))
    .map((ref) => `library ${i.id}: relatedPolicy ${ref}를 찾을 수 없습니다.`));
  return { errors, warnings };
}

function validateFeed(items, sourceIds) {
  const ids = new Set(items.map((i) => i.id));
  const errors = items.flatMap((item) => {
    const label = `feed ${item.id ?? '(id 없음)'}`;
    const list = [
      ...checkRequired(item, FEED_REQUIRED.filter((f) => f !== 'promoted'
        && !(f === 'summaryAi' && item.summaryPending === true)), label),
      ...checkEnum(item.sourceType, FEED_SOURCE_TYPES, 'sourceType', label),
      ...checkUrlAndDate(item, label),
    ];
    if (typeof item.promoted !== 'boolean') list.push(`${label}: promoted는 true/false여야 합니다.`);
    if (!isBlank(item.sourceId) && !sourceIds.has(item.sourceId)) list.push(`${label}: sourceId ${item.sourceId}가 수집 대상 목록에 없습니다.`);
    if (typeof item.summaryAi === 'string' && item.summaryAi.length > FEED_SUMMARY_MAX) {
      list.push(`${label}: summaryAi는 ${FEED_SUMMARY_MAX}자 이내여야 합니다.`);
    }
    if (!isBlank(item.duplicateOf) && !ids.has(item.duplicateOf)) list.push(`${label}: duplicateOf ${item.duplicateOf}를 찾을 수 없습니다.`);
    if (!isBlank(item.collectedAt) && Number.isNaN(Date.parse(item.collectedAt))) list.push(`${label}: collectedAt 날짜 형식이 잘못되었습니다.`);
    return list;
  });
  findDuplicates(items.map((i) => i.id)).forEach((id) => errors.push(`feed: 중복 id ${id}`));
  return { errors, warnings: [] };
}

function validateSources(items) {
  const errors = items.flatMap((item) => {
    const label = `sources ${item.id ?? '(id 없음)'}`;
    const list = [
      ...checkRequired(item, SOURCE_REQUIRED.filter((f) => f !== 'enabled'), label),
      ...checkEnum(item.sourceType, FEED_SOURCE_TYPES, 'sourceType', label),
      ...checkEnum(item.method, SOURCE_METHODS, 'method', label),
    ];
    if (typeof item.enabled !== 'boolean') list.push(`${label}: enabled는 true/false여야 합니다.`);
    if (!isBlank(item.url) && !isHttpUrl(item.url)) list.push(`${label}: url은 http(s) 주소여야 합니다.`);
    if (item.enabled && item.method === 'list' && !LIST_PARSERS.includes(item.parser)) {
      list.push(`${label}: 켜진 목록 수집 대상(method: list)은 parser(${LIST_PARSERS.join(', ')})가 필요합니다.`);
    }
    return list;
  });
  findDuplicates(items.map((i) => i.id)).forEach((id) => errors.push(`sources: 중복 id ${id}`));
  return { errors, warnings: [] };
}

function validateStages(items) {
  if (items.length !== STAGE_COUNT) {
    return { errors: [`stages: 단계는 정확히 ${STAGE_COUNT}개여야 합니다 (현재 ${items.length}개).`], warnings: [] };
  }
  const errors = [];
  const warnings = [];
  items.forEach((stage, index) => {
    if (stage.n !== index + 1) errors.push(`stages: ${index + 1}번째 항목의 n은 ${index + 1}이어야 합니다.`);
    const blank = ['name', 'nameKo', 'question'].filter((f) => isBlank(stage[f]));
    if (stage.draft) warnings.push(`stages: ${CIRCLED[index]}단계는 확정 전 초안입니다.`);
    else if (blank.length) errors.push(`stages: ${CIRCLED[index]}단계의 ${blank.join(', ')}가 비어 있습니다.`);
  });
  return { errors, warnings };
}

function sampleWarnings(data) {
  return Object.entries(data)
    .filter(([, file]) => file?.meta?.sample === true)
    .map(([name]) => `${name}.json은 샘플 데이터입니다. 실제 공개 전에 교체하세요.`);
}

export function validateAll(data) {
  const sourceIds = new Set((data.sources?.items ?? []).map((s) => s.id));
  const results = [
    validateLibrary(data.library?.items ?? []),
    validateFeed(data.feed?.items ?? [], sourceIds),
    validateSources(data.sources?.items ?? []),
    validateStages(data.stages?.items ?? []),
  ];
  return {
    errors: results.flatMap((r) => r.errors),
    warnings: [...results.flatMap((r) => r.warnings), ...sampleWarnings(data)],
  };
}
