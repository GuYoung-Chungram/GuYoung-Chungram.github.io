// 하루 브이로그 IndexedDB 저장소 (모든 사진과 영상은 사용자의 폰 안에만 저장)
const DB_NAME = 'HaruVlogDB';
const DB_VERSION = 1;

// 미리 정한 8색 (S-3: 명암비 7:1 이상 흰 글씨 가독성 보장 딥 톤 팔레트)
const PROFILE_COLORS = [
  { id: 'navy', name: '남색', hex: '#1E3A5F' },
  { id: 'forest', name: '초록', hex: '#1B4D3E' },
  { id: 'burgundy', name: '자주', hex: '#6B1D2F' },
  { id: 'plum', name: '보라', hex: '#4A255A' },
  { id: 'brown', name: '밤색', hex: '#5A381E' },
  { id: 'teal', name: '청록', hex: '#134E4A' },
  { id: 'indigo', name: '쪽빛', hex: '#283593' },
  { id: 'charcoal', name: '먹색', hex: '#263238' }
];

// 9장의 사용법 안내 카드 (첫 카드는 '오늘의 브이로그 시작하기'로 구성)
const GUIDE_CARDS = [
  {
    step: 1,
    emoji: '🎬',
    title: '오늘의 브이로그 시작하기',
    desc: '오늘 눈에 띄는 순간을 한 컷씩 찍으면,\n그날의 브이로그 영상으로 자동 완성됩니다.'
  },
  {
    step: 2,
    emoji: '🐕',
    title: '반려동물의 하루',
    desc: '밥 먹는 모습, 산책하는 모습을 한 컷씩 남기면\n우리 집 강아지의 하루가 됩니다.'
  },
  {
    step: 3,
    emoji: '📒',
    title: '날짜별 기억 노트',
    desc: '오늘 무엇을 했는지 한 컷씩 남기고, 내일 다시 꺼내 보세요.\n기억을 되짚는 데 도움이 되는 좋은 습관이 됩니다.'
  },
  {
    step: 4,
    emoji: '😊',
    title: '웃음 표시 달력',
    desc: '찍은 날에는 달력에 웃음 표시가 붙습니다.\n한 달이 모이면 일기가 되고, 몇 해가 모이면 자서전이 됩니다.'
  },
  {
    step: 5,
    emoji: '🤝',
    title: '오늘 만난 사람들',
    desc: '만난 분과 함께 한 컷. 이름을 글로 넣어 두면 기억하기 쉽습니다.\n※ 함께 찍어도 되는지 먼저 여쭤보세요.'
  },
  {
    step: 6,
    emoji: '🍚',
    title: '오늘 먹은 것',
    desc: '아침, 점심, 저녁 밥상을 한 컷씩 남겨 보세요.\n따뜻한 식사 기록이 쌓입니다.'
  },
  {
    step: 7,
    emoji: '🌳',
    title: '오늘 걸은 길',
    desc: '산책길의 나무, 꽃, 하늘을 걸으면서\n눈에 띄는 순간을 한 컷씩 남겨 보세요.'
  },
  {
    step: 8,
    emoji: '🍲',
    title: '다녀온 음식점',
    desc: '간판과 음식을 찍어 두면\n다음에 다시 찾아가기 쉽습니다.'
  },
  {
    step: 9,
    emoji: '📖',
    title: '좋은 글귀 한 줄',
    desc: '책을 읽다 마음에 드는 문장을 찍어 두세요.\n영상에서 2초 동안 선명하게 보입니다.'
  }
];

const DEFAULT_SETTINGS = {
  id: 'user_settings',
  profilePhoto: null, // DataURL
  name: '정구영',
  themeColor: '#1E3A5F',
  notifyInterval: '3h', // '1h' | '3h' | 'off' (기본값 3시간마다, S-4)
  useLocalTimezone: true, // S-5 기본값 켬
  fixedTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul',
  backupEmail: '',
  backupEmailVerified: false,
  fontSize: 'larger', // 'large' (크게) | 'larger' (더 크게, 기본값 S-7) | 'largest' (가장 크게)
  isProfileSetupDone: false, // 처음 연결 시 내 설정 화면을 먼저 보여주고 완료 후 오늘의 브이로그 시작하기로 이동
  hasSeenGuide: true,
  cameraPermissionExplained: false,
  lastMidnightCheckDate: null,
  pendingMorningNotice: null
};

class HaruDB {
  constructor() {
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cuts')) {
          const cutStore = db.createObjectStore('cuts', { keyPath: 'id' });
          cutStore.createIndex('dateStr', 'dateStr', { unique: false });
          cutStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        if (!db.objectStoreNames.contains('days')) {
          db.createObjectStore('days', { keyPath: 'dateStr' });
        }
        if (!db.objectStoreNames.contains('emailLogs')) {
          db.createObjectStore('emailLogs', { keyPath: 'id' });
        }
      };
      req.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async getSettings() {
    await this.init();
    return new Promise((resolve) => {
      const tx = this.db.transaction('settings', 'readonly');
      const req = tx.objectStore('settings').get('user_settings');
      req.onsuccess = () => {
        resolve({ ...DEFAULT_SETTINGS, ...(req.result || {}) });
      };
      req.onerror = () => resolve({ ...DEFAULT_SETTINGS });
    });
  }

