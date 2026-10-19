(function () {
  'use strict';

  // === 데이터 — 빌드 때 #ax-data에 넣은 JSON. 화면에 넣는 값은 전부 textContent로만 쓴다 ===
  var DATA = JSON.parse(document.getElementById('ax-data').textContent);
  var META = DATA.meta;
  var SOURCE_ORDER = ['gov', 'consulting', 'intl', 'chungram'];
  var ROLE_ORDER = ['staff', 'leader', 'planner'];
  var CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
  var SAVE_DELAY_MS = 400;
  var KEYS = {
    answers: META.storagePrefix + 'answers',
    read: META.storagePrefix + 'read',
    role: META.storagePrefix + 'role',
    theme: 'cr-viz-theme',
  };
  var itemsById = {};
  DATA.library.forEach(function (item) { itemsById[item.id] = item; });

  // === 저장소 헬퍼 — 사파리 프라이빗 모드 등에서 예외로 페이지가 죽는 것을 막는다 ===
  function safeGet(key) {
    try { return localStorage.getItem(key); }
    catch (e) { console.warn('저장소를 읽을 수 없습니다.', e); return null; }
  }
  function safeSet(key, value) {
    try { localStorage.setItem(key, value); return true; }
    catch (e) { console.warn('저장소에 쓸 수 없습니다.', e); return false; }
  }
  function safeRemove(key) {
    try { localStorage.removeItem(key); }
    catch (e) { console.warn('저장소에서 삭제할 수 없습니다.', e); }
  }
  function loadJson(key, fallback) {
    var raw = safeGet(key);
    if (!raw) return fallback;
    try { return JSON.parse(raw); }
    catch (e) { console.warn('저장된 값을 읽지 못해 초기화합니다.', key, e); return fallback; }
  }

  // 저장값이 진실의 출처다. 화면은 이 값에 맞춘다.
  var state = {
    answers: loadJson(KEYS.answers, {}),
    read: loadJson(KEYS.read, {}),
    role: ROLE_ORDER.indexOf(safeGet(KEYS.role)) !== -1 ? safeGet(KEYS.role) : 'staff',
  };
  function withAnswer(answers, qid, text) {
    var next = Object.assign({}, answers);
    if (text.trim()) next[qid] = text; else delete next[qid];
    return next;
  }
  function withRead(read, id, isRead) {
    var next = Object.assign({}, read);
    if (isRead) next[id] = true; else delete next[id];
    return next;
  }

  // === DOM 헬퍼 ===
  function el(tag, props, children) {
    var node = document.createElement(tag);
    var p = props || {};
    if (p.className) node.className = p.className;
    if (p.text !== undefined) node.textContent = p.text;
    Object.keys(p.attrs || {}).forEach(function (name) { node.setAttribute(name, p.attrs[name]); });
    Object.keys(p.on || {}).forEach(function (type) { node.addEventListener(type, p.on[type]); });
    (children || []).forEach(function (child) { if (child) node.appendChild(child); });
    return node;
  }
  function byId(id) { return document.getElementById(id); }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); return node; }
  function announce(message) { byId('liveRegion').textContent = message; }
  function isHttp(url) { return /^https?:\/\//i.test(url || ''); }
  function externalLink(url, text, className) {
    if (!isHttp(url)) return el('span', { text: text, className: className });
    return el('a', { text: text, className: className, attrs: { href: url, target: '_blank', rel: 'noopener noreferrer' } });
  }
  function formatDate(text) { return String(text || '').replace(/-/g, '.'); }

  // === 라벨 — 자료 1건당 최대 3개(우선순위·출처·난이도) ===
  function roleNames(roles) { return roles.map(function (r) { return META.roleLabels[r]; }).join('·'); }
  function priorityLabel(item) {
    if (item.priority === 'must') return el('span', { className: 'label label-must', text: '필독' });
    if (item.priority === 'recommended') {
      return el('span', { className: 'label label-rec', text: '추천 · ' + roleNames(item.recommendedFor || []) });
    }
    return null;
  }
  function sourceLabel(type) {
    return el('span', { className: 'label label-src src-' + type, text: META.sourceTypeLabels[type] });
  }
  function itemBadges(item) {
    return el('div', { className: 'badges' }, [
      item.isPreview ? el('span', { className: 'label label-preview', text: '검수 전' }) : null,
      priorityLabel(item),
      sourceLabel(item.sourceType),
      el('span', { className: 'label', text: item.level }),
      item.isNew ? el('span', { className: 'label label-new', text: '새 자료' }) : null,
    ]);
  }
  function itemMeta(item) {
    return el('p', { className: 'item-meta', text: [item.issuer, formatDate(item.date), item.minutes + '분'].join(' · ') });
  }
  function emptyState(text) { return el('p', { className: 'empty', text: text }); }

  // === 카드·행 ===
  function itemCard(item) {
    var card = el('article', { className: 'item-card' + (item.priority === 'must' ? ' is-must-card' : '') }, [
      itemBadges(item),
      el('h4', {}, [el('a', { text: item.titleKo, attrs: { href: '#item/' + item.id } })]),
      itemMeta(item),
      el('p', { className: 'item-lead', text: (item.summaryKo || [])[0] || '' }),
      state.read[item.id] ? el('span', { className: 'read-mark', text: '✓ 읽음' }) : null,
    ]);
    return card;
  }
  function itemRow(item) {
    return el('li', { className: 'row' }, [
      el('a', { className: 'row-title', text: item.titleKo + (state.read[item.id] ? '  ✓' : ''), attrs: { href: '#item/' + item.id } }),
      itemMeta(item),
      itemBadges(item),
    ]);
  }
  function fillCards(container, items, emptyText) {
    clear(container);
    if (!items.length) { container.appendChild(emptyState(emptyText)); return; }
    items.forEach(function (item) { container.appendChild(itemCard(item)); });
  }
  function sourceGroups(items, emptyText) {
    var wrap = el('div');
    SOURCE_ORDER.forEach(function (type) {
      var list = items.filter(function (item) { return item.sourceType === type; });
      var group = el('section', { className: 'src-group src-' + type }, [
        el('div', { className: 'src-group-head' }, [
          el('h3', { text: META.sourceTypeLabels[type] }),
          el('span', { className: 'count', text: list.length + '건' }),
        ]),
        list.length ? el('ul', { className: 'rows' }, list.map(itemRow)) : emptyState(emptyText),
      ]);
      wrap.appendChild(group);
    });
    return wrap;
  }

  // === 홈 ===
  function renderRoleTabs() {
    var tabs = clear(byId('roleTabs'));
    ROLE_ORDER.forEach(function (role) {
      var selected = role === state.role;
      tabs.appendChild(el('button', {
        text: META.roleLabels[role],
        attrs: { type: 'button', role: 'tab', 'aria-selected': String(selected), tabindex: selected ? '0' : '-1', 'data-role': role },
        on: { click: function () { selectRole(role); } },
      }));
    });
  }
  function selectRole(role) {
    state.role = role;
    safeSet(KEYS.role, role);
    renderRoleTabs();
    renderRecommended();
    var active = byId('roleTabs').querySelector('[data-role="' + role + '"]');
    if (active) active.focus();
  }
  function renderRecommended() {
    var list = DATA.library.filter(function (item) {
      return item.priority === 'recommended' && (item.recommendedFor || []).indexOf(state.role) !== -1;
    });
    fillCards(byId('recList'), list, META.roleLabels[state.role] + ' 추천 자료는 청람 검수 후 공개됩니다.');
  }
  function renderHome() {
    var must = DATA.library.filter(function (item) { return item.priority === 'must'; });
    var mustList = byId('mustList');
    mustList.classList.toggle('is-must', must.length > 1);
    fillCards(mustList, must, '필독 자료는 청람 검수를 마치면 이곳에 올라옵니다.');
    renderRoleTabs();
    renderRecommended();
    byId('allSummary').textContent = '전체 자료 ' + DATA.library.length + '건 펼치기';
    clear(byId('allList')).appendChild(sourceGroups(DATA.library, '아직 검수된 자료가 없습니다.'));
  }
  byId('roleTabs').addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var step = e.key === 'ArrowRight' ? 1 : -1;
    var index = (ROLE_ORDER.indexOf(state.role) + step + ROLE_ORDER.length) % ROLE_ORDER.length;
    selectRole(ROLE_ORDER[index]);
  });

  // === 새 자료 피드 ===
  function feedItem(item) {
    return el('li', { className: 'feed-item' }, [
      el('div', { className: 'badges' }, [
        sourceLabel(item.sourceType),
        el('span', { className: 'label label-auto', text: '자동 수집' }),
        item.promoted ? el('span', { className: 'label label-rec', text: '라이브러리 수록' }) : null,
      ]),
      externalLink(item.url, item.title + ' ↗'),
      el('p', { className: 'item-meta', text: item.issuer + ' · 발표 ' + formatDate(item.date) }),
      el('p', { className: 'feed-summary' }, [
        el('span', { className: 'label label-auto', text: 'AI 요약' }),
        document.createTextNode(item.summaryPending ? '요약을 준비하고 있습니다. 원문을 먼저 확인해 주세요.' : item.summaryAi),
      ]),
    ]);
  }
  function renderFeed() {
    var recent = DATA.feed.recent;
    var archive = DATA.feed.archive;
    var list = clear(byId('feedList'));
    if (!recent.length) list.appendChild(el('li', {}, [emptyState('최근 4주 동안 새로 모은 자료가 없습니다.')]));
    recent.forEach(function (item) { list.appendChild(feedItem(item)); });
    byId('feedArchiveDetails').hidden = !archive.length;
    byId('feedArchiveSummary').textContent = '지난 자료 ' + archive.length + '건';
    var archiveList = clear(byId('feedArchive'));
    archive.forEach(function (item) { archiveList.appendChild(feedItem(item)); });
    byId('feedCount').textContent = recent.length ? String(recent.length) : '';
  }

  // === AX 논리 지도 ===
  function countByStage(n) {
    return DATA.library.filter(function (item) { return (item.stage || []).indexOf(n) !== -1; }).length;
  }
  function renderMap() {
    var grid = clear(byId('stageGrid'));
    DATA.stages.forEach(function (stage) {
      var isDraft = stage.draft === true;
      var count = countByStage(stage.n);
      var tile = el('button', {
        className: 'stage-tile',
        attrs: { type: 'button' },
        on: { click: function () { location.hash = 'library/stage-' + stage.n; } },
      }, [
        el('span', { className: 'stage-num', text: CIRCLED[stage.n - 1], attrs: { 'aria-hidden': 'true' } }),
        el('span', { className: 'stage-name', text: isDraft ? stage.n + '단계 · 확정 전' : stage.n + '단계 · ' + stage.nameKo }),
        isDraft ? null : el('span', { className: 'stage-en', text: stage.name }),
        el('span', { className: 'stage-q', text: isDraft ? '이 단계의 질문은 정리 중입니다.' : stage.question }),
        el('span', { className: 'stage-count', text: '자료 ' + count + '건' }),
      ]);
      if (isDraft) tile.disabled = true;
      grid.appendChild(el('li', {}, [tile]));
    });
  }

  // === 자료실 ===
  function renderLibrary(stageN) {
    var stage = DATA.stages[stageN - 1];
    var items = stage
      ? DATA.library.filter(function (item) { return (item.stage || []).indexOf(stageN) !== -1; })
      : DATA.library;
    var bar = clear(byId('filterBar'));
    bar.hidden = !stage;
    if (stage) {
      bar.appendChild(el('span', { text: CIRCLED[stageN - 1] + ' ' + (stage.nameKo || '확정 전 단계') + ' 단계 자료만 보는 중' }));
      bar.appendChild(el('a', { text: '필터 해제', attrs: { href: '#library' } }));
    }
    clear(byId('libraryGroups')).appendChild(sourceGroups(items, '이 구분에 검수된 자료가 아직 없습니다.'));
  }

  // === 상세 ===
  function factPanel(item) {
    var statusText = { 원문확인: '원문 확인', 원문확인중: '원문 확인 중 · 언론 보도 링크', 개정됨: '개정됨 · 새 자료 확인 필요' }[item.status];
    return el('section', { className: 'panel panel-fact', attrs: { 'aria-labelledby': 'fact-' + item.id } }, [
      el('p', { className: 'panel-kicker', text: item.sourceType === 'gov' ? '발표 내용 (사실)' : '자료 요약', attrs: { id: 'fact-' + item.id } }),
      el('ol', { className: 'summary-list' }, (item.summaryKo || []).map(function (line) { return el('li', { text: line }); })),
      el('div', { className: 'frameworks' }, (item.frameworks || []).map(function (f) { return el('span', { className: 'label', text: f }); })),
      el('div', { className: 'source-link' }, [
        externalLink(item.url, '원문 보기 ↗', 'btn btn-solid'),
        statusText ? el('span', { className: 'label label-status', text: statusText }) : null,
        item.docType ? el('span', { className: 'label', text: item.docType + ' · ' + item.issuerLevel }) : null,
      ]),
      el('div', { className: 'stage-chips' }, (item.stage || []).map(function (n) {
        var stage = DATA.stages[n - 1];
        return el('a', { text: CIRCLED[n - 1] + ' ' + (stage && stage.nameKo ? stage.nameKo : '확정 전'), attrs: { href: '#library/stage-' + n } });
      })),
    ]);
  }
  function questionField(q) {
    var fieldId = 'answer-' + q.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    var status = el('p', { className: 'save-status', attrs: { 'aria-live': 'polite' } });
    var area = el('textarea', { attrs: { id: fieldId, rows: '3', placeholder: '우리 기관·내 업무에 비춰 짧게 적어 보세요.' } });
    area.value = state.answers[q.id] || '';
    var timer = null;
    area.addEventListener('input', function () {
      status.textContent = '입력 중…';
      clearTimeout(timer);
      timer = setTimeout(function () {
        state.answers = withAnswer(state.answers, q.id, area.value);
        var ok = safeSet(KEYS.answers, JSON.stringify(state.answers));
        status.classList.toggle('is-error', !ok);
        status.textContent = ok ? '저장됨' : '저장하지 못했습니다. 사생활 보호 모드라면 일반 창에서 열어 주세요.';
      }, SAVE_DELAY_MS);
    });
    var label = el('label', { text: q.text, attrs: { for: fieldId } });
    if (q.unique) label.appendChild(el('span', { className: 'unique-tag', text: '이 자료 고유 질문' }));
    return el('div', { className: 'q' }, [label, area, status]);
  }
  function viewPanel(item) {
    var roles = ROLE_ORDER.slice().sort(function (a, b) { return (a === state.role ? -1 : 0) - (b === state.role ? -1 : 0); });
    return el('section', { className: 'panel panel-view', attrs: { 'aria-labelledby': 'view-' + item.id } }, [
      el('p', { className: 'panel-kicker', text: '청람의 해석 · 성찰 질문', attrs: { id: 'view-' + item.id } }),
      el('h4', { text: '공공에 주는 시사점' }),
      el('p', { text: item.publicImplication }),
    ].concat(roles.map(function (role) {
      return el('div', { className: 'role-block' }, [
        el('h4', {}, [el('span', { className: 'label', text: META.roleLabels[role] }), document.createTextNode(' 관점에서 답하기')]),
      ].concat((item.questions[role] || []).map(questionField)));
    })));
  }
  function actionPanel(item) {
    if (!item.actionTask) return null;
    return el('section', { className: 'panel panel-act', attrs: { 'aria-label': '이번 주 해보기' } }, [
      el('p', { className: 'panel-kicker', text: '실천 · 이번 주 1가지 해보기' }),
      el('p', { text: item.actionTask }),
      item.samplePrompt ? el('p', { className: 'prompt-box', text: item.samplePrompt }) : null,
      el('p', { className: 'warn-line', text: '⚠ 개인정보·대외비 자료는 AI에 넣지 마세요. 기관이 허용한 AI 도구만 쓰세요.' }),
    ]);
  }
  function renderItem(id) {
    var item = itemsById[id];
    var root = clear(byId('itemDetail'));
    root.appendChild(el('a', { className: 'back-link', text: '← 자료실로', attrs: { href: '#library' } }));
    if (!item) {
      root.appendChild(el('h2', { text: '자료를 찾을 수 없습니다', attrs: { id: 'item-heading' } }));
      root.appendChild(emptyState('검수 전이거나 삭제된 자료입니다. 자료실에서 다른 자료를 골라 주세요.'));
      return;
    }
    var readBox = el('input', { attrs: { type: 'checkbox' } });
    readBox.checked = !!state.read[item.id];
    readBox.addEventListener('change', function () {
      state.read = withRead(state.read, item.id, readBox.checked);
      safeSet(KEYS.read, JSON.stringify(state.read));
      announce(readBox.checked ? '읽음으로 표시했습니다.' : '읽음 표시를 지웠습니다.');
    });
    root.appendChild(el('div', { className: 'item-head' }, [
      itemBadges(item),
      el('h2', { text: item.titleKo, attrs: { id: 'item-heading' } }),
      item.title !== item.titleKo ? el('p', { className: 'orig-title', text: item.title }) : null,
      itemMeta(item),
    ]));
    root.appendChild(factPanel(item));
    root.appendChild(viewPanel(item));
    var act = actionPanel(item);
    if (act) root.appendChild(act);
    root.appendChild(el('label', { className: 'read-toggle' }, [readBox, document.createTextNode('다 읽었어요')]));
  }

  // === 학습일지 ===
  function renderJournal() {
    var root = clear(byId('journalList'));
    var written = DATA.library.map(function (item) {
      var pairs = [];
      ROLE_ORDER.forEach(function (role) {
        (item.questions[role] || []).forEach(function (q) {
          if (state.answers[q.id]) pairs.push({ role: role, q: q, answer: state.answers[q.id] });
        });
      });
      return { item: item, pairs: pairs };
    }).filter(function (entry) { return entry.pairs.length; });
    var total = written.reduce(function (sum, entry) { return sum + entry.pairs.length; }, 0);
    root.appendChild(el('p', { className: 'item-meta', text: '작성한 답 ' + total + '개 · 자료 ' + written.length + '건' }));
    if (!written.length) {
      root.appendChild(emptyState('아직 남긴 답이 없습니다. 자료를 열고 질문에 답을 적어 보세요.'));
      return;
    }
    written.forEach(function (entry) {
      root.appendChild(el('article', { className: 'journal-item' }, [
        el('h3', {}, [el('a', { text: entry.item.titleKo, attrs: { href: '#item/' + entry.item.id } })]),
        itemMeta(entry.item),
        el('dl', {}, entry.pairs.map(function (pair) {
          return el('div', { className: 'journal-qa' }, [
            el('dt', {}, [el('span', { className: 'label', text: META.roleLabels[pair.role] }), document.createTextNode(pair.q.text)]),
            el('dd', { text: pair.answer }),
          ]);
        })),
      ]));
    });
  }
  function clearAnswers() {
    if (!window.confirm('이 브라우저에 저장된 답을 모두 지울까요? 되돌릴 수 없습니다.')) return;
    safeRemove(KEYS.answers);
    state.answers = {};
    renderJournal();
    announce('저장된 답을 모두 지웠습니다.');
  }

  // === 라우터 — #home, #feed, #map, #library, #library/stage-3, #item/gov-001, #journal ===
  var ROUTES = ['home', 'feed', 'map', 'library', 'item', 'journal'];
  function parseHash() {
    var parts = location.hash.replace(/^#/, '').split('/');
    var route = ROUTES.indexOf(parts[0]) !== -1 ? parts[0] : 'home';
    return { route: route, param: decodeURIComponent(parts[1] || '') };
  }
  var isFirstRoute = true;
  function showRoute() {
    var target = parseHash();
    if (target.route === 'item') renderItem(target.param);
    if (target.route === 'library') renderLibrary(parseInt(target.param.replace('stage-', ''), 10) || 0);
    if (target.route === 'journal') renderJournal();
    if (target.route === 'home') renderHome();
    document.querySelectorAll('.view').forEach(function (view) {
      var active = view.getAttribute('data-view') === target.route;
      view.hidden = !active;
      view.classList.toggle('is-entering', active && !isFirstRoute);
    });
    var tabRoute = target.route === 'item' ? 'library' : target.route;
    document.querySelectorAll('[data-route]').forEach(function (link) {
      if (link.getAttribute('data-route') === tabRoute) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    if (!isFirstRoute) {
      var view = document.querySelector('.view:not([hidden])');
      window.scrollTo({ top: document.querySelector('.tabs').offsetTop - 1 });
      var heading = view && view.querySelector('h2');
      if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
    }
    isFirstRoute = false;
  }
  window.addEventListener('hashchange', showRoute);
  // 뒤로 가기로 캐시에서 복원될 때도 저장값 기준으로 다시 그린다
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    state.answers = loadJson(KEYS.answers, {});
    state.read = loadJson(KEYS.read, {});
    showRoute();
  });

  // === 메뉴·테마 ===
  var menu = byId('vizMenuDropdown');
  var menuToggle = byId('vizMenuToggle');
  function closeMenu() { menu.classList.remove('open'); menuToggle.setAttribute('aria-expanded', 'false'); }
  menuToggle.addEventListener('click', function () {
    var isOpen = menu.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.viz-menu')) closeMenu();
    var action = e.target.closest('[data-action]');
    if (!action) return;
    var name = action.getAttribute('data-action');
    if (name === 'theme') applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
    if (name === 'print') { closeMenu(); window.print(); }
    if (name === 'clear-answers') clearAnswers();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  var currentTheme = safeGet(KEYS.theme) || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  function applyTheme(theme) {
    document.documentElement.className = 'theme-' + theme;
    byId('themeIcon').textContent = theme === 'dark' ? '🌙' : '☀️';
    byId('themeLabel').textContent = theme === 'dark' ? '다크' : '라이트';
    safeSet(KEYS.theme, theme);
    currentTheme = theme;
  }

  // === crmc.co.kr 공통 네비 — 실제 사이트에서 열 때만 불러온다. 파일·로컬 미리보기에서는 건너뛴다 ===
  var SITE_HOSTS = /(^|\.)crmc\.co\.kr$|^guyoung-chungram\.github\.io$/i;
  function loadSiteNav() {
    if (!SITE_HOSTS.test(location.hostname)) return;
    var script = document.createElement('script');
    script.src = '/chungram-shared.js';
    script.onload = function () { document.body.classList.add('has-site-nav'); };
    script.onerror = function () { console.warn('공통 네비게이션을 불러오지 못했습니다. 라이브러리만 표시합니다.'); };
    document.body.appendChild(script);
  }

  // === 시작 ===
  applyTheme(currentTheme);
  byId('previewBanner').hidden = !META.preview;
  byId('builtAt').textContent = '업데이트 ' + formatDate(META.builtAt.slice(0, 10));
  renderFeed();
  renderMap();
  showRoute();
  loadSiteNav();
})();
