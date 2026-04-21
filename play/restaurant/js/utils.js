export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

export function tm128ToWgs84(mx, my) {
  return { lat: my / 1e7, lng: mx / 1e7 };
}

export function formatPhone(phone) {
  if (!phone) return null;
  return phone.replace(/(\d{2,3})(\d{3,4})(\d{4})/, '$1-$2-$3');
}

export function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast toast--${type} toast--show`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('toast--show');
  }, 3000);
}

export function showBanner(message, type = 'warning') {
  const banner = document.getElementById('banner');
  if (!banner) return;
  banner.textContent = message;
  banner.className = `banner banner--${type} banner--show`;
}

export function hideBanner() {
  const banner = document.getElementById('banner');
  if (banner) banner.classList.remove('banner--show');
}

export function el(tag, attrs = {}, ...children) {
  const elem = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'className') elem.className = v;
    else if (k === 'innerHTML') elem.innerHTML = v;
    else if (k.startsWith('on')) elem.addEventListener(k.slice(2).toLowerCase(), v);
    else elem.setAttribute(k, v);
  });
  children.flat().forEach(child => {
    if (typeof child === 'string') elem.appendChild(document.createTextNode(child));
    else if (child) elem.appendChild(child);
  });
  return elem;
}

export function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
