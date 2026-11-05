const levels = [
  { id: "beginner", label: "초급", tagline: "빈칸을 채우며 역할·맥락·형식을 익힙니다." },
  { id: "applied", label: "응용", tagline: "결과물의 품질을 높이는 조건과 예시를 붙입니다." },
  { id: "advanced", label: "심화", tagline: "하나의 목표를 PRD, 실행, 수정, 검증 프롬프트로 확장합니다." },
];

const personas = [
  { id: "teacher", label: "교사·마을교육활동가" },
  { id: "public", label: "공무원" },
  { id: "office", label: "직장인" },
  { id: "student", label: "학생" },
  { id: "general", label: "일반인" },
];

const lengths = [
  { id: "short", label: "단문 프롬프트" },
  { id: "medium", label: "중문 프롬프트" },
  { id: "expanded", label: "확장 프롬프트" },
];

const scenarioBank = {
  public: {
    beginner: {
      short: {
        title: "민원 안내 문장을 부드럽게 바꾸기",
        goal: "반복 민원 답변을 시민이 이해하기 쉬운 표현으로 바꾸는 상황입니다.",
        criteria: "역할, 대상, 문체, 출력 형식이 드러나면 성공입니다.",
        hint: "역할에는 '민원 안내 담당자', 문체에는 '친절하고 간결하게'처럼 적어보세요.",
        template: [
          "너는 ",
          { key: "role", placeholder: "어떤 역할인가요?", example: "민원 안내 담당자" },
          "야. 다음 안내문을 ",
          { key: "context", placeholder: "누가 읽나요?", example: "처음 민원을 넣는 시민이" },
          " 이해하기 쉽게 ",
          { key: "request", placeholder: "무엇을 해달라고 할까요?", example: "부드러운 표현으로 고쳐줘" },
          ". 결과는 ",
          { key: "format", placeholder: "어떤 형식?", example: "3문장 이내" },
          "로 작성해줘.",
        ],
      },
      medium: {
        title: "행사 안내 문자 초안 만들기",
        goal: "주민 대상 행사 안내 문자를 빠르게 작성해야 하는 상황입니다.",
        criteria: "행사 배경, 핵심 일정, 대상, 길이 제한을 포함하면 성공입니다.",
        hint: "조건에는 '문자 1건으로 보낼 수 있게 300자 이내'처럼 제한을 넣어보세요.",
        template: [
          "너는 ",
          { key: "role", placeholder: "행정 홍보 담당자" },
          "야. ",
          { key: "context", placeholder: "어떤 행사인가요?" },
          "에 대해 ",
          { key: "request", placeholder: "주민에게 어떤 안내가 필요하나요?" },
          " 안내 문자를 작성해줘. 대상은 ",
          { key: "context", placeholder: "어떤 주민인가요?" },
          "이고, 결과는 ",
          { key: "format", placeholder: "문자 형식/길이" },
          "로 만들어줘. 반드시 ",
          { key: "constraint", placeholder: "꼭 넣을 조건" },
          "을 포함해줘.",
        ],
      },
      expanded: {
        title: "주민 설명회 Q&A 준비하기",
        goal: "주민 설명회 전 예상 질문과 답변 방향을 준비하는 상황입니다.",
        criteria: "역할, 정책 배경, 우려 사항, 표 형식, 답변 톤 조건을 포함하면 성공입니다.",
        hint: "우려 사항을 구체적으로 넣을수록 답변이 현실적으로 나옵니다.",
        template: [
          "너는 ",
          { key: "role", placeholder: "정책 설명회 준비 전문가" },
          "야. 우리는 ",
          { key: "context", placeholder: "정책/사업 배경" },
          "을 주민에게 설명하려고 해. 주민들이 걱정할 수 있는 부분은 ",
          { key: "constraint", placeholder: "예상 우려" },
          "이야. ",
          { key: "request", placeholder: "무엇을 만들어달라고 할까요?" },
          " 결과는 ",
          { key: "format", placeholder: "표/목록/스크립트" },
          "로 정리하고, 답변 톤은 ",
          { key: "constraint", placeholder: "톤 조건" },
          "로 맞춰줘.",
        ],
      },
    },
    applied: null,
    advanced: null,
  },
  office: {
    beginner: {
      short: {
        title: "회의 메모를 실행 항목으로 바꾸기",
        goal: "흩어진 회의 메모를 팀원이 바로 움직일 수 있는 할 일 목록으로 바꾸는 상황입니다.",
        criteria: "역할, 입력 자료, 요청, 출력 형식이 들어가면 성공입니다.",
        hint: "출력 형식은 '담당자/기한/할 일 표'처럼 명확히 쓰면 좋습니다.",
        template: [
          "너는 ",
          { key: "role", placeholder: "프로젝트 매니저" },
          "야. 아래 회의 메모를 보고 ",
          { key: "request", placeholder: "무엇으로 바꾸나요?" },
          ". 결과는 ",
          { key: "format", placeholder: "출력 형식" },
          "로 정리하고, ",
          { key: "constraint", placeholder: "주의 조건" },
          "은 따로 표시해줘.",
        ],
      },
      medium: {
        title: "고객사 보고 메일 초안 작성",
        goal: "고객사에 진행 상황을 정리해 보내야 하는 상황입니다.",
        criteria: "상대방, 목적, 핵심 내용, 톤, 형식이 드러나면 성공입니다.",
        hint: "맥락에는 고객사와 현재 프로젝트 상황을 한 문장으로 넣어보세요.",
        template: [
          "너는 ",
          { key: "role", placeholder: "고객 커뮤니케이션 담당자" },
          "야. ",
          { key: "context", placeholder: "현재 프로젝트 상황" },
          "을 고객사에 알리려고 해. 메일 목적은 ",
          { key: "request", placeholder: "보고/요청/확인" },
          "이고, 문체는 ",
          { key: "constraint", placeholder: "정중하게/간결하게" },
          " 해줘. 결과는 ",
          { key: "format", placeholder: "제목+본문 형식" },
          "으로 작성해줘.",
        ],
      },
      expanded: {
        title: "주간 업무 보고서 구조화",
        goal: "이번 주 성과와 다음 주 계획을 상사에게 보고할 문서로 정리하는 상황입니다.",
        criteria: "성과, 이슈, 다음 액션, 의사결정 요청이 구분되면 성공입니다.",
        hint: "AI에게 '상사가 빠르게 판단할 수 있게'라는 목적을 알려주세요.",
        template: [
          "너는 ",
          { key: "role", placeholder: "성과 보고 코치" },
          "야. 나는 ",
          { key: "context", placeholder: "팀/직무/프로젝트 상황" },
          "에서 일하고 있어. 이번 주 메모를 바탕으로 ",
          { key: "request", placeholder: "어떤 보고서를 만들까요?" },
          " 작성해줘. 반드시 ",
          { key: "constraint", placeholder: "성과/이슈/다음 계획 등" },
          "을 구분하고, 결과는 ",
          { key: "format", placeholder: "상사가 보기 쉬운 형식" },
          "으로 정리해줘.",
        ],
      },
    },
    applied: null,
    advanced: null,
  },
  student: {
    beginner: {
      short: {
        title: "수행평가 아이디어 얻기",
        goal: "주제를 정하지 못한 수행평가에서 아이디어 후보를 얻는 상황입니다.",
        criteria: "학년, 과목, 주제 범위, 출력 개수가 들어가면 성공입니다.",
        hint: "조건에는 '직접 조사할 수 있는 주제'처럼 현실적인 제한을 넣어보세요.",
        template: [
          "너는 ",
          { key: "role", placeholder: "학습 코치" },
          "야. 나는 ",
          { key: "context", placeholder: "학년/과목" },
          " 수행평가를 준비 중이야. ",
          { key: "request", placeholder: "무엇을 추천받고 싶나요?" },
          " 결과는 ",
          { key: "format", placeholder: "몇 개/어떤 형식" },
          "로 주고, ",
          { key: "constraint", placeholder: "조건" },
          "을 지켜줘.",
        ],
      },
      medium: {
        title: "발표 대본 초안 만들기",
        goal: "자료 조사는 했지만 발표 흐름을 만들기 어려운 상황입니다.",
        criteria: "청중, 발표 시간, 핵심 메시지, 구성 형식이 있으면 성공입니다.",
        hint: "발표 시간과 청중 수준을 주면 대본 난이도가 안정됩니다.",
        template: [
          "너는 ",
          { key: "role", placeholder: "발표 코치" },
          "야. 발표 주제는 ",
          { key: "context", placeholder: "주제" },
          "이고 청중은 ",
          { key: "context", placeholder: "친구/선생님/일반 청중" },
          "이야. ",
          { key: "request", placeholder: "어떤 대본이 필요한가요?" },
          " 결과는 ",
          { key: "format", placeholder: "도입-본문-마무리" },
          "로 작성하고, ",
          { key: "constraint", placeholder: "발표 시간/톤" },
          "에 맞춰줘.",
        ],
      },
      expanded: {
        title: "탐구 보고서 목차 설계",
        goal: "탐구 보고서를 쓰기 전 질문, 자료, 목차를 먼저 설계하는 상황입니다.",
        criteria: "탐구 질문, 자료 수집 방법, 목차, 검증 기준이 들어가면 성공입니다.",
        hint: "심화된 결과를 원하면 '자료를 그대로 지어내지 말고 확인해야 할 항목을 표시해줘'를 넣어보세요.",
        template: [
          "너는 ",
          { key: "role", placeholder: "탐구 보고서 지도교사" },
          "야. 나는 ",
          { key: "context", placeholder: "탐구 주제/관심사" },
          "에 대해 보고서를 쓰려고 해. 먼저 ",
          { key: "request", placeholder: "설계받고 싶은 내용" },
          "을 만들어줘. 결과는 ",
          { key: "format", placeholder: "목차+탐구 질문+자료 계획" },
          "로 정리하고, ",
          { key: "constraint", placeholder: "검증/주의 조건" },
          "을 포함해줘.",
        ],
      },
    },
    applied: null,
    advanced: null,
  },
  general: {
    beginner: {
      short: {
        title: "가족 여행 일정 아이디어 만들기",
        goal: "가족 구성원 취향이 달라 여행 일정을 정하기 어려운 상황입니다.",
        criteria: "동행자, 기간, 취향, 결과 형식이 들어가면 성공입니다.",
        hint: "조건에는 예산, 이동 피로도, 아이 동반 여부처럼 현실 제약을 넣어보세요.",
        template: [
          "너는 ",
          { key: "role", placeholder: "여행 일정 플래너" },
          "야. ",
          { key: "context", placeholder: "누구와/언제/어디로" },
          " 여행을 가려고 해. ",
          { key: "request", placeholder: "어떤 도움을 받을까요?" },
          " 결과는 ",
          { key: "format", placeholder: "일정표/추천 목록" },
          "로 주고, ",
          { key: "constraint", placeholder: "예산/취향/제약" },
          "을 고려해줘.",
        ],
      },
      medium: {
        title: "건강한 식단 계획 세우기",
        goal: "바쁜 일상에서도 실천 가능한 식단을 만들고 싶은 상황입니다.",
        criteria: "생활 패턴, 선호 음식, 목표, 형식, 제한 조건이 들어가면 성공입니다.",
        hint: "의학적 판단이 필요한 내용은 전문가 상담이 필요하다는 검증 조건을 넣어보세요.",
        template: [
          "너는 ",
          { key: "role", placeholder: "생활 식단 코치" },
          "야. 내 생활 패턴은 ",
          { key: "context", placeholder: "출근/운동/식사 습관" },
          "이고 목표는 ",
          { key: "request", placeholder: "체중 관리/간편식 개선 등" },
          "이야. 결과는 ",
          { key: "format", placeholder: "일주일 표/장보기 목록" },
          "로 만들고, ",
          { key: "constraint", placeholder: "싫어하는 음식/주의 조건" },
          "을 반영해줘.",
        ],
      },
      expanded: {
        title: "개인 프로젝트 실행 계획 만들기",
        goal: "하고 싶은 일은 있지만 시작 순서를 정하지 못한 상황입니다.",
        criteria: "목표, 현재 상태, 제약, 실행 단계, 점검 기준이 들어가면 성공입니다.",
        hint: "단계별 실행표로 나눠 달라고 요청하면 시작과 점검이 쉬워집니다.",
        template: [
          "너는 ",
          { key: "role", placeholder: "개인 프로젝트 코치" },
          "야. 내가 이루고 싶은 목표는 ",
          { key: "context", placeholder: "구체적인 목표" },
          "이고 현재 상태는 ",
          { key: "context", placeholder: "시간/역량/자원" },
          "이야. ",
          { key: "request", placeholder: "어떤 계획이 필요한가요?" },
          " 결과는 ",
          { key: "format", placeholder: "단계별 실행표" },
          "로 정리하고, ",
          { key: "constraint", placeholder: "제약과 점검 기준" },
          "을 포함해줘.",
        ],
      },
    },
    applied: null,
    advanced: null,
  },
};

