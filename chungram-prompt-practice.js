const levels = [
  { id: "beginner", label: "초급", tagline: "빈칸을 채우며 역할·맥락·형식을 익힙니다." },
  { id: "applied", label: "응용", tagline: "결과물의 품질을 높이는 조건과 예시를 붙입니다." },
  { id: "advanced", label: "심화", tagline: "하나의 목표를 PRD, 실행, 수정, 검증 프롬프트로 확장합니다." },
];

const personas = [
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
  const base = getBaseScenario(personaId, lengthId);
  const scenario = structuredClone(base);
  const guide = missionGuide[personaId][lengthId];
  scenario.detail = guide.detail;
  scenario.clues = guide.clues;
  scenario.sample = guide.sample;

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
  state = { scenario: getScenario(), answers: {} };

  elements.scenarioMeta.textContent = `${level.label} · ${persona.label} · ${length.label}`;
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

function updateStats(score) {
  const stats = JSON.parse(localStorage.getItem("promptPracticeStats") || '{"count":0,"best":0}');
  stats.count += 1;
  stats.best = Math.max(stats.best, score);
  localStorage.setItem("promptPracticeStats", JSON.stringify(stats));
  renderStats();
}

function renderStats() {
  const stats = JSON.parse(localStorage.getItem("promptPracticeStats") || '{"count":0,"best":0}');
  elements.sessionCount.textContent = stats.count;
  elements.bestScore.textContent = stats.best;
}

function currentScore() {
  return checklistRules.reduce((sum, rule) => sum + (getFilledKeys().has(rule.key) ? 20 : 0), 0);
}

function initialize() {
  fillSelect(elements.level, levels);
  fillSelect(elements.persona, personas);
  fillSelect(elements.length, lengths);
  renderStats();
  renderScenario();

  [elements.level, elements.persona, elements.length].forEach((select) => {
    select.addEventListener("change", renderScenario);
  });

  elements.hintButton.addEventListener("click", () => {
    elements.hintText.hidden = !elements.hintText.hidden;
  });

  elements.newScenarioButton.addEventListener("click", renderScenario);

  elements.copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(elements.finalPrompt.value);
    updateStats(currentScore());
    elements.copyButton.textContent = "복사됨";
    setTimeout(() => {
      elements.copyButton.textContent = "복사";
    }, 1400);
  });
}

initialize();
