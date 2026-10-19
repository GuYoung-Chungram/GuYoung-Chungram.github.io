// 데이터 스키마 상수. PRD v1.1 §4·§5·§7과 맞춘다. 값을 바꾸면 PRD도 함께 고친다.

export const SOURCE_TYPES = ['gov', 'consulting', 'intl', 'chungram'];
export const SOURCE_TYPE_LABELS = {
  gov: '정부 정책',
  consulting: '해외 인사이트',
  intl: '국제기구',
  chungram: '청람 현장',
};
// 자동 수집 대상이 될 수 있는 출처구분 (국제기구·청람 현장은 직접 추가)
export const FEED_SOURCE_TYPES = ['gov', 'consulting'];

export const ROLES = ['staff', 'leader', 'planner'];
export const ROLE_LABELS = { staff: '실무자', leader: '관리자', planner: '기획·인사' };
// 상세 화면의 역할별 질문 묶음 위에 붙는 "이 질문을 어디에 쓰는가" 안내
export const ROLE_GUIDES = {
  staff: '내 업무에 바로 적용할 거리를 찾는 질문입니다. 답은 \'이번 주 해보기\' 과제의 재료가 됩니다.',
  leader: '팀을 어떻게 이끌지 정리하는 질문입니다. 답은 팀 회의 안건이나 팀원 1:1 대화의 재료로 쓰세요.',
  planner: '기관의 제도·교육·지침을 손볼 지점을 찾는 질문입니다. 답은 개선 제안이나 보고서의 근거 메모로 쓰세요.',
};

export const PRIORITIES = ['must', 'recommended', 'none'];
export const MUST_LIMIT = 5;
export const RECOMMENDED_PER_ROLE_LIMIT = 5;
export const QUESTIONS_PER_ROLE = 3;

export const LEVELS = ['입문', '심화'];
export const ISSUER_LEVELS = ['위원회', '중앙부처', '집행기관'];
export const DOC_TYPES = ['계획', '지침', '교육제도', '사례'];
export const STATUSES = ['원문확인', '원문확인중', '개정됨'];
export const SOURCE_METHODS = ['rss', 'list'];
// method가 list인 수집 대상이 쓸 수 있는 목록 페이지 파서 (_tools/lib/collect/parsers.mjs)
export const LIST_PARSERS = ['nia-bbs'];

export const STAGE_COUNT = 10;
export const SUMMARY_LINES = 3;
export const FEED_SUMMARY_MAX = 80;
export const FEED_RECENT_DAYS = 28;
export const NEW_BADGE_DAYS = 30;

export const STORAGE_PREFIX = 'chungram_axlib_v1_';
