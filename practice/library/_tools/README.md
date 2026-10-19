# ax_library 운영 메모

청람 AX 공공 러닝 라이브러리의 데이터 검증·빌드 도구. 기준 문서는 `청람 AX 공무원 학습 레퍼런스 라이브러리 PRD.md`(v1.1).

## 폴더

| 경로 | 내용 |
| --- | --- |
| `_src/data/library.json` | 학습 라이브러리(검수 자료). `reviewedBy`가 비어 있으면 공개 빌드에 나오지 않는다 |
| `_src/data/feed.json` | 이번 주 새 자료(자동 수집 결과). 수집기가 덮어쓴다 |
| `_src/data/sources.json` | 수집 대상 등록 목록 |
| `_src/data/stages.json` | AX 10단계 공공판 문구 |
| `_src/template.html`, `styles.css`, `app.js` | 화면 원본. `index.html`을 직접 고치지 않는다 |
| `_tools/` | 검증·빌드 스크립트와 테스트 |
| `index.html` | 공개용 빌드 결과(데이터가 들어간 단일 파일) |
| `_preview/index.html` | 검수 전 자료까지 보이는 미리보기. 공개하지 않는다 |

`_`로 시작하는 폴더는 GitHub Pages(Jekyll)가 공개하지 않는다.

## 명령 (Node 20 이상, 외부 패키지 없음)

```bash
npm test               # 검증·빌드 로직 단위 테스트
npm run validate       # 데이터만 검사
npm run build          # index.html 생성 (검증 오류가 있으면 중단)
npm run build:preview  # _preview/index.html 생성
```

## 검증 규칙 요약

- 필독(`priority: must`)은 검수 완료 자료 기준 최대 5건, 역할별 추천은 역할당 최대 5건
- 성찰 질문은 역할(staff·leader·planner)마다 3문항, 자료마다 `unique: true` 질문 최소 1개
- 질문 id는 전체에서 고유. 학습자 답은 이 id로 저장되므로 한 번 공개한 id는 바꾸지 않는다
- 정부 자료는 `issuerLevel`·`docType`·`status` 필수
- 피드 `summaryAi`는 80자 이내, `sourceId`는 `sources.json`에 있어야 한다
- 학습자 저장 키 접두어: `chungram_axlib_v1_` (스키마가 바뀌면 v2로 올린다)

## 주간 자동 수집 (`_tools/collect.mjs`)

GitHub Actions(`.github/workflows/ax-library-weekly.yml`, 저장소 루트)가 매주 월요일 06:00(KST)에 실행한다. Actions 탭에서 "Run workflow"로 수동 실행·드라이런도 할 수 있다.

```bash
node _tools/collect.mjs --dry-run --no-ai   # 실제 사이트 수집·중복 점검만 (파일 안 씀)
GEMINI_API_KEY=... node _tools/collect.mjs  # 수집 + Gemini 판별·요약 + feed.json 갱신
```

처리 순서: 수집 대상(`sources.json`의 enabled) → robots.txt 확인 → RSS/목록 파싱 → 이미 있는 자료·14일보다 오래된 자료·AI 키워드 없는 자료 제외 → 비슷한 제목은 같은 발표로 묶음(rank가 작은 기관이 대표) → Gemini가 관련성·한 줄 요약(80자)·AX 단계·같은 발표 여부 판별 → 대표 자료 최대 10건(기관당 4건) 추가 → 검증 통과 시 feed.json 저장.

- **Gemini 키가 없거나 호출이 실패하면 새 자료를 올리지 않고 보류**한다. 수집 기간(14일) 안이면 다음 실행에서 다시 판별된다. 키워드만으로는 산업·행사 기사가 섞이기 때문이다.
- 기관 하나가 실패해도 나머지는 계속한다. 모든 기관이 실패하면 실행이 실패로 표시된다(해외 IP 차단 등 확인).
- 조정할 값은 `_tools/lib/collect/config.mjs`에 모여 있다(기간, 상한, 키워드, 모델).
- 새 목록형 기관을 붙이려면 `_tools/lib/collect/parsers.mjs`에 파서를 추가하고 `schema.mjs`의 `LIST_PARSERS`에 이름을 등록한다.

### 처음 한 번 설정

1. 저장소 Settings → Secrets and variables → Actions → New repository secret: `GEMINI_API_KEY`
2. (선택) Variables 탭에 `GEMINI_MODEL` — 비우면 `config.mjs`의 기본 모델을 쓴다. 기관 계정에서 쓸 수 있는 모델명인지 첫 실행 로그로 확인한다.
3. Actions 탭에서 워크플로를 드라이런으로 한 번 실행해 기관별 결과표를 확인한다.
