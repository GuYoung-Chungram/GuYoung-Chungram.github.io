import { searchRestaurants } from './naver-search.js';
import { getState, setState, getSearchRegion } from './state.js';
import { goToStep, renderRegionStep, renderFoodStep, renderFilterStep, getBackStep } from './wizard.js';
import { renderResults } from './results.js';
import { showToast, showBanner } from './utils.js';

window.goToStep = goToStep;

async function init() {
  bindNavButtons();
  acquireGPS();

  document.getElementById('btn-splash-start')?.addEventListener('click', () => {
    goToStep(1);
    renderRegionStep();
  });
}

async function acquireGPS() {
  if (!navigator.geolocation) {
    showBanner('위치 정보를 지원하지 않는 브라우저입니다. 지역을 직접 선택해주세요.', 'warning');
    return;
  }
  try {
    const pos = await new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      })
    );
    setState({ userGPS: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
  } catch {
    showBanner('📍 위치 정보 없이 계속합니다. 지역을 직접 선택해주세요.', 'info');
  }
}

function bindNavButtons() {
  document.querySelectorAll('[data-next]').forEach(btn => {
    btn.addEventListener('click', () => handleNext(parseInt(btn.dataset.next, 10)));
  });

  document.querySelectorAll('[data-back]').forEach(btn => {
    btn.addEventListener('click', () => {
      const { step } = getState();
      goToStep(getBackStep(step));
      if (step - 1 === 2) renderFoodStep();
      if (step - 1 === 3) renderFilterStep();
    });
  });

  document.getElementById('btn-skip-filters')?.addEventListener('click', () => handleSearch());
  document.getElementById('btn-apply-filters')?.addEventListener('click', () => handleSearch());
}

function handleNext(step) {
  const { foodTypes, selectedCity } = getState();

  if (step === 2 && !selectedCity) {
    showToast('지역을 선택해주세요.', 'warning');
    return;
  }
  if (step === 3 && foodTypes.length === 0) {
    showToast('음식 종류를 하나 이상 선택해주세요.', 'warning');
    return;
  }

  goToStep(step);
  if (step === 2) renderFoodStep();
  if (step === 3) renderFilterStep();
  if (step === 4) handleSearch();
}

async function handleSearch(isLoadMore = false) {
  const { foodTypes, filters, page } = getState();
  const region = getSearchRegion();

  if (!region) { showToast('지역을 선택해주세요.', 'warning'); return; }
  if (foodTypes.length === 0) { showToast('음식 종류를 선택해주세요.', 'warning'); return; }

  setState({ isLoading: true, error: null });

  if (!isLoadMore) {
    setState({ results: [], page: 1, totalCount: 0, isEnd: false });
    goToStep(4);
    renderResults();
  }

  try {
    const { places, totalCount, isEnd } = await searchRestaurants({
      region,
      foodTypes,
      filters,
      page: isLoadMore ? page : 1,
      sort: 'comment'
    });

    const prev = getState().results;
    setState({
      results: isLoadMore ? [...prev, ...places] : places,
      totalCount,
      isEnd,
      page: isLoadMore ? page + 1 : 2,
      isLoading: false
    });
  } catch (err) {
    setState({ isLoading: false, error: err.message });
    showToast(`오류: ${err.message}`, 'error');
  }

  renderResults();
}

window.loadMoreResults = () => handleSearch(true);

document.addEventListener('DOMContentLoaded', init);
