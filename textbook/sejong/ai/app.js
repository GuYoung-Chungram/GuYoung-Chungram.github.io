const STORAGE_KEY = 'ai-instructional-design-studio-v2';

// ===== 모듈 정의 (실제 운영 시간표 기준, 휴식 2회는 진행률에서 제외) =====
const MODULES = [
  { time: '10분', title: '오프닝', kicker: '오프닝', heading: '좋은 수업과 좋은 자료는 무엇이 다를까요?', description: '오늘 끝까지 설계할 실제 수업 하나를 정합니다. 범례를 눌러 밑그림부터 잡아보세요.', output: '설계 대상 선정', kind: 'project' },
  { time: '15분', title: '요청 비교', kicker: 'AI 공동설계 시연', heading: '나쁜 요청과 좋은 설계 대화, 같이 비교해요', description: '같은 수업을 두 가지 방식으로 요청한 결과를 나란히 읽고 평소 내 습관을 점검합니다.', output: 'AI 활용 원칙', kind: 'compare' },
  { time: '25분', title: '기획 실습', kicker: 'AI 인터뷰', heading: 'AI가 나를 인터뷰하게 해요', description: '학습자·현업 문제·수업 후 행동·교육환경을 AI와 대화하며 구체화합니다.', output: '수업설계 캔버스 초안', kind: 'context' },
  { time: '20분', title: '상호 검토', kicker: '2~3인 소회의실', heading: '서로의 학습목표를 점검해요', description: '옆 사람과 목표·학습자 적합성을 확인하고, 들은 의견으로 목표를 다듬습니다.', output: '수정된 학습목표', kind: 'mutualReview' },
  { time: '10분', title: '전체 피드백', kicker: '함께 발견하기', heading: '한 사례에서 모두의 기준을 찾아요', description: '대표 사례를 AI와 함께 개선하며 내 설계에 적용할 기준을 기록합니다.', output: '개선 기준 이해', kind: 'feedback' },
  { time: '15분', title: '교수법 탐색', kicker: '목적별로 고르기', heading: '재미보다 목적에 맞는 방법을 골라요', description: '목적 그룹별 범례에서 후보를 고르면 근거가 자동으로 정리됩니다.', output: '교수법 후보', kind: 'methods' },
  { time: '25분', title: '설계 실습', kicker: '수업 흐름', heading: '수업 전·중·후를 하나의 흐름으로', description: '교수자 행동이 아니라 학습자의 수행을 중심으로 시간표를 만듭니다.', output: '수업 흐름표', kind: 'flow' },
  { time: '15분', title: '동료 테스트', kicker: '학습자 역할 체험', heading: '동료가 학습자가 되어 활동을 테스트해요', description: '범례 없이, 들은 제안과 바꿀 점을 그대로 적어보는 것으로 충분합니다.', output: '설계 개선점', kind: 'peerTest' },
  { time: '15분', title: 'AI 파트너', kicker: 'Gemini Gem 만들기', heading: '나만의 교수설계 코치를 만들어요', description: '오늘의 협업 방식을 반복할 수 있는 재사용 가능한 Gem 지침을 완성합니다.', output: '재사용 프롬프트', kind: 'tutor' },
  { time: '10분', title: '마무리', kicker: '갤러리·실행', heading: '완성보다 다음 실행을 약속해요', description: '결과물을 저장하고 다음 수업에서 바꿀 한 가지를 선언합니다.', output: '완성본·실행계획', kind: 'finish' }
];

// 이 인덱스(0-based) 모듈 다음에 휴식 표시 (진행률 카운트에는 미포함)
const BREAK_AFTER = [4, 7];

// ===== 범례·예시 데이터 =====
const PLANNING_LEGEND = [
  { key: 'time', label: '교육시간', options: ['2시간 단회', '3시간 단회', '4시간 단회', '2회차 분할', '4회차 이상 분할'] },
  { key: 'audience', label: '학습대상 분야', options: ['유소년(초등)', '청소년(중고등)', '일반 시민', '직장인', '대학(원)생', '학부모', '시니어(60+)', '전문직·자격증 준비'] },
  { key: 'topic', label: '주제 분야', options: ['인공지능·디지털', '경제·금융', '건강·요리', '인문교양', '문화예술'] },
  { key: 'format', label: '운영 형태', options: ['오프라인 소규모(20인 이하)', '오프라인 대형 강당', '온라인 실시간', '온오프 혼합'] },
  { key: 'purpose', label: '수업 목적', options: ['자기계발·교양', '직무역량 강화', '취미·실습', '자격·인증 준비'] }
];

// 주제 분야별 콘텐츠 뱅크 — 도입훅·대표활동·마무리질문·주의사항 예시(강사의 도메인 지식 대체가 아니라 출발점)
const TOPIC_BANK = {
  '인공지능·디지털': { openingHook: '오늘 하루 AI를 몇 번이나 써보셨나요? 검색·번역·사진보정도 다 AI입니다.', mainActivity: '프롬프트 배틀 — 같은 과제를 서로 다른 프롬프트로 요청해 결과를 비교하고 좋은 프롬프트의 조건을 정리한다', closingQ: '오늘 만든 결과물 중 실제로 써볼 것 같은 건 무엇인가요?', riskNote: 'AI가 알려준 가격·수치·인물 등은 반드시 원문 출처로 재확인하도록 안내하세요.' },
  '경제·금융': { openingHook: '최근에 나도 모르게 손해 봤다고 느낀 경제적 결정이 있으셨나요?', mainActivity: '내 재무상태 진단표 작성 — 실제(또는 가상) 상황을 워크시트에 채워보며 개념을 적용한다', closingQ: '오늘 배운 것 중 이번 달 안에 바로 적용할 수 있는 건 무엇인가요?', riskNote: '개별 법률·세무·투자에 대한 단정적 조언은 피하고, 필요 시 전문기관 상담을 안내하세요.' },
  '건강·요리': { openingHook: '오늘 배우는 것을 이번 주 안에 집에서 그대로 해보실 수 있을까요?', mainActivity: '짝 실습 코칭 — 2인 1조로 서로의 자세·조리 과정을 관찰하고 체크리스트로 피드백을 주고받는다', closingQ: '오늘 실습 중 가장 자신 있게 다시 할 수 있는 과정은 무엇인가요?', riskNote: '알레르기·지병·신체 제약 여부를 사전에 확인하고 대체 동작·재료를 안내하세요.' },
  '인문교양': { openingHook: '오늘 주제에 대해 평소 갖고 있던 생각이나 궁금증이 있으신가요?', mainActivity: '모둠 토의 및 발표 — 소그룹으로 토의한 뒤 핵심을 한 문장으로 정리해 발표한다', closingQ: '오늘 이야기 중 다른 사람에게 들려주고 싶은 내용은 무엇인가요?', riskNote: '역사·문화적 사실은 출처를 함께 제시하고, 논쟁적 주제는 여러 관점을 균형 있게 안내하세요.' },
  '문화예술': { openingHook: '오늘 배우는 것으로 무엇을 만들어보고 싶으신가요?', mainActivity: '미니 발표회·전시 — 각자 완성한 결과물을 짧게 소개하고 소감을 나눈다', closingQ: '완성한 결과물 중 가장 마음에 드는 부분은 무엇인가요?', riskNote: '도구 사용 안전수칙(가위·바늘·화학재료 등)을 활동 시작 전 반드시 안내하세요.' }
};

