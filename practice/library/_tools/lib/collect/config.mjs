// 주간 수집기 설정. 운영하며 조정할 값은 여기만 고친다.

export const USER_AGENT = 'Mozilla/5.0 (compatible; CheongramAXLibraryBot/1.0; +https://www.crmc.co.kr/practice/library/)';
export const FETCH_TIMEOUT_MS = 20_000;
export const POLITE_DELAY_MS = 1_500;

// 이번 실행에서 새로 볼 발표 기간. 첫 실행에서 과거 글이 한꺼번에 쏟아지지 않게 막는다.
export const LOOKBACK_DAYS = 14;
// 한 번에 피드에 새로 올리는 대표 자료 수 상한 (PRD v1.1: 구현 시 확정 → 초기값 10, 운영하며 조정)
export const MAX_NEW_PER_RUN = 10;
// 한 기관이 피드를 독차지하지 않도록 기관당 한 번에 올리는 대표 자료 수 상한
export const MAX_NEW_PER_SOURCE = 4;
// feed.json에 보관하는 전체 항목 수 상한
export const FEED_MAX_ITEMS = 200;
// 제목 유사도가 이 값 이상이면 같은 발표로 본다
export const TITLE_SIMILARITY_THRESHOLD = 0.8;
// 이미 올라간 자료와 중복을 비교하는 기간
export const RECENT_COMPARE_DAYS = 60;

export const GEMINI_DEFAULT_MODEL = 'gemini-2.5-flash';
export const GEMINI_TIMEOUT_MS = 60_000;
export const GEMINI_MAX_CANDIDATES = 40;
export const GEMINI_MAX_RETRIES = 2;

// 관련성 1차 필터. 2차 판별은 Gemini가 한다.
export const KO_KEYWORDS = [
  '인공지능', '생성형', '에이전트', '챗봇', '디지털 전환', '디지털전환', '거대언어모델', '초거대',
  '지능정보', '디지털플랫폼정부', '디지털 플랫폼 정부', '바이브 코딩', '데이터 분석',
];
export const EN_KEYWORDS = ['artificial intelligence', 'generative', 'agentic', 'machine learning', 'large language model'];
// 다른 영단어 안에 섞인 글자(예: MAIN)는 걸리지 않도록 경계를 확인하는 약어
export const ACRONYMS = ['AI', 'AX', 'LLM', 'GenAI', 'GPT'];
