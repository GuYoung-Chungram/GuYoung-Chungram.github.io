export const FOOD_TYPES_PRIMARY = [
  { id: '한식', label: '한식', emoji: '🍚', desc: '비빔밥·국밥·찌개', color: '#E8470A' },
  { id: '중식', label: '중식', emoji: '🥢', desc: '짜장·짬뽕·마라탕', color: '#D4881A' },
  { id: '일식', label: '일식', emoji: '🍣', desc: '초밥·라멘·우동', color: '#2D6A8A' },
  { id: '분식', label: '분식', emoji: '🍢', desc: '떡볶이·순대·튀김', color: '#7B4F9E' }
];

export const FOOD_TYPES_SECONDARY = [
  { id: '양식', label: '양식', emoji: '🍝', desc: '파스타·피자·스테이크' },
  { id: '카페·디저트', label: '카페·디저트', emoji: '☕', desc: '카페·케이크·빙수' },
  { id: '술집·포차', label: '술집·포차', emoji: '🍺', desc: '포차·이자카야·펍' },
  { id: '고기구이', label: '고기구이', emoji: '🥩', desc: '삼겹살·갈비·불고기' },
  { id: '해산물', label: '해산물', emoji: '🦐', desc: '회·조개·해물찜' },
  { id: '채식·비건', label: '채식·비건', emoji: '🥗', desc: '샐러드·두부·곡물' },
  { id: '패스트푸드', label: '패스트푸드', emoji: '🍔', desc: '버거·치킨·피자' },
  { id: '베이커리', label: '베이커리', emoji: '🥐', desc: '빵·샌드위치·크로아상' }
];

export const FILTER_GROUPS = [
  {
    id: 'ambiance',
    label: '분위기',
    icon: '✨',
    multi: true,
    options: ['데이트', '가족 외식', '회식', '혼밥 가능', '단체석']
  },
  {
    id: 'price',
    label: '가격대',
    icon: '💰',
    multi: false,
    options: ['~1만원', '1~2만원', '2~3만원', '3만원+']
  },
  {
    id: 'convenience',
    label: '편의',
    icon: '🅿️',
    multi: true,
    options: ['주차 가능', '예약 가능', '포장 가능', '배달 가능']
  },
  {
    id: 'other',
    label: '기타',
    icon: '🌿',
    multi: true,
    options: ['24시간', '야외석', '반려동물 동반']
  }
];

const KEYWORD_MAP = {
  '데이트': '데이트',
  '가족 외식': '가족',
  '회식': '회식',
  '혼밥 가능': '혼밥',
  '단체석': '단체',
  '주차 가능': '주차',
  '예약 가능': '예약',
  '포장 가능': '포장',
  '배달 가능': '배달',
  '~1만원': '저렴한',
  '1~2만원': '',
  '2~3만원': '',
  '3만원+': '고급',
  '24시간': '24시간',
  '야외석': '야외',
  '반려동물 동반': '펫'
};

export function buildQuery(region, foodTypes, filters) {
  const parts = [region, ...foodTypes, '맛집'];

  const allSelected = [
    ...(filters.ambiance || []),
    ...(filters.price ? [filters.price] : []),
    ...(filters.convenience || []),
    ...(filters.other || [])
  ];

  allSelected.forEach(v => {
    const kw = KEYWORD_MAP[v];
    if (kw) parts.push(kw);
  });

  return parts.join(' ');
}

export function getFoodTypeColor(foodTypeName) {
  const found = FOOD_TYPES_PRIMARY.find(f => f.id === foodTypeName);
  return found ? found.color : '#E8470A';
}

export function getFoodTypeEmoji(categoryName) {
  const lc = categoryName?.toLowerCase() || '';
  if (lc.includes('한식')) return '🍚';
  if (lc.includes('중식') || lc.includes('중국')) return '🥢';
  if (lc.includes('일식') || lc.includes('일본') || lc.includes('초밥') || lc.includes('라멘')) return '🍣';
  if (lc.includes('분식')) return '🍢';
  if (lc.includes('양식') || lc.includes('이탈리아') || lc.includes('피자') || lc.includes('파스타')) return '🍝';
  if (lc.includes('카페') || lc.includes('디저트') || lc.includes('베이커리')) return '☕';
  if (lc.includes('고기') || lc.includes('삼겹') || lc.includes('갈비') || lc.includes('구이')) return '🥩';
  if (lc.includes('해산물') || lc.includes('회') || lc.includes('조개')) return '🦐';
  if (lc.includes('치킨') || lc.includes('버거') || lc.includes('패스트')) return '🍗';
  if (lc.includes('술') || lc.includes('이자카야') || lc.includes('포차')) return '🍺';
  return '🍽️';
}
