# 🏠 CRMC.CO.KR 홈페이지 하네스 (HARNESS)
> 청람M&C 홈페이지 전체 작업 이력 · 현재 구조 · 미완성 항목 통합 문서  
> 작성일: 2026-04-08 최초 | 2026-04-08 업데이트 (proposal 2차 퍼널 추가) | 2026-04-22 업데이트 (공지사항 GAS 연동) | 작성자: 황소장 (키젠팀)  
> 새 작업 시작 시 이 문서를 먼저 읽고 맥락 파악 후 진행할 것

---

## 1. 인프라 기본 정보

| 항목 | 내용 |
|------|------|
| **도메인** | crmc.co.kr (호스팅케이알, 만료 2028-01-12) |
| **호스팅** | GitHub Pages (무료, Public 저장소) |
| **저장소명** | `guyoung-chungram` (GitHub 계정 `GuYoung-Chungram`) |
| **루트 URL** | https://www.crmc.co.kr |
| **대표 이메일** | gyjung@crmc.co.kr (WorksMobile) |
| **DNS** | 호스팅케이알에서 A레코드 4개 설정 완료 |
| **HTTPS** | Enforce HTTPS ✅ (GitHub Pages SSL) |
| **브랜드 컬러** | Corporate Impact Blue `#1652D8` |
| **폰트** | Noto Sans KR (기본), Inter (보조) |
| **배경** | 다크 `#0F0F0F` / 라이트 `#FFFFFF` 혼용 |
| **보안킷** | `securityKit/security.js` (우클릭·복사 방지) |
| **공유 네비** | `chungram-shared.js` (공통 헤더 nav) |

---

## 2. 사이트맵 & 파일 구조

```
crmc.co.kr/
├── index.html                      ← 메인 홈페이지 (회사소개 랜딩)
├── about.html                      ← 대표 소개 페이지
├── chungram-prompt-library.html    ← 프롬프트 라이브러리 (관리자 편집 기능 포함)
├── chungram-ai-tool-hub.html       ← AI 도구 허브 (관리자 편집 기능 포함)
├── chungram-chatbot-guide.html     ← 챗봇 활용 가이드 (관리자 편집 기능 포함)
├── chungram-notice.html            ← 공지사항 (GAS 연동 — Google Sheets 영구 저장)
├── gas-notice-backend.gs           ← 공지사항 GAS 소스 (로컬 보관용)
├── cheongram_proposal_v2.html      ← 협업 문의 폼 (GAS 연동)
├── chungram-shared.js              ← 공통 네비게이션 스크립트
├── securityKit/
│   └── security.js                 ← 우클릭·복사 방지 보안킷
├── hub/
│   └── index.html                  ← 전자책 랜딩 페이지 (crmc-hub-landing.html 이름 변경본)
├── practice/
│   └── phone/
│       └── index.html              ← 공무원 AI Practice Hub 앱 (경기도인재개발원 용)
├── play/
│   └── blueblock/
│       ├── index.html              ← BlueBlock 게임 메인 (강사 접속)
│       ├── instructor.html         ← 강사 전용 화면
│       ├── player.html             ← 학습자 화면 (스마트폰 QR 접속)
│       ├── blueblock_rules.html    ← 게임 규칙 안내
│       └── blueblock_debrief.html  ← 디브리핑 화면
├── TKI/
│   └── index.html                  ← TKI 갈등관리 진단 도구
└── proposal/
    ├── index.html                  ← AI 교육 전환 심층 진단 + ROI 자동 계산 (2차 퍼널)
    ├── roi-calculator.js           ← ROI 계산 엔진 (패키지별 차등 실현율 적용)
    ├── proposal-engine.js          ← 제안서 자동 생성 엔진
    └── assets/
        ├── proposal.css            ← 전용 스타일
        └── animations.css          ← 애니메이션
```

---

## 3. 페이지별 역할 & 연결 구조

