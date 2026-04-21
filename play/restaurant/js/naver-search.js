// Naver Local Search API via PHP proxy
const PROXY_URL = 'api/proxy.php';
const PAGE_SIZE = 5;

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
  const query = buildSearchQuery(region, foodTypes, filters);
  const start = (page - 1) * PAGE_SIZE + 1;

  const params = new URLSearchParams({
    query,
    display: PAGE_SIZE,
    start,
    sort,
  });

  const res = await fetch(`${PROXY_URL}?${params}`);
  if (!res.ok) throw new Error(`검색 요청 실패: ${res.status}`);

  const data = await res.json();
  if (data.error) throw new Error(data.error);

  const items = (data.items || []).map(normalizeItem);
  const totalCount = data.total || 0;

  // isEnd: got fewer items than requested OR reached Naver's 25-result cap
  const isEnd = items.length < PAGE_SIZE || page >= 5;

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
  const res = await fetch(`${PROXY_URL}?${params}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.items?.[0]?.thumbnail || null;
}

function buildSearchQuery(region, foodTypes, filters) {
  const parts = [];
  if (region) parts.push(region);
  if (foodTypes && foodTypes.length) parts.push(foodTypes.join(' '));
  parts.push('맛집');
  if (filters && filters.length) parts.push(filters.join(' '));
  return parts.join(' ');
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
