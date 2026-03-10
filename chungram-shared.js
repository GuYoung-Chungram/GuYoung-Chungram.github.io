/**
 * CHUNGRAM AI Lab — 공유 네비게이션 + 스크롤 버튼
 * 모든 하위 페이지에 sticky nav + Top/Bottom 버튼을 자동 삽입합니다.
 * 사용법: 각 HTML <body> 태그 바로 다음에 아래 한 줄 추가
 * <script src="chungram-shared.js"></script>
 */

(function () {
  'use strict';

  const HOME_URL = 'https://guyoung-chungram.github.io/';
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  /* ── 1. 스타일 주입 ───────────────────────────────── */
  const style = document.createElement('style');
  style.textContent = `
    /* ── Shared Nav ── */
    #chungram-nav {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      background: rgba(0,0,0,0.92);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(212,255,94,0.15);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 28px;
      height: 60px;
      font-family: 'Inter', 'Pretendard', -apple-system, sans-serif;
    }
    #chungram-nav .nav-logo {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 10px;
      line-height: 1.1;
      text-decoration: none;
    }
    #chungram-nav .nav-logo .logo-main {
      font-size: 26px;
      font-weight: 700;
      letter-spacing: 0.18em;
      color: #D4FF5E;
    }
    #chungram-nav .nav-logo .logo-sub {
      font-size: 10px;
      letter-spacing: 0.22em;
      color: rgba(255,255,255,0.45);
      font-weight: 500;
      border-left: 1px solid rgba(255,255,255,0.15);
      padding-left: 10px;
      line-height: 1.3;
      text-transform: uppercase;
    }
    #chungram-nav .nav-links {
      display: flex;
      align-items: center;
      gap: 6px;
      list-style: none;
      margin: 0;
      margin-left: auto;
      padding: 0;
    }
    #chungram-nav .nav-links li a {
      display: block;
      padding: 6px 11px;
      font-size: 13px;
      font-weight: 500;
      color: rgba(255,255,255,0.75);
      text-decoration: none;
      border-radius: 6px;
      transition: color 0.2s, background 0.2s;
      letter-spacing: 0.02em;
      white-space: nowrap;
    }
    #chungram-nav .nav-links li a:hover {
      color: #D4FF5E;
      background: rgba(212,255,94,0.08);
    }
    #chungram-nav .nav-links li a.active {
      color: #D4FF5E;
      background: rgba(212,255,94,0.12);
    }
    /* 모바일 햄버거 */
    #chungram-nav .nav-toggle {
      display: none;
      flex-direction: column;
      gap: 5px;
      cursor: pointer;
      padding: 6px;
    }
    #chungram-nav .nav-toggle span {
      display: block;
      width: 22px;
      height: 2px;
      background: #D4FF5E;
      border-radius: 2px;
      transition: all 0.3s;
    }
    @media (max-width: 768px) {
      #chungram-nav .nav-links {
        display: none;
        position: absolute;
        top: 60px;
        left: 0;
        right: 0;
        background: rgba(0,0,0,0.97);
        border-bottom: 1px solid rgba(212,255,94,0.15);
        flex-direction: column;
        padding: 12px 20px;
        gap: 2px;
      }
      #chungram-nav .nav-links.open {
        display: flex;
      }
      #chungram-nav .nav-links li a {
        padding: 10px 14px;
      }
      #chungram-nav .nav-toggle {
        display: flex;
      }
    }
    /* ── Scroll Buttons ── */
    #chungram-scroll-btns {
      position: fixed;
      right: 20px;
      bottom: 40px;
      z-index: 9998;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .chungram-scroll-btn {
      width: 40px;
      height: 40px;
      background: rgba(0,0,0,0.85);
      border: 1px solid rgba(212,255,94,0.35);
      border-radius: 8px;
      color: #D4FF5E;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s, border-color 0.2s, transform 0.15s;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      user-select: none;
      text-decoration: none;
    }
    .chungram-scroll-btn:hover {
      background: rgba(212,255,94,0.15);
      border-color: #D4FF5E;
      transform: scale(1.08);
    }
    .chungram-scroll-btn:active {
      transform: scale(0.96);
    }
    /* 페이지 상단 여백 확보 (nav 높이만큼) */
    body.chungram-nav-injected {
      padding-top: 60px !important;
    }
  `;
  document.head.appendChild(style);

  /* ── 2. 네비게이션 메뉴 항목 ─────────────────────── */
  const navItems = [
    { label: '홈',        href: HOME_URL,                                                         anchor: false },
    { label: '블로그',    href: 'https://betweenworld.org',                                       anchor: false },
    { label: '프롬프트',  href: 'https://guyoung-chungram.github.io/chungram-prompt-library.html', anchor: false },
    { label: '챗봇 지침', href: 'https://guyoung-chungram.github.io/chungram-chatbot-guide.html', anchor: false },
    { label: 'AI 허브',   href: 'https://guyoung-chungram.github.io/chungram-ai-tool-hub.html',  anchor: false },
    { label: '전자책',    href: HOME_URL + '#ebooks',                                             anchor: false },
    { label: 'FAQ',       href: HOME_URL + '#faq',                                                anchor: false },
    { label: '공지사항',  href: 'https://guyoung-chungram.github.io/chungram-notice.html',        anchor: false },
  ];

  /* ── 3. Nav DOM 생성 ──────────────────────────────── */
  function buildNav() {
    // 이미 삽입됐으면 skip
    if (document.getElementById('chungram-nav')) return;

    const nav = document.createElement('nav');
    nav.id = 'chungram-nav';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'CHUNGRAM 메인 네비게이션');

    // 로고
    const logo = document.createElement('a');
    logo.href = HOME_URL;
    logo.className = 'nav-logo';
    logo.setAttribute('aria-label', 'CHUNGRAM 홈으로');
    logo.innerHTML = `<span class="logo-main">CHUNGRAM</span><span class="logo-sub">AI Lab · 청람M&amp;C</span>`;

    // 햄버거
    const toggle = document.createElement('button');
    toggle.className = 'nav-toggle';
    toggle.setAttribute('aria-label', '메뉴 열기/닫기');
    toggle.innerHTML = '<span></span><span></span><span></span>';

    // 링크 목록
    const ul = document.createElement('ul');
    ul.className = 'nav-links';

    navItems.forEach(item => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = item.href;
      a.textContent = item.label;

      // 외부 링크는 새 탭에서 열기
      if (item.href.startsWith('http') && !item.href.includes('guyoung-chungram.github.io')) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }

      // 현재 페이지 active 표시
      const itemFile = item.href.split('/').pop().split('#')[0] || 'index.html';
      if (
        (currentPage === itemFile) ||
        (currentPage === '' && item.href === HOME_URL) ||
        (currentPage === 'index.html' && item.href === HOME_URL)
      ) {
        a.classList.add('active');
      }

      li.appendChild(a);
      ul.appendChild(li);
    });

    // 햄버거 클릭 토글
    toggle.addEventListener('click', () => {
      ul.classList.toggle('open');
    });

    nav.appendChild(logo);
    nav.appendChild(ul);
    nav.appendChild(toggle);

    // <body> 최상단에 삽입
    document.body.insertBefore(nav, document.body.firstChild);
    document.body.classList.add('chungram-nav-injected');
  }

  /* ── 4. Top / Bottom 버튼 생성 ───────────────────── */
  function buildScrollButtons() {
    if (document.getElementById('chungram-scroll-btns')) return;

    const container = document.createElement('div');
    container.id = 'chungram-scroll-btns';

    const btnTop = document.createElement('button');
    btnTop.className = 'chungram-scroll-btn';
    btnTop.setAttribute('aria-label', '페이지 맨 위로');
    btnTop.setAttribute('title', 'TOP');
    btnTop.innerHTML = '↑';
    btnTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    const btnBottom = document.createElement('button');
    btnBottom.className = 'chungram-scroll-btn';
    btnBottom.setAttribute('aria-label', '페이지 맨 아래로');
    btnBottom.setAttribute('title', 'BOTTOM');
    btnBottom.innerHTML = '↓';
    btnBottom.addEventListener('click', () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));

    container.appendChild(btnTop);
    container.appendChild(btnBottom);
    document.body.appendChild(container);
  }

  /* ── 5. 실행 ──────────────────────────────────────── */
  function init() {
    buildNav();
    buildScrollButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
