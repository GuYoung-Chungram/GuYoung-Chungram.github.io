/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║   CHUNGRAM M&C AI Lab — Site Security Module v1.1       ║
 * ║   © 2025 청람M&C  |  Unauthorized copy PROHIBITED       ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * [적용 방법] 모든 HTML 파일 <head> 최상단에 삽입:
 *   <script src="보안킷/security.js"></script>
 *
 * [v1.1 수정]
 *  - FIXED: DOMContentLoaded 래핑 → head 최상단 로드 시 body null 오류 해결
 *  - FIXED: 키다운 이벤트는 document 즉시 등록 유지 (DOM 불필요)
 */

(function () {
  "use strict";

  /* ──────────────────────────────────────────
   * 4. 개발자 도구 단축키 차단 — DOM 불필요, 즉시 등록
   * ────────────────────────────────────────── */
  document.addEventListener("keydown", function (e) {
    const blocked =
      e.key === "F12" ||
      (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) ||
      (e.ctrlKey && e.key === "U") ||
      (e.ctrlKey && e.key === "S") ||
      (e.ctrlKey && e.key === "P");
    if (blocked) {
      e.preventDefault();
      if (typeof showSecurityToast === "function") {
        showSecurityToast("🔒 보안 정책에 의해 해당 기능이 제한됩니다.");
      }
      return false;
    }
  });

  /* ──────────────────────────────────────────
   * 나머지 기능 — DOM 준비 후 실행
   * ────────────────────────────────────────── */
  function init() {

    /* 1. 우클릭 방지 */
    document.addEventListener("contextmenu", function (e) {
      e.preventDefault();
      showSecurityToast("🔒 콘텐츠 보호 정책에 의해 우클릭이 제한됩니다.");
      return false;
    });

    /* 2. 텍스트 드래그 선택 방지 */
    document.addEventListener("selectstart", function (e) {
      e.preventDefault();
      return false;
    });

    /* 3. 복사 / 잘라내기 단축키 차단 */
    document.addEventListener("copy", function (e) {
      if (window.__trustedCopy) return;
      e.preventDefault();
      showSecurityToast("🔒 저작권 보호 콘텐츠입니다. 복사가 제한됩니다.");
      return false;
    });
    document.addEventListener("cut", function (e) {
      e.preventDefault();
      return false;
    });

    /* 5. 개발자 도구 오픈 감지 (창 크기 기반) */
    (function devToolsDetect() {
      const threshold = 160;
      setInterval(function () {
        const widthDiff = window.outerWidth - window.innerWidth;
        const heightDiff = window.outerHeight - window.innerHeight;
        if (widthDiff > threshold || heightDiff > threshold) {
          document.body.style.filter = "blur(8px)";
          showSecurityToast("⚠️ 보안 정책: 개발자 도구 사용이 감지되었습니다.", 5000);
          setTimeout(() => { document.body.style.filter = "none"; }, 3000);
        }
      }, 1000);
    })();

    /* 6. iframe 삽입 방지 */
    if (window.top !== window.self) {
      window.top.location = window.self.location;
    }

    /* 7. 드래그 앤 드롭으로 이미지 도용 방지 */
    document.addEventListener("dragstart", function (e) {
      if (e.target.tagName === "IMG" || e.target.tagName === "A") {
        e.preventDefault();
        return false;
      }
    });

    /* 8. 소스 보기 숨김용 콘솔 경고 */
    (function consoleWarning() {
      const style1 = "color:#D4FF5E;background:#000;font-size:18px;font-weight:bold;padding:8px 16px;";
      const style2 = "color:#fff;background:#000;font-size:13px;padding:4px 8px;";
      console.log("%c⚠ STOP!", style1);
      console.log(
        "%c이 사이트의 콘텐츠는 저작권법에 의해 보호됩니다.\n청람M&C의 사전 서면 동의 없이 복제·배포·수정을 금지합니다.\n© 2025 청람M&C AI Lab. All Rights Reserved.",
        style2
      );
    })();

    /* 10. CSS — 사용자 선택 방지 인라인 주입 */
    const css = `
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      img {
        -webkit-user-drag: none !important;
        user-drag: none !important;
        pointer-events: none !important;
      }
      input, textarea, [contenteditable="true"] {
        -webkit-user-select: text !important;
        user-select: text !important;
        pointer-events: auto !important;
      }
    `;
    const styleTag = document.createElement("style");
    styleTag.textContent = css;
    document.head.appendChild(styleTag);

  } // end init()

  /* ──────────────────────────────────────────
   * 9. 보안 토스트 메시지 UI
   * ────────────────────────────────────────── */
  function showSecurityToast(msg, duration = 2500) {
    let toast = document.getElementById("__security_toast__");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "__security_toast__";
      Object.assign(toast.style, {
        position: "fixed",
        bottom: "30px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#000",
        color: "#D4FF5E",
        border: "1px solid #D4FF5E",
        padding: "12px 24px",
        borderRadius: "8px",
        fontFamily: "'Pretendard', sans-serif",
        fontSize: "13px",
        fontWeight: "600",
        zIndex: "99999",
        boxShadow: "0 4px 20px rgba(212,255,94,0.25)",
        letterSpacing: "0.03em",
        transition: "opacity 0.4s ease",
        opacity: "0",
        pointerEvents: "none",
      });
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = "1";
    clearTimeout(toast.__timer);
    toast.__timer = setTimeout(() => { toast.style.opacity = "0"; }, duration);
  }

  /* DOMContentLoaded 또는 이미 로드된 경우 즉시 실행 */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
