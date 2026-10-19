// 테스트용 최소 유효 데이터. 각 테스트는 이 값을 복사해 필요한 필드만 바꾼다.

export function makeQuestions(id) {
  const byRole = (role) => [1, 2, 3].map((n) => ({
    id: `${id}.${role}.${n}`,
    text: `${role} 질문 ${n}`,
    ...(n === 1 ? { unique: true } : {}),
  }));
  return { staff: byRole('staff'), leader: byRole('leader'), planner: byRole('planner') };
}

export function makeItem(overrides = {}) {
  const id = overrides.id ?? 'gov-001';
  return {
    id,
    sourceType: 'gov',
    issuer: '인사혁신처',
    issuerLevel: '중앙부처',
    docType: '지침',
    status: '원문확인',
    date: '2026-05-22',
    title: '교육훈련 보고서 생성형 AI 활용 지침',
    titleKo: '교육훈련 보고서 생성형 AI 활용 지침',
    url: 'https://example.go.kr/doc',
    stage: [9],
    level: '입문',
    minutes: 10,
    summaryKo: ['첫 줄', '둘째 줄', '셋째 줄'],
    frameworks: ['7대 원칙'],
    publicImplication: '시사점',
    questions: makeQuestions(id),
    priority: 'none',
    recommendedFor: [],
    reviewedBy: '정구영',
    reviewedAt: '2026-10-17',
    ...overrides,
  };
}

export function makeFeedItem(overrides = {}) {
  return {
    id: 'f-001',
    sourceId: 'mois',
    sourceType: 'gov',
    issuer: '행정안전부',
    date: '2026-10-10',
    title: '보도자료 제목',
    url: 'https://example.go.kr/press/1',
    summaryAi: '한 줄 요약',
    collectedAt: '2026-10-13T06:00:00+09:00',
    promoted: false,
    ...overrides,
  };
}

export function makeSource(overrides = {}) {
  return {
    id: 'mois',
    name: '행정안전부',
    sourceType: 'gov',
    method: 'rss',
    url: 'https://example.go.kr/rss',
    enabled: true,
    ...overrides,
  };
}

export function makeStages() {
  return Array.from({ length: 10 }, (_, i) => ({
    n: i + 1,
    name: `Stage ${i + 1}`,
    nameKo: `단계 ${i + 1}`,
    question: `질문 ${i + 1}?`,
  }));
}

export function makeData(overrides = {}) {
  return {
    library: { items: [makeItem()] },
    feed: { items: [makeFeedItem()] },
    sources: { items: [makeSource()] },
    stages: { items: makeStages() },
    ...overrides,
  };
}
