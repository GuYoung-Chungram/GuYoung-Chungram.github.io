// Naver Local Search API via PHP proxy
const PROXY_URL = 'api/proxy.php';
const PAGE_SIZE = 5;

// 더보기마다 다른 검색어 변형을 사용해 새로운 결과를 가져옴
const QUERY_VARIANTS = ['맛집', '식당', '음식점', '맛있는곳', '추천맛집'];

/**
 * Search restaurants via Naver Local Search API.
 * @param {object} opts
 * @param {string} opts.region     - 지역명 (e.g. "강남구 역삼동")
 * @param {string[]} opts.foodTypes - 음식 종류 배열
 * @param {string[]} opts.filters   - 필터 키워드 배열
 * @param {number} opts.page        - 1-based page (max 5)
 * @param {string} [opts.sort]      - 'comment' | 'random'
 * @returns {Promise<{ places: object[], totalCount: number, isEnd: boolean }>}
 */
export async function searchRestaurants({ region, foodTypes, filters, page = 1, sort = 'comment' }) {
  // page 1은 기본 쿼리, 더보기(page 2+)는 다른 검색어 변형 사용
  const variantIndex = page - 1;
  const query = buildSearchQuery(region, foodTypes, filters, variantIndex);
  // 쿼리 변형 방식이므로 start는 항상 1
  const start = 1;

  const params = new URLSearchParams({
    query,
    display: PAGE_SIZE,
    start,
    sort,
  });

  const res = await fetch(`${PROXY_URL}?${params}`);
  if (!res.ok) throw new Error(`검색 요청 실패: ${res.status}`);

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error('서버 응답 오류 — 잠시 후 다시 시도해주세요');
  }
  if (data.error) throw new Error(data.error);

  const items = (data.items || []).map(normalizeItem);
  const totalCount = data.total || 0;

  // isEnd: 결과 부족 또는 변형 쿼리를 모두 소진
  const isEnd = items.length < PAGE_SIZE || page >= QUERY_VARIANTS.length;

  // Fetch thumbnails in parallel (best-effort, failures silently skipped)
  const thumbResults = await Promise.allSettled(items.map(p => fetchThumbnail(p.name, p.category)));
  thumbResults.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value) items[i].thumbnail = r.value;
  });

  return { places: items, totalCount, isEnd };
}

async function fetchThumbnail(name, category) {
  const query = `${name} ${category || ''}`.trim();
  const params = new URLSearchParams({ action: 'image', query });
  try {
    const res = await fetch(`${PROXY_URL}?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.items?.[0]?.thumbnail || null;
  } catch {
    return null;
  }
}

function buildSearchQuery(region, foodTypes, filters, variantIndex = 0) {
  const variant = QUERY_VARIANTS[variantIndex % QUERY_VARIANTS.length];
  const filterKeywords = normalizeFilters(filters);
  const parts = [];
  if (region) parts.push(region);
  if (foodTypes && foodTypes.length) parts.push(foodTypes.join(' '));
  parts.push(variant);
  if (filterKeywords.length) parts.push(filterKeywords.join(' '));
  return parts.join(' ');
}

function normalizeFilters(filters) {
  if (!filters) return [];
  if (Array.isArray(filters)) return filters.filter(Boolean);

  return Object.values(filters)
    .flatMap(value => Array.isArray(value) ? value : [value])
    .filter(Boolean);
}

function normalizeItem(item) {
  return {
    id: item.link || item.title,
    name: stripHtml(item.title),
    category: item.category || '',
    roadAddress: item.roadAddress || item.address || '',
    address: item.address || '',
    phone: item.telephone || '',
    link: item.link || '',
    mapx: item.mapx ? parseInt(item.mapx, 10) : 0,
    mapy: item.mapy ? parseInt(item.mapy, 10) : 0,
    thumbnail: null,
  };
}

function stripHtml(str) {
  return str.replace(/<[^>]*>/g, '');
}