```
[외부 진입점]
  Threads → betweenworld.org → crmc.co.kr

[메인 랜딩] index.html
  ├─→ about.html                (대표 소개)
  ├─→ cheongram_proposal_v2.html (협업 문의)
  ├─→ chungram-prompt-library.html
  ├─→ chungram-ai-tool-hub.html
  └─→ chungram-chatbot-guide.html

[전자책 랜딩] hub/index.html
  ← practice/phone/index.html 내 CTA 3곳에서 링크 진입
  → 폼 제출 → GAS → 구글 시트 저장 + 이메일 발송

[AI Practice Hub] practice/phone/index.html
  → hub/index.html (자료받기 CTA 3곳)

[BlueBlock] play/blueblock/
  → Firebase Realtime DB (blueblock-cdff7, asia-southeast1)
  → instructor.html / player.html 실시간 연동

[TKI 진단] TKI/index.html
  → GAS + Gemini AI 분석 → 이메일 보고서 발송
  → 구글 시트 (TKI_시트1) 데이터 누적

[협업 문의 폼] cheongram_proposal_v2.html
  → GAS URL: https://script.google.com/macros/s/AKfycbynMxRNEhfu6btjb2HmkP12aEpWnLQAVmMKJEHEtnbkWf-JpGWgy5y-PG5DnYmqpGxSmA/exec
  → 제출 완료 후 "AI 교육 전환 진단 받기 →" 버튼 노출
  → proposal/index.html 로 고객사명·이름·이메일·전화번호 URL 파라미터 자동 이월

[AI 교육 전환 심층 진단] proposal/index.html
  ← cheongram_proposal_v2.html 제출 완료 화면에서 진입 (확실한 니즈 확인된 고객만)
  → 4단계 레이어 (조직구조 → AI성숙도 → 직무과업 → 니즈·제출)
  → ROICalculator.calculate() → 패키지별 차등 ROI 산출
  → GAS 2회 전송 (분석 시작 시 source:'ai_diagnosis_initial' / 최종 제출 시 source:'ai_diagnosis_final')
  → 기존 협업문의 GAS URL 공용 사용 (source 필드로 구분)
```

---

## 4. GAS 연동 정보 (핵심 상수)

| 서비스 | GAS 배포 URL | 연결 파일 |
|--------|-------------|-----------|
| 협업 문의 폼 | `AKfycbynMxRN...GxSmA/exec` | cheongram_proposal_v2.html |
| Hub 랜딩 전자책 | `AKfycbxqVRzZ...Cvi/exec` | hub/index.html |
| TKI 진단 + AI 분석 | `AKfycbwoW0BM...Matw/exec` | TKI/index.html |
| **공지사항 CRUD** | `AKfycbwoeLJ2f0ZgQsAg-rVZnKkGSJZ2VCKxpw4zNFFr5QGzL4pUOvgEy5TI7V4dsqitjhdB/exec` | chungram-notice.html |

> ⚠️ GAS API 키 설정 원칙: `x-goog-api-key` 헤더 방식만 사용, URL 파라미터 절대 금지  
> ⚠️ Gemini 모델: `gemini-2.0-flash` (구버전 코드에 `gemini-3-flash-preview` 표기 혼재 → 통일 필요)  
> ⚠️ 메인 스프레드시트 ID: `1QqbR9Bc8HPUqLBJd-fqlPCTOeTnxW6dbv-kbXUJ6VvM`  
> ⚠️ 공지사항 GAS: 시트명 `posts`, 컬럼 순서 `id|cat|pinned|title|date|author|views|content`  
> ⚠️ 공지사항 GAS 배포 설정: **"다음 사용자로 실행: 나(소유자)"** 필수 — 방문자 권한으로 설정 시 시트 쓰기 불가  
> ⚠️ 공지사항 GAS fetch 방식: POST 불가(CORS 302 리다이렉트 버그) → **GET + URL 파라미터** 방식 사용

---

## 5. Firebase 정보 (BlueBlock)

