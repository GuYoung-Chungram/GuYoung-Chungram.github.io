import { getState, setState } from './state.js';
import { haversineDistance, formatDistance, formatPhone, tm128ToWgs84, showToast } from './utils.js';
import { getFoodTypeEmoji } from './filters.js';

export function renderResults() {
  const { results, totalCount, isEnd, userGPS, sortBy, isLoading } = getState();
  const container = document.getElementById('results-list');
  if (!container) return;

  if (isLoading && results.length === 0) {
    container.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>맛집을 찾고 있어요...</p></div>';
    return;
  }

  if (!isLoading && results.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🍽️</span>
        <p>검색 결과가 없어요</p>
        <p class="empty-sub">필터를 줄이거나 다른 지역을 선택해보세요</p>
        <button class="btn-retry" onclick="window.goToStep(1)">다시 검색</button>
      </div>`;
    return;
  }

  const sortedResults = sortResults(results, sortBy, userGPS);
  const header = buildResultsHeader(totalCount, sortBy);
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

function buildResultsHeader(totalCount, sortBy) {
  const header = document.createElement('div');
  header.className = 'results-header';
  header.innerHTML = `
    <span class="results-count">총 <strong>${totalCount.toLocaleString()}</strong>개</span>
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
    ? `<img class="card-img" src="${escHtml(place.thumbnail)}" alt="${escHtml(place.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
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
      <p class="card-address">📍 ${escHtml(address)}</p>
      ${phone ? `<a class="card-phone" href="tel:${phone}">📞 ${phone}</a>` : ''}
      <div class="card-actions">
        <a class="btn-navi" href="${naviUrl}" target="_blank" rel="noopener">길찾기</a>
        ${place.link ? `<a class="btn-review" href="${escHtml(place.link)}" target="_blank" rel="noopener">리뷰 보기</a>` : ''}
      </div>
    </div>`;

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
