// ════════════════════════════════════════════════════════
// 청람M&C ROI 계산 엔진
// ════════════════════════════════════════════════════════

const ROICalculator = (() => {

  // AI 단축률 매트릭스 (직무 × 성숙도 단계)
  const REDUCTION_RATE = {
    office:     { 1: 0.20, 2: 0.30, 3: 0.40, 4: 0.50 },
    sales:      { 1: 0.15, 2: 0.25, 3: 0.35, 4: 0.45 },
    field:      { 1: 0.10, 2: 0.18, 3: 0.25, 4: 0.30 },
    production: { 1: 0.08, 2: 0.15, 3: 0.22, 4: 0.28 }
  };

  // 패키지 가격표 (만원) — 상품가격_및_인력채용_계획.hwpx 기준
  const PACKAGES = {
    starter:    { name: '스타터',       months: 3,  cost: 900,  sessions: 3,  roiMultiplier: 1.0 },
    standard:   { name: '스탠다드',     months: 6,  cost: 1460, sessions: 6,  roiMultiplier: 1.4 },
    premium:    { name: '프리미엄',     months: 12, cost: 2200, sessions: 10, roiMultiplier: 2.0 },
    enterprise: { name: '엔터프라이즈', months: 12, cost: 0,    sessions: 0,  roiMultiplier: 2.5 }
  };

  // 시간당 인건비 (만원 → 원 → 시간당 만원)
  function hourlyRate(salaryMan) {
    return salaryMan / (52 * 40); // 만원/시간
  }

  // ── 사무직 계산 ────────────────────────────────────
  function calcOffice(d, stage) {
    if (!d.headcount) return { hours: 0, cost: 0, details: [] };
    const rate = REDUCTION_RATE.office[stage];
    const totalWeekly = d.docHours + d.meetingHours + d.dataHours + d.emailHours;
    const weeklySaved = totalWeekly * rate;
    const annualHours = weeklySaved * 52 * d.headcount;
    const annualCost = annualHours * hourlyRate(d.salary);

    const details = [];
    const items = [
      { label: '문서 작성', hours: d.docHours },
      { label: '회의 참여', hours: d.meetingHours },
      { label: '데이터 수집·정리', hours: d.dataHours },
      { label: '이메일·보고', hours: d.emailHours }
    ];
    items.forEach(item => {
      if (item.hours > 0) {
        const saved = item.hours * rate * 52 * d.headcount;
        const cost = saved * hourlyRate(d.salary);
        details.push({
          label: '사무직 — ' + item.label,
          basis: item.hours + '시간/주 × ' + (rate * 100).toFixed(0) + '% 단축 × ' + d.headcount + '명',
          saving: Math.round(cost).toLocaleString() + '만원'
        });
      }
    });

    return { hours: Math.round(annualHours), cost: Math.round(annualCost), details };
  }

  // ── 영업/CS직 계산 ────────────────────────────────
  function calcSales(d, stage) {
    if (!d.headcount) return { hours: 0, cost: 0, details: [] };
    const rate = REDUCTION_RATE.sales[stage];
    // 제안서 시간: 주 2건 가정
    const weeklyProposal = d.proposalHours * 2;
    // CRM: 분 → 시간/주 (5일)
    const weeklyCRM = (d.crmMinutes / 60) * 5;
    // 고객 응대 기록: 건당 10분 가정
    const weeklyContact = (d.contactCount * 10 / 60) * 5;

    const totalWeekly = weeklyProposal + weeklyCRM + weeklyContact;
    const weeklySaved = totalWeekly * rate;
    const annualHours = weeklySaved * 52 * d.headcount;
    const annualCost = annualHours * hourlyRate(d.salary);

    const details = [];
    if (weeklyProposal > 0) {
      const saved = weeklyProposal * rate * 52 * d.headcount;
      details.push({
        label: '영업직 — 제안서 작성',
        basis: d.proposalHours + '시간/건 × 주 2건 × ' + (rate * 100).toFixed(0) + '% × ' + d.headcount + '명',
        saving: Math.round(saved * hourlyRate(d.salary)).toLocaleString() + '만원'
      });
    }
    if (weeklyCRM > 0) {
      const saved = weeklyCRM * rate * 52 * d.headcount;
      details.push({
        label: '영업직 — CRM 입력',
        basis: d.crmMinutes + '분/일 × 5일 × ' + (rate * 100).toFixed(0) + '% × ' + d.headcount + '명',
        saving: Math.round(saved * hourlyRate(d.salary)).toLocaleString() + '만원'
      });
    }
    if (weeklyContact > 0) {
      const saved = weeklyContact * rate * 52 * d.headcount;
      details.push({
        label: '영업직 — 고객응대 기록',
        basis: d.contactCount + '건/일 × 10분 × ' + (rate * 100).toFixed(0) + '% × ' + d.headcount + '명',
        saving: Math.round(saved * hourlyRate(d.salary)).toLocaleString() + '만원'
      });
    }

    return { hours: Math.round(annualHours), cost: Math.round(annualCost), details };
  }

  // ── 현장직 계산 ────────────────────────────────────
  function calcField(d, stage) {
    if (!d.headcount) return { hours: 0, cost: 0, details: [] };
    const rate = REDUCTION_RATE.field[stage];
    const weeklyReport = d.reportHours * 5;
    const weeklySaved = weeklyReport * rate;
    const annualHours = weeklySaved * 52 * d.headcount;
    const annualCost = annualHours * hourlyRate(d.salary);

    const details = [];
    if (weeklyReport > 0) {
      details.push({
        label: '현장직 — 점검·보고',
        basis: d.reportHours + '시간/일 × 5일 × ' + (rate * 100).toFixed(0) + '% × ' + d.headcount + '명',
        saving: Math.round(annualCost).toLocaleString() + '만원'
      });
    }

    return { hours: Math.round(annualHours), cost: Math.round(annualCost), details };
  }

  // ── 생산직 계산 ────────────────────────────────────
  function calcProduction(d, stage) {
    // 인원·생산량·불량률·다운타임 모두 0이면 완전 제외 (탭 미선택 시)
    if (!d.headcount && !d.dailyOutput && !d.downtime && !d.defectRate) return { hours: 0, cost: 0, details: [] };
    const rate = REDUCTION_RATE.production[stage];

    // 불량 절감 효과
    const defectSaving = d.dailyOutput * (d.defectRate / 100) * d.defectCost * rate * 250;
    // 다운타임 절감 (시간 → 비용은 별도 환산)
    const downtimeSavedHours = d.downtime * rate * 12;

    const details = [];
    if (defectSaving > 0) {
      details.push({
        label: '생산직 — 불량 절감',
        basis: d.dailyOutput + '개/일 × ' + d.defectRate + '% × ' + d.defectCost + '만원 × ' + (rate * 100).toFixed(0) + '%',
        saving: Math.round(defectSaving).toLocaleString() + '만원'
      });
    }
    if (downtimeSavedHours > 0) {
      details.push({
        label: '생산직 — 다운타임 절감',
        basis: d.downtime + '시간/월 × ' + (rate * 100).toFixed(0) + '% × 12개월',
        saving: Math.round(downtimeSavedHours).toLocaleString() + '시간'
      });
    }

    return {
      hours: Math.round(downtimeSavedHours),
      cost: Math.round(defectSaving),
      details
    };
  }

  // ── 메인 계산 ──────────────────────────────────────
  function calculate(jobData, aiStage, packageKey) {
    const pkg = PACKAGES[packageKey] || PACKAGES.standard;
    const office = calcOffice(jobData.office, aiStage);
    const sales = calcSales(jobData.sales, aiStage);
    const field = calcField(jobData.field, aiStage);
    const production = calcProduction(jobData.production, aiStage);

    const rawHours = office.hours + sales.hours + field.hours + production.hours;
    const rawCost  = office.cost  + sales.cost  + field.cost  + production.cost;

    // 패키지별 실현율: 교육 깊이·회수가 많을수록 더 많은 절감 실현
    const m = pkg.roiMultiplier || 1.0;
    const totalHoursSaved = Math.round(rawHours * m);
    const totalCostSaved  = Math.round(rawCost  * m);
    const monthlySaving = totalCostSaved / 12;

    // 패키지 기간에 맞는 ROI 산출
    const periodSaving = monthlySaving * pkg.months;
    const roiPackage = (pkg.cost > 0 && monthlySaving > 0)
      ? ((periodSaving - pkg.cost) / pkg.cost * 100).toFixed(1)
      : 0;
    const roi12m = monthlySaving > 0 && pkg.cost > 0
      ? ((totalCostSaved - pkg.cost) / pkg.cost * 100).toFixed(1)
      : 0;
    const breakEvenMonths = (monthlySaving > 0 && pkg.cost > 0)
      ? Math.ceil(pkg.cost / monthlySaving)
      : 0;

    const details = [
      ...office.details,
      ...sales.details,
      ...field.details,
      ...production.details
    ];

    // 투자비 행 추가
    if (pkg.cost > 0) {
      details.push({
        label: '교육 투자비 (' + pkg.name + ' ' + pkg.months + '개월) ³⁾',
        basis: '컨설팅 + 교육 실행' + (pkg.months >= 9 ? ' + AX 전환' : ''),
        saving: '-' + pkg.cost.toLocaleString() + '만원'
      });
    } else {
      details.push({
        label: '교육 투자비 (엔터프라이즈) ³⁾',
        basis: '대규모 조직 맞춤 설계',
        saving: '별도 협의'
      });
    }

    return {
      totalHoursSaved,
      totalCostSaved,
      roiPackage: parseFloat(roiPackage),
      roi12m: parseFloat(roi12m),
      breakEvenMonths,
      monthlySaving: Math.round(monthlySaving),
      details,
      byJob: { office, sales, field, production },
      packageInfo: pkg
    };
  }

  return { calculate, REDUCTION_RATE, PACKAGES };
})();