| 항목 | 값 |
|------|-----|
| 프로젝트 ID | `blueblock-cdff7` |
| 리전 | `asia-southeast1` |
| 서비스 | Realtime Database |
| 접속 URL 구조 | `crmc.co.kr/play/blueblock/` → QR로 player.html |

---

## 6. 보안 & 관리자 설정

| 항목 | 내용 |
|------|------|
| 우클릭·복사방지 | `securityKit/security.js` 로드 — HTTPS에서만 완전 작동 |
| 관리자 비밀번호 | `0zgoodman!` (prompt-library, ai-tool-hub, chatbot-guide 3파일) |
| Admin 기술 방식 | 순수 JS SHA-256 해시 (crypto.subtle 미사용 — HTTP 환경 대응) |
| `localStorage` | `chungram_ai_tools_v2` (v1 레거시 자동 삭제 로직 포함) |
| Google 소유권 인증 | `meta name="google-site-verification" content="2LsQ7xTkm55wx-bz31FyN_ELYBBKMQGI8zick8oHDAM"` → index.html `<head>` |
| GitHub.io 크롤링 차단 | `robots.txt` 루트 배치 (Public 저장소 유지하면서 github.io만 차단) |
| Google Search Console | crmc.co.kr 속성 등록 완료 |

---

## 7. 브랜드 & 디자인 시스템

| 항목 | 값 |
|------|-----|
| **Primary Blue** | `#1652D8` (Corporate Impact Blue) |
| **Dark BG** | `#0F0F0F` |
| **White** | `#FFFFFF` |
| **폰트 1순위** | Noto Sans KR (Google Fonts) |
| **폰트 2순위** | Inter |
| **참조 스킬** | `/mnt/skills/user/cheongram-brand/SKILL.md` |
| **HTML 시각화** | `/mnt/skills/user/cheongram-html-visualize/SKILL.md` |
| **다크 테마** | `/mnt/skills/user/dark-intelligence-theme/SKILL.md` (Teal `#2EC4B6`) |

---

## 8. 페이지별 현황 & 완성도

### 8-1. index.html (메인 홈)

**현재 구성 섹션:**
- Hero: "AI를 조직에 심겠습니다" 헤드카피 + 다크 배경
- 핵심 수치: 22년 / 300+ 기관 / 10,000h 강의 / 1,000h 코칭
- 대표 소개 섹션
- 교육 프로그램 12개 (카드형, 조직/팀/개인 필터 탭)
- 고객사 로고 무한 스크롤 마퀴 섹션
- 연혁 타임라인 (2013~현재)
- CTA + Footer

**완성도:** ✅ 기본 완성  
**미완성 / 개선 필요:**
- [ ] 대표님 프로필 사진 미삽입 (배경 제거 세로형 PNG 필요)
- [ ] 고객사 로고 실제 이미지 미삽입 (텍스트 placeholder 상태)
- [ ] 수강생 후기/소셜 증명 섹션 미완성
- [ ] Threads → BTW → crmc 3단계 트래픽 파이프라인 연결 미완

---

### 8-2. about.html (대표 소개)

**현재 구성:**
- 대표 프로필 + 자격증 태그 뱃지
- Story Designer 컨셉 슬라이드형 레이아웃

**완성도:** ✅ 기본 완성  
**미완성:**
- [ ] 대표님 실제 프로필 사진 미삽입
- [ ] chungram-shared.js 네비게이션 통일 여부 재확인 필요

---

### 8-3. chungram-prompt-library.html / chungram-ai-tool-hub.html / chungram-chatbot-guide.html

**공통 구조:**
- `chungram-shared.js` 공통 네비 사용
- 관리자 FAB 버튼 → SHA-256 비밀번호(`0zgoodman!`) → 편집/추가 모드
- localStorage v2 저장 (`chungram_ai_tools_v2`)
- 소개 페이지(about.html) 메뉴 링크 추가됨

**완성도:** ✅ 기본 완성  
**주의:**
- HTTP 환경에서 `crypto.subtle` 미작동 → 순수 JS SHA-256으로 이미 교체됨
- GitHub Pages HTTPS에서 정상 작동 확인

