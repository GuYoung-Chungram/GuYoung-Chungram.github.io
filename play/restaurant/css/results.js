import { getState, setState } from './state.js';
import { haversineDistance, formatDistance, formatPhone, tm128ToWgs84, showToast } from './utils.js';
import { getFoodTypeEmoji } from './filters.js';

export function renderResults() {
  const { results, totalCount, isEnd, userGPS, sortBy, isLoading, isNearbyMode, filters } = getState();
  const container = document.getElementById('results-list');
  if (!container) return;

  if (isLoading && results.length === 0) {
    container.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>맛집을 찾고 있어요...</p></div>';
    return;
  }

  if (!isLoading && results.length === 0) {
    const emptyMsg = isNearbyMode
      ? '<p>근처 50km 이내에 결과가 없어요</p><p class="empty-sub">지역을 넓히거나 필터를 줄여보세요.</p>'
      : '<p>검색 결과가 없어요</p><p class="empty-sub">필터를 줄이거나 음식 종류와 지역을 바꿔보세요.</p>';
    const hasFilters = hasSelectedFilters(filters);
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🍽️</span>
        ${emptyMsg}
        <div class="empty-actions">
          ${hasFilters ? '<button class="btn-empty-secondary" data-empty-action="filters">필터 줄이기</button>' : ''}
          <button class="btn-empty-secondary" data-empty-action="food">음식 바꾸기</button>
          <button class="btn-retry" data-empty-action="region">지역 다시 선택</button>
        </div>
      </div>`;
    container.querySelector('[data-empty-action="filters"]')?.addEventListener('click', () => window.goToStep?.(3));
    container.querySelector('[data-empty-action="food"]')?.addEventListener('click', () => window.goToStep?.(2));
    container.querySelector('[data-empty-action="region"]')?.addEventListener('click', () => window.goToStep?.(1));
    return;
  }

  const sortedResults = sortResults(results, sortBy, userGPS);
  const header = buildResultsHeader(totalCount, sortBy, isNearbyMode);
  const cards = sortedResults.map((place, idx) => buildCard(place, idx, userGPS));

  container.innerHTML = '';
  container.appendChild(header);
  cards.forEach(card => container.appendChild(card));

  if (!isEnd) {
    container.appendChild(buildLoadMoreBtn());
  }

  const retryBtn = document.createElement('button');
  retryBtn.className = 'btn-new-search';
  retryBtn.textContent = '🔍 다시 검색';
  retryBtn.onclick = () => window.goToStep(1);
  container.appendChild(retryBtn);
}

function sortResults(results, sortBy, userGPS) {
  if (sortBy === 'distance' && userGPS) {
    return [...results].sort((a, b) => {
      const { lat: aLat, lng: aLng } = tm128ToWgs84(a.mapx, a.mapy);
      const { lat: bLat, lng: bLng } = tm128ToWgs84(b.mapx, b.mapy);
      const da = haversineDistance(userGPS.lat, userGPS.lng, aLat, aLng);
      const db = haversineDistance(userGPS.lat, userGPS.lng, bLat, bLng);
      return da - db;
    });
  }
  return results;
}

function buildResultsHeader(totalCount, sortBy, isNearbyMode) {
  const header = document.createElement('div');
  header.className = 'results-header';
  const nearbyBadge = isNearbyMode ? '<span class="nearby-badge">📍 내 주변 50km</span>' : '';
  header.innerHTML = `
    <span class="results-count">${nearbyBadge}총 <strong>${totalCount.toLocaleString()}</strong>개</span>
    <div class="sort-btns">
      <button class="sort-btn ${sortBy === 'accuracy' ? 'active' : ''}" data-sort="accuracy">리뷰순</button>
      <button class="sort-btn ${sortBy === 'distance' ? 'active' : ''}" data-sort="distance">거리순</button>
    </div>`;

  header.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setState({ sortBy: btn.dataset.sort });
      renderResults();
    });
  });

  return header;
}

function buildCard(place, idx, userGPS) {
  const { lat, lng } = tm128ToWgs84(place.mapx, place.mapy);
  const address = place.roadAddress || place.address || '';
  const phone = formatPhone(place.phone);
  const emoji = getFoodTypeEmoji(place.category);
  const categoryShort = place.category?.split('>').pop()?.trim() || '';
  const naviUrl = `https://map.naver.com/p/directions/-/-/${place.mapx},${place.mapy},${encodeURIComponent(place.name)}/-/transit`;
  const mapUrl = place.link || `https://map.naver.com/p/search/${encodeURIComponent(`${place.name} ${address}`)}`;
  const shareText = `${place.name}\n${address}${phone ? `\n${phone}` : ''}\n${mapUrl}`;

  let distanceText = '';
  if (userGPS && lat && lng) {
    const km = haversineDistance(userGPS.lat, userGPS.lng, lat, lng);
    distanceText = formatDistance(km);
  }

  const card = document.createElement('div');
  card.className = 'result-card';
  card.dataset.idx = idx;
  card.dataset.placeId = place.id;

  const imageContent = place.thumbnail
    ? `<img class="card-img" src="${escAttr(place.thumbnail)}" alt="${escAttr(place.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
      + `<span class="card-emoji" style="display:none">${emoji}</span>`
    : `<span class="card-emoji">${emoji}</span>`;

  card.innerHTML = `
    <div class="card-image">
      ${imageContent}
      <span class="card-rank">${idx + 1}</span>
    </div>
    <div class="card-body">
      <div class="card-top">
        <h3 class="card-name">${escHtml(place.name)}</h3>
        ${distanceText ? `<span class="card-distance">${distanceText}</span>` : ''}
      </div>
      ${categoryShort ? `<span class="card-category">${escHtml(categoryShort)}</span>` : ''}
      <p class="card-address" title="${escAttr(address)}"><span aria-hidden="true">📍</span> ${escHtml(address)}</p>
      ${phone ? `<a class="card-phone" href="tel:${phone}"><span aria-hidden="true">📞</span> ${phone}</a>` : '<p class="card-phone card-phone--muted">전화번호 없음</p>'}
      <div class="card-actions">
        <a class="card-action card-action--primary" href="${escAttr(mapUrl)}" target="_blank" rel="noopener">지도</a>
        ${phone ? `<a class="card-action" href="tel:${phone}">전화</a>` : ''}
        <button class="card-action" type="button" data-copy="${escAttr(address)}">주소복사</button>
        <button class="card-action" type="button" data-share="${escAttr(shareText)}">공유</button>
        <a class="card-action" href="${escAttr(naviUrl)}" target="_blank" rel="noopener">길찾기</a>
      </div>
    </div>`;

  card.querySelector('[data-copy]')?.addEventListener('click', async event => {
    await copyText(event.currentTarget.dataset.copy, '주소를 복사했어요.');
  });

  card.querySelector('[data-share]')?.addEventListener('click', async event => {
    const text = event.currentTarget.dataset.share;
    if (navigator.share) {
      try {
        await navigator.share({ title: place.name, text, url: mapUrl });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }
    await copyText(text, '공유할 내용을 복사했어요.');
  });

  return card;
}

function buildLoadMoreBtn() {
  const wrap = document.createElement('div');
  wrap.className = 'load-more-wrap';
  wrap.innerHTML = `<button class="btn-load-more">더 보기</button>`;
  wrap.querySelector('button').addEventListener('click', () => {
    window.loadMoreResults?.();
  });
  return wrap;
}

function escHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escAttr(str) {
  return escHtml(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function hasSelectedFilters(filters) {
  if (!filters) return false;
  return Object.values(filters).some(value => Array.isArray(value) ? value.length > 0 : Boolean(value));
}

async function copyText(text, successMessage) {
  if (!text) {
    showToast('복사할 정보가 없어요.', 'warning');
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage, 'success');
  } catch {
    showToast('복사하지 못했어요. 브라우저 권한을 확인해주세요.', 'error');
  }
}