  async saveSettings(partial) {
    const current = await this.getSettings();
    const updated = { ...current, ...partial, id: 'user_settings' };
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('settings', 'readwrite');
      tx.objectStore('settings').put(updated);
      tx.oncomplete = () => resolve(updated);
      tx.onerror = (e) => reject(e.target.error);
    });
  }

  async addCut(cut) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('cuts', 'readwrite');
      tx.objectStore('cuts').put(cut);
      tx.oncomplete = () => resolve(cut);
      tx.onerror = (e) => reject(e.target.error);
    });
  }

  async updateCut(id, updates) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('cuts', 'readwrite');
      const store = tx.objectStore('cuts');
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        if (!getReq.result) return resolve(null);
        const updated = { ...getReq.result, ...updates };
        store.put(updated);
        tx.oncomplete = () => resolve(updated);
      };
      getReq.onerror = (e) => reject(e.target.error);
    });
  }

  async deleteCut(id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('cuts', 'readwrite');
      tx.objectStore('cuts').delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => reject(e.target.error);
    });
  }

  async deleteCutsByDate(dateStr) {
    const cuts = await this.getCutsByDate(dateStr);
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('cuts', 'readwrite');
      const store = tx.objectStore('cuts');
      cuts.forEach((c) => store.delete(c.id));
      tx.oncomplete = () => resolve(cuts.length);
      tx.onerror = (e) => reject(e.target.error);
    });
  }

  async getCutsByDate(dateStr) {
    await this.init();
    return new Promise((resolve) => {
      const tx = this.db.transaction('cuts', 'readonly');
      const idx = tx.objectStore('cuts').index('dateStr');
      const req = idx.getAll(IDBKeyRange.only(dateStr));
      req.onsuccess = () => {
        const list = req.result || [];
        // 찍은 시각 순으로 정렬 (P-5, 4장)
        list.sort((a, b) => a.timestamp - b.timestamp);
        resolve(list);
      };
      req.onerror = () => resolve([]);
    });
  }

  async getAllCuts() {
    await this.init();
    return new Promise((resolve) => {
      const tx = this.db.transaction('cuts', 'readonly');
      const req = tx.objectStore('cuts').getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }

  async getDayRecord(dateStr) {
    await this.init();
    return new Promise((resolve) => {
      const tx = this.db.transaction('days', 'readonly');
      const req = tx.objectStore('days').get(dateStr);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }

  async saveDayRecord(dayObj) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('days', 'readwrite');
      tx.objectStore('days').put(dayObj);
      tx.oncomplete = () => resolve(dayObj);
      tx.onerror = (e) => reject(e.target.error);
    });
  }

  async addEmailLog(log) {
    await this.init();
    return new Promise((resolve) => {
      const tx = this.db.transaction('emailLogs', 'readwrite');
      tx.objectStore('emailLogs').put(log);
      tx.oncomplete = () => resolve(log);
    });
  }

  async getEmailLogs() {
    await this.init();
    return new Promise((resolve) => {
      const tx = this.db.transaction('emailLogs', 'readonly');
      const req = tx.objectStore('emailLogs').getAll();
      req.onsuccess = () => {
        const list = req.result || [];
        list.sort((a, b) => b.sentAt - a.sentAt);
        resolve(list);
      };
      req.onerror = () => resolve([]);
    });
  }

  // 용량 관리 (10장: 앱이 쓰는 용량 계산)
  async estimateStorage() {
    const cuts = await this.getAllCuts();
    let bytes = 0;
    for (const c of cuts) {
      if (c.imageDataUrl) bytes += c.imageDataUrl.length * 0.75;
      if (c.audioDataUrl) bytes += c.audioDataUrl.length * 0.75;
    }
    let quotaMB = null;
    let availMB = null;
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        if (est.quota) {
          quotaMB = Math.round(est.quota / (1024 * 1024));
          availMB = Math.round((est.quota - (est.usage || bytes)) / (1024 * 1024));
        }
      } catch (_) {}
    }
    return {
      cutCount: cuts.length,
      usedMB: (bytes / (1024 * 1024)).toFixed(2),
      availMB,
      lowSpace: availMB !== null && availMB < 1024
    };
  }
}

// 긴 변 1280픽셀, JPEG 압축 (6장 사진 용량 규칙: 한 장당 약 0.2~0.3MB)
async function resizeAndCompressImage(sourceImgOrCanvas, maxEdge = 1280, quality = 0.82) {
  return new Promise((resolve) => {
    const origW = sourceImgOrCanvas.videoWidth || sourceImgOrCanvas.naturalWidth || sourceImgOrCanvas.width || 1280;
    const origH = sourceImgOrCanvas.videoHeight || sourceImgOrCanvas.naturalHeight || sourceImgOrCanvas.height || 720;
    let targetW = origW;
    let targetH = origH;

    if (origW >= origH && origW > maxEdge) {
      targetW = maxEdge;
      targetH = Math.round((origH / origW) * maxEdge);
    } else if (origH > origW && origH > maxEdge) {
      targetH = maxEdge;
      targetW = Math.round((origW / origH) * maxEdge);
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(sourceImgOrCanvas, 0, 0, targetW, targetH);

    const orientation = targetW >= targetH ? 'landscape' : 'portrait';
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    resolve({
      dataUrl,
      width: targetW,
      height: targetH,
      orientation
    });
  });
}

window.HaruDB = new HaruDB();
window.PROFILE_COLORS = PROFILE_COLORS;
window.GUIDE_CARDS = GUIDE_CARDS;
window.resizeAndCompressImage = resizeAndCompressImage;