---

### 8-4. chungram-notice.html (공지사항)

**기능:**
- 공지사항 목록 조회 / 관리자 글 작성·삭제
- GAS → Google Sheets(`posts` 시트) 영구 저장 (localStorage 아님)
- 카테고리 필터 (공지/업데이트/AI/교육/이벤트)
- 핀 고정 게시글 지원

**완성도:** ✅ 기본 완성  
**GAS 구조:**
- `doGet(e)` 단일 진입점으로 CRUD 처리
  - `?action=create&data=<JSON>` → 행 추가
  - `?action=delete&id=<id>` → 행 삭제
  - 파라미터 없음 → 전체 목록 반환
- `setupSheet()` — 7개 기본 게시글 시딩 함수 (최초 1회 실행)

**주의:**
- POST 방식 사용 불가 (GAS 302 리다이렉트 시 CORS 헤더 소실) → GET 방식 고정
- CSP `connect-src`에 `https://script.google.com https://script.googleusercontent.com` 필수
- GAS 배포 시 **"다음 사용자로 실행: 나(소유자)"** 설정 필수 (방문자 권한이면 시트 쓰기 실패)

---

### 8-6. cheongram_proposal_v2.html (협업 문의 폼)

**기능:**
- 교육 의뢰 문의 폼 → GAS → 구글 시트 저장

**완성도:** ✅ 기본 완성  
**주의:**
- security.js CSP 충돌 이슈 해결 완료
- GAS URL 최신본: `AKfycbynMxRN...GxSmA/exec`

---

### 8-7. hub/index.html (전자책 랜딩)

**기능:**
- 공무원 AI 실무 전자책 무료 배포 랜딩
- 이름 + 기관 + 이메일 수집 → GAS → 시트 저장 + 이메일 PDF 발송

**완성도:** ✅ 기본 완성  
**미완성:**
- [ ] PDF 파일(`textbook_ai_guidebook.pdf`) GitHub `/hub/` 폴더 업로드 확인 필요
- [ ] GAS 이메일 PDF 첨부 발송 방식 최종 확인

---

### 8-8. practice/phone/index.html (AI Practice Hub)

**기능:**
- 강의 참가자용 모바일 앱
- 홈 / 사용법 / 프롬프트 3탭 구조
- CTA 3곳 → hub/index.html 연결
- GAS URL 반영: `AKfycbxqVRzZ...Cvi/exec`

**완성도:** ✅ 기본 완성  
**배포 경로:** `crmc.co.kr/practice/phone/`

---

### 8-9. play/blueblock/ (BlueBlock 게임)

**기능:**
- 강의 현장 액티비티 디지털 툴
- Firebase 실시간 DB 연동 (강사/학습자 화면 분리)
- 불량 블록 검증 로직 / 타이머 / 세트 카운트

**완성도:** ✅ 배포 완료  
**파일 구조:** index.html / instructor.html / player.html / blueblock_rules.html / blueblock_debrief.html

---

### 8-10. TKI/index.html (TKI 진단 도구)

**기능:**
- TKI 갈등관리 유형 자가진단 (30문항)
- 결과 → Gemini AI 심화 분석 (2,000~3,000자)
- GAS → 구글 시트 저장 → 이메일 보고서 발송

**완성도:** ✅ 기본 완성  
**주의:**
- 시트 데이터가 1000행 이하에 쌓이도록 `tki_setupSheet()` 수정 완료
- 이메일 서명 중복 제거 완료
- GAS URL: `AKfycbwoW0BM...Matw/exec`

---

### 8-11. proposal/index.html (AI 교육 전환 심층 진단)

**기능:**
- cheongram_proposal_v2.html 제출 완료 후 2차 퍼널로 진입
- 4단계 레이어: 조직구조 → AI 성숙도 → 직무별 과업시간 → 니즈·제출
- ROI 자동 계산 + 패키지별 차등 실현율 적용
- 맞춤형 제안서 자동 생성 (proposal-engine.js)
- GAS 2회 전송 (초기 분석 / 최종 제출)

