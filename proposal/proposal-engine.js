// ════════════════════════════════════════════════════════
// 청람M&C 제안서 자동 생성 엔진
// ════════════════════════════════════════════════════════

const ProposalEngine = (() => {

  // ── 한글 이름 → 영어 이니셜 변환 ─────────────────
  const CHOSUNG = [
    'K','GG','N','D','DD','R','M','B','BB','S','SS',
    'O','J','JJ','C','K','T','P','H'
  ];
  function getInitials(name) {
    return name.split('').filter(c => /[가-힣]/.test(c)).map(c => {
      const code = c.charCodeAt(0) - 0xAC00;
      const cho = Math.floor(code / (21 * 28));
      return CHOSUNG[cho] || '';
    }).join('');
  }

  function generatePassword(name, phone) {
    const initials = getInitials(name || '').toUpperCase() || 'CRMC';
    const phoneLast4 = (phone || '').replace(/[^0-9]/g, '').slice(-4) || '0000';
    return initials + phoneLast4;
  }

  // ── 교육 커리큘럼 데이터 ──────────────────────────
  const CURRICULUM = {
    office: {
      label: '사무직',
      basic: [
        'ChatGPT로 회의록 자동 요약',
        'Gemini로 보고서 초안 작성',
        'Claude로 이메일 다듬기',
        'Notion AI 업무 정리'
      ],
      advanced: [
        'GAS + AI 보고서 자동 생성기',
        '사내 문서 기반 Q&A 챗봇',
        '데이터 분석 자동화 대시보드',
        '부서별 GPT 커스텀 구축'
      ]
    },
    sales: {
      label: '영업/CS직',
      basic: [
        'AI 제안서 초안 생성',
        '고객 응대 스크립트 자동화',
        '경쟁사 분석 AI 리서치'
      ],
      advanced: [
        '고객사 홈페이지 분석 자동화',
        'CRM 자동 입력 에이전트',
        '맞춤 제안서 원클릭 생성기'
      ]
    },
    field: {
      label: '현장직',
      basic: [
        '음성 → 점검 보고서 변환',
        '사진 → 이상 유무 판독',
        'AI 매뉴얼 검색 활용'
      ],
      advanced: [
        '현장 보고 자동화 앱',
        '설비 이상 탐지 시스템',
        '예방정비 스케줄 자동화'
      ]
    },
    production: {
      label: '생산직',
      basic: [
        '불량 패턴 AI 탐지 이해',
        'AI 작업지시서 활용',
        '간단한 데이터 기록 자동화'
      ],
      advanced: [
        '예지보전 AI 시스템 운용',
        '품질 예측 대시보드 구축',
        '생산 최적화 AI 적용'
      ]
    }
  };

  // ── HRD 포트폴리오 ────────────────────────────────
  const HRD_PORTFOLIO = [
    { category: '리더십', items: ['7Habits 기반 리더십 과정', '코칭 리더십 (PCCC 기반)', '의사결정력 & 문제해결 워크숍'] },
    { category: '조직문화', items: ['심리적 안전감 조직 만들기', '세대통합 소통 워크숍', 'FIRO-B 기반 팀 다이나믹스'] },
    { category: '전략·기획', items: ['기획력 향상 과정', 'ESG 경영 이해 (ISO17024 기반)', '변화관리 & 혁신 퍼실리테이션'] },
    { category: '평가·진단', items: ['Harrison Assessment 조직진단', '리더십 360도 피드백', '조직문화 진단 & 개선 컨설팅'] }
  ];

  // ── AI 성숙도 라벨 ────────────────────────────────
  const AI_STAGE_LABELS = {
    1: { name: '시작단계', desc: 'ChatGPT 등 개인 차원 탐색', color: '#EF4444' },
    2: { name: '증강단계', desc: '일부 업무 AI 도구 도입', color: '#F59E0B' },
    3: { name: '응용단계', desc: '부서 단위 AI 워크플로우', color: '#3B82F6' },
    4: { name: '통합단계', desc: '조직 전반 AI 정책 보유', color: '#10B981' }
  };

  // ── 제안서 HTML 생성 ──────────────────────────────
  function generate(data, roi) {
    const password = generatePassword(data.name, data.phone);
    const clientName = data.client || '귀 기관';
    const aiStage = data.aiStage || 1;
    const stageInfo = AI_STAGE_LABELS[aiStage];

    const html = buildProposalHTML(data, roi, password, clientName, aiStage, stageInfo);

    // 새 탭에서 열기
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  function buildProposalHTML(data, roi, password, clientName, aiStage, stageInfo) {
    const painText = (data.painPoints || []).join(', ') || '미선택';
    const deptText = (data.departments || []).join(', ') || '미선택';
    const formatText = (data.eduFormat || []).join(', ') || '미정';
    const meetingText = (data.meetingDates || []).join(', ') || '미정';

    // 로드맵 Phase별 과정
    const activeCurriculum = [];
    if (data.jobData.office.headcount > 0) activeCurriculum.push(CURRICULUM.office);
    if (data.jobData.sales.headcount > 0) activeCurriculum.push(CURRICULUM.sales);
    if (data.jobData.field.headcount > 0) activeCurriculum.push(CURRICULUM.field);
    if (data.jobData.production.headcount > 0) activeCurriculum.push(CURRICULUM.production);
    if (activeCurriculum.length === 0) activeCurriculum.push(CURRICULUM.office);

    return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${clientName} — AI 교육 전환 제안서 | 청람M&C</title>
<meta name="robots" content="noindex,nofollow">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;900&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"><\/script>
<script src="https://unpkg.com/aos@2.3.4/dist/aos.js"><\/script>
<link rel="stylesheet" href="https://unpkg.com/aos@2.3.4/dist/aos.css">
<style>
:root{--cr:#1652D8;--accent:#00D4FF;--dark:#0A0F1E;--glass:rgba(255,255,255,0.05);--glass-b:rgba(255,255,255,0.08);--ff:'Noto Sans KR',sans-serif;}
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:var(--ff);color:#E8E8E8;background:var(--dark);overflow-x:hidden;}

/* Password Overlay */
#pw-overlay{position:fixed;inset:0;z-index:9999;background:var(--dark);display:flex;align-items:center;justify-content:center;}
.pw-box{text-align:center;max-width:400px;padding:40px;}
.pw-icon{font-size:48px;color:var(--accent);margin-bottom:20px;}
.pw-title{font-size:20px;font-weight:700;color:#fff;margin-bottom:8px;}
.pw-desc{font-size:13px;color:rgba(255,255,255,.5);margin-bottom:24px;line-height:1.6;}
.pw-input{width:100%;padding:14px 18px;border:2px solid rgba(255,255,255,.15);border-radius:10px;background:rgba(255,255,255,.05);color:#fff;font-size:16px;font-family:var(--ff);text-align:center;letter-spacing:.15em;outline:none;transition:border-color .2s;}
.pw-input:focus{border-color:var(--accent);}
.pw-btn{width:100%;padding:14px;margin-top:12px;border:none;border-radius:10px;background:linear-gradient(135deg,var(--cr),var(--accent));color:#fff;font-size:15px;font-weight:700;cursor:pointer;font-family:var(--ff);transition:opacity .15s;}
.pw-btn:hover{opacity:.9;}
.pw-error{color:#EF4444;font-size:12px;margin-top:8px;display:none;}

/* Content (hidden until password) */
#proposal-content{display:none;}

/* Sections */
.p-section{padding:80px 0;position:relative;}
.p-container{max-width:900px;margin:0 auto;padding:0 24px;}
.p-section:nth-child(even){background:rgba(255,255,255,.02);}

/* Hero */
.p-hero{min-height:80vh;display:flex;align-items:center;justify-content:center;text-align:center;position:relative;overflow:hidden;}
.p-hero::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,var(--cr),var(--accent));}
.hero-bg-grid{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.03) 1px,transparent 1px);background-size:30px 30px;}
.p-hero-badge{display:inline-block;padding:6px 16px;border-radius:20px;background:rgba(22,82,216,.2);border:1px solid rgba(22,82,216,.4);color:var(--accent);font-size:11px;font-weight:700;letter-spacing:.12em;margin-bottom:20px;}
.p-hero-title{font-size:clamp(28px,5vw,44px);font-weight:900;color:#fff;line-height:1.3;margin-bottom:16px;}
.p-hero-title span{background:linear-gradient(135deg,var(--accent),#A855F7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.p-hero-sub{font-size:16px;color:rgba(255,255,255,.5);line-height:1.7;max-width:600px;margin:0 auto 32px;}
.p-hero-meta{display:flex;gap:24px;justify-content:center;flex-wrap:wrap;font-size:12px;color:rgba(255,255,255,.3);}

/* Section Header */
.s-num{display:inline-block;padding:4px 12px;border-radius:4px;background:linear-gradient(135deg,var(--cr),var(--accent));color:#fff;font-size:10px;font-weight:700;letter-spacing:.15em;margin-bottom:12px;}
.s-title{font-size:28px;font-weight:900;color:#fff;margin-bottom:8px;}
.s-desc{font-size:14px;color:rgba(255,255,255,.5);line-height:1.6;margin-bottom:32px;}

/* Glass Card */
.g-card{background:var(--glass);border:1px solid var(--glass-b);border-radius:16px;padding:28px;margin-bottom:16px;transition:transform .2s,border-color .2s;}
.g-card:hover{transform:translateY(-2px);border-color:rgba(255,255,255,.15);}

/* Metric Row */
.metric-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:24px;}
.metric-card{background:var(--glass);border:1px solid var(--glass-b);border-radius:12px;padding:20px;text-align:center;}
.mc-label{font-size:11px;color:rgba(255,255,255,.4);margin-bottom:8px;text-transform:uppercase;letter-spacing:.08em;}
.mc-value{font-size:24px;font-weight:900;color:#fff;}
.mc-value.accent{background:linear-gradient(135deg,var(--accent),#A855F7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}

/* Chart Container */
.chart-wrap{position:relative;max-width:400px;margin:0 auto 24px;}

/* Timeline */
.tl{position:relative;padding-left:32px;}
.tl::before{content:'';position:absolute;left:12px;top:0;bottom:0;width:2px;background:linear-gradient(180deg,var(--cr),var(--accent),#A855F7);}
.tl-item{position:relative;margin-bottom:28px;}
.tl-dot{position:absolute;left:-26px;top:4px;width:16px;height:16px;border-radius:50%;border:3px solid var(--cr);background:var(--dark);}
.tl-item:nth-child(2) .tl-dot{border-color:var(--accent);}
.tl-item:nth-child(3) .tl-dot{border-color:#A855F7;}
.tl-item:nth-child(4) .tl-dot{border-color:#10B981;}
.tl-phase{font-size:11px;font-weight:700;color:var(--accent);letter-spacing:.1em;margin-bottom:4px;}
.tl-title{font-size:16px;font-weight:700;color:#fff;margin-bottom:6px;}
.tl-desc{font-size:13px;color:rgba(255,255,255,.5);line-height:1.6;}
.tl-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;}
.tl-tag{padding:3px 10px;border-radius:12px;font-size:11px;background:rgba(22,82,216,.15);color:var(--accent);border:1px solid rgba(22,82,216,.3);}

/* Curriculum Grid */
.cur-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;}
.cur-card{background:var(--glass);border:1px solid var(--glass-b);border-radius:12px;padding:20px;}
.cur-card h4{font-size:14px;font-weight:700;color:var(--accent);margin-bottom:12px;display:flex;align-items:center;gap:8px;}
.cur-card h4 i{font-size:12px;}
.cur-list{list-style:none;font-size:13px;color:rgba(255,255,255,.7);line-height:1.8;}
.cur-list li::before{content:'→ ';color:var(--accent);}
.cur-label{font-size:10px;font-weight:700;letter-spacing:.1em;color:rgba(255,255,255,.3);margin-bottom:6px;text-transform:uppercase;}

/* HRD Portfolio */
.hrd-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;}
.hrd-card{background:var(--glass);border:1px solid var(--glass-b);border-radius:12px;padding:20px;}
.hrd-card h4{font-size:13px;font-weight:700;color:#fff;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,.08);}
.hrd-list{list-style:none;font-size:12.5px;color:rgba(255,255,255,.6);line-height:1.8;}
.hrd-list li::before{content:'• ';color:var(--cr);}

/* CTA */
.cta-box{text-align:center;padding:48px 24px;background:linear-gradient(135deg,rgba(22,82,216,.15),rgba(0,212,255,.08));border:1px solid rgba(22,82,216,.3);border-radius:16px;}
.cta-title{font-size:22px;font-weight:900;color:#fff;margin-bottom:12px;}
.cta-desc{font-size:14px;color:rgba(255,255,255,.5);margin-bottom:24px;line-height:1.6;}
.cta-btn{display:inline-flex;align-items:center;gap:8px;padding:16px 32px;border-radius:10px;background:linear-gradient(135deg,var(--cr),var(--accent));color:#fff;font-size:15px;font-weight:700;text-decoration:none;transition:opacity .15s;}
.cta-btn:hover{opacity:.9;}
.cta-meta{margin-top:16px;font-size:12px;color:rgba(255,255,255,.3);}

/* Footer */
.p-footer{text-align:center;padding:40px 24px;border-top:1px solid rgba(255,255,255,.05);}
.p-footer p{font-size:12px;color:rgba(255,255,255,.3);line-height:1.8;}

/* Gauge */
.gauge-wrap{display:flex;align-items:center;gap:24px;flex-wrap:wrap;justify-content:center;margin-bottom:24px;}
.gauge-chart{width:200px;height:200px;position:relative;}
.gauge-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}
.gauge-stage{font-size:32px;font-weight:900;color:var(--accent);}
.gauge-label{font-size:12px;color:rgba(255,255,255,.5);}
.gauge-info{flex:1;min-width:200px;}
.gauge-info h4{font-size:18px;font-weight:700;color:#fff;margin-bottom:8px;}
.gauge-info p{font-size:13px;color:rgba(255,255,255,.5);line-height:1.6;}

/* Print */
@media print{
  body{background:#fff;color:#333;}
  #pw-overlay{display:none!important;}
  #proposal-content{display:block!important;}
  .p-section{padding:40px 0;}
  .g-card,.metric-card,.cur-card,.hrd-card{border:1px solid #ddd;background:#f9f9f9;}
  .mc-value,.s-title,.p-hero-title{color:#1A1A1A;}
}

@media(max-width:640px){
  .p-hero{min-height:60vh;}
  .metric-grid{grid-template-columns:1fr 1fr;}
  .cur-grid,.hrd-grid{grid-template-columns:1fr;}
  .gauge-wrap{flex-direction:column;text-align:center;}
}
</style>
</head>
<body>

<!-- ═══ PASSWORD OVERLAY ═══ -->
<div id="pw-overlay">
  <div class="pw-box">
    <div class="pw-icon"><i class="fas fa-lock"></i></div>
    <div class="pw-title">제안서 열람</div>
    <div class="pw-desc">
      본 제안서는 <strong style="color:#fff;">${clientName}</strong> 전용입니다.<br>
      비밀번호: 담당자 영문 이니셜(대문자) + 전화번호 뒤 4자리
    </div>
    <input type="password" class="pw-input" id="pw-input" placeholder="비밀번호 입력" autocomplete="off">
    <button class="pw-btn" onclick="checkPw()">열기</button>
    <div class="pw-error" id="pw-error">비밀번호가 올바르지 않습니다.</div>
  </div>
</div>

<!-- ═══ PROPOSAL CONTENT ═══ -->
<div id="proposal-content">

  <!-- Section 1: Hero / Executive Summary -->
  <section class="p-section p-hero">
    <div class="hero-bg-grid"></div>
    <div class="p-container" data-aos="fade-up">
      <div class="p-hero-badge">AI EDUCATION TRANSFORMATION PROPOSAL</div>
      <h1 class="p-hero-title">
        ${clientName}의<br><span>AI 교육 전환</span> 제안서
      </h1>
      <p class="p-hero-sub">
        조직 진단 결과를 기반으로 설계된 맞춤형 12개월 교육 로드맵입니다.
        컨설팅 → 교육 실행 → AX 조직문화 전환의 3단계 체계적 접근으로
        실질적인 업무 생산성 향상과 조직 변화를 이끕니다.
      </p>
      <div class="p-hero-meta">
        <span><i class="fas fa-building"></i> ${clientName}</span>
        <span><i class="fas fa-users"></i> ${data.orgSize || '미정'}</span>
        <span><i class="fas fa-calendar"></i> ${data.timestamp}</span>
        <span><i class="fas fa-building"></i> 청람M&C</span>
      </div>
    </div>
  </section>

  <!-- Section 2: 진단 결과 -->
  <section class="p-section">
    <div class="p-container">
      <div class="s-num" data-aos="fade-right">SECTION 01</div>
      <h2 class="s-title" data-aos="fade-up">현재 진단 결과</h2>
      <p class="s-desc" data-aos="fade-up">조직 구조 및 AI 성숙도 분석 결과입니다.</p>

      <!-- AI 성숙도 게이지 -->
      <div class="g-card" data-aos="fade-up">
        <div class="gauge-wrap">
          <div class="gauge-chart"><canvas id="gaugeChart"></canvas>
            <div class="gauge-center">
              <div class="gauge-stage">${aiStage}</div>
              <div class="gauge-label">/ 4 단계</div>
            </div>
          </div>
          <div class="gauge-info">
            <h4 style="color:${stageInfo.color}">${stageInfo.name}</h4>
            <p>${stageInfo.desc}</p>
            <p style="margin-top:8px;">AI 적용 우선 부서: <strong style="color:#fff;">${(data.deptPriority || []).join(' → ') || '미선택'}</strong></p>
            <p>구성원 AI 수준: <strong style="color:#fff;">${data.aiLevel || '미선택'}</strong></p>
          </div>
        </div>
      </div>

      <!-- 조직 메트릭 -->
      <div class="metric-grid" data-aos="fade-up" data-aos-delay="100">
        <div class="metric-card">
          <div class="mc-label">임직원 규모</div>
          <div class="mc-value">${data.orgSize || '미정'}</div>
        </div>
        <div class="metric-card">
          <div class="mc-label">교육 예산</div>
          <div class="mc-value">${data.budget || '미정'}</div>
        </div>
        <div class="metric-card">
          <div class="mc-label">의사결정자</div>
          <div class="mc-value" style="font-size:16px;">${data.decisionMaker || '미정'}</div>
        </div>
        <div class="metric-card">
          <div class="mc-label">주요 부서</div>
          <div class="mc-value" style="font-size:13px;line-height:1.5;">${deptText}</div>
        </div>
      </div>

      <!-- 조직 문제 -->
      <div class="g-card" data-aos="fade-up" data-aos-delay="200">
        <h3 style="font-size:14px;font-weight:700;color:var(--accent);margin-bottom:16px;">
          <i class="fas fa-exclamation-triangle" style="margin-right:6px;"></i>식별된 조직 문제
        </h3>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          ${(data.painPoints || []).map(p => '<span style="padding:6px 14px;border-radius:20px;font-size:12px;background:rgba(239,68,68,.15);color:#FCA5A5;border:1px solid rgba(239,68,68,.3);">' + p + '</span>').join('')}
        </div>
        ${data.expectedChange ? '<p style="margin-top:14px;font-size:13px;color:rgba(255,255,255,.6);line-height:1.6;padding:12px;background:rgba(255,255,255,.03);border-radius:8px;"><strong style="color:rgba(255,255,255,.8);">기대 변화:</strong> ' + data.expectedChange + '</p>' : ''}
      </div>

      <!-- 레이더 차트 -->
      <div class="g-card" data-aos="fade-up" data-aos-delay="300">
        <h3 style="font-size:14px;font-weight:700;color:var(--accent);margin-bottom:16px;">
          <i class="fas fa-chart-radar" style="margin-right:6px;"></i>역량 진단 레이더
        </h3>
        <div class="chart-wrap"><canvas id="radarChart"></canvas></div>
      </div>
    </div>
  </section>

  <!-- Section 3: ROI 분석 -->
  <section class="p-section">
    <div class="p-container">
      <div class="s-num" data-aos="fade-right">SECTION 02</div>
      <h2 class="s-title" data-aos="fade-up">ROI 분석</h2>
      <p class="s-desc" data-aos="fade-up">AI 교육 투자 대비 예상 절감 효과입니다.</p>

      <div class="metric-grid" data-aos="fade-up">
        <div class="metric-card">
          <div class="mc-label">연간 절감 시간</div>
          <div class="mc-value accent">${roi.totalHoursSaved.toLocaleString()} <span style="font-size:14px;-webkit-text-fill-color:rgba(255,255,255,.5);">시간</span></div>
        </div>
        <div class="metric-card" style="border-color:rgba(0,212,255,.3);">
          <div class="mc-label">연간 절감 비용</div>
          <div class="mc-value accent">${roi.totalCostSaved.toLocaleString()} <span style="font-size:14px;-webkit-text-fill-color:rgba(255,255,255,.5);">만원</span></div>
        </div>
        <div class="metric-card">
          <div class="mc-label">${roi.packageInfo.name} ${roi.packageInfo.months}개월 ROI</div>
          <div class="mc-value accent">${roi.roiPackage}%</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;" data-aos="fade-up" data-aos-delay="100">
        <div class="metric-card">
          <div class="mc-label">연환산 12개월 ROI</div>
          <div class="mc-value">${roi.roi12m}%</div>
        </div>
        <div class="metric-card">
          <div class="mc-label">손익분기점</div>
          <div class="mc-value">${roi.breakEvenMonths} <span style="font-size:14px;color:rgba(255,255,255,.5);">개월</span></div>
        </div>
      </div>

      <!-- ROI 차트 -->
      <div class="g-card" data-aos="fade-up" data-aos-delay="200">
        <h3 style="font-size:14px;font-weight:700;color:var(--accent);margin-bottom:16px;">
          <i class="fas fa-chart-bar" style="margin-right:6px;"></i>투자 대비 수익 비교
        </h3>
        <div class="chart-wrap" style="max-width:600px;"><canvas id="roiChart"></canvas></div>
      </div>

      <!-- 상세 테이블 -->
      <div class="g-card" data-aos="fade-up" data-aos-delay="300">
        <h3 style="font-size:14px;font-weight:700;color:var(--accent);margin-bottom:16px;">
          <i class="fas fa-table" style="margin-right:6px;"></i>산출 근거 상세
        </h3>
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead><tr style="border-bottom:1px solid rgba(255,255,255,.1);">
              <th style="text-align:left;padding:10px;color:rgba(255,255,255,.4);font-weight:500;">항목</th>
              <th style="text-align:left;padding:10px;color:rgba(255,255,255,.4);font-weight:500;">산출 근거</th>
              <th style="text-align:right;padding:10px;color:rgba(255,255,255,.4);font-weight:500;">절감 효과</th>
            </tr></thead>
            <tbody>
              ${roi.details.map(d => '<tr style="border-bottom:1px solid rgba(255,255,255,.05);"><td style="padding:10px;color:rgba(255,255,255,.7);">' + d.label + '</td><td style="padding:10px;color:rgba(255,255,255,.5);">' + d.basis + '</td><td style="padding:10px;text-align:right;font-weight:600;color:var(--accent);">' + d.saving + '</td></tr>').join('')}
            </tbody>
          </table>
        </div>
        <div style="margin-top:20px;padding:16px;background:rgba(255,255,255,.02);border-radius:8px;border:1px solid rgba(255,255,255,.05);">
          <p style="font-size:11px;color:rgba(255,255,255,.35);line-height:1.8;margin-bottom:6px;">¹⁾ AI 업무 시간 단축률은 McKinsey Global Institute(2023) 「The Economic Potential of Generative AI」, Harvard Business School(2023) 실험 연구, Microsoft Work Trend Index(2023) 등의 산업 평균치를 기반으로 조직의 AI 성숙도 단계별로 보수적으로 적용한 추정값입니다.</p>
          <p style="font-size:11px;color:rgba(255,255,255,.35);line-height:1.8;margin-bottom:6px;">²⁾ 절감 비용은 입력하신 평균 연봉을 연간 근무시간(52주 × 40시간)으로 나눈 시간당 인건비에 절감 시간을 곱하여 산출합니다.</p>
          <p style="font-size:11px;color:rgba(255,255,255,.35);line-height:1.8;margin-bottom:6px;">³⁾ 교육 투자비는 선택하신 ${roi.packageInfo.name} 패키지(${roi.packageInfo.months}개월) 기준이며, 실제 비용은 교육 범위·기간·인원에 따라 협의하여 확정됩니다.</p>
          <p style="font-size:11px;color:rgba(255,255,255,.35);line-height:1.8;margin-bottom:6px;">⁴⁾ 생산직 불량 절감률은 제조업 AI 도입 사례(NIST, 2023) 및 국내 스마트팩토리 실증 데이터를 참고한 추정값입니다.</p>
          <p style="font-size:11px;color:rgba(255,255,255,.35);line-height:1.8;margin-bottom:6px;">⁵⁾ 손익분기점은 ${roi.packageInfo.name} 패키지 투자비를 월평균 절감 비용으로 나누어 산출합니다. 교육 효과의 점진적 발현을 고려하면 실제 손익분기점은 다소 늦어질 수 있습니다.</p>
          <p style="font-size:11px;color:rgba(255,255,255,.4);line-height:1.8;margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,.06);">※ 본 ROI 분석은 입력된 데이터와 산업 평균 기준에 의한 추정치이며, 실제 성과를 보장하지 않습니다. 정밀한 ROI 산출은 컨설팅 단계에서 조직별 맞춤 진단을 통해 제공됩니다.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Section 4: 12개월 교육 로드맵 -->
  <section class="p-section">
    <div class="p-container">
      <div class="s-num" data-aos="fade-right">SECTION 03</div>
      <h2 class="s-title" data-aos="fade-up">12개월 교육 로드맵</h2>
      <p class="s-desc" data-aos="fade-up">3 Pillar 기반의 체계적 전환 로드맵입니다.</p>

      <div class="tl" data-aos="fade-up">
        <div class="tl-item">
          <div class="tl-dot"></div>
          <div class="tl-phase">PHASE 1 · Month 1~2</div>
          <div class="tl-title">Pillar 1 — 컨설팅 (교육체계 수립)</div>
          <div class="tl-desc">AI 성숙도 정밀 진단, 직무별 자동화 가능 영역 매핑, 우선순위 로드맵 수립, KPI 설정</div>
          <div class="tl-tags">
            <span class="tl-tag">성숙도 진단</span>
            <span class="tl-tag">자동화 매핑</span>
            <span class="tl-tag">KPI 설정</span>
          </div>
        </div>
        <div class="tl-item">
          <div class="tl-dot"></div>
          <div class="tl-phase">PHASE 2 · Month 2~4</div>
          <div class="tl-title">Pillar 2a — 기초 AI 교육</div>
          <div class="tl-desc">생성형 AI 기본 활용 (전 직원 공통), 프롬프트 엔지니어링 실전, AI 도구 생산성 적용 (ChatGPT/Gemini/Claude), AI 리터러시 & 윤리</div>
          <div class="tl-tags">
            <span class="tl-tag">프롬프트 설계</span>
            <span class="tl-tag">AI 도구 활용</span>
            <span class="tl-tag">AI 윤리</span>
          </div>
        </div>
        <div class="tl-item">
          <div class="tl-dot"></div>
          <div class="tl-phase">PHASE 3 · Month 4~9</div>
          <div class="tl-title">Pillar 2b — 직무별 응용 교육</div>
          <div class="tl-desc">${activeCurriculum.map(c => c.label).join(', ')} 대상 맞춤 AI 자동화 교육. 실무 프로젝트 기반 학습으로 현업 즉시 적용.</div>
          <div class="tl-tags">
            ${activeCurriculum.map(c => '<span class="tl-tag">' + c.label + ' AI</span>').join('')}
          </div>
        </div>
        <div class="tl-item">
          <div class="tl-dot"></div>
          <div class="tl-phase">PHASE 4 · Month 9~12</div>
          <div class="tl-title">Pillar 3 — AX 조직문화 전환</div>
          <div class="tl-desc">AI 활용 조직문화 설계, 내부 AI 챔피언 육성, 부서별 자동화 툴 내재화, 성과 측정 & 다음 연도 계획</div>
          <div class="tl-tags">
            <span class="tl-tag">AI 챔피언</span>
            <span class="tl-tag">조직문화</span>
            <span class="tl-tag">내재화</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Section 5: 직무별 커리큘럼 -->
  <section class="p-section">
    <div class="p-container">
      <div class="s-num" data-aos="fade-right">SECTION 04</div>
      <h2 class="s-title" data-aos="fade-up">직무별 AI 교육 커리큘럼</h2>
      <p class="s-desc" data-aos="fade-up">직무 특성에 맞는 기초→응용 단계별 교육 프로그램입니다.</p>

      <div class="cur-grid" data-aos="fade-up">
        ${activeCurriculum.map(c => `
          <div class="cur-card">
            <h4><i class="fas fa-graduation-cap"></i>${c.label}</h4>
            <div class="cur-label">기초 교육</div>
            <ul class="cur-list">${c.basic.map(i => '<li>' + i + '</li>').join('')}</ul>
            <div class="cur-label" style="margin-top:14px;">응용 교육</div>
            <ul class="cur-list">${c.advanced.map(i => '<li>' + i + '</li>').join('')}</ul>
          </div>
        `).join('')}
      </div>
    </div>
  </section>

  <!-- Section 6: 추가 HRD 제안 -->
  <section class="p-section">
    <div class="p-container">
      <div class="s-num" data-aos="fade-right">SECTION 05</div>
      <h2 class="s-title" data-aos="fade-up">추가 HRD 제안</h2>
      <p class="s-desc" data-aos="fade-up">AI 교육과 병행 가능한 청람M&C의 연간 HRD 패키지입니다.</p>

      <div class="hrd-grid" data-aos="fade-up">
        ${HRD_PORTFOLIO.map(h => `
          <div class="hrd-card">
            <h4><i class="fas fa-bookmark" style="color:var(--cr);margin-right:6px;font-size:12px;"></i>${h.category}</h4>
            <ul class="hrd-list">${h.items.map(i => '<li>' + i + '</li>').join('')}</ul>
          </div>
        `).join('')}
      </div>
    </div>
  </section>

  <!-- Section 7: 미팅 / CTA -->
  <section class="p-section">
    <div class="p-container">
      <div class="s-num" data-aos="fade-right">SECTION 06</div>
      <h2 class="s-title" data-aos="fade-up">다음 단계</h2>

      <div class="cta-box" data-aos="fade-up">
        <div class="cta-title">함께 시작하겠습니다</div>
        <div class="cta-desc">
          ${meetingText !== '미정' ? '희망 미팅일: <strong style="color:#fff;">' + meetingText + '</strong><br>' : ''}
          선호 교육 방식: <strong style="color:#fff;">${formatText}</strong><br><br>
          제안서 내용을 검토하신 후, 아래 연락처로 문의해 주시면<br>
          상세 미팅을 통해 최적의 교육 로드맵을 확정하겠습니다.
        </div>
        <a href="mailto:crmc@crmc.co.kr" class="cta-btn">
          <i class="fas fa-envelope"></i> 미팅 요청하기
        </a>
        <div class="cta-meta">
          청람M&C · crmc.co.kr<br>
          교육콘텐츠 개발 전문기업
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="p-footer">
    <p>
      본 제안서는 ${clientName} 전용으로 작성되었으며, 무단 배포를 금합니다.<br>
      &copy; 2026 청람M&C. All rights reserved.
    </p>
  </footer>
</div>

<script>
// Password check
const CORRECT_PW = '${password}';
function checkPw(){
  const input = document.getElementById('pw-input').value.trim();
  if(input === CORRECT_PW){
    document.getElementById('pw-overlay').style.display='none';
    document.getElementById('proposal-content').style.display='block';
    AOS.init({duration:800,once:true});
    initCharts();
  } else {
    document.getElementById('pw-error').style.display='block';
    document.getElementById('pw-input').style.borderColor='#EF4444';
    setTimeout(()=>{
      document.getElementById('pw-error').style.display='none';
      document.getElementById('pw-input').style.borderColor='';
    },2000);
  }
}
document.getElementById('pw-input').addEventListener('keydown',e=>{if(e.key==='Enter')checkPw();});

// Charts
function initCharts(){
  // Gauge Chart
  new Chart(document.getElementById('gaugeChart'),{
    type:'doughnut',
    data:{
      datasets:[{
        data:[${aiStage},${4-aiStage}],
        backgroundColor:['${stageInfo.color}','rgba(255,255,255,0.05)'],
        borderWidth:0,
        circumference:270,
        rotation:225
      }]
    },
    options:{
      cutout:'75%',
      responsive:true,
      maintainAspectRatio:true,
      plugins:{legend:{display:false},tooltip:{enabled:false}}
    }
  });

  // Radar Chart
  const painMap = {
    '업무 생산성 정체': 'productivity',
    '팀 간 협업·소통 부재': 'communication',
    '리더십 역량 편차': 'leadership',
    '변화 저항 심함': 'changeResistance',
    'AI 도입 방향 모름': 'aiReadiness',
    '교육 후 현업 적용 안 됨': 'applicationRate',
    '조직문화 경직': 'culture',
    '우수인재 이탈': 'retention'
  };
  const dims = ['리더십','디지털 스킬','커뮤니케이션','전문성','조직문화','혁신'];
  const current = [${aiStage > 2 ? 3 : 2},${aiStage},${aiStage > 1 ? 3 : 2},3,${aiStage > 2 ? 3 : 2},${aiStage}];
  const target = [4.5,4.5,4,4.5,4,4.5];

  new Chart(document.getElementById('radarChart'),{
    type:'radar',
    data:{
      labels:dims,
      datasets:[
        {label:'현재 수준',data:current,borderColor:'${stageInfo.color}',backgroundColor:'${stageInfo.color}33',pointBackgroundColor:'${stageInfo.color}',borderWidth:2},
        {label:'목표 수준',data:target,borderColor:'#00D4FF',backgroundColor:'rgba(0,212,255,.08)',pointBackgroundColor:'#00D4FF',borderWidth:2,borderDash:[5,5]}
      ]
    },
    options:{
      responsive:true,
      maintainAspectRatio:true,
      scales:{r:{
        beginAtZero:true,max:5,
        ticks:{display:false},
        grid:{color:'rgba(255,255,255,.06)'},
        pointLabels:{color:'rgba(255,255,255,.6)',font:{size:11}}
      }},
      plugins:{legend:{labels:{color:'rgba(255,255,255,.6)',font:{size:11}}}}
    }
  });

  // ROI Bar Chart
  new Chart(document.getElementById('roiChart'),{
    type:'bar',
    data:{
      labels:['교육 투자비 (${roi.packageInfo.name})','${roi.packageInfo.months}개월 절감','연간 절감'],
      datasets:[{
        data:[${roi.packageInfo.cost || 0},${roi.monthlySaving * roi.packageInfo.months},${roi.totalCostSaved}],
        backgroundColor:['rgba(239,68,68,.6)','rgba(0,212,255,.6)','rgba(22,82,216,.8)'],
        borderRadius:6,
        barPercentage:.6
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:true,
      plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.raw.toLocaleString()+'만원'}}},
      scales:{
        y:{grid:{color:'rgba(255,255,255,.05)'},ticks:{color:'rgba(255,255,255,.4)',callback:v=>v.toLocaleString()}},
        x:{grid:{display:false},ticks:{color:'rgba(255,255,255,.6)'}}
      }
    }
  });
}
<\/script>
</body>
</html>`;
  }

  return { generate, generatePassword, CURRICULUM, HRD_PORTFOLIO };
})();