const appliedAddOns = {
  titlePrefix: "결과 품질 높이기: ",
  criteria: "초급 요소에 더해 조건, 예시, 제외할 내용을 명확히 넣으면 성공입니다.",
  extraTemplate: [
    " 참고 예시는 ",
    { key: "constraint", placeholder: "원하는 예시/참고 톤" },
    "이고, 피해야 할 것은 ",
    { key: "constraint", placeholder: "제외할 표현/방식" },
    "이야.",
  ],
};

const advancedAddOns = {
  titlePrefix: "심화 설계: ",
  criteria: "PRD, 초안 생성, 결과 검토, 수정 요청, 재검증 프롬프트까지 이어가면 성공입니다.",
  extraTemplate: [
    " 먼저 이 목표를 위한 미니 PRD를 만들고, 이후 실행 프롬프트와 검토 기준을 함께 제안해줘. 특히 ",
    { key: "constraint", placeholder: "기획 의도/절대 놓치면 안 되는 기준" },
    "이 어긋나면 수정 프롬프트까지 작성해줘.",
  ],
};

const missionGuide = {
  public: {
    short: {
      detail:
        "주민센터에 전입신고 처리 기간을 묻는 민원이 반복해서 들어오고 있습니다. 기존 안내문은 법령 표현이 많아 처음 민원을 넣는 시민이 이해하기 어렵습니다. 시민이 불안하지 않도록 친절하고 짧은 답변으로 바꾸는 것이 목표입니다.",
      clues: "역할: 민원 안내 담당자 / 대상: 처음 민원을 넣는 시민 / 요청: 어려운 안내문을 쉽게 고치기 / 형식: 3문장 이내 / 조건: 친절하고 단정한 문체",
      sample:
        "너는 주민센터 민원 안내 담당자야. 전입신고 처리 기간을 처음 문의한 시민이 읽을 안내문을 작성하려고 해. 법령 표현은 줄이고, 시민이 지금 무엇을 확인하면 되는지 알 수 있게 부드럽고 쉬운 표현으로 고쳐줘. 결과는 3문장 이내로 작성하고, 불필요한 약속이나 확정적인 표현은 피해서 안내해줘.",
    },
    medium: {
      detail:
        "구청에서 주말 재활용 분리배출 캠페인을 진행합니다. 대상은 아파트 주민이고, 문자 한 통으로 일시, 장소, 참여 방법을 안내해야 합니다. 너무 딱딱하지 않되 공공기관 안내문답게 정확해야 합니다.",
      clues: "역할: 행정 홍보 담당자 / 상황: 주민 대상 행사 / 요청: 안내 문자 작성 / 형식: 300자 이내 문자 / 조건: 일시·장소·참여 방법 포함",
      sample:
        "너는 구청 행정 홍보 담당자야. 아파트 주민을 대상으로 주말 재활용 분리배출 캠페인 안내 문자를 작성해야 해. 일시, 장소, 참여 방법이 한눈에 보이도록 정리하고, 주민이 부담 없이 참여하고 싶게 친절한 문체로 써줘. 결과는 문자 1건으로 보낼 수 있게 300자 이내로 작성하고, 문의처를 넣을 자리는 [문의처]로 표시해줘.",
    },
    expanded: {
      detail:
        "새로운 생활폐기물 배출 방식 설명회를 앞두고 있습니다. 주민들은 비용 증가, 배출 시간 변경, 고령층의 이용 어려움을 걱정할 수 있습니다. 담당자는 예상 질문과 답변 방향을 먼저 준비해야 합니다.",
      clues: "역할: 정책 설명회 준비 전문가 / 배경: 새 배출 방식 / 우려: 비용·시간·이용 어려움 / 요청: 예상 Q&A / 형식: 표 / 조건: 공감 후 설명",
      sample:
        "너는 정책 설명회 준비 전문가야. 생활폐기물 배출 방식 변경을 주민에게 설명하려고 해. 주민들이 비용 증가, 배출 시간 변경, 고령층 이용 어려움을 걱정할 수 있으니 예상 질문 8개와 답변 방향을 만들어줘. 결과는 질문, 주민 우려, 답변 핵심, 추가 확인 필요 사항이 있는 표로 정리해줘. 답변은 먼저 우려에 공감한 뒤 행정 절차와 지원 방안을 설명하는 톤으로 작성해줘.",
    },
  },
  office: {
    short: {
      detail:
        "팀 회의에서 나온 메모가 길고 흩어져 있습니다. 다음 회의 전까지 누가 무엇을 언제까지 해야 하는지 정리해야 합니다. 누락되거나 애매한 항목은 따로 표시해야 합니다.",
      clues: "역할: 프로젝트 매니저 / 입력: 회의 메모 / 요청: 실행 항목 정리 / 형식: 담당자·기한·할 일 표 / 조건: 불명확한 항목 표시",
      sample:
        "너는 프로젝트 매니저야. 아래 회의 메모를 보고 팀원이 바로 실행할 수 있는 할 일 목록으로 정리해줘. 결과는 담당자, 할 일, 마감일, 확인이 필요한 사항이 있는 표로 작성해줘. 담당자나 일정이 메모에 없으면 임의로 만들지 말고 '확인 필요'라고 표시해줘.",
    },
    medium: {
      detail:
        "고객사에 프로젝트 진행 상황을 공유해야 합니다. 일정은 조금 지연됐지만 해결 계획이 있고, 고객사가 불안하지 않도록 현재 상태와 다음 조치를 명확히 알려야 합니다.",
      clues: "역할: 고객 커뮤니케이션 담당자 / 상황: 일정 지연 / 요청: 보고 메일 / 형식: 제목+본문 / 조건: 정중하고 해결 중심",
      sample:
        "너는 고객 커뮤니케이션 담당자야. 프로젝트 일정이 일부 지연되었지만 원인 파악과 보완 일정이 준비된 상황에서 고객사에 진행 상황 보고 메일을 보내려고 해. 메일 목적은 현재 상태를 투명하게 공유하고 다음 조치에 대한 신뢰를 주는 것이야. 결과는 제목 3안과 본문 1개로 작성해줘. 문체는 정중하고 해결 중심으로 하고, 책임 회피처럼 보이는 표현은 피해주세요.",
    },
    expanded: {
      detail:
        "이번 주 업무 성과, 지연 이슈, 다음 주 계획을 상사에게 보고해야 합니다. 상사는 긴 설명보다 핵심 판단 포인트와 의사결정이 필요한 부분을 빠르게 보고 싶어 합니다.",
      clues: "역할: 성과 보고 코치 / 상황: 주간 업무 / 요청: 보고서 구조화 / 형식: 요약+표 / 조건: 의사결정 요청 분리",
      sample:
        "너는 성과 보고 코치야. 나는 마케팅 운영팀에서 캠페인 일정 관리와 성과 정리를 맡고 있어. 이번 주 메모를 바탕으로 상사가 빠르게 판단할 수 있는 주간 업무 보고서를 작성해줘. 반드시 이번 주 성과, 지연 이슈, 원인, 다음 주 계획, 의사결정 요청을 구분해줘. 결과는 5줄 요약과 세부 표로 정리하고, 감정적 표현보다 근거 중심으로 작성해줘.",
    },
  },
  student: {
    short: {
      detail:
        "수행평가 주제를 정해야 하는데 너무 넓은 주제만 떠오릅니다. 실제로 조사할 수 있고 발표로 설명하기 쉬운 후보가 필요합니다.",
      clues: "역할: 학습 코치 / 상황: 학년·과목 / 요청: 주제 추천 / 형식: 후보 목록 / 조건: 직접 조사 가능",
      sample:
        "너는 학습 코치야. 나는 중학교 2학년 사회 수행평가를 준비 중이고, 지역 문제와 생활 속 변화를 연결한 주제를 찾고 있어. 직접 조사할 수 있고 발표로 설명하기 쉬운 탐구 주제 5개를 추천해줘. 결과는 주제명, 탐구 질문, 조사 방법, 쉬운 이유를 표로 정리하고, 너무 전문적인 주제는 제외해줘.",
    },
    medium: {
      detail:
        "조사는 어느 정도 했지만 발표 순서와 말투를 정하지 못했습니다. 친구들이 듣는 3분 발표라서 어렵지 않고 자연스럽게 들려야 합니다.",
      clues: "역할: 발표 코치 / 주제: 조사 내용 / 요청: 발표 대본 / 형식: 도입-본문-마무리 / 조건: 3분, 쉬운 말",
      sample:
        "너는 발표 코치야. 발표 주제는 청소년 스마트폰 사용 습관이고, 청중은 같은 반 친구들이야. 3분 안에 말할 수 있는 발표 대본을 만들어줘. 결과는 도입, 본문 2개, 마무리로 나누고, 어려운 용어는 쉬운 말로 바꿔줘. 친구들이 지루하지 않도록 질문으로 시작하는 도입도 포함해줘.",
    },
    expanded: {
      detail:
        "탐구 보고서를 쓰기 전에 질문, 자료 수집 방법, 목차를 먼저 잡아야 합니다. AI가 자료를 지어내지 않도록 확인해야 할 항목도 표시해야 합니다.",
      clues: "역할: 탐구 보고서 지도교사 / 관심사: 탐구 주제 / 요청: 보고서 설계 / 형식: 목차+질문+자료 계획 / 조건: 확인 필요 표시",
      sample:
        "너는 탐구 보고서 지도교사야. 나는 학교 급식 잔반을 줄이는 방법에 대해 탐구 보고서를 쓰려고 해. 먼저 탐구 질문, 가설, 자료 수집 방법, 보고서 목차를 설계해줘. 결과는 목차, 각 장의 핵심 내용, 필요한 자료, 직접 확인해야 할 항목으로 정리해줘. 자료나 통계 수치를 지어내지 말고 확인이 필요한 부분은 '조사 필요'라고 표시해줘.",
    },
  },
  general: {
    short: {
      detail:
        "가족 여행을 준비 중인데 부모님은 편한 이동을 원하고 아이는 체험 활동을 좋아합니다. 짧은 일정 안에서 무리 없는 추천이 필요합니다.",
      clues: "역할: 여행 일정 플래너 / 상황: 가족 여행 / 요청: 일정 추천 / 형식: 일정표 / 조건: 이동 피로도와 취향 고려",
      sample:
        "너는 여행 일정 플래너야. 부모님 2명과 초등학생 아이 1명과 함께 1박 2일 국내 여행을 가려고 해. 부모님은 이동이 편한 코스를 원하고 아이는 체험 활동을 좋아해. 무리 없는 여행 일정 2안을 추천해줘. 결과는 시간대별 일정표로 작성하고, 이동 시간이 길거나 비용이 많이 드는 활동은 피해서 구성해줘.",
    },
    medium: {
      detail:
        "바쁜 생활 때문에 식사가 불규칙합니다. 장보기와 조리가 부담되지 않으면서 일주일 동안 따라 하기 쉬운 식단 아이디어가 필요합니다.",
      clues: "역할: 생활 식단 코치 / 상황: 바쁜 생활 패턴 / 요청: 식단 계획 / 형식: 일주일 표+장보기 목록 / 조건: 간단 조리, 주의 문구",
      sample:
        "너는 생활 식단 코치야. 나는 평일 저녁 시간이 부족하고 아침을 자주 거르는 편이야. 건강한 식습관을 만들기 위한 일주일 식단 아이디어를 제안해줘. 결과는 아침, 점심, 저녁 표와 장보기 목록으로 정리해줘. 조리는 20분 이내로 가능한 메뉴 위주로 하고, 의학적 판단이 필요한 내용은 전문가 상담이 필요하다고 표시해줘.",
    },
    expanded: {
      detail:
        "개인 프로젝트를 시작하고 싶지만 목표가 크고 막연합니다. 지금 가진 시간과 자원을 고려해 첫 주에 바로 할 수 있는 작은 실행 계획으로 나눠야 합니다.",
      clues: "역할: 개인 프로젝트 코치 / 상황: 목표와 현재 상태 / 요청: 실행 계획 / 형식: 단계별 실행표 / 조건: 제약과 점검 기준 포함",
      sample:
        "너는 개인 프로젝트 코치야. 내가 이루고 싶은 목표는 3개월 안에 개인 뉴스레터를 시작하는 것이고, 현재는 주말에만 3시간 정도 시간을 낼 수 있어. 첫 주에 바로 시작할 수 있는 실행 계획을 만들어줘. 결과는 단계별 실행표로 정리하고, 각 단계의 완료 기준, 예상 소요 시간, 막혔을 때 대안을 포함해줘.",
    },
  },
};