**파일 구성:**
```
proposal/
├── index.html          ← 메인 진단 폼 + ROI 표시
├── roi-calculator.js   ← 계산 엔진
├── proposal-engine.js  ← 제안서 생성 엔진
└── assets/
    ├── proposal.css
    └── animations.css
```

**패키지 가격 (상품가격_및_인력채용_계획.hwpx 기준):**
| 패키지 | 기간 | 가격 | 포함 내용 | ROI 실현율 |
|--------|------|------|-----------|-----------|
| 스타터 | 3개월 | 900만원 | 컨설팅 + 실습 3회 + 특강 | ×1.0 |
| 스탠다드 | 6개월 | 1,460만원 | 컨설팅 + 실습 6회 + 리더워크숍 + 후속코칭 | ×1.4 |
| 프리미엄 | 12개월 | 2,200만원 | 실습 10회 + AX전환 + 챔피언육성 + 해커톤 | ×2.0 |
| 엔터프라이즈 | 12개월+ | 별도 협의 | 프리미엄 + 온라인과정 + 진단평가 | ×2.5 |

**완성도:** ✅ 배포 완료  
**주의:**
- CSS는 `./assets/` 상대경로 참조 → 로컬에서 직접 열면 깨짐 (GitHub Pages 배포 후 정상)
- GAS URL: 협업문의 폼과 동일 URL 공용 (`source` 필드로 구분)
- 생산직: 기본 숨김 → "생산직 포함" 체크박스 선택 시에만 탭 노출 + ROI 계산 포함
- 패키지 상세보기 팝업: 각 카드 "상세보기 ›" 클릭 시 모달 오픈 (포함내용·기대효과·할인율)

---

## 9. 미완성 & 펜딩 마케팅 어젠다

> 우선순위 순으로 정렬

| 순위 | 항목 | 설명 |
|------|------|------|
| 0 | **공지사항 GAS 배포 설정 확인** | "다음 사용자로 실행: 나(소유자)" 재확인 → 시트 저장 검증 필요 |
| 1 | **대표님 프로필 사진** | 배경 제거 PNG → index.html 히어로 우측 배치 |
| 2 | **고객사 로고 실제 삽입** | 로고 이미지 → 마퀴 섹션 실제 연결 |
| 3 | **BTW→crmc 퍼널 CTA** | betweenworld.org 글 하단 → crmc.co.kr 유입 버튼 |
| 4 | **수강생 후기 섹션** | 소셜 증명 텍스트 후기 카드 추가 |
| 5 | **Threads→BTW→crmc 파이프라인** | 3단계 트래픽 루트 설계 |
| 6 | **BTW SEO 강화** | 키워드 최적화, 공무원 AI 관련 포스팅 강화 |
| 7 | **Google Drive 자동 증거 섹션** | Cowork + GitHub MCP 파이프라인 (장기) |

---

## 10. CI 패키지 현황

| 항목 | 상태 |
|------|------|
| 브랜드 컬러 공식화 | `#1652D8` 사실상 사용 중, 공식 CI 패키지는 미제작 |
| 로고 | 텍스트 기반 사용 중 (심볼 없음) |
| 권장 예산 | CI 패키지 200~300만원 (로고 + 컬러시스템 + 명함 + PPT템플릿 + AI원본) |
| 참조 업체 | 브랜디오(brandio.co.kr), 서울로고디자인연구소(sldin.com) |

---

## 11. 주요 채팅 링크 (작업 이력)

