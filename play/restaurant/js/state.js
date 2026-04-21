const state = {
  step: 0,
  userGPS: null,
  selectedCity: null,
  selectedDistrict: null,
  selectedDong: null,
  foodTypes: [],
  filters: { ambiance: [], price: null, convenience: [], other: [] },
  results: [],
  totalCount: 0,
  page: 1,
  sortBy: 'accuracy',
  isLoading: false,
  isEnd: false,
  error: null
};

const listeners = [];

export function getState() {
  return { ...state };
}

export function setState(updates) {
  Object.assign(state, updates);
  listeners.forEach(fn => fn({ ...state }));
}

export function subscribe(fn) {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

export function getSearchRegion() {
  const parts = [state.selectedCity, state.selectedDistrict, state.selectedDong].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : null;
}