const METHOD_GROUPS = [
  { group: '실습·적용 강화', options: ['시뮬레이션·역할연기', '문제해결학습', '시범 후 연습'] },
  { group: '사고·성찰 강화', options: ['개별 성찰', '코칭'] },
  { group: '상호작용·동기 강화', options: ['토의', '게임화'] },
  { group: '사례 기반 이해', options: ['사례기반학습'] }
];

const OUTPUT_OPTIONS = ['수업설계 캔버스', '학습목표', '수업 흐름표', '강의안 목차', '활동지', '평가 루브릭', '강사 스크립트'];

const HABIT_OPTIONS = ['거의 항상 생성형처럼 요청했다', '섞어서 썼다', '이미 질문형으로 요청해왔다'];

// 교육시간 범례 선택 시 아래 숫자 필드를 자동으로 채우는 값(직접 고치면 그 값이 우선함)
const TIME_LEGEND_MAP = {
  '2시간 단회': { duration: '120', sessions: '1' },
  '3시간 단회': { duration: '180', sessions: '1' },
  '4시간 단회': { duration: '240', sessions: '1' },
  '2회차 분할': { duration: '120', sessions: '2' },
  '4회차 이상 분할': { duration: '90', sessions: '4' }
};

const COMPARE_DEMO = {
  generative: '시니어 대상 자서전 글쓰기반 2시간 수업안을 만들어 줘.',
  codesign: '당신은 나의 교수설계 코치입니다. 수업안을 바로 작성하지 말고, 학습자·현업 문제·수업 후 수행행동·교육환경을 파악하기 위해 한 번에 하나씩 질문해 주세요. 제 답변이 모호하면 구체적인 사례를 요청해 주세요. 정보가 충분해지면 서로 다른 수업설계 방향 세 가지를 장단점과 함께 비교하고, 제가 선택하기 전에는 최종안을 작성하지 마세요.'
};

// ===== 상태 =====
function createInitialState() {
  return {
    currentModule: 0,
    modules: MODULES.map((module) => ({ ...module })),
    completed: [],
    project: {
      title: '', learners: '', duration: '120', sessions: '1',
      kdf: { know: '', do: '', feel: '' },
      legend: { time: '', audience: '', topic: '', format: '', purpose: '' }
    },
    context: { learnerProfile: '', workplaceProblem: '', environment: '', constraints: '' },
    objectives: '', peerReviewNotes: '',
    habitCheck: '', principles: '',
    feedbackCriteria: '',
    methods: [], methodReason: '',
    lessonFlow: '',
    peerTest: { feedback: '', action: '' },
    tutor: { career: '', topics: '', learnerAgeGroups: '', questionStyle: '한 번에 하나씩', tone: '친절하지만 구체적으로', alternatives: '3', outputs: ['수업 흐름표'], preferredMethods: '', avoid: '' },
    actionPlan: '',
    theme: 'light'
  };
}