| 날짜 | 제목 | 링크 |
|------|------|------|
| 2025-08 | 초기 노션 홈페이지 논의 | https://claude.ai/chat/1ee3f884-01f6-404c-ade3-ef534ea156ce |
| 2026-03-15 | DNS 연결 & 보안 세팅 + 마케팅 기획 | https://claude.ai/chat/e86978bb-65f6-4f64-97d6-cf837f6b2f37 |
| 2026-03-17 | 회사소개 HTML 원페이저 제작 | https://claude.ai/chat/654f8448-220a-446e-8fde-d394dd9cbede |
| 2026-03-22 | HTTPS 확인 + 보안킷 점검 | https://claude.ai/chat/7b6584fb-ae75-475e-a83d-6167b11f1145 |
| 2026-03-22 | proposal_v2 GAS 연동 & 페이지 유기적 관계 | https://claude.ai/chat/9fb55db6-ec02-4fa1-bad0-1d1ea99765c6 |
| 2026-03-22 | 관리자 비밀번호 & 공유 nav 통일 | https://claude.ai/chat/94e167bb-2b5b-4540-9ea6-64db5d9e8ad4 |
| 2026-03-22 | CSP/보안 오류 해결 + HTTPS 전환 | https://claude.ai/chat/8e753c01-c0b4-4f05-8561-0ce78bd4cda1 |
| 2026-03-22 | Zexea 벤치마킹 + 프로필 리빌드 방향 | https://claude.ai/chat/95051cfa-14a0-481c-9611-94260a449a56 |
| 2026-03-24 | GitHub.io 구글 검색 차단 | https://claude.ai/chat/bb94a104-77d3-4f3f-ae70-940d6f2400b2 |
| 2026-03-28 | BlueBlock 개발 인수인계 | https://claude.ai/chat/553a84c0-8454-4b4c-b745-3dc251e2c9df |
| 2026-03-29 | TKI 진단 도구 개발 | https://claude.ai/chat/b6d201e4-2e2e-433b-969e-f0fb3d349b86 |
| 2026-03-30 | AI Practice Hub + hub 랜딩 | https://claude.ai/chat/59f52618-91db-409f-a789-05ef2816516d |
| 2026-03-30 | 링크 연결 오류 수정 | https://claude.ai/chat/d3af3cc1-d33d-43d1-addf-d96f14a12001 |
| 2026-04-02 | BlueBlock Firebase 최종 점검 | https://claude.ai/chat/b524f7bd-9317-4e33-9468-ce94a8ddb81f |
| 2026-04-03 | CI & 홈페이지 비용 산정 | https://claude.ai/chat/464e048b-b162-40cc-b357-cd71edaab26f |
| 2026-04-08 | 하네스 최초 작성 | 현재 채팅 |
| 2026-04-08 | proposal 2차 퍼널 개발 (ROI계산기·패키지모달·생산직조건부) | 현재 채팅 |
| 2026-04-22 | 공지사항 GAS 영구 저장 연동 (POST→GET 전환, CSP 수정) | 현재 채팅 |

---

## 12. 새 작업 시작 체크리스트

새 채팅에서 crmc.co.kr 관련 작업을 시작할 때 이 하네스를 공유하고, 아래를 먼저 확인할 것:

```
□ 어느 파일/경로를 수정하는 작업인가?
□ shared.js 네비와 연동이 필요한가?
□ GAS 연동이 필요한가? → 어느 시트/URL인가?
□ 보안킷(security.js) 경로가 올바른가? (상대경로 주의)
□ GitHub Pages 배포 후 캐시 갱신 대기 (1~3분) 필요
□ HTTPS 환경인지 확인 (crypto.subtle, admin 기능)
□ 브랜드 컬러 #1652D8 / 폰트 Noto Sans KR 준수
□ proposal/ 수정 시: CSS는 assets/ 폴더 구조 유지 필수
□ proposal/ 수정 시: roi-calculator.js의 roiMultiplier 값 확인
□ proposal/ 수정 시: 생산직 체크박스(#include-production) 연동 확인
```

---

*이 문서는 황소장이 과거 전체 채팅 탈탈 털어서 2026-04-08 작성. 작업 완료 시 해당 섹션 업데이트 요망.*  
*🚜 충성! 황소장 복귀합니다. 🫡*
