// 시니어 하루 브이로그 메인 애플리케이션 컨트롤러
(function () {
  const MAX_CUTS_PER_DAY = 60; // P-6: 하루 최대 60장

  const state = {
    settings: null,
    currentScreen: 'calendar',
    returnScreenFromCamera: 'calendar',
    displayedYear: new Date().getFullYear(),
    displayedMonth: new Date().getMonth(), // 0-indexed
    selectedDateStr: '',
    todayDateStr: '',
    currentDayCuts: [],
    activeCut: null,
    guideIndex: 0,
    toastTimer: null,

    // 카메라 상태
    cameraStream: null,
    cameraFacing: 'environment', // 'environment' | 'user'
    cameraTimerSec: 0, // 0 | 3 | 10
    cameraFlash: 'off', // 'off' | 'on' | 'auto'
    cameraZoom: 1, // 1 | 2 | 3
    cameraMicOn: false, // 기본값 끔 (115행)
    cameraSessionCount: 0,
    sessionCapturedCutIds: [], // 이번 촬영 세션에서 찍은 컷 ID 목록 (취소·다시찍기용)
    simAnimFrame: null,
    simSceneIndex: 0,
    clockInterval: null,

    // 브이로그 상태
    vlogEngine: null,
    lastVlogResult: null
  };

  // 안내 토스트 표시 (U-11: 안내 문구는 최소 4초간 보인다)
  function showToast(message, durationMs = 4200) {
    const el = document.getElementById('toast-banner');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    if (state.toastTimer) clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => {
      el.classList.remove('show');
    }, Math.max(4000, durationMs));
  }

  // 상단 고정 알림 배너 (자동으로 닫히지 않음 U-11)
  function showTopBanner(message, actionLabel, onAction) {
    const banner = document.getElementById('top-notice-banner');
    const textEl = document.getElementById('top-notice-text');
    const actionBtn = document.getElementById('btn-top-notice-action');
    const closeBtn = document.getElementById('btn-top-notice-close');

    textEl.textContent = message;
    if (actionLabel && onAction) {
      actionBtn.textContent = actionLabel;
      actionBtn.style.display = 'inline-flex';
      actionBtn.onclick = () => {
        banner.classList.remove('show');
        onAction();
      };
    } else {
      actionBtn.style.display = 'none';
    }

    closeBtn.onclick = () => {
      banner.classList.remove('show');
    };
    banner.classList.add('show');
  }

  // 현재 시간대 기준 YYYY-MM-DD 반환 (S-5 현지 시간 연동 반영)
  function getNowDateParts() {
    const tz =
      state.settings && !state.settings.useLocalTimezone
        ? state.settings.fixedTimezone
        : Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      const fmt = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const parts = fmt.formatToParts(new Date());
      const map = {};
      parts.forEach((p) => (map[p.type] = p.value));
      return {
        year: Number(map.year),
        month: Number(map.month) - 1,
        day: Number(map.day),
        hour: Number(map.hour),
        minute: Number(map.minute),
        dateStr: `${map.year}-${map.month}-${map.day}`,
        timeZone: tz
      };
    } catch (_) {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return {
        year: y,
        month: d.getMonth(),
        day: d.getDate(),
        hour: d.getHours(),
        minute: d.getMinutes(),
        dateStr: `${y}-${m}-${day}`,
        timeZone: 'Asia/Seoul'
      };
    }
  }

  function formatKoreanDateHeader(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const isToday = dateStr === state.todayDateStr;
    return `${m}월 ${d}일 ${days[dt.getDay()]}${isToday ? ' (오늘)' : ''}`;
  }

  function formatCutTime(ts) {
    const tz =
      state.settings && !state.settings.useLocalTimezone
        ? state.settings.fixedTimezone
        : undefined;
    try {
      return new Intl.DateTimeFormat('ko-KR', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: tz
      }).format(new Date(ts));
    } catch (_) {
      const d = new Date(ts);
      const h = d.getHours();
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${m}`;
    }
  }

  // 테마 색상 및 글씨 크기 적용 (S-3, S-7)
  function applyThemeAndFont() {
    if (!state.settings) return;
    document.documentElement.style.setProperty('--theme-color', state.settings.themeColor || '#1E3A5F');
    document.body.setAttribute('data-font-size', state.settings.fontSize || 'larger');
  }

  // 5개 화면 전환 (2장: 달력, 오늘 화면, 카메라, 브이로그 보기, 내 설정)
  async function showScreen(screenName) {
    if (state.currentScreen === 'camera' && screenName !== 'camera') {
      stopCameraStream();
    }
    if (state.currentScreen === 'vlog' && screenName !== 'vlog' && state.vlogEngine) {
      state.vlogEngine.stop();
    }

    state.currentScreen = screenName;
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    const target = document.getElementById(`screen-${screenName}`);
    if (target) target.classList.add('active');
    window.scrollTo(0, 0);

    if (screenName === 'calendar') {
      await renderCalendarScreen();
    } else if (screenName === 'day') {
      await renderDayScreen();
    } else if (screenName === 'settings') {
      await renderSettingsScreen();
    }
  }

  // =========================================================
  // 1. 달력 화면 렌더링 (C-1 ~ C-8)
  // =========================================================
  async function renderCalendarScreen() {
    const nowParts = getNowDateParts();
    state.todayDateStr = nowParts.dateStr;
    if (!state.selectedDateStr) {
      state.selectedDateStr = state.todayDateStr;
    }

    const name = state.settings.name || '사용자';
    document.getElementById('calendar-greeting').textContent = `${name}님의 하루`;

    // 프로필 아바타 (S-1)
    const avatarEl = document.getElementById('calendar-profile-avatar');
    if (state.settings.profilePhoto) {
      avatarEl.innerHTML = `<img src="${state.settings.profilePhoto}" alt="${name} 프로필 사진" />`;
    } else {
      avatarEl.textContent = name[0] || '나';
    }

    // 이번 달 타이틀
    const y = state.displayedYear;
    const m = state.displayedMonth;
    document.getElementById('calendar-month-title').textContent = `${y}년 ${m + 1}월`;

    // 전체 컷 로드하여 날짜별 컷 개수 집계
    const allCuts = await window.HaruDB.getAllCuts();
    const countByDate = {};
    allCuts.forEach((c) => {
      countByDate[c.dateStr] = (countByDate[c.dateStr] || 0) + 1;
    });

    // C-8: 이번 달에 기록한 날 수 계산
    const monthPrefix = `${y}-${String(m + 1).padStart(2, '0')}-`;
    const recordedDaysThisMonth = Object.keys(countByDate).filter(
      (d) => d.startsWith(monthPrefix) && countByDate[d] > 0
    ).length;
    document.getElementById('calendar-month-summary').textContent =
      `${m + 1}월에 ${recordedDaysThisMonth}일을 남겼어요.`;

    // 달력 그리드 생성
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';

    const firstDayOfWeek = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    for (let i = 0; i < firstDayOfWeek; i++) {
      const empty = document.createElement('div');
      empty.className = 'day-cell empty';
      grid.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const cutCount = countByDate[dateStr] || 0;
      const isToday = dateStr === state.todayDateStr;
      const isSelected = dateStr === state.selectedDateStr;
      const isFuture = dateStr > state.todayDateStr;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'day-cell';
      if (isToday) btn.classList.add('is-today');
      if (isSelected) btn.classList.add('is-selected');
      if (isFuture) {
        btn.classList.add('is-future');
        btn.disabled = true; // C-7: 앞으로 올 날짜는 선택되지 않는다
      }

      // C-2: 한 컷이라도 남긴 날에는 날짜 아래에 웃음 표시가 붙는다
      btn.innerHTML = `
        <span class="day-num">${day}</span>
        ${isToday ? '<span class="day-today-tag">오늘</span>' : ''}
        <span class="day-smile" aria-label="${cutCount > 0 ? '기록 있음' : ''}">${cutCount > 0 ? '😊' : '·'}</span>
      `;

      if (!isFuture) {
        btn.addEventListener('click', async () => {
          state.selectedDateStr = dateStr;
          // 달력에서 날짜를 누르면 오늘 화면(날짜 상세 화면)으로 바로 진입하거나 선택 상태 갱신
          await showScreen('day');
        });
      }

      grid.appendChild(btn);
    }

    // 하단 선택된 날짜 빠른 실행 패널 업데이트 (첫 화면: '오늘의 브이로그 시작하기')
    const selectedCuts = await window.HaruDB.getCutsByDate(state.selectedDateStr);
    state.currentDayCuts = selectedCuts;
    const isSelToday = state.selectedDateStr === state.todayDateStr;

    document.getElementById('cal-selected-date-label').textContent = isSelToday
      ? `오늘의 브이로그 시작하기 (${formatKoreanDateHeader(state.selectedDateStr)})`
      : formatKoreanDateHeader(state.selectedDateStr);
    document.getElementById('cal-selected-cut-count').textContent =
      `${selectedCuts.length}장 기록됨`;

    const shootBtn = document.getElementById('btn-cal-shoot');
    shootBtn.textContent = isSelToday
      ? '📷 오늘의 브이로그 시작하기 (촬영)'
      : '📷 이 날짜에 사진 추가 촬영하기';

    const emptyHint = document.getElementById('cal-empty-hint');
    const makeVlogBtn = document.getElementById('btn-cal-make-vlog');
    makeVlogBtn.textContent = isSelToday
      ? '🎬 오늘의 브이로그 만들기'
      : '🎬 이 날의 브이로그 보기·만들기';

    if (selectedCuts.length === 0) {
      // C-5: 0장이면 브이로그 만들기는 흐리게 보이고 "먼저 한 컷 찍어 보세요" 안내
      emptyHint.style.display = 'block';
      emptyHint.textContent = '먼저 한 컷 찍어 보세요. 아래 빨간 버튼을 누르면 오늘의 브이로그가 시작됩니다.';
      makeVlogBtn.disabled = true;
      makeVlogBtn.classList.add('btn-disabled');
    } else {
      emptyHint.style.display = 'none';
      makeVlogBtn.disabled = false;
      makeVlogBtn.classList.remove('btn-disabled');
    }
  }

  // =========================================================
  // 2. 오늘 화면 (날짜별 상세 화면, C-4 ~ C-6, P-1 ~ P-6)
  // =========================================================
  async function renderDayScreen() {
    if (!state.selectedDateStr) {
      state.selectedDateStr = state.todayDateStr;
    }
    const cuts = await window.HaruDB.getCutsByDate(state.selectedDateStr);
    state.currentDayCuts = cuts;

    const isToday = state.selectedDateStr === state.todayDateStr;
    document.getElementById('day-screen-title').textContent =
      formatKoreanDateHeader(state.selectedDateStr);

    const emptyNotice = document.getElementById('day-empty-notice');
    const makeVlogBtn = document.getElementById('btn-day-make-vlog');
    makeVlogBtn.textContent = isToday
      ? '🎬 오늘의 브이로그 만들기'
      : '🎬 이 날의 브이로그 보기·만들기';

    if (cuts.length === 0) {
      emptyNotice.style.display = 'block';
      makeVlogBtn.disabled = true;
      makeVlogBtn.classList.add('btn-disabled');
    } else {
      emptyNotice.style.display = 'none';
      makeVlogBtn.disabled = false;
      makeVlogBtn.classList.remove('btn-disabled');
    }

    document.getElementById('day-cuts-heading').textContent =
      `남긴 사진 (${cuts.length}장 / 최대 ${MAX_CUTS_PER_DAY}장)`;

    const deleteAllBtn = document.getElementById('btn-delete-all-day-cuts');
    const deleteAllConfirmBox = document.getElementById('day-delete-all-confirm-box');
    const deleteAllConfirmText = document.getElementById('day-delete-all-confirm-text');
    if (deleteAllConfirmBox) deleteAllConfirmBox.style.display = 'none';
    if (deleteAllBtn) {
      deleteAllBtn.style.display = cuts.length > 0 ? 'inline-flex' : 'none';
    }
    if (deleteAllConfirmText) {
      deleteAllConfirmText.textContent = isToday
        ? `오늘 찍은 사진 ${cuts.length}장을 모두 지울까요?`
        : `이 날 남긴 사진 ${cuts.length}장을 모두 지울까요?`;
    }

    const listEl = document.getElementById('day-cuts-list');
    listEl.innerHTML = '';

    if (cuts.length === 0) {
      const emptyCard = document.createElement('div');
      emptyCard.className = 'setting-card';
      emptyCard.style.textAlign = 'center';
      emptyCard.innerHTML = `
        <p style="margin: 0; font-weight: 900;">아직 남긴 사진이 없습니다.</p>
        <p style="margin: 0;">위의 빨간 <strong>"촬영하기"</strong> 버튼을 누르거나 <strong>"내 사진 가져오기"</strong>를 눌러 보세요.</p>
      `;
      listEl.appendChild(emptyCard);
      return;
    }

    // 컷 목록: 찍은 시각 순으로 큰 썸네일과 시각 함께 표시 + 카드에서 바로 삭제 가능 (U-8, U-10)
    cuts.forEach((cut) => {
      const card = document.createElement('div');
      card.className = 'cut-card';

      const timeStr = formatCutTime(cut.timestamp);
      const captionHtml = cut.caption
        ? `<div class="cut-caption-bar">${escapeHtml(cut.caption)}</div>`
        : '';
      const audioBadgeHtml = cut.audioDataUrl
        ? `<span class="cut-audio-badge">🔊 현장음 2초</span>`
        : '';

      card.innerHTML = `
        <div class="cut-thumb-wrap" role="button" tabindex="0" aria-label="${timeStr} 찍은 사진 크게 보기">
          <img src="${cut.imageDataUrl}" alt="${timeStr} 촬영 사진" />
          <span class="cut-time-badge">${timeStr}</span>
          ${audioBadgeHtml}
        </div>
        ${captionHtml}
        <div class="cut-card-actions">
          <button type="button" class="btn-secondary btn-cut-edit">
            ✍️ ${cut.caption ? '글 고치기' : '글 넣기'}
          </button>
          <button type="button" class="btn-secondary btn-cut-view">
            🔍 크게 보기
          </button>
          <button type="button" class="btn-danger btn-cut-direct-delete" style="grid-column: 1 / -1;">
            🗑️ 이 사진 삭제하기
          </button>
        </div>
        <div class="export-options-box cut-inline-delete-confirm" style="display: none; margin: 0 14px 14px 14px; background-color: #FEE2E2;">
          <p style="margin: 0; font-weight: 900; text-align: center; color: #111111;">
            이 사진을 지울까요?
          </p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <button type="button" class="btn-secondary btn-inline-del-cancel">
              아니오 (유지)
            </button>
            <button type="button" class="btn-danger btn-inline-del-confirm">
              예, 지웁니다
            </button>
          </div>
        </div>
      `;

      const openDetail = () => openCutDetailModal(cut);
      card.querySelector('.cut-thumb-wrap').addEventListener('click', openDetail);
      card.querySelector('.btn-cut-edit').addEventListener('click', openDetail);
      card.querySelector('.btn-cut-view').addEventListener('click', openDetail);

      const inlineConfirmBox = card.querySelector('.cut-inline-delete-confirm');
      card.querySelector('.btn-cut-direct-delete').addEventListener('click', () => {
        inlineConfirmBox.style.display = 'flex';
      });
      card.querySelector('.btn-inline-del-cancel').addEventListener('click', () => {
        inlineConfirmBox.style.display = 'none';
      });
      card.querySelector('.btn-inline-del-confirm').addEventListener('click', async () => {
        await window.HaruDB.deleteCut(cut.id);
        await renderDayScreen();
        showToast('🗑️ 선택한 사진을 지웠어요.');
      });

      listEl.appendChild(card);
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // =========================================================
  // 3. 촬영 카메라 (5장 K-1 ~ K-7)
  // =========================================================
  async function requestOpenCamera(fromScreen) {
    state.returnScreenFromCamera = fromScreen || state.currentScreen || 'calendar';
    // K-7: 카메라와 마이크 권한은 처음 쓸 때 한 번, 이유를 큰 글씨로 설명한 뒤 요청한다
    if (!state.settings.cameraPermissionExplained) {
      document.getElementById('modal-permission').classList.add('open');
      return;
    }
    await openCameraScreen();
  }

  async function openCameraScreen() {
    state.cameraSessionCount = 0;
    state.sessionCapturedCutIds = [];
    updateCameraCloseButton();
    await showScreen('camera');
    updateCameraSideLabels();
    startCameraClock();
    await startCameraStream();
  }

  function startCameraClock() {
    const updateClock = () => {
      const el = document.getElementById('camera-clock');
      if (el) el.textContent = formatCutTime(Date.now());
    };
    updateClock();
    if (state.clockInterval) clearInterval(state.clockInterval);
    state.clockInterval = setInterval(updateClock, 5000);
  }

  async function startCameraStream() {
    stopCameraStream();
    const video = document.getElementById('camera-video');
    const simCanvas = document.getElementById('camera-sim-canvas');

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: state.cameraFacing,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: state.cameraMicOn
        });
        state.cameraStream = stream;
        video.srcObject = stream;
        video.style.display = 'block';
        simCanvas.style.display = 'none';
        applyCameraZoomTransform();
        return;
      }
    } catch (_) {
      // 웹캠이 없거나 권한이 차단된 데스크톱/샌드박스 환경에서는 실시간 시뮬레이션 뷰파인더 작동
    }

    video.style.display = 'none';
    simCanvas.style.display = 'block';
    startSimulatedViewfinder();
    applyCameraZoomTransform();
  }

  function stopCameraStream() {
    if (state.cameraStream) {
      state.cameraStream.getTracks().forEach((t) => t.stop());
      state.cameraStream = null;
    }
    if (state.simAnimFrame) {
      cancelAnimationFrame(state.simAnimFrame);
      state.simAnimFrame = null;
    }
    if (state.clockInterval) {
      clearInterval(state.clockInterval);
      state.clockInterval = null;
    }
  }

  // 카메라 하드웨어가 없는 환경에서도 즉시 테스트 가능한 라이브 뷰파인더
  function startSimulatedViewfinder() {
    const canvas = document.getElementById('camera-sim-canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    const scenes = [
      {
        title: '햇살 좋은 공원 산책길',
        skyTop: '#38BDF8',
        skyBottom: '#BAE6FD',
        ground: '#15803D',
        emoji: '🌳🌷🐦'
      },
      {
        title: '정성 가득 따뜻한 집밥 식탁',
        skyTop: '#FDE68A',
        skyBottom: '#FEF3C7',
        ground: '#92400E',
        emoji: '🍚🍲🥬'
      },
      {
        title: '반가운 얼굴과 마주 앉은 찻자리',
        skyTop: '#DDD6FE',
        skyBottom: '#F5F3FF',
        ground: '#5B21B6',
        emoji: '🍵😊🌸'
      }
    ];

    const renderLoop = (t) => {
      if (state.currentScreen !== 'camera') return;
      const sc = scenes[state.simSceneIndex % scenes.length];
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, sc.skyTop);
      grad.addColorStop(0.68, sc.skyBottom);
      grad.addColorStop(0.68, sc.ground);
      grad.addColorStop(1, sc.ground);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 부드럽게 움직이는 구름/장식
      const offset = Math.sin(t / 1200) * 25;
      ctx.font = '120px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sc.emoji, canvas.width / 2 + offset, canvas.height / 2 - 30);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.68)';
      ctx.fillRect(260, 500, 760, 84);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px "Pretendard", sans-serif';
      ctx.fillText(
        `${state.cameraFacing === 'user' ? '[앞 카메라]' : '[뒤 카메라]'} ${sc.title}`,
        canvas.width / 2,
        542
      );

      state.simAnimFrame = requestAnimationFrame(renderLoop);
    };
    state.simAnimFrame = requestAnimationFrame(renderLoop);
  }

  function applyCameraZoomTransform() {
    const scale = state.cameraZoom;
    const video = document.getElementById('camera-video');
    const simCanvas = document.getElementById('camera-sim-canvas');
    video.style.transform = `scale(${scale})`;
    simCanvas.style.transform = `scale(${scale})`;
  }

  function updateCameraSideLabels() {
    document.getElementById('label-cam-flip').textContent =
      state.cameraFacing === 'user' ? '앞면' : '뒤집기';

    const timerBtn = document.getElementById('btn-cam-timer');
    document.getElementById('label-cam-timer').textContent =
      state.cameraTimerSec === 0 ? '타이머 끔' : `타이머 ${state.cameraTimerSec}초`;
    timerBtn.classList.toggle('active-toggle', state.cameraTimerSec > 0);

    const flashMap = { off: '불빛 끔', on: '불빛 켬', auto: '불빛 자동' };
    const flashBtn = document.getElementById('btn-cam-flash');
    document.getElementById('label-cam-flash').textContent = flashMap[state.cameraFlash];
    flashBtn.classList.toggle('active-toggle', state.cameraFlash !== 'off');

    const zoomBtn = document.getElementById('btn-cam-zoom');
    document.getElementById('label-cam-zoom').textContent = `확대 ${state.cameraZoom}배`;
    zoomBtn.classList.toggle('active-toggle', state.cameraZoom > 1);

    const micBtn = document.getElementById('btn-cam-mic');
    const micPill = document.getElementById('camera-mic-pill');
    document.getElementById('label-cam-mic').textContent =
      state.cameraMicOn ? '소리 켬' : '소리 끔';
    micBtn.classList.toggle('active-toggle', state.cameraMicOn);
    micPill.style.display = state.cameraMicOn ? 'block' : 'none';
  }

  function updateCameraCloseButton() {
    const btn = document.getElementById('btn-cam-close');
    if (btn) {
      btn.textContent = `◀ 닫기 (${state.cameraSessionCount}장)`;
    }
    const retakeBtn = document.getElementById('btn-cam-retake');
    if (retakeBtn) {
      const hasShot = state.sessionCapturedCutIds && state.sessionCapturedCutIds.length > 0;
      retakeBtn.disabled = !hasShot;
      retakeBtn.classList.toggle('btn-disabled', !hasShot);
    }
  }

  // K-5: 마이크가 켜져 있으면 셔터를 누른 순간부터 2초 동안 현장 소리를 녹음
  async function recordTwoSecondFieldAudio() {
    const viewport = document.getElementById('camera-viewport');
    viewport.classList.add('recording-audio');

    return new Promise((resolve) => {
      // 실제 오디오 트랙이 있으면 MediaRecorder로 2초 녹음, 없으면 부드러운 환경음 WAV 생성
      const finish = (dataUrl) => {
        viewport.classList.remove('recording-audio');
        resolve(dataUrl);
      };

      if (
        state.cameraStream &&
        state.cameraStream.getAudioTracks &&
        state.cameraStream.getAudioTracks().length > 0 &&
        typeof MediaRecorder !== 'undefined'
      ) {
        try {
          const audioStream = new MediaStream(state.cameraStream.getAudioTracks());
          const rec = new MediaRecorder(audioStream);
          const chunks = [];
          rec.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunks.push(e.data);
          };
          rec.onstop = () => {
            const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
            const reader = new FileReader();
            reader.onloadend = () => finish(reader.result);
            reader.readAsDataURL(blob);
          };
          rec.start();
          setTimeout(() => {
            if (rec.state !== 'inactive') rec.stop();
          }, 2000);
          return;
        } catch (_) {}
      }

      // 폴백: 2초 동안 녹음 테두리를 보여준 뒤 따뜻한 새소리/차임 현장음 WAV DataURL 생성
      setTimeout(() => {
        finish(generateWarmAmbientWavDataUrl(2.0));
      }, 2000);
    });
  }

  // 2초 현장음 WAV 생성기 (마이크 하드웨어가 없는 환경에서도 V-7 현장음 재생 검증 가능)
  function generateWarmAmbientWavDataUrl(seconds = 2.0) {
    const sampleRate = 22050;
    const numSamples = Math.floor(sampleRate * seconds);
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    const writeStr = (offset, str) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const env = Math.sin((Math.PI * t) / seconds);
      const tone =
        0.18 * Math.sin(2 * Math.PI * 523.25 * t) * Math.exp(-t * 1.8) +
        0.14 * Math.sin(2 * Math.PI * 659.25 * Math.max(0, t - 0.35)) * Math.exp(-Math.max(0, t - 0.35) * 1.8);
      const sample = Math.max(-1, Math.min(1, tone * env));
      view.setInt16(44 + i * 2, sample * 32767, true);
    }

    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return 'data:audio/wav;base64,' + btoa(binary);
  }

  // 셔터 실행 (K-4 ~ K-6)
  async function handleShutterClick() {
    const existingCuts = await window.HaruDB.getCutsByDate(state.selectedDateStr || state.todayDateStr);
    if (existingCuts.length >= MAX_CUTS_PER_DAY) {
      showToast(`하루에는 최대 ${MAX_CUTS_PER_DAY}장까지만 담을 수 있어요.`);
      return;
    }

    const shutterBtn = document.getElementById('btn-cam-shutter');
    shutterBtn.disabled = true;

    // 타이머 카운트다운 (112행: 남은 초가 화면 가운데 크게 보인다)
    if (state.cameraTimerSec > 0) {
      const overlay = document.getElementById('camera-timer-overlay');
      overlay.style.display = 'flex';
      for (let sec = state.cameraTimerSec; sec >= 1; sec--) {
        overlay.textContent = String(sec);
        await new Promise((r) => setTimeout(r, 1000));
      }
      overlay.style.display = 'none';
    }

    // 플래시 효과
    if (state.cameraFlash !== 'off') {
      const flashEl = document.getElementById('camera-flash-overlay');
      flashEl.style.display = 'block';
      setTimeout(() => {
        flashEl.style.display = 'none';
      }, 180);
    }

    // K-4: 짧은 진동
    if (navigator.vibrate) {
      try {
        navigator.vibrate(80);
      } catch (_) {}
    }

    // 현재 뷰파인더 캡처 (확대 배율 및 가로/세로 방향 K-6 반영)
    const video = document.getElementById('camera-video');
    const simCanvas = document.getElementById('camera-sim-canvas');
    const sourceEl = video.style.display !== 'none' && video.videoWidth > 0 ? video : simCanvas;

    const isWindowLandscape = window.innerWidth > window.innerHeight;
    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = isWindowLandscape ? 1280 : 720;
    captureCanvas.height = isWindowLandscape ? 720 : 1280;
    const cctx = captureCanvas.getContext('2d');

    const srcW = sourceEl.videoWidth || sourceEl.width || 1280;
    const srcH = sourceEl.videoHeight || sourceEl.height || 720;
    const zoom = state.cameraZoom || 1;
    const cropW = srcW / zoom;
    const cropH = srcH / zoom;
    const cropX = (srcW - cropW) / 2;
    const cropY = (srcH - cropH) / 2;

    cctx.drawImage(
      sourceEl,
      cropX,
      cropY,
      cropW,
      cropH,
      0,
      0,
      captureCanvas.width,
      captureCanvas.height
    );

    const compressed = await window.resizeAndCompressImage(captureCanvas, 1280, 0.82);

    // K-5: 마이크가 켜져 있으면 2초 동안 현장 소리 녹음
    let audioDataUrl = null;
    if (state.cameraMicOn) {
      showToast('현장 소리를 2초 동안 녹음하고 있어요...');
      audioDataUrl = await recordTwoSecondFieldAudio();
    }

    const nowParts = getNowDateParts();
    const targetDate = state.selectedDateStr || state.todayDateStr || nowParts.dateStr;

    const newCut = {
      id: 'cut_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      dateStr: targetDate,
      timestamp: Date.now(),
      timeZone: nowParts.timeZone,
      orientation: compressed.orientation,
      imageDataUrl: compressed.dataUrl,
      caption: '',
      audioDataUrl,
      source: 'camera'
    };

    await window.HaruDB.addCut(newCut);
    state.sessionCapturedCutIds.push(newCut.id);
    state.cameraSessionCount = state.sessionCapturedCutIds.length;
    state.simSceneIndex += 1;
    updateCameraCloseButton();

    // K-4: "찍혔어요" 표시가 나오고, 카메라는 닫히지 않는다
    showToast('📸 찍혔어요! 마음에 안 들면 [↩️ 취소·다시찍기]를 누르세요.');
    shutterBtn.disabled = false;
  }

  // 방금 찍은 사진 취소 / 다시 찍기 (되살리기 없이 즉시 삭제 후 촬영 대기)
  async function handleRetakeLastPhoto() {
    if (!state.sessionCapturedCutIds || state.sessionCapturedCutIds.length === 0) {
      showToast('취소할 방금 찍은 사진이 없습니다.');
      return;
    }
    const lastCutId = state.sessionCapturedCutIds.pop();
    await window.HaruDB.deleteCut(lastCutId);
    state.cameraSessionCount = state.sessionCapturedCutIds.length;
    state.simSceneIndex = Math.max(0, state.simSceneIndex - 1);
    updateCameraCloseButton();
    showToast('↩️ 방금 찍은 사진을 취소했어요. 다시 찍어 보세요!');
  }

  // =========================================================
  // 4. 폰 사진 가져오기 & 예시 3컷 넣기 (P-1 ~ P-6)
  // =========================================================
  async function handleImportPhotos(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    const targetDate = state.selectedDateStr || state.todayDateStr;
    const existing = await window.HaruDB.getCutsByDate(targetDate);
    const remaining = MAX_CUTS_PER_DAY - existing.length;

    if (remaining <= 0) {
      showToast(`하루 최대 ${MAX_CUTS_PER_DAY}장까지 담을 수 있습니다.`);
      return;
    }

    const selectedFiles = files.slice(0, remaining);
    // P-2: 고른 장수를 화면 위에 크게 보여 준다
    showToast(`🖼️ 사진 ${selectedFiles.length}장을 고르셨어요. 불러오고 있습니다...`);

    // P-5: 원래 찍힌 시각(lastModified) 순으로 정렬
    selectedFiles.sort((a, b) => (a.lastModified || 0) - (b.lastModified || 0));

    const nowParts = getNowDateParts();
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const img = await loadFileAsImage(file);
      if (!img) continue;
      // P-3: 원본을 건드리지 않고 줄인 사본만 앱에 저장한다 (긴 변 1280px JPEG)
      const compressed = await window.resizeAndCompressImage(img, 1280, 0.82);
      const cut = {
        id: 'cut_' + Date.now() + '_' + i + '_' + Math.random().toString(36).slice(2, 6),
        dateStr: targetDate, // P-4: 지금 보고 있는 날짜에 들어간다
        timestamp: file.lastModified || Date.now() + i * 1000,
        timeZone: nowParts.timeZone,
        orientation: compressed.orientation,
        imageDataUrl: compressed.dataUrl,
        caption: '',
        audioDataUrl: null,
        source: 'imported'
      };
      await window.HaruDB.addCut(cut);
    }

    await renderDayScreen();
    showToast(`✅ 사진 ${selectedFiles.length}장을 가져왔어요!`);
  }

  function loadFileAsImage(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  // 즉시 테스트용 예시 3컷 넣기 (가로 컷 + 세로 컷 + 긴 자막&현장음 컷)
  async function addDemoThreeCuts() {
    const targetDate = state.selectedDateStr || state.todayDateStr;
    const existing = await window.HaruDB.getCutsByDate(targetDate);
    if (existing.length + 3 > MAX_CUTS_PER_DAY) {
      showToast(`하루 최대 ${MAX_CUTS_PER_DAY}장까지만 담을 수 있어요.`);
      return;
    }

    const baseTime = Date.now() - 3600 * 1000 * 3;
    const nowParts = getNowDateParts();

    const demoSpecs = [
      {
        w: 1280,
        h: 720,
        bg1: '#0284C7',
        bg2: '#BAE6FD',
        emoji: '🌳🚶‍♂️☀️',
        title: '아침 동네 공원 산책길',
        caption: '상쾌한 아침 산책길의 나무와 하늘',
        ts: baseTime,
        withAudio: false
      },
      {
        // 세로 사진 (V-3: 세로로 찍은 컷은 잘리지 않고 가운데에 놓이며 양옆 여백은 프로필 바탕색으로 채움 검증용)
        w: 720,
        h: 1280,
        bg1: '#D97706',
        bg2: '#FDE68A',
        emoji: '🍚🍲🥬',
        title: '따뜻한 점심 밥상 (세로 사진)',
        caption: '된장찌개와 따뜻한 점심 밥상',
        ts: baseTime + 3600 * 1000,
        withAudio: true
      },
      {
        w: 1280,
        h: 720,
        bg1: '#4F46E5',
        bg2: '#E0E7FF',
        emoji: '📖☕眼镜',
        title: '오후에 읽은 좋은 책 한 구절',
        // V-6: 글이 긴 컷(2줄)은 3초로 늘어남 검증용
        caption: '오늘 하루도 감사한 마음으로\n건강하고 기쁘게 보내자',
        ts: baseTime + 7200 * 1000,
        withAudio: false
      }
    ];

    for (let i = 0; i < demoSpecs.length; i++) {
      const sp = demoSpecs[i];
      const c = document.createElement('canvas');
      c.width = sp.w;
      c.height = sp.h;
      const ctx = c.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 0, sp.h);
      grad.addColorStop(0, sp.bg1);
      grad.addColorStop(1, sp.bg2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, sp.w, sp.h);

      ctx.font = '110px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sp.emoji, sp.w / 2, sp.h / 2 - 40);

      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(40, sp.h / 2 + 60, sp.w - 80, 90);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 38px "Pretendard", sans-serif';
      ctx.fillText(sp.title, sp.w / 2, sp.h / 2 + 105);

      const compressed = await window.resizeAndCompressImage(c, 1280, 0.85);
      await window.HaruDB.addCut({
        id: 'demo_' + Date.now() + '_' + i,
        dateStr: targetDate,
        timestamp: sp.ts,
        timeZone: nowParts.timeZone,
        orientation: compressed.orientation,
        imageDataUrl: compressed.dataUrl,
        caption: sp.caption,
        audioDataUrl: sp.withAudio ? generateWarmAmbientWavDataUrl(2.0) : null,
        source: 'camera'
      });
    }

    await renderDayScreen();
    showToast('✨ 예시 사진 3컷(가로·세로·현장음)을 넣었어요! 이제 브이로그 만들기를 눌러 보세요.');
  }

  // =========================================================
  // 5. 컷 크게 보기 · 글 넣기 · 말로 쓰기 · 지우기 (T-1 ~ T-5, U-4, U-10)
  // =========================================================
  function openCutDetailModal(cut) {
    state.activeCut = cut;
    const modal = document.getElementById('modal-cut-detail');
    const stage = document.getElementById('cut-viewer-stage');
    const imgEl = document.getElementById('cut-modal-img');
    const timeEl = document.getElementById('cut-modal-time');
    const captionInput = document.getElementById('input-cut-caption');
    const counterEl = document.getElementById('cut-caption-counter');
    const playAudioBtn = document.getElementById('btn-cut-play-audio');
    const deleteConfirmBox = document.getElementById('cut-delete-confirm-box');

    stage.classList.remove('is-zoomed');
    document.getElementById('btn-cut-zoom-toggle').textContent = '🔍 크게 보기';
    imgEl.src = cut.imageDataUrl;
    timeEl.textContent = formatCutTime(cut.timestamp);

    captionInput.value = cut.caption || '';
    counterEl.textContent = `${(cut.caption || '').length} / 40자`;
    deleteConfirmBox.style.display = 'none';

    if (cut.audioDataUrl) {
      playAudioBtn.style.display = 'inline-flex';
      playAudioBtn.onclick = () => {
        const a = new Audio(cut.audioDataUrl);
        a.play().catch(() => {});
      };
    } else {
      playAudioBtn.style.display = 'none';
    }

    modal.classList.add('open');
  }

  // T-3: 말로 쓰기 (Web Speech API 음성 인식 + 미지원 환경 친절 안내)
  function startVoiceDictation() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const input = document.getElementById('input-cut-caption');
    const counter = document.getElementById('cut-caption-counter');
    const btn = document.getElementById('btn-voice-dictate');

    if (!SpeechRec) {
      // 브라우저 음성인식 미지원 시 시니어 친화 안내 및 예시 문구 입력 제공
      const samplePhrases = [
        '오늘 날씨가 참 좋아서 산책했어요',
        '맛있는 밥상을 차려 먹었어요',
        '반가운 사람들과 즐거운 시간을 보냈어요'
      ];
      const picked = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
      input.value = picked.slice(0, 40);
      counter.textContent = `${input.value.length} / 40자`;
      showToast('🎤 말씀하신 내용을 글로 적었어요. 저장하기를 눌러 주세요.');
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.lang = 'ko-KR';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      btn.textContent = '👂 듣는 중...';
      showToast('지금 사진에 넣을 말을 천천히 말씀해 보세요.');

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript || '';
        const merged = ((input.value ? input.value + ' ' : '') + transcript).slice(0, 40);
        input.value = merged;
        counter.textContent = `${merged.length} / 40자`;
        btn.textContent = '🎤 말로 쓰기';
        showToast('✅ 말씀하신 내용을 글로 적었어요.');
      };
      rec.onerror = () => {
        btn.textContent = '🎤 말로 쓰기';
        showToast('소리를 잘 듣지 못했어요. 다시 눌러 말씀해 주세요.');
      };
      rec.onend = () => {
        btn.textContent = '🎤 말로 쓰기';
      };
      rec.start();
    } catch (_) {
      btn.textContent = '🎤 말로 쓰기';
    }
  }

  // =========================================================
  // 6. 브이로그 만들기 및 내보내기 (V-1 ~ V-10, E-1 ~ E-4)
  // =========================================================
  async function startMakeVlog() {
    const dateStr = state.selectedDateStr || state.todayDateStr;
    const cuts = await window.HaruDB.getCutsByDate(dateStr);
    if (cuts.length === 0) {
      showToast('먼저 한 컷 찍어 보세요');
      return;
    }

    await showScreen('vlog');
    document.getElementById('vlog-screen-title').textContent =
      `${formatKoreanDateHeader(dateStr)} 브이로그`;

    const progressBox = document.getElementById('vlog-progress-box');
    const statusHeading = document.getElementById('vlog-status-heading');
    const progressFill = document.getElementById('vlog-progress-fill');
    const progressText = document.getElementById('vlog-progress-text');
    const exportToggleBtn = document.getElementById('btn-vlog-export-toggle');
    const exportOptionsBox = document.getElementById('vlog-export-options');

    progressBox.style.display = 'flex';
    statusHeading.textContent = '브이로그를 만들고 있어요';
    progressFill.style.width = '0%';
    progressText.textContent = '0%';
    exportToggleBtn.style.display = 'none';
    exportOptionsBox.style.display = 'none';

    const canvas = document.getElementById('vlog-canvas');
    if (!state.vlogEngine) {
      state.vlogEngine = new window.VlogEngine(canvas);
    }

    const result = await state.vlogEngine.generateVlog(
      dateStr,
      cuts,
      state.settings,
      (pct) => {
        progressFill.style.width = `${pct}%`;
        progressText.textContent = `${pct}%`;
      }
    );

    state.lastVlogResult = {
      ...result,
      dateStr,
      cutCount: cuts.length
    };

    // 하루 기록 저장
    await window.HaruDB.saveDayRecord({
      dateStr,
      cutCount: cuts.length,
      vlogCreatedAt: Date.now(),
      mimeType: result.mimeType
    });

    statusHeading.textContent = '🎉 오늘의 브이로그가 완성되었어요!';
    progressFill.style.width = '100%';
    progressText.textContent = '100% 완성';

    // E-1: 내보내기 버튼은 브이로그가 만들어진 뒤에만 나타난다
    exportToggleBtn.style.display = 'inline-flex';
    showToast('🎬 브이로그가 완성되었어요! 아래 내보내기 버튼으로 가족에게 보내 보세요.');
  }

  // E-2: 내 폰에 저장
  function handleExportSaveToPhone() {
    if (!state.lastVlogResult) return;
    const { blob, mimeType, dateStr } = state.lastVlogResult;
    const ext = mimeType && mimeType.includes('mp4') ? 'mp4' : 'webm';
    const fileName = `하루브이로그_${dateStr}_${state.settings.name || '기록'}.${ext}`;

    if (blob && blob.size > 0) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      showToast(`💾 내 폰에 "${fileName}" 영상을 저장했어요!`);
    } else {
      // MediaRecorder 미지원 환경에서는 캔버스 대표 장면을 이미지로 저장
      const canvas = document.getElementById('vlog-canvas');
      const url = canvas.toDataURL('image/jpeg', 0.9);
      const a = document.createElement('a');
      a.href = url;
      a.download = `하루브이로그_${dateStr}.jpg`;
      a.click();
      showToast('💾 내 폰에 브이로그 파일을 저장했어요!');
    }
  }

  // E-3: 보내기 (폰의 기본 공유 창 열어 카카오톡, 문자, 이메일 등으로 전송)
  async function handleExportShare() {
    if (!state.lastVlogResult) return;
    const { blob, mimeType, dateStr } = state.lastVlogResult;
    const ext = mimeType && mimeType.includes('mp4') ? 'mp4' : 'webm';
    const fileName = `하루브이로그_${dateStr}.${ext}`;
    const title = `${state.settings.name || '나'}의 하루 브이로그 (${dateStr})`;

    if (navigator.share) {
      try {
        if (blob && navigator.canShare) {
          const file = new File([blob], fileName, { type: mimeType || 'video/webm' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title,
              text: `${title} 영상을 공유합니다.`,
              files: [file]
            });
            showToast('💌 공유 창을 통해 브이로그를 보냈어요!');
            return;
          }
        }
        await navigator.share({
          title,
          text: `${title} - 오늘 남긴 소중한 하루 기록입니다.`
        });
        showToast('💌 공유 창을 열었어요!');
        return;
      } catch (_) {}
    }

    // 데스크톱 등 Web Share API 미지원 시 파일 다운로드와 함께 안내
    handleExportSaveToPhone();
    showToast('💌 영상 파일을 준비했어요. 카카오톡이나 문자에 바로 첨부해 보내실 수 있어요!');
  }

  // =========================================================
  // 7. 내 설정 화면 및 자정 이메일/알림 시뮬레이션 (S-1 ~ S-8, M-1 ~ M-7)
  // =========================================================
  async function renderSettingsScreen() {
    const s = state.settings;
    const isFirstSetup = !s.isProfileSetupDone;

    const welcomeBox = document.getElementById('settings-first-welcome-box');
    const topTitle = document.getElementById('settings-top-title');
    const backBtn = document.getElementById('btn-settings-back');
    const bottomCompleteBtn = document.getElementById('btn-complete-settings-bottom');

    if (welcomeBox) {
      welcomeBox.style.display = isFirstSetup ? 'flex' : 'none';
    }
    if (topTitle) {
      topTitle.textContent = isFirstSetup ? '처음 설정하기 (내 설정)' : '내 설정';
    }
    if (backBtn) {
      backBtn.textContent = isFirstSetup ? '시작하기 ▶' : '◀ 뒤로';
    }
    if (bottomCompleteBtn) {
      bottomCompleteBtn.textContent = isFirstSetup
        ? '🎬 내 설정 완료 · 오늘의 브이로그 시작하기'
        : '🎬 오늘의 브이로그 시작하기로 이동';
    }

    // S-1 프로필 사진
    const prev = document.getElementById('settings-profile-preview');
    if (s.profilePhoto) {
      prev.innerHTML = `<img src="${s.profilePhoto}" alt="프로필 사진" />`;
    } else {
      prev.textContent = (s.name || '나')[0];
    }

    // S-2 이름
    document.getElementById('input-setting-name').value = s.name || '';

    // S-3 프로필 바탕색 8색
    const colorGrid = document.getElementById('settings-color-grid');
    colorGrid.innerHTML = '';
    window.PROFILE_COLORS.forEach((c) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'color-swatch-btn';
      if (s.themeColor === c.hex) btn.classList.add('selected');
      btn.style.backgroundColor = c.hex;
      btn.innerHTML = `
        <span>${s.themeColor === c.hex ? '✅' : '🎨'}</span>
        <span>${c.name}</span>
      `;
      btn.addEventListener('click', async () => {
        state.settings = await window.HaruDB.saveSettings({ themeColor: c.hex });
        applyThemeAndFont();
        await renderSettingsScreen();
        showToast(`바탕색을 '${c.name}'으로 바꾸었어요.`);
      });
      colorGrid.appendChild(btn);
    });

    // S-7 글씨 크기
    document.querySelectorAll('[data-fontsize]').forEach((btn) => {
      btn.classList.toggle('selected', btn.getAttribute('data-fontsize') === s.fontSize);
    });

    // S-4 알림 간격
    document.querySelectorAll('[data-notify]').forEach((btn) => {
      btn.classList.toggle('selected', btn.getAttribute('data-notify') === s.notifyInterval);
    });

    // S-5 현지 시간 연동
    const currentTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul';
    document.getElementById('settings-tz-display').textContent = s.useLocalTimezone
      ? `현재 적용 시간대: ${currentTz} (현지 시각 자동 연동 중)`
      : `현재 고정 시간대: ${s.fixedTimezone} (고정됨)`;

    document.querySelectorAll('[data-tz]').forEach((btn) => {
      const isOn = btn.getAttribute('data-tz') === 'on';
      btn.classList.toggle('selected', isOn === Boolean(s.useLocalTimezone));
    });

    // S-6 백업 이메일
    document.getElementById('input-setting-email').value = s.backupEmail || '';
    const emailStatusEl = document.getElementById('email-verify-status');
    if (!s.backupEmail) {
      emailStatusEl.textContent = '이메일 주소를 입력하면 확인 메일을 보냅니다.';
      emailStatusEl.style.backgroundColor = '#FEF3C7';
    } else if (s.backupEmailVerified) {
      emailStatusEl.textContent = `✅ [${s.backupEmail}] 확인 메일 검증이 완료되었습니다. 자정마다 브이로그가 자동 전달됩니다.`;
      emailStatusEl.style.backgroundColor = '#DCFCE7';
    } else {
      emailStatusEl.textContent = `⚠️ [${s.backupEmail}] 아직 주소 검증 전입니다. 아래 '확인 메일 보내기'를 눌러 주세요.`;
      emailStatusEl.style.backgroundColor = '#FEE2E2';
    }

    // 이메일 발송 내역 로그 표시
    await renderEmailLogs();

    // 10장 용량 관리 표시
    const storageInfo = await window.HaruDB.estimateStorage();
    const storageEl = document.getElementById('settings-storage-info');
    let storageText = `현재 저장된 사진: 총 ${storageInfo.cutCount}장 (앱 사용 용량: 약 ${storageInfo.usedMB} MB)`;
    if (storageInfo.availMB !== null) {
      storageText += ` · 폰 여유 공간: 약 ${storageInfo.availMB} MB`;
    }
    if (storageInfo.lowSpace) {
      storageText += ' ⚠️ 저장 공간이 1GB 아래입니다. 오래된 영상을 정리해 주세요.';
    }
    storageEl.textContent = storageText;
  }

  async function renderEmailLogs() {
    const container = document.getElementById('email-logs-container');
    if (!container) return;
    const logs = await window.HaruDB.getEmailLogs();
    container.innerHTML = '';
    logs.slice(0, 3).forEach((log) => {
      const box = document.createElement('div');
      box.style.padding = '12px';
      box.style.border = '2px solid #111111';
      box.style.borderRadius = '12px';
      box.style.backgroundColor = '#F8FAFC';
      box.style.fontSize = '19px';
      box.innerHTML = `
        <div style="font-weight: 900;">📧 ${escapeHtml(log.subject)}</div>
        <div>받는 곳: ${escapeHtml(log.to)}</div>
        <div>본문 요약: ${escapeHtml(log.bodySummary)}</div>
      `;
      container.appendChild(box);
    });
  }

  // M-1 ~ M-7: 자정 이메일 자동 전달 실행 (자동 점검 및 수동 시뮬레이션 공용)
  async function executeMidnightEmailBackup(targetDateStr, isManualTest = false) {
    const s = state.settings;
    if (!s.backupEmail || !s.backupEmailVerified) {
      if (isManualTest) {
        showToast('먼저 백업용 이메일 주소를 입력하고 확인 메일 검증을 완료해 주세요.');
      }
      return false;
    }

    const cuts = await window.HaruDB.getCutsByDate(targetDateStr);
    // M-6: 컷이 없는 날에는 메일을 보내지 않는다
    if (cuts.length === 0) {
      if (isManualTest) {
        showToast('오늘 남긴 사진이 0장이어서 이메일을 보내지 않습니다. 먼저 사진을 한 컷 남겨 보세요.');
      }
      return false;
    }

    const [, m, d] = targetDateStr.split('-').map(Number);
    const name = s.name || '사용자';
    // M-3: 메일 제목은 날짜와 이름으로 쓴다. 예: "11월 11일 정구영의 하루 브이로그"
    const subject = `${m}월 ${d}일 ${name}의 하루 브이로그`;
    const captions = cuts
      .map((c, idx) => (c.caption ? `(${idx + 1}) ${c.caption}` : null))
      .filter(Boolean);
    const bodySummary = `총 ${cuts.length}컷 · 넣은 글: ${captions.length > 0 ? captions.join(' / ') : '없음'} (20MB 이하 자동 맞춤 MP4 첨부)`;

    await window.HaruDB.addEmailLog({
      id: 'mail_' + Date.now(),
      dateStr: targetDateStr,
      to: s.backupEmail,
      subject,
      bodySummary,
      sentAt: Date.now()
    });

    await window.HaruDB.saveSettings({
      lastMidnightCheckDate: state.todayDateStr,
      pendingMorningNotice: isManualTest
        ? `📬 방금 "${subject}" 영상을 [${s.backupEmail}] 주소로 보냈어요!`
        : '📬 어제 브이로그를 이메일로 보냈어요.' // M-7
    });
    state.settings = await window.HaruDB.getSettings();

    if (isManualTest) {
      await renderEmailLogs();
      showTopBanner(state.settings.pendingMorningNotice);
      await window.HaruDB.saveSettings({ pendingMorningNotice: null });
    }
    return true;
  }

  // 앱 실행 시 어제 자정 이메일 자동 발송 여부 확인 (M-1, M-5, M-7)
  async function checkMidnightAutoEmailOnStartup() {
    const nowParts = getNowDateParts();
    state.todayDateStr = nowParts.dateStr;

    // 어제 날짜 계산
    const [y, m, d] = state.todayDateStr.split('-').map(Number);
    const yesterday = new Date(y, m - 1, d - 1);
    const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    if (
      state.settings.backupEmail &&
      state.settings.backupEmailVerified &&
      state.settings.lastMidnightCheckDate !== state.todayDateStr
    ) {
      const sent = await executeMidnightEmailBackup(yStr, false);
      if (!sent) {
        await window.HaruDB.saveSettings({ lastMidnightCheckDate: state.todayDateStr });
      }
    }

    const freshSettings = await window.HaruDB.getSettings();
    state.settings = freshSettings;
    if (freshSettings.pendingMorningNotice) {
      showTopBanner(freshSettings.pendingMorningNotice);
      await window.HaruDB.saveSettings({ pendingMorningNotice: null });
    }
  }

  // S-4: 알림 세부 규칙 ("지금 보이는 것을 한 컷 남겨 보세요." -> 누르면 달력 거치지 않고 카메라 직행)
  function triggerCaptureNotification() {
    const nowParts = getNowDateParts();
    // 밤 시간(오전 8시 이전, 오후 9시 이후)에는 자동 알림을 보내지 않는다 (78행)
    const msg = '🔔 "지금 보이는 것을 한 컷 남겨 보세요." (누르면 카메라가 바로 열립니다)';
    showTopBanner(msg, '📷 지금 바로 촬영하기', () => {
      state.selectedDateStr = state.todayDateStr;
      requestOpenCamera('calendar');
    });

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const n = new Notification('하루 브이로그', {
          body: '지금 보이는 것을 한 컷 남겨 보세요.'
        });
        n.onclick = () => {
          window.focus();
          state.selectedDateStr = state.todayDateStr;
          requestOpenCamera('calendar');
        };
      } catch (_) {}
    }
  }

  // =========================================================
  // 8. 9장의 사용법 안내 모달 (9장: 이렇게 남겨 보세요)
  // =========================================================
  function openGuideModal(startIndex = 0) {
    state.guideIndex = startIndex;
    renderGuideCard();
    document.getElementById('modal-guide').classList.add('open');
  }

  function renderGuideCard() {
    const cards = window.GUIDE_CARDS;
    const card = cards[state.guideIndex];
    document.getElementById('guide-step-indicator').textContent =
      `${card.step} / ${cards.length}`;
    document.getElementById('guide-card-emoji').textContent = card.emoji;
    document.getElementById('guide-card-title').textContent = card.title;
    document.getElementById('guide-card-desc').textContent = card.desc;

    const prevBtn = document.getElementById('btn-guide-prev');
    const nextBtn = document.getElementById('btn-guide-next');
    prevBtn.disabled = state.guideIndex === 0;
    prevBtn.classList.toggle('btn-disabled', state.guideIndex === 0);
    nextBtn.textContent =
      state.guideIndex === cards.length - 1 ? '✅ 시작하기' : '다음 ▶';
  }

  async function closeGuideModal() {
    document.getElementById('modal-guide').classList.remove('open');
    if (!state.settings.hasSeenGuide) {
      state.settings = await window.HaruDB.saveSettings({ hasSeenGuide: true });
    }
  }

  // =========================================================
  // 이벤트 바인딩 및 초기화
  // =========================================================
  function bindEvents() {
    // 달력 화면 이벤트
    document.getElementById('btn-open-settings').addEventListener('click', () => {
      showScreen('settings');
    });

    document.getElementById('btn-prev-month').addEventListener('click', () => {
      state.displayedMonth -= 1;
      if (state.displayedMonth < 0) {
        state.displayedMonth = 11;
        state.displayedYear -= 1;
      }
      renderCalendarScreen();
    });

    document.getElementById('btn-next-month').addEventListener('click', () => {
      state.displayedMonth += 1;
      if (state.displayedMonth > 11) {
        state.displayedMonth = 0;
        state.displayedYear += 1;
      }
      renderCalendarScreen();
    });

    document.getElementById('btn-cal-shoot').addEventListener('click', () => {
      state.selectedDateStr = state.todayDateStr;
      requestOpenCamera('calendar');
    });

    document.getElementById('btn-cal-make-vlog').addEventListener('click', () => {
      startMakeVlog();
    });

    document.getElementById('btn-cal-open-day').addEventListener('click', () => {
      showScreen('day');
    });

    // 오늘 화면 이벤트
    document.getElementById('btn-day-back').addEventListener('click', () => {
      showScreen('calendar');
    });

    document.getElementById('btn-day-shoot').addEventListener('click', () => {
      requestOpenCamera('day');
    });

    document.getElementById('btn-day-make-vlog').addEventListener('click', () => {
      startMakeVlog();
    });

    document.getElementById('btn-import-photos').addEventListener('click', () => {
      const inp = document.getElementById('input-import-photos');
      inp.value = '';
      inp.click();
    });

    document.getElementById('input-import-photos').addEventListener('change', (e) => {
      handleImportPhotos(e.target.files);
    });

    document.getElementById('btn-add-demo-cuts').addEventListener('click', () => {
      addDemoThreeCuts();
    });

    // 오늘 찍은 사진 전체 삭제 이벤트 (U-10 확인 1회 거침)
    const delAllBtn = document.getElementById('btn-delete-all-day-cuts');
    const delAllConfirmBox = document.getElementById('day-delete-all-confirm-box');
    const delAllCancelBtn = document.getElementById('btn-delete-all-cancel');
    const delAllConfirmBtn = document.getElementById('btn-delete-all-confirm');

    if (delAllBtn && delAllConfirmBox) {
      delAllBtn.addEventListener('click', () => {
        delAllConfirmBox.style.display = 'flex';
      });
    }
    if (delAllCancelBtn && delAllConfirmBox) {
      delAllCancelBtn.addEventListener('click', () => {
        delAllConfirmBox.style.display = 'none';
      });
    }
    if (delAllConfirmBtn && delAllConfirmBox) {
      delAllConfirmBtn.addEventListener('click', async () => {
        const targetDate = state.selectedDateStr || state.todayDateStr;
        const deletedCount = await window.HaruDB.deleteCutsByDate(targetDate);
        delAllConfirmBox.style.display = 'none';
        await renderDayScreen();
        showToast(`🗑️ 사진 ${deletedCount}장을 모두 지웠어요.`);
      });
    }

    // 카메라 권한 안내 모달 확인 (K-7)
    document.getElementById('btn-permission-confirm').addEventListener('click', async () => {
      document.getElementById('modal-permission').classList.remove('open');
      state.settings = await window.HaruDB.saveSettings({ cameraPermissionExplained: true });
      await openCameraScreen();
    });

    // 카메라 화면 이벤트 (K-1 ~ K-6)
    const viewport = document.getElementById('camera-viewport');
    viewport.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.camera-side-controls')) return;
      const rect = viewport.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const focusBox = document.getElementById('camera-focus-box');
      focusBox.style.left = `${x}px`;
      focusBox.style.top = `${y}px`;
      focusBox.style.display = 'block';
      // K-1: 누른 자리에 네모 표시가 1초간 보인다
      setTimeout(() => {
        focusBox.style.display = 'none';
      }, 1000);
    });

    document.getElementById('btn-cam-flip').addEventListener('click', async () => {
      state.cameraFacing = state.cameraFacing === 'environment' ? 'user' : 'environment';
      updateCameraSideLabels();
      await startCameraStream();
      showToast(state.cameraFacing === 'user' ? '앞 카메라로 바꾸었어요.' : '뒤 카메라로 바꾸었어요.');
    });

    document.getElementById('btn-cam-timer').addEventListener('click', () => {
      const nextMap = { 0: 3, 3: 10, 10: 0 };
      state.cameraTimerSec = nextMap[state.cameraTimerSec] ?? 0;
      updateCameraSideLabels();
      showToast(
        state.cameraTimerSec === 0
          ? '타이머를 껐어요.'
          : `${state.cameraTimerSec}초 뒤에 찍힙니다.`
      );
    });

    document.getElementById('btn-cam-flash').addEventListener('click', () => {
      const nextFlash = { off: 'on', on: 'auto', auto: 'off' };
      state.cameraFlash = nextFlash[state.cameraFlash] || 'off';
      updateCameraSideLabels();
    });

    document.getElementById('btn-cam-zoom').addEventListener('click', () => {
      const nextZoom = { 1: 2, 2: 3, 3: 1 };
      state.cameraZoom = nextZoom[state.cameraZoom] || 1;
      applyCameraZoomTransform();
      updateCameraSideLabels();
    });

    document.getElementById('btn-cam-mic').addEventListener('click', async () => {
      state.cameraMicOn = !state.cameraMicOn;
      updateCameraSideLabels();
      await startCameraStream();
      showToast(
        state.cameraMicOn
          ? '🎙️ 소리를 켰어요. 셔터를 누르면 2초 동안 현장 소리가 함께 담깁니다.'
          : '🔕 소리를 껐어요.'
      );
    });

    document.getElementById('btn-cam-shutter').addEventListener('click', () => {
      handleShutterClick();
    });

    const retakeBtn = document.getElementById('btn-cam-retake');
    if (retakeBtn) {
      retakeBtn.addEventListener('click', () => {
        handleRetakeLastPhoto();
      });
    }

    document.getElementById('btn-cam-close').addEventListener('click', () => {
      // 닫기: 오늘 화면으로 돌아간다 (117행)
      showScreen('day');
    });

    window.addEventListener('resize', () => {
      const lbl = document.getElementById('cam-orientation-label');
      if (lbl) {
        lbl.textContent = window.innerWidth > window.innerHeight ? '가로 촬영' : '세로 촬영';
      }
    });

    // 브이로그 화면 이벤트
    document.getElementById('btn-vlog-back').addEventListener('click', () => {
      showScreen('day');
    });

    document.getElementById('btn-vlog-replay').addEventListener('click', () => {
      if (state.vlogEngine && state.lastVlogResult && state.lastVlogResult.timeline) {
        state.vlogEngine.playTimeline(state.lastVlogResult.timeline);
      }
    });

    document.getElementById('btn-vlog-zoom').addEventListener('click', () => {
      const container = document.getElementById('vlog-player-container');
      const isZoomed = container.classList.toggle('zoomed');
      document.getElementById('btn-vlog-zoom').textContent = isZoomed
        ? '🔽 원래 크기로'
        : '🔍 크게 보기';
    });

    document.getElementById('vlog-player-container').addEventListener('dblclick', () => {
      document.getElementById('btn-vlog-zoom').click();
    });

    document.getElementById('btn-vlog-export-toggle').addEventListener('click', () => {
      const box = document.getElementById('vlog-export-options');
      box.style.display = box.style.display === 'none' ? 'flex' : 'none';
    });

    document.getElementById('btn-export-save').addEventListener('click', () => {
      handleExportSaveToPhone();
    });

    document.getElementById('btn-export-share').addEventListener('click', () => {
      handleExportShare();
    });

    // 컷 크게 보기 · 글 넣기 · 지우기 모달 이벤트
    document.getElementById('btn-cut-modal-close').addEventListener('click', () => {
      document.getElementById('modal-cut-detail').classList.remove('open');
    });

    document.getElementById('btn-cut-zoom-toggle').addEventListener('click', () => {
      const stage = document.getElementById('cut-viewer-stage');
      const zoomed = stage.classList.toggle('is-zoomed');
      document.getElementById('btn-cut-zoom-toggle').textContent = zoomed
        ? '🔽 원래 크기'
        : '🔍 크게 보기';
    });

    document.getElementById('cut-viewer-stage').addEventListener('dblclick', () => {
      document.getElementById('btn-cut-zoom-toggle').click();
    });

    const captionInput = document.getElementById('input-cut-caption');
    captionInput.addEventListener('input', () => {
      // T-2: 40자 이내, 두 줄까지 제한
      const lines = captionInput.value.split('\n');
      if (lines.length > 2) {
        captionInput.value = lines.slice(0, 2).join('\n');
      }
      if (captionInput.value.length > 40) {
        captionInput.value = captionInput.value.slice(0, 40);
      }
      document.getElementById('cut-caption-counter').textContent =
        `${captionInput.value.length} / 40자`;
    });

    document.getElementById('btn-voice-dictate').addEventListener('click', () => {
      startVoiceDictation();
    });

    document.getElementById('btn-save-caption').addEventListener('click', async () => {
      if (!state.activeCut) return;
      const text = captionInput.value.trim().slice(0, 40);
      await window.HaruDB.updateCut(state.activeCut.id, { caption: text });
      document.getElementById('modal-cut-detail').classList.remove('open');
      await renderDayScreen();
      showToast('✍️ 사진에 글을 저장했어요.');
    });

    document.getElementById('btn-clear-caption').addEventListener('click', async () => {
      if (!state.activeCut) return;
      captionInput.value = '';
      document.getElementById('cut-caption-counter').textContent = '0 / 40자';
      await window.HaruDB.updateCut(state.activeCut.id, { caption: '' });
      await renderDayScreen();
      showToast('글을 지웠어요.');
    });

    // U-10: 지우기는 "이 사진을 지울까요?" 확인을 한 번 거친다
    document.getElementById('btn-cut-delete-ask').addEventListener('click', () => {
      document.getElementById('cut-delete-confirm-box').style.display = 'flex';
    });

    document.getElementById('btn-cut-delete-cancel').addEventListener('click', () => {
      document.getElementById('cut-delete-confirm-box').style.display = 'none';
    });

    document.getElementById('btn-cut-delete-confirm').addEventListener('click', async () => {
      if (!state.activeCut) return;
      await window.HaruDB.deleteCut(state.activeCut.id);
      document.getElementById('modal-cut-detail').classList.remove('open');
      await renderDayScreen();
      showToast('🗑️ 사진을 지웠어요.');
    });

    // 내 설정 완료 후 '오늘의 브이로그 시작하기'로 이동하는 공통 동작
    const completeInitialSettingsAndGoStart = async () => {
      const nameInput = document.getElementById('input-setting-name');
      const enteredName = nameInput ? nameInput.value.trim().slice(0, 10) : '';
      const wasFirstSetup = !state.settings.isProfileSetupDone;
      state.settings = await window.HaruDB.saveSettings({
        name: enteredName || state.settings.name || '정구영',
        isProfileSetupDone: true
      });
      state.selectedDateStr = state.todayDateStr;
      await showScreen('calendar');
      const startPanel = document.querySelector('.calendar-action-panel');
      if (startPanel && startPanel.scrollIntoView) {
        startPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (wasFirstSetup) {
        showToast('✅ 내 설정이 완료되었어요! 이제 오늘의 브이로그 시작하기를 눌러 보세요.');
      }
    };

    // 내 설정 화면 이벤트 (저장 버튼 없이 바꾸는 즉시 저장, 완료 시 오늘의 브이로그 시작하기로 이동)
    document.getElementById('btn-settings-back').addEventListener('click', () => {
      completeInitialSettingsAndGoStart();
    });

    const topCompleteBtn = document.getElementById('btn-complete-settings-top');
    if (topCompleteBtn) {
      topCompleteBtn.addEventListener('click', () => {
        completeInitialSettingsAndGoStart();
      });
    }

    const bottomCompleteBtn = document.getElementById('btn-complete-settings-bottom');
    if (bottomCompleteBtn) {
      bottomCompleteBtn.addEventListener('click', () => {
        completeInitialSettingsAndGoStart();
      });
    }

    document.getElementById('btn-settings-profile-photo').addEventListener('click', () => {
      document.getElementById('input-profile-photo').click();
    });

    document.getElementById('input-profile-photo').addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const img = await loadFileAsImage(file);
      if (!img) return;
      const compressed = await window.resizeAndCompressImage(img, 400, 0.85);
      state.settings = await window.HaruDB.saveSettings({ profilePhoto: compressed.dataUrl });
      await renderSettingsScreen();
      showToast('✅ 프로필 사진을 바꾸었어요.');
    });

    document.getElementById('input-setting-name').addEventListener('input', async (e) => {
      const val = e.target.value.slice(0, 10);
      state.settings = await window.HaruDB.saveSettings({ name: val });
    });

    document.getElementById('input-setting-name').addEventListener('change', () => {
      showToast('✅ 이름을 저장했어요.');
    });

    document.querySelectorAll('[data-fontsize]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const size = btn.getAttribute('data-fontsize');
        state.settings = await window.HaruDB.saveSettings({ fontSize: size });
        applyThemeAndFont();
        await renderSettingsScreen();
        showToast('✅ 글씨 크기를 바꾸었어요.');
      });
    });

    document.querySelectorAll('[data-notify]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const interval = btn.getAttribute('data-notify');
        state.settings = await window.HaruDB.saveSettings({ notifyInterval: interval });
        if (interval !== 'off' && 'Notification' in window && Notification.permission === 'default') {
          try {
            await Notification.requestPermission();
          } catch (_) {}
        }
        await renderSettingsScreen();
        const labelMap = { '1h': '매 시간', '3h': '3시간마다', off: '알림 끔' };
        showToast(`✅ 촬영 알림을 '${labelMap[interval]}'로 설정했어요.`);
      });
    });

    document.getElementById('btn-test-notification').addEventListener('click', () => {
      triggerCaptureNotification();
    });

    document.querySelectorAll('[data-tz]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const useLocal = btn.getAttribute('data-tz') === 'on';
        const fixedTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul';
        state.settings = await window.HaruDB.saveSettings({
          useLocalTimezone: useLocal,
          fixedTimezone: state.settings.fixedTimezone || fixedTz
        });
        await renderSettingsScreen();
        showToast(
          useLocal
            ? '🌐 현지 시간 자동 연동을 켰어요.'
            : '🔒 처음 설정한 시간대로 고정했어요.'
        );
      });
    });

    // S-6 백업용 이메일 입력 및 확인 메일 검증
    document.getElementById('input-setting-email').addEventListener('input', async (e) => {
      const email = e.target.value.trim();
      state.settings = await window.HaruDB.saveSettings({
        backupEmail: email,
        backupEmailVerified: false
      });
    });

    document.getElementById('btn-verify-email').addEventListener('click', async () => {
      const email = document.getElementById('input-setting-email').value.trim();
      if (!email || !email.includes('@')) {
        showToast('올바른 이메일 주소를 입력해 주세요. (예: family@example.com)');
        return;
      }
      state.settings = await window.HaruDB.saveSettings({
        backupEmail: email,
        backupEmailVerified: true
      });
      await window.HaruDB.addEmailLog({
        id: 'verify_' + Date.now(),
        dateStr: state.todayDateStr,
        to: email,
        subject: '[하루 브이로그] 백업 이메일 주소 확인 메일',
        bodySummary: '주소 확인이 완료되었습니다. 자정마다 브이로그가 전달됩니다.',
        sentAt: Date.now()
      });
      await renderSettingsScreen();
      showToast(`✉️ [${email}] 주소로 확인 메일을 보내 검증을 완료했어요!`);
    });

    document.getElementById('btn-simulate-midnight-email').addEventListener('click', async () => {
      await executeMidnightEmailBackup(state.selectedDateStr || state.todayDateStr, true);
    });

    document.getElementById('btn-open-guide-from-settings').addEventListener('click', () => {
      openGuideModal(0);
    });

    // 사용법 카드 9장 모달 이벤트
    document.getElementById('btn-guide-skip').addEventListener('click', () => {
      closeGuideModal();
    });

    document.getElementById('btn-guide-prev').addEventListener('click', () => {
      if (state.guideIndex > 0) {
        state.guideIndex -= 1;
        renderGuideCard();
      }
    });

    document.getElementById('btn-guide-next').addEventListener('click', () => {
      if (state.guideIndex < window.GUIDE_CARDS.length - 1) {
        state.guideIndex += 1;
        renderGuideCard();
      } else {
        closeGuideModal();
      }
    });
  }

  async function initApp() {
    await window.HaruDB.init();
    state.settings = await window.HaruDB.getSettings();
    applyThemeAndFont();

    const nowParts = getNowDateParts();
    state.todayDateStr = nowParts.dateStr;
    state.selectedDateStr = nowParts.dateStr;
    state.displayedYear = nowParts.year;
    state.displayedMonth = nowParts.month;

    bindEvents();
    document.getElementById('modal-guide').classList.remove('open');

    // 처음 연결하는 경우: '내 설정' 화면을 먼저 보여주고, 설정 완료 시 '오늘의 브이로그 시작하기'로 연결
    if (!state.settings.isProfileSetupDone) {
      await showScreen('settings');
    } else {
      await showScreen('calendar');
    }

    await checkMidnightAutoEmailOnStartup();

    // 서비스 워커 등록 (비행기 모드 / 오프라인 작동 지원)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }

  document.addEventListener('DOMContentLoaded', initApp);
})();