// ===== 유틸 =====
function escapeHtml(value = '') {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

const text = (value, fallback = '[아직 정하지 않음]') => String(value || '').trim() || fallback;

function calculateLessonMinutes(items, limit) {
  const total = items.reduce((sum, item) => sum + (Number(item.minutes) || 0), 0);
  const safeLimit = Number(limit) || 0;
  return { total, limit: safeLimit, remaining: safeLimit - total, overflow: total > safeLimit };
}

function buildLegendSentence(legend = {}) {
  const bits = [];
  if (legend.audience) bits.push(`${legend.audience} 대상`);
  if (legend.topic) bits.push(legend.topic);
  if (legend.time) bits.push(legend.time);
  if (legend.format) bits.push(legend.format);
  if (legend.purpose) bits.push(`목적: ${legend.purpose}`);
  return bits.join(' · ');
}

// ===== 프롬프트 빌더 =====
function buildPrompt(type, moduleIndex, state) {
  const p = state.project;
  const c = state.context;
  const legendLine = buildLegendSentence(p.legend);
  const topicBank = TOPIC_BANK[p.legend.topic];
  const base = `수업명: ${text(p.title)}\n학습자: ${text(p.learners)}\n수업 구성: 회차당 ${text(p.duration)}분, 총 ${text(p.sessions, '1')}회차${legendLine ? `\n수업 조건: ${legendLine}` : ''}`;
  const generative = {
    2: `${text(p.learners)} 대상 ${text(p.title)} 수업 기획서를 만들어 줘.`,
    3: `다음 수업의 학습목표를 더 명확하게 고쳐 줘.\n\n${text(state.objectives)}`,
    4: `다음 수업설계를 개선할 수 있는 기준 5개를 알려 줘.\n\n${base}`,
    5: `${base}\n학습목표: ${text(state.objectives)}\n이 수업에 사용할 재미있는 교수법 5가지를 추천해 줘.`,
    6: `${base}\n학습목표: ${text(state.objectives)}\n선택 교수법: ${text(state.methods.join(', '))}\n${text(p.duration)}분짜리 수업 흐름표를 만들어 줘.`
  };
  const codesign = {
    2: `당신은 교수설계 코치입니다.${state.principles ? ` 방금 비교 실습에서 제가 세운 AI 활용 원칙은 다음과 같습니다: "${text(state.principles)}" 이 원칙을 지키면서 진행해 주세요.` : ''} 저는 강사이지 학습자 본인이 아니라서, 아래 정보 중 일부는 경험과 짐작으로 채웠습니다. 저를 질문으로 계속 몰아붙이지 말고, 아래 정보로 함께 수업 기획서 초안을 만들어 주세요.\n\nStep 1. 아래 정보에서 다음 설계(학습목표·교수법)에 가장 영향을 줄 요소 3~5개를 짚어 주세요.\nStep 2. 제가 적지 않았지만 효과적인 교수설계를 위해 꼭 알아야 할 요소가 있다면 짚어 주시고, 왜 필요한지 이유도 함께 알려주세요.\nStep 3. Step 1·2를 반영해 학습자·현업 문제·교육환경·제약을 표로 정리한 수업 기획서 초안을 작성해 주세요. 제가 확인한 뒤 다음 단계로 넘어가겠습니다.\n\n${base}\n학습자 특성(짐작 포함 가능): ${text(c.learnerProfile)}\n현업의 실제 문제: ${text(c.workplaceProblem)}\n교육환경: ${text(c.environment)}\n제약조건: ${text(c.constraints)}\n수업 후 해야 할 행동(Do, 모듈 1에서 가져옴): ${text(p.kdf.do)}`,
    3: `아래 수업 맥락과 현재 학습목표를 바탕으로 목표를 구체화하도록 도와주세요. 목표를 곧바로 다시 쓰지 말고, 학습자가 수업 후 실제로 만들어 내거나 수행할 결과가 무엇인지 한 번에 하나씩 질문해 주세요. 답변이 충분해지면 범위 유지, 범위 축소, 수행 수준 상향의 3개 방향을 비교하고 제가 선택한 방향으로 관찰 가능한 학습목표를 작성해 주세요.${state.peerReviewNotes ? `\n\n동료 검토 의견: ${text(state.peerReviewNotes)}` : ''}\n\n학습목표: ${text(state.objectives)}\n학습자: ${text(c.learnerProfile || p.learners)}\n수업 후 수행행동: ${text(p.kdf.do)}`,
    4: `당신은 교수설계 품질 코치입니다. 아래 수업을 즉시 수정하지 말고, 학습자 필요성·행동의 관찰 가능성·시간 내 달성 가능성·활동 및 평가와의 연결을 기준으로 진단해 주세요. 가장 영향이 큰 개선점부터 질문하고, 제가 동의한 기준만 나의 개선 체크리스트로 정리하세요.\n\n${base}\n학습목표: ${text(state.objectives)}`,
    5: `아래 학습목표와 학습자·환경 정보를 기준으로 교수법 후보 3가지를 제안해 주세요. 목표 정렬, 실제 수행 연습, 학습자 부담, 운영 난이도, 소요시간으로 비교하세요. 하나를 단정하지 말고 어떤 조건에서 각 후보가 적합한지 설명한 뒤 제가 선택하도록 질문해 주세요.\n\n${base}\n학습자 맥락: ${text(c.learnerProfile)}\n현업 문제: ${text(c.workplaceProblem)}\n학습목표: ${text(state.objectives)}\n환경·제약: ${text(c.environment)} / ${text(c.constraints)}`,
    6: `당신은 수업 흐름 설계를 돕는 코치입니다. 먼저 목표별로 학습자가 반드시 해 봐야 할 수행을 한 번에 하나씩 질문하세요. 그다음 수업 전·도입·전개·적용·마무리·수업 후 활동 후보를 제안하되 각 활동의 목적, 시간, 교수자 행동, 학습자 행동, 상호작용, 성공 증거를 포함하세요. 총 시간이 ${text(p.duration)}분을 넘으면 임의로 줄이지 말고 축소 대안을 비교해 제가 선택하게 하세요.\n\n학습목표: ${text(state.objectives)}\n선택 교수법: ${text(state.methods.join(', '))}\n선택 이유: ${text(state.methodReason)}${topicBank ? `\n주의사항(${p.legend.topic} 분야): ${topicBank.riskNote}` : ''}`
  };
  const body = (type === 'codesign' ? codesign[moduleIndex] : generative[moduleIndex]) || `${base}\n이 정보를 바탕으로 수업설계를 도와주세요.`;
  return `${body}\n\n[자체 점검] 확인되지 않은 사실(통계·기관명·인물·비용 등)이 있다면 추정임을 표시하거나 [확인 필요]로 남겨 주세요.`;
}

function buildGemInstruction(state) {
  const t = state.tutor;
  return `당신은 사용자의 AI 교수설계 코치입니다.

[사용자 맥락]
- 강사 경력/전문 분야: ${text(t.career)}
- 주요 강의 주제: ${text(t.topics)}
- 주요 학습자: ${text(t.learnerAgeGroups)}
- 현재 설계 중인 수업: ${text(state.project.title)}
- 수업 구성: 회차당 ${text(state.project.duration)}분, 총 ${text(state.project.sessions, '1')}회차

[핵심 임무]
사용자가 자신의 수업을 분석 → 목표 → 교수법 → 흐름 → 평가 → 개선의 순서로 설계하도록 질문, 대안 비교, 검토를 지원합니다. 사용자를 대신해 중요한 교수설계 결정을 내리지 않습니다.

[대화 원칙]
1. 새 설계를 시작할 때 수업안을 곧바로 작성하지 않습니다.
2. 학습자, 현업 문제, 수업 후 수행행동, 환경과 제약을 먼저 파악합니다.
3. 질문은 ${text(t.questionStyle)} 제시합니다.
4. 답변이 모호하면 실제 사례나 관찰 가능한 행동을 요청합니다.
5. 정보가 충분해지면 설계 방향 ${text(t.alternatives, '3')}개를 장점, 위험, 적합 조건과 함께 비교합니다.
6. 사용자가 승인하기 전에는 최종안을 확정하거나 작성하지 않습니다.
7. 학습목표, 활동, 평가의 정렬과 전체 시간 합계를 항상 점검합니다.

[선호하는 협업 방식]
- 말투와 피드백: ${text(t.tone)}
- 선호 교수법/활동: ${text(t.preferredMethods)}
- 피하고 싶은 방식: ${text(t.avoid)}

[주요 산출물]
${t.outputs.length ? t.outputs.join(', ') : '[아직 정하지 않음]'}

[금지사항]
- 제공되지 않은 학습자 특성이나 현업 상황을 사실처럼 가정하지 않습니다.
- 재미있다거나 효과적이라는 말만으로 교수법을 추천하지 않습니다.
- 사용자의 판단이 필요한 지점에서는 기준을 설명하고 질문합니다.
- 민감한 개인정보 입력을 요구하지 않습니다.

[첫 응답]
인사와 역할을 한 문장으로 설명한 뒤, 지금 설계하고 싶은 수업과 수업 후 학습자가 하게 될 행동을 묻는 질문 하나만 제시하세요.`;
}

let state = createInitialState();
let snackTimer;

// ===== 필드·범례 렌더 헬퍼 =====
function exampleChips(fieldPath, examples = []) {
  if (!examples.length) return '';
  return `<div class="example-row" role="group" aria-label="예시"><span class="example-label">예시</span>${examples.map(ex => `<button type="button" class="example-chip" data-example-path="${fieldPath}" data-example-text="${escapeHtml(ex)}">${escapeHtml(ex.length > 24 ? `${ex.slice(0, 24)}…` : ex)}</button>`).join('')}</div>`;
}

function field(label, path, value, options = {}) {
  const cls = options.full ? 'field full' : 'field';
  const examples = exampleChips(path, options.examples);
  if (options.type === 'textarea') return `<div class="${cls}"><label for="${path}">${label}</label><textarea id="${path}" data-path="${path}" placeholder="${options.placeholder || ''}">${escapeHtml(value)}</textarea>${examples}</div>`;
  if (options.type === 'select') return `<div class="${cls}"><label for="${path}">${label}</label><select id="${path}" data-path="${path}">${options.choices.map(v => `<option ${v === value ? 'selected' : ''}>${escapeHtml(v)}</option>`).join('')}</select></div>`;
  const numberOptions = options.inputType === 'number' ? ` min="${options.min || 1}" step="${options.step || 1}"` : '';
  return `<div class="${cls}"><label for="${path}">${label}</label><input id="${path}" data-path="${path}" type="${options.inputType || 'text'}" value="${escapeHtml(value)}" placeholder="${options.placeholder || ''}"${numberOptions}>${examples}</div>`;
}

function legendGroupChips(group) {
  const legend = state.project.legend;
  return `<div class="chips">${group.options.map(o => `<button type="button" class="choice-chip legend-chip ${legend[group.key] === o ? 'selected' : ''}" data-single-path="project.legend.${group.key}" data-value="${o}" aria-pressed="${legend[group.key] === o}">${o}</button>`).join('')}</div>`;
}

function promptComparison(index) {
  return `<div class="section-block"><h2 class="section-label">두 방식으로 요청해 보세요</h2><p class="helper">내용을 직접 고친 뒤 복사해도 좋습니다. 공동설계형은 답을 만들기 전에 맥락과 판단을 먼저 다룹니다.</p><div class="prompt-compare">
    ${promptCard('generate', '생성형 요청', '결과물을 빠르게 받기', '⚡', buildPrompt('generate', index, state))}
    ${promptCard('codesign', '공동설계형 요청', '질문하고 대안을 비교하기', '✦', buildPrompt('codesign', index, state))}
  </div><div class="insight-strip"><span>💡</span><p><strong>무엇이 다른가요?</strong> 생성형은 속도가 장점이고, 공동설계형은 산파 모형처럼 AI의 숨은 가정을 줄이면서 교수자의 판단을 설계 안에 남깁니다.</p></div></div>`;
}

function compareDemoBlock() {
  return `<div class="section-block"><h2 class="section-label">고정 사례로 먼저 비교해 보세요</h2><p class="helper">시니어 대상 자서전 글쓰기반, 2시간 수업이라는 같은 조건입니다. 전원이 같은 사례를 읽고 비교합니다.</p><div class="prompt-compare">
    ${promptCard('generate', '생성형 요청', '결과물을 빠르게 받기', '⚡', COMPARE_DEMO.generative, true)}
    ${promptCard('codesign', '공동설계형 요청', '질문하고 대안을 비교하기', '✦', COMPARE_DEMO.codesign, true)}
  </div><div class="insight-strip"><span>💡</span><p><strong>무엇이 다른가요?</strong> 생성형은 속도가 장점이고, 공동설계형은 AI의 숨은 가정을 줄이면서 교수자의 판단을 설계 안에 남깁니다.</p></div></div>`;
}

function promptCard(type, title, subtitle, icon, prompt, fixed = false) {
  return `<article class="prompt-card ${type}"><div class="prompt-card-head"><div class="prompt-icon">${icon}</div><div><strong>${title}</strong><span>${subtitle}</span></div></div><textarea class="prompt-text" id="prompt-${type}" aria-label="${title} 프롬프트">${escapeHtml(prompt)}</textarea><div class="prompt-actions"><button type="button" class="text-button reset-prompt" data-type="${type}" ${fixed ? 'data-fixed="1"' : ''}>원본 복원</button><button type="button" class="tonal-button copy-prompt" data-type="${type}">복사하기</button></div></article>`;
}

function canvasPreview() {
  const legendLine = buildLegendSentence(state.project.legend);
  return `<div class="canvas-preview" id="livePreview"><h3>나의 설계 캔버스</h3><div class="mini-canvas-grid">${miniCell('수업', state.project.title)}${miniCell('수업 조건', legendLine)}${miniCell('학습자', state.project.learners || state.context.learnerProfile)}${miniCell('수업 후 행동', state.project.kdf.do)}</div></div>`;
}

// 자유입력 중에는 전체 render()를 안 하므로(커서 위치 보존), 하단 미리보기만 따로 갱신
function refreshLivePreview() {
  const el = document.getElementById('livePreview');
  if (el) el.outerHTML = canvasPreview();
}

function miniCell(label, value) { return `<div class="mini-cell"><span>${label}</span><p class="${value ? '' : 'empty'}">${escapeHtml(value || '아직 입력하지 않았어요')}</p></div>`; }

function chipSelector(options, selected, group) {
  return `<div class="chips">${options.map(option => `<button type="button" class="choice-chip ${selected.includes(option) ? 'selected' : ''}" data-chip-group="${group}" data-value="${option}" aria-pressed="${selected.includes(option)}">${option}</button>`).join('')}</div>`;
}

function groupedChipSelector(groups, selected) {
  return groups.map(g => `<div class="chip-group"><span class="chip-group-label">${g.group}</span><div class="chips">${g.options.map(option => `<button type="button" class="choice-chip ${selected.includes(option) ? 'selected' : ''}" data-chip-group="methods" data-value="${option}" aria-pressed="${selected.includes(option)}">${option}</button>`).join('')}</div></div>`).join('');
}

function habitCheckChips() {
  return `<div class="chip-group"><span class="chip-group-label">평소 나의 습관은?</span><div class="chips">${HABIT_OPTIONS.map(o => `<button type="button" class="choice-chip ${state.habitCheck === o ? 'selected' : ''}" data-single-path="habitCheck" data-value="${o}" aria-pressed="${state.habitCheck === o}">${o}</button>`).join('')}</div></div>`;
}

// 관찰 불가능한 동사(이해한다·안다·배운다 등) 감지 — project.kdf.do 필드 전용
const UNOBSERVABLE_VERB_PATTERN = /이해한다|이해합니다|압니다|안다|배운다|배웁니다/;

function verbWarningStrip(value) {
  if (!UNOBSERVABLE_VERB_PATTERN.test(String(value || ''))) return '<div id="doVerbWarning"></div>';
  return `<div id="doVerbWarning"><div class="insight-strip warn"><span>❌</span><p><strong>확인이 어려운 동사예요</strong> — 설명한다·구분한다·수행한다처럼 관찰 가능한 동사로 바꿔보세요</p></div></div>`;
}

// project.kdf.do 입력 중 실시간으로 동사 경고를 갱신(전체 render() 없이)
function refreshDoVerbWarning() {
  const el = document.getElementById('doVerbWarning');
  if (el) el.outerHTML = verbWarningStrip(state.project.kdf.do);
}

// ===== 모듈별 화면 =====
function projectFields() {
  const [timeGroup, audienceGroup, topicGroup, formatGroup, purposeGroup] = PLANNING_LEGEND;
  const sentence = buildLegendSentence(state.project.legend);
  return `<div class="insight-strip"><span>❓</span><p><strong>핵심 질문:</strong> 좋은 수업과 좋은 자료는 무엇이 다른가요? 수업 후 학습자가 실제로 무엇을 하게 되면 성공인가요? 오후에 배운 빈 그릇 모형·산파 모형, 기억나시나요? 지금부터 산파 모형으로 AI와 설계합니다.</p></div>
  <div class="legend-block section-block">
    <h2 class="section-label">범례를 눌러 밑그림을 그려보세요</h2>
    <p class="helper">누르면 아래 세부 항목이 자동으로 채워집니다. 숫자나 설명은 그대로 고치면 됩니다 — 같은 걸 두 번 묻지 않아요.</p>

    <div class="chip-group"><span class="chip-group-label">${timeGroup.label}</span>${legendGroupChips(timeGroup)}
      <div class="legend-detail">${field('회차당 수업 시간(분)', 'project.duration', state.project.duration, { inputType: 'number', min: 30, step: 30 })}${field('총 회차', 'project.sessions', state.project.sessions, { inputType: 'number', min: 1, step: 1 })}</div>
    </div>

    <div class="chip-group"><span class="chip-group-label">${audienceGroup.label}</span>${legendGroupChips(audienceGroup)}
      <div class="legend-detail">${field('주요 학습자(구체적으로)', 'project.learners', state.project.learners, { full: true, placeholder: '예: 입직 1년 이내 공무원' })}</div>
    </div>

    <div class="chip-group"><span class="chip-group-label">${topicGroup.label}</span>${legendGroupChips(topicGroup)}</div>
    <div class="chip-group"><span class="chip-group-label">${formatGroup.label}</span>${legendGroupChips(formatGroup)}</div>
    <div class="chip-group"><span class="chip-group-label">${purposeGroup.label}</span>${legendGroupChips(purposeGroup)}</div>

    <div class="legend-sentence ${sentence ? '' : 'empty'}"><span>조립된 문장</span><p>${sentence ? escapeHtml(sentence) : '범례를 하나씩 눌러보세요'}</p></div>
  </div>
  <h2 class="section-label">수업명과 학습자에게 남기고 싶은 것</h2><p class="helper">아직 정하지 못한 내용은 비워 두어도 됩니다. 학습자 인터뷰 전이니, 강사가 의도하는 설계 목표를 적으면 됩니다.</p><div class="field-grid">
    ${field('수업명', 'project.title', state.project.title, { full: true, placeholder: '예: 신입 공무원 보고서 작성법' })}
    ${field('알아야 할 것 (Know)', 'project.kdf.know', state.project.kdf.know, { type: 'textarea', full: true, placeholder: '이 수업에서 새로 알아야 할 지식·개념', examples: ['보고서에서 핵심 메시지를 앞에 배치해야 하는 이유', '자서전에서 다뤄야 할 인생의 전환점 찾는 법'] })}
    ${field('해야 할 것 (Do)', 'project.kdf.do', state.project.kdf.do, { type: 'textarea', full: true, placeholder: '수업 후 실제로 할 수 있어야 하는 행동', examples: ['혼자서 보고서 초안을 20분 안에 작성한다.', '자신의 인생 사건 3가지를 문단으로 쓴다.'] })}
    ${field('느꼈으면 하는 것 (Feel)', 'project.kdf.feel', state.project.kdf.feel, { type: 'textarea', full: true, placeholder: '수업 후 학습자가 느꼈으면 하는 마음·태도', examples: ['내 글도 남에게 도움이 될 수 있다는 자신감', '다시 써봐도 되겠다는 편안함'] })}
  </div>${verbWarningStrip(state.project.kdf.do)}${canvasPreview()}`;
}

function contextFields() {
  return `<div class="insight-strip"><span>🧭</span><p><strong>확신이 없어도 괜찮습니다.</strong> 아직 실제 학습자를 인터뷰한 게 아니니, 지금 아는 만큼만 적거나 짐작이면 짐작이라고 적어도 됩니다. 다음 단계에서 AI가 빠진 부분을 짚어 드립니다. (수업 후 행동은 모듈 1에서 이미 정했으니 여기서 다시 묻지 않습니다.)</p></div>
  <h2 class="section-label">수업 기획서에 들어갈 요소를 정리하세요</h2><div class="field-grid">
    ${field('학습자 특성', 'context.learnerProfile', state.context.learnerProfile, { type: 'textarea', placeholder: '연령, 직무, 선수지식, 참여 동기 — 짐작이면 짐작이라고 표시', examples: ['30~50대 중간관리자로 추정, 보고서 작성 경험 있을 것 같음', '자녀 교육에 관심 많은 학부모, IT는 낯설어할 듯'] })}
    ${field('현업의 실제 문제', 'context.workplaceProblem', state.context.workplaceProblem, { type: 'textarea', placeholder: '현재 어떤 상황에서 무엇이 어려운가요?', examples: ['보고서 초안에 핵심 메시지가 안 드러나 재작성이 반복됨'] })}
    ${field('교육환경', 'context.environment', state.context.environment, { type: 'textarea', placeholder: '장소, 인원, 기기, 온라인/오프라인', examples: ['세종시평생학습원 강의실, 20인, 노트북 지참'] })}
    ${field('제약조건', 'context.constraints', state.context.constraints, { type: 'textarea', full: true, placeholder: '시간, 도구, 보안, AI 사용 가능 여부', examples: ['와이파이 불안정, 개인 AI 계정 사용 가능'] })}
  </div>${promptComparison(2)}${canvasPreview()}`;
}

function mutualReviewFields() {
  return `<div class="insight-strip"><span>🤝</span><p><strong>2~3인 소회의실에서 서로의 목표를 점검하세요.</strong> 학습자에게 맞는 목표인지, 시간 안에 가능한지 서로 물어봐 주세요.</p></div>
  ${field('현재 학습목표', 'objectives', state.objectives, { type: 'textarea', full: true, placeholder: '예: 주어진 사례를 검토해 보고서 핵심 메시지를 한 문장으로 작성할 수 있다.', examples: ['주어진 사례를 검토해 보고서 핵심 메시지를 한 문장으로 작성할 수 있다.', '실습 후 자신의 자서전 목차를 3단계로 구성할 수 있다.'] })}
  <div class="section-block"><h2 class="section-label">좋은 학습목표의 기준</h2><div class="chips">${['학습자에게 필요한가', '행동으로 관찰 가능한가', '시간 안에 가능한가', '활동·평가로 확인 가능한가'].map(x => `<button type="button" class="choice-chip static-chip">${x}</button>`).join('')}</div></div>
  <div class="section-block field-grid">${field('동료가 점검해 준 내용', 'peerReviewNotes', state.peerReviewNotes, { type: 'textarea', full: true, placeholder: '예: 목표가 너무 넓다는 의견을 들었어요.' })}</div>
  ${promptComparison(3)}`;
}

function feedbackFields() {
  return `<div class="insight-strip"><span>◎</span><p><strong>대표 사례를 보며 내 기준으로 바꾸세요.</strong> 좋은 피드백은 정답을 알려주는 대신 다음 판단에서 다시 쓸 수 있는 기준을 남깁니다.</p></div><div class="section-block field-grid">${field('내 설계에 적용할 개선 기준', 'feedbackCriteria', state.feedbackCriteria, { type: 'textarea', full: true, placeholder: '예: 목표 문장에는 실제 상황과 산출물이 드러나야 한다.' })}</div>${promptComparison(4)}`;
}

function methodFields() {
  return `<h2 class="section-label">목적별로 후보를 골라 보세요</h2><p class="helper">여러 개를 선택할 수 있습니다. 익숙하거나 재미있다는 이유보다 '목표 행동을 연습하는가'를 먼저 보세요.</p>${groupedChipSelector(METHOD_GROUPS, state.methods)}
  <div class="section-block"><h2 class="section-label">교수법 선택의 5기준</h2><div class="chips">${['목표', '내용', '학습자', '환경', '증거'].map(x => `<button type="button" class="choice-chip static-chip">${x}</button>`).join('')}</div></div>
  <div class="section-block field-grid">${field('잠정 선택 이유', 'methodReason', state.methodReason, { type: 'textarea', full: true, placeholder: '이 방법이 왜 내 학습목표와 학습자에게 맞나요?' })}</div>${promptComparison(5)}`;
}

function flowFields() {
  const estimated = (state.lessonFlow.match(/(\d+)\s*분/g) || []).map(x => ({ minutes: Number(x.match(/\d+/)[0]) }));
  const time = calculateLessonMinutes(estimated, state.project.duration);
  const topic = TOPIC_BANK[state.project.legend.topic];
  const examples = topic
    ? [`도입 10분 — ${topic.openingHook}`, `전개 20분 — ${topic.mainActivity}`, `마무리 10분 — ${topic.closingQ}`]
    : ['도입 10분 — 실제 보고서 두 편 비교', '적용 20분 — 자신의 사례로 초안 작성'];
  return `<div class="field-grid">${field('수업 흐름 초안', 'lessonFlow', state.lessonFlow, { type: 'textarea', full: true, placeholder: '예: 도입 10분 — 실제 보고서 사례 비교\n전개 30분 — 핵심 메시지 시범...', examples })}</div><p class="helper ${time.overflow ? 'warning' : ''}">${estimated.length ? `문장에서 감지한 시간 합계: ${time.total}분 / ${time.limit}분 ${time.overflow ? `— ${Math.abs(time.remaining)}분 초과, 축소가 필요합니다.` : ''}` : '활동 옆에 "10분"처럼 입력하면 전체 시간을 확인해 드립니다.'}</p><p class="helper">❌ '질문 있습니까'가 아니라 ✅ '무엇을 보고 배웠다고 판단할지'를 함께 적어보세요.</p>${topic ? `<div class="insight-strip warn"><span>⚠</span><p><strong>${text(state.project.legend.topic)} 분야 주의사항:</strong> ${topic.riskNote}</p></div>` : ''}${promptComparison(6)}`;
}

function peerTestFields() {
  return `<div class="insight-strip"><span>🧑‍🤝‍🧑</span><p><strong>다른 참여자가 학습자 입장이 되어 내 활동을 테스트합니다.</strong> 범례 없이, 들은 그대로 적어보는 것으로 충분합니다.</p></div><div class="field-grid">
    ${field('동료가 학습자 입장에서 준 제안', 'peerTest.feedback', state.peerTest.feedback, { type: 'textarea', full: true, placeholder: '예: 도입에서 목표를 먼저 말해주면 좋겠다고 했어요.' })}
    ${field('그래서 무엇을 바꿀지', 'peerTest.action', state.peerTest.action, { type: 'textarea', full: true, placeholder: '예: 도입 첫 2분에 오늘의 목표를 한 문장으로 안내한다.' })}
  </div>`;
}

function missingTutorFields() {
  const checks = [['project.title', '수업명'], ['project.kdf.do', '해야 할 것(Do)'], ['objectives', '학습목표'], ['lessonFlow', '수업 흐름']];
  const missing = checks.filter(([path]) => !String(getPath(path) || '').trim()).map(([, label]) => label);
  if (!state.methods.length) missing.push('교수법');
  return missing;
}

function tutorFields() {
  const instruction = buildGemInstruction(state);
  const missing = missingTutorFields();
  return `${missing.length ? `<div class="warn-banner"><strong>아직 비어 있어요:</strong> ${missing.join(', ')} — 그대로 진행해도 되지만, 채울수록 Gem 지침이 정확해지고 다음에 재사용하기 좋아집니다.</div>` : ''}<h2 class="section-label">AI 코치가 나를 이해하도록 알려 주세요</h2><p class="helper">민감한 개인정보는 넣지 마세요. 입력할 때마다 아래 Gem 지침이 자동으로 바뀝니다. 이 지침은 오후에 배운 강사의 4가지 개입(질문·설명·기다림·피드백)을 AI에게 그대로 시킨 것입니다.</p><div class="field-grid">
    ${field('강사 경력·전문 분야', 'tutor.career', state.tutor.career, { placeholder: '예: 공공기관 성인교육 10년' })}
    ${field('주요 강의 주제', 'tutor.topics', state.tutor.topics, { placeholder: '예: 리더십, 보고서 작성' })}
    ${field('주요 학습자·연령대', 'tutor.learnerAgeGroups', state.tutor.learnerAgeGroups, { placeholder: '예: 30~50대 중간관리자' })}
    ${field('질문 방식', 'tutor.questionStyle', state.tutor.questionStyle, { type: 'select', choices: ['한 번에 하나씩', '관련 질문을 3개씩'] })}
    ${field('코칭 말투', 'tutor.tone', state.tutor.tone, { type: 'select', choices: ['친절하지만 구체적으로', '간결하고 도전적으로', '상세한 설명과 함께'] })}
    ${field('비교할 대안 수', 'tutor.alternatives', state.tutor.alternatives, { type: 'select', choices: ['2', '3', '4'] })}
    ${field('선호 교수법·활동', 'tutor.preferredMethods', state.tutor.preferredMethods, { type: 'textarea', placeholder: '자주 사용하고 싶은 방식' })}
    ${field('피하고 싶은 방식', 'tutor.avoid', state.tutor.avoid, { type: 'textarea', placeholder: '예: 설명 위주의 긴 강의' })}
  </div><div class="section-block"><h2 class="section-label">필요한 최종 산출물</h2>${chipSelector(OUTPUT_OPTIONS, state.tutor.outputs, 'outputs')}</div><div class="section-block"><h2 class="section-label">Gem에 붙여 넣을 최종 지침</h2><p class="helper">Gemini의 Gem 만들기 화면에서 '지침' 영역에 붙여 넣으세요. 서비스 제공 범위는 수업 직전 확인하세요.</p><article class="prompt-card codesign"><textarea id="gemOutput" class="prompt-text gem-output" aria-label="Gem용 최종 지침">${escapeHtml(instruction)}</textarea><div class="prompt-actions"><button type="button" class="filled-button" id="copyGem">Gem 지침 복사</button></div></article></div>`;
}

function finishFields() {
  return `<div class="insight-strip"><span>✓</span><p><strong>오늘 만든 것은 완성품이 아니라 실행 가능한 첫 설계입니다.</strong> 실제 수업에서 관찰한 뒤 다시 AI 코치와 개선하세요.</p></div><div class="section-block field-grid">${field('다음 수업에서 실행할 한 가지', 'actionPlan', state.actionPlan, { type: 'textarea', full: true, placeholder: '언제, 어떤 수업에서, 무엇을 바꿀지 구체적으로 적어 보세요.' })}</div><div class="canvas-preview"><h3>완주 체크</h3><div class="chips">${['수업 선택', '맥락 분석', '상호 검토', '교수법', '수업 흐름', '동료 테스트', 'AI 튜터'].map(x => `<span class="choice-chip selected">✓ ${x}</span>`).join('')}</div><div style="margin-top:20px;display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="filled-button" id="finishExport">전체 결과 내보내기</button><button type="button" class="outlined-button" id="importButton">이전 JSON 불러오기</button></div></div>`;
}

function moduleBody(module) {
  switch (module.kind) {
    case 'project': return projectFields();
    case 'compare': return `<div class="insight-strip"><span>↔</span><p><strong>먼저 같은 사례로 두 요청을 읽어보세요.</strong> 답변 길이보다 AI가 무엇을 가정했고, 교수자의 판단이 어디에 남았는지를 비교합니다.</p></div>${compareDemoBlock()}<div class="section-block">${habitCheckChips()}</div><div class="section-block field-grid">${field('내가 발견한 AI 활용 원칙', 'principles', state.principles, { type: 'textarea', full: true, placeholder: '예: AI가 수업안을 쓰기 전에 학습자의 실제 문제부터 확인한다.' })}</div>`;
    case 'context': return contextFields();
    case 'mutualReview': return mutualReviewFields();
    case 'feedback': return feedbackFields();
    case 'methods': return methodFields();
    case 'flow': return flowFields();
    case 'peerTest': return peerTestFields();
    case 'tutor': return tutorFields();
    case 'finish': return finishFields();
    default: return '';
  }
}

// ===== 메인 렌더 =====
function render() {
  if (typeof document === 'undefined') return;
  const module = state.modules[state.currentModule];
  document.documentElement.dataset.theme = state.theme;
  document.getElementById('moduleNav').innerHTML = state.modules.map((item, i) => `<button type="button" class="module-nav-item ${i === state.currentModule ? 'active' : ''} ${state.completed.includes(i) ? 'done' : ''}" data-module="${i}" ${i === state.currentModule ? 'aria-current="step"' : ''}><span class="step-dot">${state.completed.includes(i) ? '✓' : i + 1}</span><span class="nav-label">${item.title}</span><span class="module-time">${item.time}</span></button>${BREAK_AFTER.includes(i) ? '<div class="journey-break" aria-hidden="true"><span>휴식 10분</span></div>' : ''}`).join('');
  document.getElementById('moduleHero').innerHTML = `<div><div class="module-kicker"><span>${String(state.currentModule + 1).padStart(2, '0')}</span><span>·</span><span>${module.kicker}</span><span>·</span><span>${module.time}</span></div><h1>${module.heading}</h1><p>${module.description}</p></div><div class="output-pill"><span>이번 단계 산출물</span><strong>${module.output}</strong></div>`;
  document.getElementById('moduleContent').innerHTML = moduleBody(module);
  document.getElementById('progressBar').style.width = `${((state.currentModule + 1) / state.modules.length) * 100}%`;
  document.getElementById('progressText').textContent = `${state.currentModule + 1} / ${state.modules.length} 모듈`;
  document.getElementById('prevModule').disabled = state.currentModule === 0;
  document.getElementById('nextModule').innerHTML = state.currentModule === state.modules.length - 1 ? '처음으로 돌아가기 ↺' : '다음 단계 <span aria-hidden="true">→</span>';
  document.getElementById('savedCount').textContent = countFilledSections();
  bindDynamicEvents();
}

function getPath(path) { return path.split('.').reduce((obj, key) => obj?.[key], state); }
function setPath(path, value) { const keys = path.split('.'); const last = keys.pop(); const target = keys.reduce((obj, key) => obj[key], state); target[last] = value; }

// ===== 이벤트 바인딩 =====
function bindDynamicEvents() {
  document.querySelectorAll('[data-module]').forEach(btn => btn.addEventListener('click', () => navigate(Number(btn.dataset.module))));
  document.querySelectorAll('[data-path]').forEach(input => input.addEventListener('input', (event) => {
    setPath(event.target.dataset.path, event.target.value);
    saveState();
    if (['lessonFlow'].includes(event.target.dataset.path)) render();
    if (event.target.dataset.path.startsWith('tutor.')) renderTutorOutput();
    if (event.target.dataset.path === 'project.kdf.do') refreshDoVerbWarning();
    refreshLivePreview();
  }));
  document.querySelectorAll('[data-single-path]').forEach(chip => chip.addEventListener('click', () => {
    const path = chip.dataset.singlePath;
    const current = getPath(path);
    const next = current === chip.dataset.value ? '' : chip.dataset.value;
    setPath(path, next);
    // 범례가 아래 세부 입력을 대신 채움 — 같은 항목을 두 번 묻지 않기 위함
    if (path === 'project.legend.time' && next && TIME_LEGEND_MAP[next]) {
      setPath('project.duration', TIME_LEGEND_MAP[next].duration);
      setPath('project.sessions', TIME_LEGEND_MAP[next].sessions);
    }
    if (path === 'project.legend.audience' && next && !state.project.learners.trim()) {
      setPath('project.learners', next);
    }
    saveState(); render();
  }));
  document.querySelectorAll('[data-example-path]').forEach(chip => chip.addEventListener('click', () => {
    const path = chip.dataset.examplePath;
    const current = String(getPath(path) || '');
    setPath(path, current.trim() ? `${current}\n${chip.dataset.exampleText}` : chip.dataset.exampleText);
    saveState(); render(); showSnack('예시를 넣었어요 — 자유롭게 고쳐 보세요');
  }));
  document.querySelectorAll('[data-chip-group]').forEach(chip => chip.addEventListener('click', () => {
    const list = chip.dataset.chipGroup === 'methods' ? state.methods : state.tutor.outputs;
    const index = list.indexOf(chip.dataset.value);
    index >= 0 ? list.splice(index, 1) : list.push(chip.dataset.value);
    saveState(); render();
  }));
  document.querySelectorAll('.copy-prompt').forEach(btn => btn.addEventListener('click', () => copyText(document.getElementById(`prompt-${btn.dataset.type}`).value, '프롬프트를 복사했습니다')));
  document.querySelectorAll('.reset-prompt').forEach(btn => btn.addEventListener('click', () => {
    const original = btn.dataset.fixed ? COMPARE_DEMO[btn.dataset.type] : buildPrompt(btn.dataset.type, state.currentModule, state);
    document.getElementById(`prompt-${btn.dataset.type}`).value = original;
    showSnack('원본 프롬프트로 되돌렸습니다');
  }));
  document.querySelectorAll('.static-chip').forEach(chip => chip.addEventListener('click', () => { chip.classList.toggle('selected'); chip.setAttribute('aria-pressed', chip.classList.contains('selected')); }));
  document.getElementById('copyGem')?.addEventListener('click', () => copyText(document.getElementById('gemOutput').value, 'Gem 지침을 복사했습니다'));
  document.getElementById('finishExport')?.addEventListener('click', exportMarkdown);
  document.getElementById('importButton')?.addEventListener('click', () => document.getElementById('jsonImport').click());
}

function renderTutorOutput() { const output = document.getElementById('gemOutput'); if (output) output.value = buildGemInstruction(state); }
function navigate(index) { state.completed = [...new Set([...state.completed, state.currentModule])]; state.currentModule = Math.max(0, Math.min(index, state.modules.length - 1)); saveState(); render(); document.getElementById('workspace').focus(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function countFilledSections() { return [state.project.title, state.context.learnerProfile, state.objectives, state.methods.length, state.lessonFlow, state.peerTest.feedback, state.tutor.career, state.actionPlan].filter(Boolean).length; }

// ===== 저장·내보내기 =====
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); const status = document.getElementById('saveStatus'); if (status) { status.textContent = '✓ 방금 자동 저장됨'; setTimeout(() => { status.textContent = '이 기기에 자동 저장됩니다'; }, 1300); } } catch { showSnack('자동 저장하지 못했습니다. JSON으로 백업해 주세요.'); }
}