/* ===== 교사·마을교육활동가 버전 (대상별 단계 연습) ===== */
const teacherTargets = [
  {
    id: "lower",
    label: "초등 저학년 (1~3학년)",
    tip: "저학년은 짧은 문장, 10~15분 단위 활동, 보호자 안심이 핵심입니다.",
    conditionWhy:
      "저학년은 읽기 수준과 집중 시간이 다릅니다. 문장 길이·활동 시간·안전을 조건으로 걸어야 '진짜 저학년용' 결과가 나옵니다.",
    followUps: [
      "네가 초등 2학년이라면 이 결과에서 어려운 낱말 3개를 골라 쉬운 말로 바꿔줘.",
      "네가 보호자라면 이 글을 읽고 무엇이 궁금할까? 질문 3개를 뽑고 그 답을 반영해줘.",
      "활동 시간이 20분 줄었어. 가장 중요한 활동만 남기고 다시 구성해줘.",
    ],
  },
  {
    id: "upper",
    label: "초등 고학년 (4~6학년)",
    tip: "고학년은 모둠 역할, 스스로 고르는 선택권, '왜·어떻게' 질문에 몰입합니다.",
    conditionWhy:
      "고학년은 스스로 선택하고 역할을 나눌 때 몰입합니다. 모둠 역할·열린 질문·선택권을 조건으로 넣어주세요.",
    followUps: [
      "네가 5학년이라면 이 활동에서 지루할 부분은 어디야? 더 재미있게 바꿔줘.",
      "모둠마다 속도가 달라. 빨리 끝난 모둠을 위한 도전 과제를 1개 추가해줘.",
      "비가 오면 실내에서 할 수 있게 바꿔줘.",
    ],
  },
  {
    id: "teen",
    label: "중학생·청소년",
    tip: "청소년은 가르치는 말투를 싫어합니다. 주인공이 되는 표현과 선택권이 핵심입니다.",
    conditionWhy:
      "청소년은 '어른이 시키는 활동'에 거리를 둡니다. 훈계조 금지, 열린 질문, 동의 절차를 조건으로 걸어주세요.",
    followUps: [
      "중학생이 이 글을 읽고 '오글거린다'고 느낄 표현을 찾아서 고쳐줘.",
      "청소년이 직접 고를 수 있게 선택지 3개 버전으로 다시 만들어줘.",
      "이 활동에서 어른이 너무 많이 개입하는 부분이 있다면 짚어줘.",
    ],
  },
  {
    id: "parent",
    label: "학부모·마을 주민",
    tip: "어른 대상은 1분 안에 읽히는 글, 핵심 먼저, 참여 부담 낮추기가 핵심입니다.",
    conditionWhy:
      "바쁜 어른은 끝까지 읽지 않습니다. 핵심을 맨 앞에, 쉬운 말로, 참여 부담을 낮추는 조건을 넣어주세요.",
    followUps: [
      "바쁜 보호자 입장에서 읽어보고, 꼭 필요 없는 문장을 빼서 더 짧게 만들어줘.",
      "어르신 주민도 읽기 쉽게 글자 수를 줄이고 쉬운 말로 바꿔줘.",
      "참여를 망설이는 주민이 할 법한 질문 3개와 답을 추가해줘.",
    ],
  },
];

