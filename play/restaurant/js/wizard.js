import { getState, setState } from './state.js';
import { REGIONS } from '../data/regions.js';
import { FOOD_TYPES_PRIMARY, FOOD_TYPES_SECONDARY, FILTER_GROUPS } from './filters.js';

const STEPS = ['splash', 'region', 'food', 'filters', 'results'];

export function goToStep(step) {
  const prev = getState().step;
  if (step === prev) return;

  const prevEl = document.getElementById(`screen-${STEPS[prev]}`);
  const nextEl = document.getElementById(`screen-${STEPS[step]}`);
  if (!nextEl) return;

  setState({ step });

  if (prevEl) {
    prevEl.classList.add('screen--exit');
    prevEl.addEventListener('transitionend', () => {
      prevEl.classList.remove('screen--active', 'screen--exit');
    }, { once: true });
  }

  nextEl.classList.add('screen--active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  updateProgress(step);
}

function updateProgress(step) {
  const bar = document.getElementById('progress-bar');
  const dots = document.querySelectorAll('.progress-dot');
  if (!bar) return;

  const pct = step === 0 ? 0 : ((step - 1) / 3) * 100;
  bar.style.width = `${pct}%`;

  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i + 1 <= step);
    dot.classList.toggle('current', i + 1 === step);
  });
}

export function renderRegionStep() {
  const container = document.getElementById('region-content');
  if (!container) return;

  container.innerHTML = '';

  const { userGPS } = getState();

  if (userGPS) {
    const nearbyBtn = document.createElement('button');
    nearbyBtn.className = 'btn-nearby';
    nearbyBtn.innerHTML = '📍 내 주변에서 찾기';
    nearbyBtn.addEventListener('click', () => handleNearbyClick(userGPS));
    container.appendChild(nearbyBtn);
  }

  const cityGrid = document.createElement('div');
  cityGrid.className = 'city-grid';

  REGIONS.forEach(region => {
    const cityChip = document.createElement('button');
    cityChip.className = 'city-chip';
    cityChip.textContent = region.name;
    cityChip.addEventListener('click', () => toggleCity(region, cityChip, container));
    cityGrid.appendChild(cityChip);
  });

  container.appendChild(cityGrid);
}

function handleNearbyClick(userGPS) {
  setState({ selectedCity: '내 주변', selectedDistrict: null });
  const { lat, lng } = userGPS;
  setState({ userGPS: { lat, lng } });
  goToStep(2);
  renderFoodStep();
}