function mergeSavedState(parsed = {}) {
  const defaults = createInitialState();
  const validMethodOptions = METHOD_GROUPS.flatMap(g => g.options);
  return {
    ...defaults,
    ...parsed,
    currentModule: Math.min(Math.max(Number(parsed.currentModule) || 0, 0), defaults.modules.length - 1),
    modules: defaults.modules,
    completed: Array.isArray(parsed.completed) ? parsed.completed.filter(index => index >= 0 && index < defaults.modules.length) : [],
    methods: Array.isArray(parsed.methods) ? parsed.methods.filter(method => validMethodOptions.includes(method)) : [],
    project: { ...defaults.project, ...(parsed.project || {}), legend: { ...defaults.project.legend, ...((parsed.project || {}).legend || {}) }, kdf: { ...defaults.project.kdf, ...((parsed.project || {}).kdf || {}) } },
    context: { ...defaults.context, ...(parsed.context || {}) },
    tutor: { ...defaults.tutor, ...(parsed.tutor || {}) },
    peerTest: { ...defaults.peerTest, ...(parsed.peerTest || {}) },
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) state = mergeSavedState(JSON.parse(saved));
  } catch { state = createInitialState(); }
}

async function copyText(value, message) {
  try { await navigator.clipboard.writeText(value); showSnack(message); } catch { showSnack('복사하지 못했습니다. 텍스트를 선택해 직접 복사해 주세요.'); }
}