const teacherContent = {
  lower: {
    short: {
      title: "텃밭 활동 보호자 안내문 만들기",
      bad: "텃밭 활동 안내문 써줘.",
      role: "초등 저학년 마을교실을 10년째 운영한 마을교사",
      context: "세종시 ○○아파트 마을교실에서 초등 1~3학년 12명과 11월 마지막 주 토요일 10:00~11:30에 단지 텃밭에서 배추 수확 활동을 해.",
      request: "보호자에게 보낼 안내문을 써줘. 준비물(장갑·여벌옷), 안전 주의사항, 비 올 때 대체 일정을 꼭 넣어줘.",
      format: "카카오톡으로 보낼 10줄 이내 글, 이모지 2개 이하",
      constraint: "날짜·시간·장소를 맨 앞에 두고, 저학년 보호자가 걱정할 화장실·간식·귀가 방법도 한 줄씩 안내해줘. 아이 이름 같은 개인정보는 넣지 마.",
    },
    medium: {
      title: "하천 산책 활동지 만들기",
      bad: "환경 활동지 만들어줘.",
      role: "초등 저학년 눈높이를 잘 아는 교육자료 개발자",
      context: "초등 2학년 10명이 동네 하천을 15분 동안 산책한 뒤, 마을교실에서 20분 동안 쓰는 활동지야.",
      request: "'하천에서 만난 것' 활동지를 만들어줘. 본 것 그리기 칸 1개, 빈칸 채우기 3문항, 느낀 점 한 줄을 넣어줘.",
      format: "A4 한 장 활동지 (제목-그리기 칸-문항-느낀 점 순서)",
      constraint: "2학년이 혼자 읽을 수 있게 한 문장은 15자 안팎으로 쓰고, 어려운 한자어는 쉬운 말로 바꿔줘. 정답이 하나뿐인 문제는 1개만 넣어줘.",
    },
    expanded: {
      title: "동네 자원으로 저학년 프로그램 구상하기",
      bad: "마을교육 프로그램 아이디어 알려줘.",
      role: "마을교육 프로그램 기획 전문가",
      context: "우리 동네(세종시 ○○동)에는 하천 산책로, 작은도서관, 전통시장, 목공을 하셨던 은퇴 주민 2명이 있어. 대상은 방과후 마을교실에 오는 초등 1~3학년 12명이야.",
      request: "이 동네 자원을 활용한 4회차 프로그램 주제를 5개 제안해줘.",
      format: "표 (주제 / 활용하는 동네 자원 / 아이들이 배우는 것 / 회차별 활동 한 줄 / 예산 부담 상·중·하)",
      constraint: "저학년은 집중 시간이 짧으니 한 활동을 10~15분 단위로 쪼개고, 칼·불 같은 위험 도구는 쓰지 않게 해줘. 동네 정보 중 사실 확인이 필요한 건 '확인 필요'로 표시해줘.",
    },
  },
  upper: {
    short: {
      title: "전통시장 탐방 보호자 안내문 만들기",
      bad: "마을 탐방 안내문 써줘.",
      role: "초등 고학년 마을학교를 운영하는 마을교사",
      context: "세종시 ○○마을학교에서 초등 4~6학년 15명과 다음 주 토요일 13:00~16:00에 전통시장 탐방 활동을 해. 모둠별로 가게 사장님 인터뷰를 할 예정이야.",
      request: "보호자에게 보낼 안내문을 써줘. 모이는 곳, 준비물(필기도구·용돈 3,000원), 모둠 활동 안전 수칙, 귀가 시간을 꼭 넣어줘.",
      format: "카카오톡으로 보낼 12줄 이내 글",
      constraint: "'모둠별 이동 시 지도교사 동행' 원칙을 분명히 적고, 활동 사진 촬영·게시 동의 여부를 묻는 문장도 한 줄 넣어줘.",
    },
    medium: {
      title: "모둠 인터뷰 활동지 만들기",
      bad: "인터뷰 활동지 만들어줘.",
      role: "초등 고학년 프로젝트 수업을 잘 아는 교육자료 개발자",
      context: "초등 5학년 15명이 4명씩 모둠을 지어 전통시장 가게 사장님을 30분 동안 인터뷰하는 활동이야.",
      request: "인터뷰 활동지를 만들어줘. 인사말 예시, 질문 5개(그중 2개는 모둠이 직접 만드는 빈칸), 들은 내용 정리 칸, 새로 알게 된 점을 넣어줘.",
      format: "A4 앞뒤 한 장 (앞: 인터뷰 준비, 뒤: 정리)",
      constraint: "한 문장은 25자 안팎으로 쓰고, 예/아니오로 끝나는 질문은 빼고 '왜'·'어떻게' 질문을 넣어줘. 모둠 역할(질문자·기록자·사진·시간지킴이)도 표시해줘.",
    },
    expanded: {
      title: "'우리 동네 가이드북' 프로젝트 설계하기",
      bad: "고학년 프로그램 짜줘.",
      role: "마을교육 프로그램 기획 전문가",
      context: "우리 동네(세종시 ○○동)에는 전통시장, 마을 도서관, 하천 생태공원, 마을 기록을 모아온 주민 모임이 있어. 대상은 초등 4~6학년 15명이고, 토요일 2시간씩 4회 운영해.",
      request: "아이들이 '우리 동네 가이드북'을 만드는 4회차 프로젝트를 설계해줘.",
      format: "표 (회차 / 목표 / 활동 / 활용 동네 자원 / 결과물)",
      constraint: "매 회차에 모둠이 스스로 고르는 선택권을 넣고, 동네 정보 중 사실 확인이 필요한 건 '확인 필요'로 표시해줘.",
    },
  },
  teen: {
    short: {
      title: "청소년 동아리 모집 글 만들기",
      bad: "동아리 모집 글 써줘.",
      role: "청소년 동아리(동네방네 프로젝트)를 돕는 마을교육 코디네이터",
      context: "중학생·학교 밖 청소년 10명을 모아 '우리 동네 영상 기록' 동아리를 시작하려고 해. 12월 매주 수요일 17:00~19:00에 모여.",
      request: "청소년이 직접 읽고 신청하고 싶어지는 모집 글을 써줘. 무엇을 하는지, 언제·어디서, 신청 방법을 넣어줘.",
      format: "인스타그램 게시글 (첫 줄 한 문장 + 본문 8줄 이내 + 해시태그 5개)",
      constraint: "어른이 가르치는 말투나 '유익한 시간' 같은 뻔한 표현은 빼고, 청소년이 주인공이 되는 표현으로 써줘. 보호자 동의가 필요하다는 안내도 한 줄 넣어줘.",
    },
    medium: {
      title: "'바꾸고 싶은 우리 동네' 워크시트 만들기",
      bad: "청소년 활동지 만들어줘.",
      role: "청소년 프로젝트 학습을 돕는 퍼실리테이터",
      context: "중학생 10명이 동아리 첫 모임에서 40분 동안 '우리 동네에서 바꾸고 싶은 것'을 찾는 활동이야.",
      request: "문제 발견 워크시트를 만들어줘. 동네에서 불편했던 경험 쓰기, 그 문제로 불편한 사람 떠올리기, 우리가 해볼 수 있는 작은 행동 3개 고르기를 넣어줘.",
      format: "A4 한 장, 3단계 칸 구성",
      constraint: "정답을 유도하는 질문은 빼고 열린 질문으로 써줘. 다른 사람 실명이나 학교 이름은 쓰지 않도록 안내 문구를 넣어줘.",
    },
    expanded: {
      title: "6주 청소년 주도 프로젝트 설계하기",
      bad: "청소년 프로젝트 기획해줘.",
      role: "청소년 주도 프로젝트 설계 전문가",
      context: "동네방네 프로젝트 팀(중학생 6명)이 우리 동네 놀이터 안전 문제를 다루고 싶어 해. 동네에는 주민자치회, 작은도서관, 마을 신문이 있어. 기간은 6주, 주 1회 2시간이야.",
      request: "청소년이 스스로 기획·실행·성찰하는 6주 프로젝트 흐름을 설계해줘. 활동가가 언제 돕고 언제 물러날지도 함께 제안해줘.",
      format: "표 (주차 / 청소년이 하는 일 / 활동가 역할 / 활용 동네 자원 / 성찰 질문)",
      constraint: "결정은 청소년이 하도록 선택지를 주는 방식으로 쓰고, 주민 인터뷰·사진 촬영 때 동의 받는 단계를 꼭 넣어줘.",
    },
  },
  parent: {
    short: {
      title: "겨울방학 프로그램 설명회 안내문 만들기",
      bad: "설명회 안내문 써줘.",
      role: "마을교육지원센터의 주민 소통 담당자",
      context: "○○권역 마을교육지원센터가 12월 둘째 주 목요일 19:00에 주민센터 2층에서 '우리 마을 겨울방학 프로그램 설명회'를 열어. 대상은 초등 자녀를 둔 보호자와 마을 주민이야.",
      request: "보호자와 주민에게 보낼 안내문을 써줘. 무엇을 듣게 되는지, 참석 신청 방법, 자녀 동반 가능 여부를 넣어줘.",
      format: "카카오톡 10줄 이내 글 + 끝에 [신청 링크] 자리 표시",
      constraint: "퇴근하고 오는 바쁜 어른이 1분 안에 읽을 수 있게 날짜·시간·장소를 맨 앞에 두고, 행정 용어 대신 쉬운 말로 써줘.",
    },
    medium: {
      title: "보호자 의견 설문지 만들기",
      bad: "설문지 만들어줘.",
      role: "마을교육 프로그램 만족도 조사를 설계하는 평생교육사",
      context: "가을 마을학교 프로그램(초등 대상, 8회)이 끝났어. 보호자 20명에게 다음 프로그램을 위한 의견을 묻고 싶어.",
      request: "보호자용 짧은 설문지를 만들어줘. 아이가 즐거워한 점, 아쉬웠던 점, 다음에 바라는 주제, 참여 가능한 요일·시간을 물어줘.",
      format: "네이버폼에 옮길 수 있는 문항 목록 (객관식 4개 + 주관식 2개)",
      constraint: "3분 안에 끝낼 수 있게 문항을 짧게 쓰고, 아이 이름·연락처는 묻지 마. 칭찬만 나오지 않게 아쉬운 점을 묻는 문항도 꼭 넣어줘.",
    },
    expanded: {
      title: "주민 재능기부 강사 과정 설계하기",
      bad: "주민 참여 프로그램 짜줘.",
      role: "주민과 함께 마을교육을 설계해 온 마을교육 코디네이터",
      context: "우리 마을에는 텃밭 동아리, 은퇴한 목공·요리 재능 주민, 작은도서관 독서 모임이 있어. 마을학교에 '주민 재능기부 강사'를 새로 모시고 싶어.",
      request: "주민이 마을학교 일일 강사로 참여하는 3단계 과정(발굴-준비-첫 수업)을 설계해줘.",
      format: "표 (단계 / 할 일 / 담당 / 필요한 것 / 주의할 점) + 주민에게 보낼 첫 제안 문자 1개",
      constraint: "주민이 부담 느끼지 않게 '1회 1시간 체험'부터 시작하게 하고, 아동 대상 활동이니 안전 교육·보험 확인 단계를 꼭 넣어줘.",
    },
  },
};