function toggleCity(region, chip, container) {
  container.querySelectorAll('.city-chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  setState({ selectedCity: region.name, selectedDistrict: null });

  const existing = container.querySelector('.district-panel');
  if (existing) existing.remove();

  const panel = document.createElement('div');
  panel.className = 'district-panel';

  const hotspotWrap = document.createElement('div');
  hotspotWrap.className = 'district-section';
  hotspotWrap.innerHTML = '<p class="district-label">인기 지역</p>';
  const hotspotGrid = document.createElement('div');
  hotspotGrid.className = 'district-grid';

  region.hotspots.forEach(spot => {
    const btn = document.createElement('button');
    btn.className = 'district-chip hotspot';
    btn.textContent = spot;
    btn.addEventListener('click', () => {
      setState({ selectedDistrict: spot, selectedDong: null });
      showDongInput(panel, spot);
    });
    hotspotGrid.appendChild(btn);
  });
  hotspotWrap.appendChild(hotspotGrid);
  panel.appendChild(hotspotWrap);

  const districtWrap = document.createElement('div');
  districtWrap.className = 'district-section';
  districtWrap.innerHTML = '<p class="district-label">전체 지역</p>';
  const districtGrid = document.createElement('div');
  districtGrid.className = 'district-grid';

  region.districts.forEach(dist => {
    const btn = document.createElement('button');
    btn.className = 'district-chip';
    btn.textContent = dist;
    btn.addEventListener('click', () => {
      setState({ selectedDistrict: dist, selectedDong: null });
      showDongInput(panel, dist);
    });
    districtGrid.appendChild(btn);
  });

  const regionOnlyBtn = document.createElement('button');
  regionOnlyBtn.className = 'btn-region-only';
  regionOnlyBtn.textContent = `${region.name} 전체로 검색`;
  regionOnlyBtn.addEventListener('click', () => {
    setState({ selectedDistrict: null, selectedDong: null });
    goToStep(2);
    renderFoodStep();
  });

  districtWrap.appendChild(districtGrid);
  panel.appendChild(districtWrap);
  panel.appendChild(regionOnlyBtn);
  container.appendChild(panel);

  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

export function renderFoodStep() {
  const container = document.getElementById('food-content');
  if (!container) return;
  const { foodTypes } = getState();

  container.innerHTML = '';

  const primaryGrid = document.createElement('div');
  primaryGrid.className = 'food-grid food-grid--primary';

  FOOD_TYPES_PRIMARY.forEach(ft => {
    const card = buildFoodCard(ft, foodTypes.includes(ft.id), true);
    primaryGrid.appendChild(card);
  });
  container.appendChild(primaryGrid);

  const moreToggle = document.createElement('button');
  moreToggle.className = 'btn-more-food';
  moreToggle.textContent = '+ 더 보기';
  container.appendChild(moreToggle);

  const secondaryPanel = document.createElement('div');
  secondaryPanel.className = 'food-secondary hidden';
  const secondaryGrid = document.createElement('div');
  secondaryGrid.className = 'food-grid food-grid--secondary';

  FOOD_TYPES_SECONDARY.forEach(ft => {
    const card = buildFoodCard(ft, foodTypes.includes(ft.id), false);
    secondaryGrid.appendChild(card);
  });

  secondaryPanel.appendChild(secondaryGrid);
  container.appendChild(secondaryPanel);

  moreToggle.addEventListener('click', () => {
    secondaryPanel.classList.toggle('hidden');
    moreToggle.textContent = secondaryPanel.classList.contains('hidden') ? '+ 더 보기' : '− 접기';
  });
}

function buildFoodCard(ft, isSelected, isPrimary) {
  const card = document.createElement('button');
  card.className = `food-card ${isPrimary ? 'food-card--primary' : 'food-card--secondary'} ${isSelected ? 'selected' : ''}`;
  if (ft.color) card.style.setProperty('--food-color', ft.color);

  card.innerHTML = `
    <span class="food-emoji">${ft.emoji}</span>
    <span class="food-label">${ft.label}</span>
    ${ft.desc ? `<span class="food-desc">${ft.desc}</span>` : ''}`;

  card.addEventListener('click', () => {
    const { foodTypes } = getState();
    const updated = foodTypes.includes(ft.id)
      ? foodTypes.filter(f => f !== ft.id)
      : [...foodTypes, ft.id];
    setState({ foodTypes: updated });
    card.classList.toggle('selected', updated.includes(ft.id));
  });

  return card;
}

export function renderFilterStep() {
  const container = document.getElementById('filter-content');
  if (!container) return;
  const { filters } = getState();

  container.innerHTML = '';

  FILTER_GROUPS.forEach(group => {
    const section = document.createElement('div');
    section.className = 'filter-group';
    section.innerHTML = `<p class="filter-group-label">${group.icon} ${group.label}</p>`;
    const chips = document.createElement('div');
    chips.className = 'filter-chips';

    group.options.forEach(opt => {
      const isActive = group.id === 'price'
        ? filters.price === opt
        : (filters[group.id] || []).includes(opt);

      const chip = document.createElement('button');
      chip.className = `filter-chip ${isActive ? 'active' : ''}`;
      chip.textContent = opt;

      chip.addEventListener('click', () => {
        const { filters: f } = getState();
        let updated;
        if (group.id === 'price') {
          updated = { ...f, price: f.price === opt ? null : opt };
        } else {
          const arr = f[group.id] || [];
          updated = {
            ...f,
            [group.id]: arr.includes(opt) ? arr.filter(x => x !== opt) : [...arr, opt]
          };
        }
        setState({ filters: updated });
        chip.classList.toggle('active',
          group.id === 'price' ? updated.price === opt : updated[group.id].includes(opt)
        );
      });

      chips.appendChild(chip);
    });

    section.appendChild(chips);
    container.appendChild(section);
  });
}

function showDongInput(panel, districtName) {
  const existing = panel.querySelector('.dong-input-wrap');
  if (existing) existing.remove();

  const wrap = document.createElement('div');
  wrap.className = 'dong-input-wrap';
  wrap.innerHTML = `
    <p class="district-label">동/읍/면 입력 <span class="dong-optional">(선택사항)</span></p>
    <div class="dong-row">
      <input class="dong-input" type="text" placeholder="${districtName} 내 동명 입력..." maxlength="20" />
      <button class="btn-dong-next">다음 →</button>
    </div>`;

  const input = wrap.querySelector('.dong-input');
  const nextBtn = wrap.querySelector('.btn-dong-next');

  input.addEventListener('input', () => {
    setState({ selectedDong: input.value.trim() || null });
  });

  nextBtn.addEventListener('click', () => { goToStep(2); renderFoodStep(); });
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { goToStep(2); renderFoodStep(); } });

  panel.appendChild(wrap);
  wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  input.focus();
}

export function getBackStep(currentStep) {
  return Math.max(1, currentStep - 1);
}