function showSnack(message) { const snack = document.getElementById('snackbar'); snack.textContent = message; snack.classList.add('show'); clearTimeout(snackTimer); snackTimer = setTimeout(() => snack.classList.remove('show'), 2200); }

function openCanvas() { renderCanvas(); document.getElementById('canvasSheet').classList.add('open'); document.getElementById('canvasSheet').setAttribute('aria-hidden', 'false'); document.getElementById('scrim').hidden = false; document.getElementById('closeCanvas').focus(); }
function closeCanvas() { document.getElementById('canvasSheet').classList.remove('open'); document.getElementById('canvasSheet').setAttribute('aria-hidden', 'true'); document.getElementById('scrim').hidden = true; document.getElementById('openCanvas').focus(); }

function renderCanvas() {
  const sections = [
    ['설계할 수업', `${text(state.project.title)} · 회차당 ${text(state.project.duration)}분 · 총 ${text(state.project.sessions, '1')}회차\n${text(state.project.learners)}${buildLegendSentence(state.project.legend) ? `\n조건: ${buildLegendSentence(state.project.legend)}` : ''}`],
    ['현업 문제와 수행행동', `${text(state.context.workplaceProblem)}\n→ ${text(state.project.kdf.do)}`],
    ['Know · Do · Feel', `알아야 할 것: ${text(state.project.kdf.know)}\n해야 할 것: ${text(state.project.kdf.do)}\n느꼈으면 하는 것: ${text(state.project.kdf.feel)}`],
    ['학습목표', text(state.objectives)],
    ['상호 검토 의견', text(state.peerReviewNotes)],
    ['교수법', `${text(state.methods.join(', '))}\n${text(state.methodReason)}`],
    ['수업 흐름', text(state.lessonFlow)],
    ['동료 테스트 결과', `${text(state.peerTest.feedback)}\n→ ${text(state.peerTest.action)}`],
    ['AI 활용 원칙', text(state.principles)],
    ['실행 약속', text(state.actionPlan)]
  ];
  document.getElementById('canvasContent').innerHTML = sections.map(([title, content]) => `<section class="sheet-section"><h3>${title}</h3><p>${escapeHtml(content)}</p></section>`).join('');
}