const teacherTemplate = [
  "너는 ",
  { key: "role", placeholder: "누가: 어떤 경험의 사람인가요?" },
  "야. ",
  { key: "context", placeholder: "어디서: 대상(학년·인원)·장소·날짜" },
  " ",
  { key: "request", placeholder: "무엇을: 만들 것 + 꼭 넣을 내용" },
  " 결과는 ",
  { key: "format", placeholder: "어떻게: 어디에 쓸지·길이" },
  " 형태로 만들어줘. ",
  { key: "constraint", placeholder: "대상 맞춤 조건" },
];

const stepDefs = [
  { key: "bad", label: "나쁜 질문", title: "STEP 0. 짧은 질문부터 넣어보기" },
  { key: "role", label: "누가", title: "STEP 1. 누가 — AI에게 역할 주기", prefix: "너는 ", suffix: "야.",
    why: "AI에게 어떤 사람이 되어 답할지 정해줍니다. 경력·전문 분야를 붙이면 말투와 깊이가 달라집니다." },
  { key: "context", label: "어디서", title: "STEP 2. 어디서 — 대상과 상황 알려주기", prefix: "", suffix: "",
    why: "AI는 우리 마을과 우리 아이들을 모릅니다. 대상(학년·인원), 장소, 날짜를 직접 알려줘야 '우리 활동'의 결과가 나옵니다." },
  { key: "request", label: "무엇을", title: "STEP 3. 무엇을 — 만들 것과 꼭 넣을 내용", prefix: "", suffix: "",
    why: "결과물의 종류와 반드시 들어갈 내용을 분명히 말합니다. 빠지면 안 되는 항목은 '꼭'이라고 적어주세요." },
  { key: "format", label: "어떻게", title: "STEP 4. 어떻게 — 형식과 길이 정하기", prefix: "결과는 ", suffix: " 형태로 만들어줘.",
    why: "어디에 쓸지(카톡·A4·표·폼)와 길이를 정하면 고칠 필요 없이 바로 쓸 수 있는 모양으로 나옵니다." },
  { key: "constraint", label: "대상 맞춤", title: "STEP 5. 대상 맞춤 조건 걸기", prefix: "", suffix: "" },
  { key: "followup", label: "이어 묻기", title: "STEP 6. 한 번 더 — 대상의 눈으로 이어 묻기",
    why: "한 번에 끝내지 마세요. 같은 대화창에서 대상의 눈으로 다시 보게 하면 결과가 한 단계 좋아집니다." },
];

