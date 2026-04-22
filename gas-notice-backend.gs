var SHEET_NAME = 'posts';

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  var action = e.parameter.action;

  if (action === 'create') {
    var np = JSON.parse(e.parameter.data);
    sheet.appendRow([
      np.id, np.cat,
      np.pinned ? 'TRUE' : 'FALSE',
      np.title, np.date, np.author,
      np.views || 0, np.content
    ]);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'delete') {
    var id = e.parameter.id;
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(id)) {
        sheet.deleteRow(i + 1);
        break;
      }
    }
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 기본: 전체 목록 반환
  var data = sheet.getDataRange().getValues();
  var posts = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;
    posts.push({
      id:      Number(row[0]),
      cat:     row[1],
      pinned:  row[2] === true || row[2] === 'TRUE',
      title:   row[3],
      date:    row[4],
      author:  row[5],
      views:   Number(row[6]) || 0,
      content: row[7]
    });
  }
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, posts: posts }))
    .setMimeType(ContentService.MimeType.JSON);
}


function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  sheet.clearContents();
  sheet.appendRow(['id', 'cat', 'pinned', 'title', 'date', 'author', 'views', 'content']);

  var defaults = [
    [1, 'notice', 'TRUE',  '청람M&C AI Lab 웹사이트 오픈 안내',        '2025-03-10', '청람M&C',      128, '안녕하세요, 청람M&C입니다.\n\nAI 교육 컨설팅 전문 플랫폼 CHUNGRAM AI Lab 웹사이트가 새롭게 오픈하였습니다.\n\n주요 기능:\n• 프롬프트 라이브러리 — 검증된 실전 프롬프트 컬렉션\n• 챗봇 지침 라이브러리 — Gems/GPTs용 시스템 프롬프트\n• AI 허브 — 업무별 AI 도구 큐레이션\n• 공지사항 — 최신 소식 및 업데이트\n\n앞으로도 지속적으로 콘텐츠를 확충해 나가겠습니다.\n감사합니다.'],
    [2, 'update', 'TRUE',  '프롬프트 라이브러리 v2.0 업데이트 완료',   '2025-03-09', '청람M&C',       95, '프롬프트 라이브러리가 v2.0으로 업데이트되었습니다.\n\n변경사항:\n• UI/UX 전면 개편 — 다크 모드 기반 새로운 디자인\n• 카테고리 필터링 기능 강화\n• 원클릭 복사 기능 개선\n• 모바일 반응형 최적화\n\n많은 활용 부탁드립니다.'],
    [3, 'ai',     'FALSE', 'AI 허브 — 업무별 AI 도구 큐레이션 오픈',  '2025-03-08', '청람M&C',       72, 'AI 허브 페이지가 오픈되었습니다.\n\n5가지 카테고리로 분류된 AI 도구 모음:\n• Chat — 대화형 AI 어시스턴트\n• Research — 리서치 및 분석 도구\n• Design — 디자인 및 이미지 생성\n• Video — 영상 제작 및 편집\n• Dev — 개발 지원 도구\n\n각 도구의 특징과 활용법을 확인해보세요.'],
    [4, 'edu',    'FALSE', '2026년 상반기 기업교육 프로그램 안내',      '2025-03-07', '정구영 대표',   156, '2026년 상반기 기업교육 프로그램을 안내드립니다.\n\n■ 주요 교육과정\n• AI 활용 업무혁신 — 생성형 AI를 활용한 업무 생산성 향상\n• 리더십 역량강화 — 변화 시대의 리더십 스킬\n• ESG 경영 실무 — 지속가능경영 전략과 실행\n• 조직문화 혁신 — 심리적 안전감과 팀 빌딩\n\n강의 문의: https://forms.gle/ZjcfyiaXt5VZymXe8'],
    [5, 'notice', 'FALSE', '챗봇 지침 라이브러리 신규 콘텐츠 추가',    '2025-03-06', '청람M&C',       63, '챗봇 지침 라이브러리에 새로운 시스템 프롬프트가 추가되었습니다.\n\n신규 추가 지침:\n• 전략적 보고서 작성 도우미\n• 소크라테스식 학습 코치\n• ESG 경영 분석관\n• 조직문화 진단 컨설턴트\n• 창의적 글쓰기 파트너\n\nGemini Gems 또는 ChatGPT의 나만의 GPTs에서 활용하세요.'],
    [6, 'event',  'FALSE', '블로그 BTW(Between World) 연동 안내',       '2025-03-05', '청람M&C',       89, '청람M&C의 공식 블로그 BTW(Between World)가 AI Lab과 연동되었습니다.\n\n블로그 바로가기: https://betweenworld.org'],
    [7, 'update', 'FALSE', '보안 강화 업데이트 적용 완료',              '2025-03-04', '청람M&C',       45, '웹사이트 보안이 강화되었습니다.\n\n적용 항목:\n• 콘텐츠 보안 정책(CSP) 적용\n• AI 크롤러 학습 차단 설정\n• 우클릭 복사 보호 기능\n• XSS/인젝션 방어 헤더 추가\n\n안전하게 이용해 주세요.']
  ];

  defaults.forEach(function(row) { sheet.appendRow(row); });
  Logger.log('setupSheet 완료: ' + defaults.length + '개 기본 데이터 추가');
}