function markdownContent() {
  return `# ${text(state.project.title, '나의 수업설계')}\n\n## 수업 기본정보\n- 학습자: ${text(state.project.learners)}\n- 회차당 수업 시간: ${text(state.project.duration)}분\n- 총 회차: ${text(state.project.sessions, '1')}회차\n- 수업 조건: ${text(buildLegendSentence(state.project.legend))}\n\n## Know · Do · Feel\n- 알아야 할 것: ${text(state.project.kdf.know)}\n- 해야 할 것: ${text(state.project.kdf.do)}\n- 느꼈으면 하는 것: ${text(state.project.kdf.feel)}\n\n## 학습자와 현업 맥락\n${text(state.context.learnerProfile)}\n\n### 현업 문제\n${text(state.context.workplaceProblem)}\n\n### 수업 후 수행행동\n${text(state.project.kdf.do)}\n\n## 학습목표\n${text(state.objectives)}\n\n### 상호 검토 의견\n${text(state.peerReviewNotes)}\n\n## 교수법\n- 후보: ${text(state.methods.join(', '))}\n- 선택 이유: ${text(state.methodReason)}\n\n## 수업 흐름\n${text(state.lessonFlow)}\n\n### 동료 테스트 결과\n${text(state.peerTest.feedback)}\n→ ${text(state.peerTest.action)}\n\n## 나의 AI 교수설계 튜터 지침\n\n${buildGemInstruction(state)}\n\n## 다음 실행\n${text(state.actionPlan)}\n`;
}