function getTeacherTarget() {
  return teacherTargets.find((t) => t.id === elements.target.value) || teacherTargets[0];
}

function assembleTeacherPrompt(parts) {
  return stepDefs
    .filter((s) => s.prefix !== undefined && parts[s.key])
    .map((s) => `${s.prefix}${parts[s.key]}${s.suffix}`)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildTeacherGuide(lengthId) {
  const target = getTeacherTarget();
  const c = teacherContent[target.id][lengthId];
  return {
    title: c.title,
    detail: `[${target.label}] ${c.context}`,
    clues: `누가: ${c.role} / 어디서: ${target.label} / 무엇을: ${c.request.split(".")[0]} / 어떻게: ${c.format} / 대상 맞춤: ${target.tip}`,
    sample: assembleTeacherPrompt(c),
    hint: `${target.tip} 처음 질문 "${c.bad}"에서 무엇이 빠졌는지 떠올려 보세요.`,
    criteria: "누가·어디서·무엇을·어떻게 + 대상 맞춤 조건이 모두 들어가면 성공입니다.",
  };
}

const checklistRules = [
  { key: "role", label: "역할 부여", help: "AI가 어떤 전문가로 답해야 하는지 정합니다." },
  { key: "context", label: "맥락·배경", help: "누구의 어떤 상황인지 알려줍니다." },
  { key: "request", label: "구체적 요청", help: "무엇을 해달라는지 동사로 말합니다." },
  { key: "format", label: "출력 형식", help: "표, 목록, 문장 수 등 결과 모양을 정합니다." },
  { key: "constraint", label: "조건·예시", help: "제약, 톤, 예시, 제외 항목을 붙입니다." },
];

const advancedTasks = [
  {
    title: "1. PRD 작성 프롬프트",
    body: "이 Goal을 제품/수업/업무 과제로 본다면 목적, 대상, 성공 기준, 제약을 정리하게 만듭니다.",
    starter: "너는 PRD 작성 전문가야. 위 Goal을 기준으로 목적, 사용자, 핵심 기능, 성공 기준, 제약 조건을 한 페이지 PRD로 정리해줘.",
  },
  {
    title: "2. 실행 프롬프트",
    body: "PRD를 바탕으로 실제 산출물을 만들게 하는 프롬프트를 작성합니다.",
    starter: "방금 작성한 PRD를 바탕으로 실제 산출물을 만들어줘. 대상 사용자가 바로 쓸 수 있게 구조와 문체를 맞춰줘.",
  },
  {
    title: "3. 산출물 검토 프롬프트",
    body: "방금 나온 결과가 기획 의도와 맞는지 기준표로 점검하게 합니다.",
    starter: "방금 나온 결과물이 나의 기획 의도와 맞는지 검토해줘. PRD의 성공 기준별로 충족/미흡/수정 제안을 표로 정리해줘.",
  },
  {
    title: "4. 수정 요청 프롬프트",
    body: "기획 의도와 다른 결과가 나왔을 때 무엇을 유지하고 무엇을 바꿀지 지시합니다.",
    starter: "방금 입력한 결과물에서 나의 기획 의도와 다른 산출물이 제시되었습니다. 유지할 부분은 ___이고, 수정할 부분은 ___입니다. 이 기준에 맞춰 다시 작성해줘.",
  },
  {
    title: "5. 재생성 프롬프트",
    body: "수정 기준을 반영해 더 나은 두 번째 결과물을 만들게 합니다.",
    starter: "위 수정 기준을 반영해 결과물을 다시 생성해줘. 이전 답변보다 개선된 점을 마지막에 3가지로 요약해줘.",
  },
  {
    title: "6. 회고 프롬프트",
    body: "이번 프롬프트에서 잘 작동한 조건과 다음에 보완할 조건을 정리합니다.",
    starter: "이번 대화에서 프롬프트가 잘 작동한 부분과 부족했던 부분을 분석해줘. 다음에 재사용할 수 있는 개선 프롬프트 템플릿도 만들어줘.",
  },
];

const elements = {
  level: document.querySelector("#levelSelect"),
  persona: document.querySelector("#personaSelect"),
  target: document.querySelector("#targetSelect"),
  targetField: document.querySelector("#targetField"),
  targetTip: document.querySelector("#targetTip"),
  stepPanel: document.querySelector("#stepPanel"),
  stepNav: document.querySelector("#stepNav"),
  stepCounter: document.querySelector("#stepCounter"),
  stepChip: document.querySelector("#stepChip"),
  stepTitle: document.querySelector("#stepTitle"),
  stepWhy: document.querySelector("#stepWhy"),
  stepInputArea: document.querySelector("#stepInputArea"),
  stepPreview: document.querySelector("#stepPreview"),
  stepPrev: document.querySelector("#stepPrev"),
  stepNext: document.querySelector("#stepNext"),
  stepCopy: document.querySelector("#stepCopy"),
  stepCompare: document.querySelector("#stepCompare"),
  compareBad: document.querySelector("#compareBad"),
  compareGood: document.querySelector("#compareGood"),
  length: document.querySelector("#lengthSelect"),
  scenarioMeta: document.querySelector("#scenarioMeta"),
  goalTitle: document.querySelector("#goalTitle"),
  goalDescription: document.querySelector("#goalDescription"),
  successCriteria: document.querySelector("#successCriteria"),
  missionClues: document.querySelector("#missionClues"),
  promptBuilder: document.querySelector("#promptBuilder"),
  hintButton: document.querySelector("#hintButton"),
  hintText: document.querySelector("#hintText"),
  checklist: document.querySelector("#checklist"),
  scoreValue: document.querySelector("#scoreValue"),
  finalPrompt: document.querySelector("#finalPrompt"),
  sampleBox: document.querySelector("#sampleBox"),
  samplePrompt: document.querySelector("#samplePrompt"),
  copyButton: document.querySelector("#copyButton"),
  newScenarioButton: document.querySelector("#newScenarioButton"),
  advancedPanel: document.querySelector("#advancedPanel"),
  advancedTasks: document.querySelector("#advancedTasks"),
  sessionCount: document.querySelector("#sessionCount"),
  bestScore: document.querySelector("#bestScore"),
  progressFill: document.querySelector("#progressFill"),
  progressLabel: document.querySelector("#progressLabel"),
  nextAction: document.querySelector("#nextAction"),
  missionTitle: document.querySelector("#missionTitle"),
};

let state = {
  scenario: null,
  answers: {},
  stepIndex: 0,
  stepAnswers: {},
  showExample: false,
};

function fillSelect(select, options) {
  select.innerHTML = options.map((option) => `<option value="${option.id}">${option.label}</option>`).join("");
}

function getBaseScenario(personaId, lengthId) {
  return scenarioBank[personaId].beginner[lengthId];
}

function getScenario() {
  const levelId = elements.level.value;
  const personaId = elements.persona.value;
  const lengthId = elements.length.value;
  let scenario;
  if (personaId === "teacher") {
    const guide = buildTeacherGuide(lengthId);
    scenario = {
      title: guide.title,
      goal: guide.detail,
      criteria: guide.criteria,
      hint: guide.hint,
      template: structuredClone(teacherTemplate),
      detail: guide.detail,
      clues: guide.clues,
      sample: guide.sample,
    };
  } else {
    const base = getBaseScenario(personaId, lengthId);
    scenario = structuredClone(base);
    const guide = missionGuide[personaId][lengthId];
    scenario.detail = guide.detail;
    scenario.clues = guide.clues;
    scenario.sample = guide.sample;
  }

  if (levelId === "applied") {
    scenario.title = `${appliedAddOns.titlePrefix}${scenario.title}`;
    scenario.criteria = appliedAddOns.criteria;
    scenario.template = [...scenario.template, ...appliedAddOns.extraTemplate];
    scenario.sample = `${scenario.sample}\n\n추가로 원하는 예시 톤과 피해야 할 표현을 각각 1개씩 반영해서, 결과가 더 구체적으로 나오도록 작성해줘.`;
  }

  if (levelId === "advanced") {
    scenario.title = `${advancedAddOns.titlePrefix}${scenario.title}`;
    scenario.criteria = advancedAddOns.criteria;
    scenario.template = [...scenario.template, ...advancedAddOns.extraTemplate];
    scenario.sample = `${scenario.sample}\n\n먼저 이 목표를 위한 미니 PRD를 작성한 뒤, 실행 프롬프트, 산출물 검토 기준, 기획 의도와 다르게 나왔을 때 사용할 수정 프롬프트까지 함께 제안해줘.`;
  }

  return scenario;
}

function renderScenario() {
  const level = levels.find((item) => item.id === elements.level.value);
  const persona = personas.find((item) => item.id === elements.persona.value);
  const length = lengths.find((item) => item.id === elements.length.value);
  const isTeacher = persona.id === "teacher";
  state = { scenario: getScenario(), answers: {}, stepIndex: 0, stepAnswers: {}, showExample: false };

  elements.targetField.hidden = !isTeacher;
  const targetLabel = isTeacher ? ` · ${getTeacherTarget().label}` : "";
  if (isTeacher) elements.targetTip.textContent = getTeacherTarget().tip;
  elements.scenarioMeta.textContent = `${level.label} · ${persona.label}${targetLabel} · ${length.label}`;
  elements.goalTitle.textContent = state.scenario.title;
  elements.goalDescription.textContent = `${state.scenario.detail} ${level.tagline}`;
  elements.successCriteria.textContent = state.scenario.criteria;
  elements.missionClues.textContent = state.scenario.clues;
  elements.samplePrompt.value = state.scenario.sample;
  elements.sampleBox.hidden = true;
  elements.hintText.textContent = state.scenario.hint;
  elements.hintText.hidden = true;
  elements.missionTitle.textContent = `${length.label} 미션 클리어하기`;

  renderPromptBuilder();
  renderAdvancedPanel();
  updateReview();
  elements.stepPanel.hidden = !isTeacher;
  if (isTeacher) renderStepPanel();
}

function renderPromptBuilder() {
  elements.promptBuilder.innerHTML = "";
  state.scenario.template.forEach((part, index) => {
    if (typeof part === "string") {
      const span = document.createElement("span");
      span.className = "prompt-text";
      span.textContent = part;
      elements.promptBuilder.append(span);
      return;
    }

    const input = document.createElement("input");
    input.className = "blank-input";
    input.type = "text";
    input.placeholder = part.placeholder;
    input.dataset.key = part.key;
    input.dataset.index = String(index);
    input.autocomplete = "off";
    input.addEventListener("input", (event) => {
      state.answers[event.target.dataset.index] = event.target.value.trim();
      updateReview();
    });
    elements.promptBuilder.append(input);
  });
}

function buildPrompt() {
  return state.scenario.template
    .map((part, index) => {
      if (typeof part === "string") return part;
      return state.answers[index] || `[${part.placeholder}]`;
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function getFilledKeys() {
  const filled = new Set();
  state.scenario.template.forEach((part, index) => {
    if (typeof part !== "string" && (state.answers[index] || "").length >= 2) {
      filled.add(part.key);
    }
  });
  return filled;
}

function updateReview() {
  const filled = getFilledKeys();
  const score = checklistRules.reduce((sum, rule) => sum + (filled.has(rule.key) ? 20 : 0), 0);
  elements.scoreValue.textContent = `${score}점`;
  elements.finalPrompt.value = buildPrompt();
  elements.sampleBox.hidden = score < 60;
  elements.checklist.innerHTML = checklistRules
    .map((rule) => {
      const done = filled.has(rule.key);
      return `
        <div class="check-item ${done ? "done" : ""}">
          <span class="check-state">${done ? "✓" : "·"}</span>
          <div>
            <h3>${rule.label}</h3>
            <p>${rule.help}</p>
          </div>
          <strong>${done ? 20 : 0}</strong>
        </div>
      `;
    })
    .join("");

  updateMotivation(score, filled);
}

function updateMotivation(score, filled) {
  elements.progressFill.style.width = `${score}%`;
  elements.progressLabel.textContent = `${score}% 달성`;
  document.querySelectorAll("[data-badge]").forEach((badge) => {
    badge.classList.toggle("unlocked", filled.has(badge.dataset.badge));
  });

  const hasInput = Object.values(state.answers).some((value) => value && value.length > 0);
  if (score >= 100) {
    elements.nextAction.textContent = "모든 배지를 모았습니다. 복사해서 내 LLM에 붙여 넣고 결과를 확인해보세요.";
    return;
  }
  if (score >= 80) {
    elements.nextAction.textContent = "거의 완성입니다. 빠진 배지 하나만 채우면 미션 클리어입니다.";
    return;
  }
  if (score >= 40) {
    elements.nextAction.textContent = "좋습니다. 이제 형식이나 조건을 더해 결과를 더 정확하게 만들어보세요.";
    return;
  }
  elements.nextAction.textContent = hasInput
    ? "시작했습니다. AI가 맡을 역할과 상황을 조금 더 알려주세요."
    : "첫 빈칸을 채우면 연습이 시작됩니다.";
}

function renderAdvancedPanel() {
  const isAdvanced = elements.level.value === "advanced";
  elements.advancedPanel.hidden = !isAdvanced;
  elements.advancedTasks.innerHTML = advancedTasks
    .map(
      (task) => `
        <article class="task-card">
          <h3>${task.title}</h3>
          <p>${task.body}</p>
          <textarea aria-label="${task.title}" spellcheck="false">${task.starter}</textarea>
        </article>
      `,
    )
    .join("");
}

function readStats() {
  try {
    return JSON.parse(localStorage.getItem("promptPracticeStats") || '{"count":0,"best":0}');
  } catch (error) {
    return { count: 0, best: 0 };
  }
}

function updateStats(score) {
  const stats = readStats();
  stats.count += 1;
  stats.best = Math.max(stats.best, score);
  try {
    localStorage.setItem("promptPracticeStats", JSON.stringify(stats));
  } catch (error) {
    /* 저장이 막힌 환경에서는 기록만 생략 */
  }
  renderStats();
}

function renderStats() {
  const stats = readStats();
  elements.sessionCount.textContent = stats.count;
  elements.bestScore.textContent = stats.best;
}

function currentScore() {
  return checklistRules.reduce((sum, rule) => sum + (getFilledKeys().has(rule.key) ? 20 : 0), 0);
}

/* ===== 단계별 연습 패널 ===== */
async function copyText(text, button) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    const temp = document.createElement("textarea");
    temp.value = text;
    document.body.append(temp);
    temp.select();
    try {
      document.execCommand("copy");
    } catch (e) {
      /* 복사 불가 환경 */
    }
    temp.remove();
  }
  if (button) {
    const original = button.textContent;
    button.textContent = "복사됨";
    setTimeout(() => {
      button.textContent = original;
    }, 1400);
  }
}

function currentTeacherContent() {
  return teacherContent[getTeacherTarget().id][elements.length.value];
}

function currentStepPrompt() {
  const prompt = assembleTeacherPrompt(state.stepAnswers);
  return prompt || currentTeacherContent().bad;
}

function goStep(index) {
  const next = Math.max(0, Math.min(stepDefs.length - 1, index));
  state.stepIndex = next;
  state.showExample = false;
  renderStepPanel();
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderStepNav() {
  elements.stepNav.innerHTML = "";
  stepDefs.forEach((step, index) => {
    const li = document.createElement("li");
    const button = el("button", "step-dot", `${index}. ${step.label}`);
    button.type = "button";
    const done =
      step.key === "bad"
        ? state.stepIndex > 0
        : step.key === "followup"
          ? false
          : (state.stepAnswers[step.key] || "").length >= 2;
    if (done) button.classList.add("done");
    if (index === state.stepIndex) {
      button.classList.add("current");
      button.setAttribute("aria-current", "step");
    }
    button.addEventListener("click", () => goStep(index));
    li.append(button);
    elements.stepNav.append(li);
  });
}

function renderStepInput(step, content, target) {
  const area = elements.stepInputArea;
  area.innerHTML = "";

  if (step.key === "bad") {
    const quote = el("blockquote", "bad-quote", content.bad);
    const copyBtn = el("button", "secondary-button", "이 질문 복사해서 AI에 넣어보기");
    copyBtn.type = "button";
    copyBtn.addEventListener("click", () => copyText(content.bad, copyBtn));
    const ask = el("p", "step-ask", "결과를 보고, 무엇이 빠져서 '아무 데나 쓸 수 있는 글'이 나왔는지 체크해 보세요.");
    const checks = el("div", "reflect-checks");
    ["누가 쓰는 글인지", "어떤 대상·상황인지", "꼭 들어갈 내용", "길이·형식", `${target.label}에 맞는 배려`].forEach((label) => {
      const lab = el("label", "reflect-check");
      const box = document.createElement("input");
      box.type = "checkbox";
      lab.append(box, document.createTextNode(` ${label}`));
      checks.append(lab);
    });
    area.append(quote, copyBtn, ask, checks);
    return;
  }

  if (step.key === "followup") {
    const list = el("div", "followup-list");
    target.followUps.forEach((text) => {
      const card = el("div", "followup-card");
      const p = el("p", "", text);
      const btn = el("button", "secondary-button", "복사");
      btn.type = "button";
      btn.addEventListener("click", () => copyText(text, btn));
      card.append(p, btn);
      list.append(card);
    });
    const own = el("label", "field-label dark", "나만의 이어 묻기");
    const ta = document.createElement("textarea");
    ta.className = "step-textarea";
    ta.placeholder = `예: 네가 ${target.label.split(" ")[0]} 입장이라면 이 결과에서 무엇을 바꾸고 싶을까?`;
    ta.value = state.stepAnswers.followup || "";
    ta.addEventListener("input", (e) => {
      state.stepAnswers.followup = e.target.value;
    });
    area.append(list, own, ta);
    return;
  }

  const ta = document.createElement("textarea");
  ta.className = "step-textarea";
  ta.placeholder = "여기에 직접 써보세요. 막히면 아래 '예시 보기'를 누르세요.";
  ta.value = state.stepAnswers[step.key] || "";
  ta.addEventListener("input", (e) => {
    state.stepAnswers[step.key] = e.target.value.trim();
    renderStepPreview();
    renderStepNav();
  });

  const row = el("div", "example-row");
  const showBtn = el("button", "secondary-button", state.showExample ? "예시 숨기기" : "예시 보기");
  showBtn.type = "button";
  showBtn.addEventListener("click", () => {
    state.showExample = !state.showExample;
    renderStepPanel();
  });
  row.append(showBtn);

  area.append(ta, row);

  if (state.showExample) {
    const ex = el("div", "example-box");
    ex.append(el("span", "chip", `${target.label} 예시`), el("p", "", content[step.key]));
    const useBtn = el("button", "secondary-button", "예시로 채우고 내 상황에 맞게 고치기");
    useBtn.type = "button";
    useBtn.addEventListener("click", () => {
      state.stepAnswers[step.key] = content[step.key];
      state.showExample = false;
      renderStepPanel();
    });
    ex.append(useBtn);
    area.append(ex);
  }
}

function renderStepPreview() {
  const step = stepDefs[state.stepIndex];
  const content = currentTeacherContent();
  const preview = elements.stepPreview;
  preview.innerHTML = "";
  const filled = stepDefs.filter((s) => s.prefix !== undefined && state.stepAnswers[s.key]);

  if (!filled.length) {
    preview.append(el("span", "preview-bad", content.bad));
    preview.append(el("p", "preview-note", "아직 처음 질문 그대로입니다. 단계를 하나씩 채우면 여기서 프롬프트가 자라납니다."));
  } else {
    filled.forEach((s) => {
      const part = el(s.key === step.key ? "mark" : "span", "preview-part", `${s.prefix}${state.stepAnswers[s.key]}${s.suffix} `);
      part.title = s.label;
      preview.append(part);
    });
  }

  const isLast = step.key === "followup";
  elements.stepCompare.hidden = !(isLast || step.key === "constraint") || !filled.length;
  elements.compareBad.textContent = content.bad;
  elements.compareGood.textContent = assembleTeacherPrompt(state.stepAnswers);
}

function renderStepPanel() {
  const step = stepDefs[state.stepIndex];
  const content = currentTeacherContent();
  const target = getTeacherTarget();

  elements.stepCounter.textContent = `${state.stepIndex} / ${stepDefs.length - 1}`;
  elements.stepChip.textContent = `STEP ${state.stepIndex} · ${target.label}`;
  elements.stepTitle.textContent = step.title;
  elements.stepWhy.textContent =
    step.key === "bad"
      ? `미션: ${content.title}. 먼저 많은 분들이 처음 쓰는 짧은 질문을 그대로 AI에 넣어보세요.`
      : step.key === "constraint"
        ? target.conditionWhy
        : step.why;

  elements.stepPrev.disabled = state.stepIndex === 0;
  elements.stepNext.disabled = state.stepIndex === stepDefs.length - 1;
  elements.stepNext.textContent = state.stepIndex === stepDefs.length - 2 ? "마지막: 이어 묻기" : "다음 단계";

  renderStepNav();
  renderStepInput(step, content, target);
  renderStepPreview();
}

function initialize() {
  fillSelect(elements.level, levels);
  fillSelect(elements.persona, personas);
  fillSelect(elements.target, teacherTargets);
  fillSelect(elements.length, lengths);
  renderStats();
  renderScenario();

  [elements.level, elements.persona, elements.length, elements.target].forEach((select) => {
    select.addEventListener("change", renderScenario);
  });

  elements.hintButton.addEventListener("click", () => {
    elements.hintText.hidden = !elements.hintText.hidden;
  });

  elements.newScenarioButton.addEventListener("click", renderScenario);

  elements.stepPrev.addEventListener("click", () => goStep(state.stepIndex - 1));
  elements.stepNext.addEventListener("click", () => goStep(state.stepIndex + 1));
  elements.stepCopy.addEventListener("click", () => {
    copyText(currentStepPrompt(), elements.stepCopy);
  });

  elements.copyButton.addEventListener("click", async () => {
    await copyText(elements.finalPrompt.value);
    updateStats(currentScore());
    elements.copyButton.textContent = "복사됨";
    setTimeout(() => {
      elements.copyButton.textContent = "복사";
    }, 1400);
  });
}

initialize();