function download(name, content, type) { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
function exportMarkdown() { download(`${state.project.title || '나의-수업설계'}.md`, markdownContent(), 'text/markdown;charset=utf-8'); showSnack('전체 설계를 Markdown으로 저장했습니다'); }
function backupJson() { download('AI-교수설계-백업.json', JSON.stringify(state, null, 2), 'application/json'); showSnack('JSON 백업을 저장했습니다'); }

function resetAll() {
  const ok = confirm('전체 초기화할까요? 이 브라우저에 저장된 모든 입력 내용이 사라집니다.\n\n먼저 백업하려면 취소를 누르고 "설계 캔버스 → JSON 백업"을 이용하세요.');
  if (!ok) return;
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  state = createInitialState();
  render();
  showSnack('전체 초기화했습니다');
}

// ===== 부트스트랩 =====
function setup() {
  loadState(); render();
  document.getElementById('prevModule').addEventListener('click', () => navigate(state.currentModule - 1));
  document.getElementById('nextModule').addEventListener('click', () => navigate(state.currentModule === state.modules.length - 1 ? 0 : state.currentModule + 1));
  document.getElementById('resetAll').addEventListener('click', resetAll);
  document.getElementById('openCanvas').addEventListener('click', openCanvas);
  document.getElementById('closeCanvas').addEventListener('click', closeCanvas);
  document.getElementById('scrim').addEventListener('click', closeCanvas);
  document.getElementById('exportMarkdown').addEventListener('click', exportMarkdown);
  document.getElementById('backupJson').addEventListener('click', backupJson);
  document.getElementById('themeToggle').addEventListener('click', () => { state.theme = state.theme === 'light' ? 'dark' : 'light'; saveState(); render(); });
  document.getElementById('jsonImport').addEventListener('change', async event => { try { state = mergeSavedState(JSON.parse(await event.target.files[0].text())); saveState(); render(); showSnack('백업을 불러왔습니다'); } catch { showSnack('올바른 백업 파일이 아닙니다'); } event.target.value = ''; });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && document.getElementById('canvasSheet').classList.contains('open')) closeCanvas(); });
}

if (typeof document !== 'undefined') setup();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    buildPrompt,
    buildGemInstruction,
    buildLegendSentence,
    calculateLessonMinutes,
    createInitialState,
    escapeHtml,
    mergeSavedState,
    MODULES,
    METHOD_GROUPS,
  };
}
