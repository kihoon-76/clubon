/**
 * 한국어 사전 — **기준 사전**입니다.
 *
 * 키 구조의 진실은 이 파일이며, 다른 언어 사전의 타입은 여기서 파생됩니다.
 * 그래서 새 문구를 넣을 때는 반드시 여기부터 넣습니다.
 *
 * `{이름}` 꼴은 치환 자리입니다(`t("...", { 이름: 값 })`).
 */
export const ko = {
  /** 공유 카드·검색 결과에 나가는 사이트 정보. */
  site: {
    title: "ClubOn — 어디에 있든, 프라이빗 소셜 클럽",
    description:
      "프로필을 넘기는 대신 대화로 만나는 성인 전용 온라인 소셜 클럽. 그룹으로 입장하고, 마스크를 쓴 채 이야기하고, 양쪽 라운지의 방장이 모두 수락할 때만 얼굴을 공개합니다.",
    ogAlt: "ClubOn — 오늘 밤, 클럽을 켜세요",
    /** `og:locale` — BCP 47이 아니라 `언어_지역` 형식입니다. */
    ogLocale: "ko_KR",
  },
  common: {
    language: "언어",
    close: "닫기",
    back: "돌아가기",
    interests: "관심사",
    mock: "모의 기능",
    mockTitle:
      "이 기능은 데모용 모의 구현입니다. 실제 외부 서비스는 아직 연결되지 않았습니다.",
  },
  nav: {
    pricing: "요금 안내",
    safety: "안전",
    lobby: "로비",
    login: "로그인",
    signup: "가입하기",
    enterNow: "바로 입장",
    logout: "로그아웃",
    dashboard: "마이페이지",
    mainMenu: "주요 메뉴",
    home: "ClubOn 홈으로 이동",
    toLobby: "클럽 로비로 이동",
    adminConsole: "관리자 콘솔",
    myDashboard: "내 대시보드",
    open: "영업 중",
    closed: "영업 종료",
  },
  auth: {
    signupTitle: "가입",
    email: "이메일",
    password: "비밀번호",
    passwordHint: "8자 이상. 다른 서비스와 다른 비밀번호를 사용하세요.",
    passwordConfirm: "비밀번호 확인",
    gender: "성별",
    female: "여성",
    male: "남성",
    genderLocked: "상대를 찾는 기준이 되는 값이라 가입 후에는 바꿀 수 없습니다.",
    signupSubmit: "가입하고 성인 확인하기",
    signupPending: "가입 중…",

    demoTitle: "데모 계정",
    demoIntro:
      "아직 데이터베이스가 연결되지 않아 인메모리 데모 데이터로 동작합니다. 아래 계정으로 바로 둘러볼 수 있으며, 서버가 재시작되면 초기화됩니다.",
    demoMember: "일반 회원 · 하나",
    demoHost: "상대 라운지 호스트 · 도윤",
    demoAdmin: "관리자",
    demoPassword: "비밀번호 공통",
    demoSwitchLabel: "데모 회원 전환",
    demoSwitchTitle: "로그인 없이 둘러보기 — 데모 회원 전환",
    demoSwitch: "전환",
    roleAdmin: "관리자",
    roleModerator: "모더레이터",
    roleUser: "회원",

    signupEyebrow: "입장 신청",
    signupHeadline: "클럽에 등록하기",
    signupIntro:
      "만 19세 이상 성인 전용입니다. 가입 후 성인 확인과 동의 절차가 이어집니다.",
    googleSignup: "Google로 가입하기",
    legalNoticeBefore: "가입 시",
    legalNoticeBetween: "및",
    legalNoticeAfter: "에 대한 동의를 다음 단계에서 받습니다.",
    haveAccount: "이미 회원이신가요?",

    loginEyebrow: "회원 입장",
    loginTitle: "다시 오셨군요",
    loginIntro: "오늘 저녁 자리를 안내해 드릴게요.",
    emailPlaceholder: "you@example.com",
    passwordPlaceholder: "8자 이상",
    loginSubmit: "입장하기",
    loginPending: "입장 중…",
    noAccount: "아직 회원이 아니신가요?",
    or: "또는",
    google: "Google로 계속하기",
    errors: {
      google_unavailable: "Google 로그인이 아직 설정되지 않았습니다.",
      google_cancelled: "Google 로그인을 취소했습니다.",
      google_state:
        "로그인 요청이 만료되었거나 올바르지 않습니다. 다시 시도해 주세요.",
      google_failed:
        "Google 계정을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      account_restricted: "이용이 제한된 계정입니다. 안전센터로 문의해 주세요.",
    },
  },
  /**
   * 폼 선택지 표기.
   *
   * 저장되는 값(`INTEREST_OPTIONS` 등)은 한국어 문자열 그대로이고 DB와 매칭
   * 로직이 그 값을 씁니다. 그래서 값은 손대지 않고 **표기만** 여기서 찾습니다.
   */
  options: {
    gender: {
      female: "여성",
      male: "남성",
      any: "상관없음",
      other: "밝히지 않음",
    },
    energy: { relaxed: "차분한", balanced: "균형 잡힌", lively: "활발한" },
    interests: {
      travel: "여행",
      food: "미식",
      music: "음악",
      jazz: "재즈",
      movies: "영화",
      photography: "사진",
      exhibitions: "전시",
      cafes: "카페",
      books: "책",
      running: "러닝",
      fitness: "운동",
      games: "게임",
    },
    ageBands: {
      early20s: "20대 초반",
      late20s: "20대 후반",
      early30s: "30대 초반",
      late30s: "30대 후반",
    },
  },
  /**
   * 상품 문구 — 키는 상품 코드입니다.
   *
   * 값과 제공량은 `catalog.ts`가, 읽는 문장은 여기가 가집니다.
   */
  products: {
    entry_pass: {
      name: "라운지 입장료",
      tagline: "입장하면서 방 매치 5회를 함께 받습니다",
      f1: "방 매치 5회",
      f2: "매치 1회 = 30분 대화 한 자리",
      f3: "AI 라운지 매니저 매칭",
      f4: "남녀 동일 금액",
    },
    match_1: {
      name: "방 매치 1회",
      tagline: "한 자리만 더 필요할 때",
      f1: "방 매치 1회",
      f2: "30분 대화 한 자리",
    },
    extend_30: {
      name: "30분 연장",
      description: "진행 중인 방을 30분 더 이어갑니다.",
    },
    gift_extend_30: {
      name: "30분 연장 선물",
      description: "이 자리를 연 회원 대신 방 시간을 30분 늘려 줍니다.",
    },
  },
  /** 지역 표기 — 코드는 `regions.<지역 코드>`로 찾습니다. */
  regions: {
    korea: "대한민국",
    "kr-seoul": "서울",
    "kr-gyeonggi": "경기",
    "kr-incheon": "인천",
    "kr-daejeon": "대전",
    "kr-daegu": "대구",
    "kr-busan": "부산",
    "kr-gwangju": "광주",
    "kr-jeju": "제주",
    "kr-chungnam": "충남",
    "kr-chungbuk": "충북",
    "kr-jeonbuk": "전북",
    "kr-jeonnam": "전남",
    "kr-gyeongbuk": "경북",
    "kr-gyeongnam": "경남",
    "kr-islands": "도서지역 (백령·연평·흑산·울릉 등)",
  },
  entry: {
    eyebrow: "입장 신청",
    metaTitle: "입장 신청",
    seatName: "{nickname}님의 자리",
    title: "오늘의 자리를 여세요",
    intro:
      "입장료 {price}에 방 매치 {matches}회를 드립니다. 매치 1회가 {minutes}분 대화 한 자리이고, 성별과 무관하게 같은 금액입니다.",
    remaining: "남은 방 매치",
    times: "{count}회",
    step1Title: "어디에서 만날까요",
    step1Hint: "지역이 같은 회원끼리 이어 드립니다.",
    step2Title: "누구에게 맡길까요",
    step2Hint: "고른 AI 라운지 매니저가 조건에 맞는 상대를 찾습니다.",
    step3Title: "어떤 분을 만나고 싶나요",
    step3Hint: "매니저가 이 조건과 공통점이 가장 많은 상대를 고릅니다.",
    country: "나라 · Country",
    krRegion: "시 · 도",
    select: "선택하세요",
    regionNote:
      "상대는 같은 지역 안에서만 찾습니다. 사람이 적은 지역은 매칭까지 시간이 더 걸릴 수 있습니다.",
    aiDisclaimer:
      "AI 라운지 매니저는 대화를 돕는 디지털 페르소나이며 실제 사람이 아닙니다.",
    desiredGender: "원하는 상대의 성별",
    energy: "대화 분위기",
    interests: "관심사 (여러 개 선택 가능)",
    ageBands: "선호 연령대 (여러 개 선택 가능)",
    submit: "입장 신청하기",
    submitPending: "신청하는 중…",
    accepted: "접수됨",
    summaryTitle: "신청한 조건",
    region: "지역",
    regionUnset: "지역이 지정되지 않았습니다",
    manager: "AI 라운지 매니저",
    managerUnset: "미지정",
    findMatch: "이 조건으로 상대 찾기",
    noMatch:
      "지금 이 지역에서 조건에 맞는 상대를 찾지 못했습니다. 잠시 뒤 다시 시도하거나 조건을 넓혀 보세요.",
    needPayment:
      "남은 방 매치가 없습니다. 입장료를 결제하면 {matches}회를 받고 바로 상대를 찾을 수 있습니다.",
    pay: "{name} 결제하기 · {price}",
    notConfigured: "결제가 아직 연결되지 않았습니다. 곧 열립니다.",
    reset: "조건 다시 고르기",
    toLobby: "로비로",
    checking:
      "결제를 확인하는 중입니다. 확인이 끝나면 이 화면에 매치 횟수가 반영됩니다 — 잠시 후 새로고침해 주세요.",
    deductNote:
      "매치 횟수는 신청할 때가 아니라 영상방에 들어갈 때 1회 빠집니다. 상대를 찾지 못했거나 합석이 성사되지 않으면 횟수는 그대로 남습니다. 방에 들어가면 참가자 각자에게서 1회씩 빠집니다.",
    errors: {
      region: "지역을 다시 골라 주세요.",
      invalid: "입력한 조건을 확인해 주세요.",
      unavailable: "지금은 결제할 수 없는 상품입니다.",
      unknown: "알 수 없는 상품입니다.",
      not_configured: "결제가 아직 연결되지 않았습니다. 잠시 후 다시 시도해 주세요.",
      creem_error: "결제 페이지를 열지 못했습니다. 잠시 후 다시 시도해 주세요.",
    },
  },
  /** 라운지 상태 배지 — 키는 `Table.state`입니다. */
  tableState: {
    FORMING: "구성 중",
    READY: "매칭 준비 완료",
    WAITING: "매칭 대기 중",
    MATCH_PROPOSED: "매치 제안됨",
    MATCH_ACCEPTED: "합석 준비 중",
    LIVE: "대화 중",
    PAUSED: "일시 정지",
    CLOSED: "종료됨",
    MODERATION_LOCKED: "잠금",
  },
  dashboard: {
    eyebrow: "내 대시보드",
    greeting: "{nickname}님",
    member: "회원",
    feedbackThanks: "피드백을 보내주셔서 감사합니다.",
    purchaseProcessing:
      "결제를 확인하고 있습니다. 결제사 확인이 끝나면 방 매치가 자동으로 지갑에 들어옵니다. 잠시 후 이 페이지를 새로고침해 주세요.",
    purchaseCancelled: "결제를 취소했습니다. 매치 횟수는 차감되지 않았습니다.",

    club: "클럽",
    open: "영업 중",
    closed: "영업 종료",
    toLounge: "라운지로 이동",
    toLobby: "클럽 로비로 입장",

    profile: "프로필",
    vibe: "대화 성향",
    reputation: "평판 점수",
    points: "{count}점",
    editProfile: "프로필 수정",

    history: "대화 기록",
    historyEmpty: "아직 참여한 대화가 없습니다.",
    sessionEnded: "종료",
    sessionLive: "진행 중",
    myRating: "내 평가 {rating}점",
    leaveFeedback: "피드백 남기기",

    safety: "안전 · 동의",
    accountStatus: "계정 상태",
    statusActive: "정상",
    statusSuspended: "정지",
    statusRestricted: "이용 제한",
    requiredConsent: "필수 동의",
    completed: "완료",
    blockedMembers: "차단한 회원",
    people: "{count}명",
    optionalConsent: "선택 동의",
    granted: "동의함",
    notGranted: "동의 안 함",
    changeConsent: "동의 항목 변경",
    safetyCenter: "안전 센터",
  },
  club: {
    alwaysOpen: "상시 오픈",
    until: "{time}까지",
    opensAt: "{time} 오픈",
    open: "영업 중",
    hoursUnknown: "운영시간 미정",
  },
  legal: {
    updatedAt: "최종 수정일 {date}",
    draft: "초안",
  },
  safety: {
    metaTitle: "안전 센터",
    metaDescription:
      "ClubOn의 안전 원칙, 얼굴 공개 정책, 촬영·녹화 금지 정책과 신고 절차 안내.",
    eyebrow: "안전 센터",
    title: "편안한 대화는 안전에서 시작합니다",
    intro:
      "ClubOn이 회원을 보호하기 위해 지키는 원칙과, 문제가 생겼을 때 이용할 수 있는 절차를 정리했습니다.",

    p1Title: "그룹으로만 만납니다",
    p1Body:
      "대화는 라운지 단위로 합석합니다. 합석 룸은 최소 2명으로 시작하며, 인원이 기준 아래로 떨어지면 세션이 일시 정지되고 참가자는 대기 라운지로 돌아갑니다.",
    p2Title: "얼굴은 기본적으로 가려집니다",
    p2Body:
      "모든 세션은 동물 마스크가 적용된 상태로 시작합니다. 얼굴 추적이 일시적으로 실패하면 영상이 블러 처리되거나 아바타로 대체되며, 원본 얼굴이 노출되지 않습니다.",
    p3Title: "언제든 나가고, 신고할 수 있습니다",
    p3Body:
      "룸 안에서 신고와 차단은 항상 한 번의 조작으로 가능합니다. 차단하면 이후 매칭에서도 해당 회원과 다시 만나지 않습니다.",
    p4Title: "촬영과 녹화는 금지됩니다",
    p4Body:
      "가입 시, 룸 입장 전, 얼굴 공개 전 세 차례 확인을 받습니다. 화면에는 사용자 식별자와 시각이 포함된 워터마크가 표시됩니다.",

    revealTitle: "얼굴 공개 정책",
    reveal1:
      "얼굴 공개는 합석한 두 라운지의 방장이 모두 수락해야 이루어집니다. 참가자 개인이 다른 참가자에게 직접 공개를 요청할 수는 없습니다.",
    reveal2:
      "양쪽 방장의 수락이 확정되면 그 방에 있는 모든 참가자의 마스크가 한꺼번에 벗겨집니다.",
    reveal3:
      "어느 쪽 방장이든 마스크를 다시 씌우면 참가자 전원이 즉시 마스크 상태로 돌아갑니다. 공개를 결정한 방장이 방을 나가도 마찬가지입니다.",
    reveal4:
      "공개된 뒤에도 내가 차단한 참가자는 나에게 계속 마스크로 보이며, 모더레이션 조치로 영상이 제한된 참가자도 공개되지 않습니다.",
    reveal5: "세션이 종료되면 얼굴 공개도 함께 종료됩니다.",
    reveal6: "거절해도 상대에게 거절 사유가 표시되지 않습니다.",

    recordingTitle: "촬영·녹화 금지 정책",
    recordingBody:
      "다른 참가자의 영상, 음성, 개인정보를 캡처·녹화·촬영하거나 공유하는 행위는 금지됩니다. 위반 시 영구 이용정지 및 관련 법률에 따른 법적 책임이 따를 수 있습니다.",
    recordingLimits:
      "플랫폼은 모든 스크린샷이나 외부 기기를 이용한 촬영을 기술적으로 완전히 차단할 수 없습니다. 그래서 마스크 기본 착용, 방장 합의 기반 공개, 동적 워터마크, 반복 확인 절차, 신고와 제재를 함께 운영합니다.",

    reportTitle: "신고 절차",
    report1: "룸 안에서 해당 참가자의 신고 버튼을 선택합니다.",
    report2: "사유를 고르고 필요하면 상황을 설명합니다.",
    report3:
      "신고와 동시에 해당 참가자를 차단할 수 있으며, 차단하면 그 참가자는 나에게 다시 마스크 상태로만 보입니다.",
    report4: "관리자가 신고를 검토하고 경고, 제한, 정지 등 조치를 결정합니다.",
    reportUrgent:
      "긴급한 위험이 있다고 판단되는 경우 즉시 세션에서 나간 뒤 신고해 주세요. 자동 모더레이션은 모든 위반을 완벽하게 탐지한다고 보장하지 않습니다.",

    /** 약관·개인정보 처리방침은 아직 한국어 원문만 있습니다. */
    legalKoreanOnly:
      "이 문서는 현재 한국어로만 제공됩니다. 번역본은 법률 검토를 거친 뒤 올라갑니다.",
  },
  footer: {
    blurb:
      "성인 전용 온라인 소셜 클럽. 술 없이, 이동 없이, 대화로 만나는 그룹 기반 만남.",
    groupClub: "클럽",
    howItWorks: "이용 방식",
    groupSafety: "안전과 신뢰",
    safetyCenter: "안전 센터",
    revealPolicy: "얼굴 공개 정책",
    recordingPolicy: "촬영·녹화 금지 정책",
    groupLegal: "약관",
    terms: "이용약관",
    privacy: "개인정보처리방침",
    adultsOnly:
      "만 19세 이상 성인만 이용할 수 있습니다. 본 서비스는 데이팅 매칭이나 성인 오락 서비스가 아니며, 그룹 대화를 위한 소셜 클럽입니다.",
    noRecording:
      "다른 참가자의 영상, 음성, 개인정보를 캡처·녹화·촬영하거나 공유하는 행위는 금지됩니다. 위반 시 영구 이용정지 및 관련 법률에 따른 법적 책임이 따를 수 있습니다.",
  },
  landing: {
    badge: "만 19세 이상 · 회원제 · 술 없는 클럽",
    heroLine1: "어디에 있든,",
    heroLine2: "프라이빗 소셜 클럽.",
    heroBody:
      "프로필을 넘기는 대신 대화로 만납니다. 친구와 함께 한 테이블에 앉고, 마스크를 쓴 채 이야기하고, 양쪽 라운지의 방장이 모두 수락할 때만 얼굴을 공개합니다.",
    heroCta: "입장 신청하기",
    heroSecondary: "이용 방식 살펴보기",
    heroNote:
      "1:1 매칭은 제공하지 않습니다. 모든 대화는 최소 2명 이상의 그룹으로 시작됩니다.",
    scrollDown: "아래로 스크롤",

    uspEyebrow: "ClubOn이 다른 이유",
    uspCompare: "나이트클럽 부킹룸 한 번에",
    uspComparePrice: "30만 원부터 150만 원.",
    uspOurs: "클럽온 라운지룸은 단 3만 원.",
    uspEasy1: "비싼 술값도, 택시비도, 긴 대기 줄도 필요 없습니다.",
    uspEasy2:
      "친구와 함께 라운지에 입장해 동물 마스크를 쓰고 편하게 대화하세요.",
    uspPromise1: "대화가 통했다면 양쪽 방장의 동의로 동시에",
    uspPromise1Accent: "얼굴 공개!",
    uspPromise2: "마음에 들지 않으면 부담 없이",
    uspPromise2Accent: "다음 라운지로 이동!",
    uspClose1: "집에서 즐기는 프라이빗 나이트라이프,",
    uspClose2: "부킹의 설렘은 그대로, 비용은",
    uspCloseAccent: "10분의 1",
    uspCloseTail: "로.",
    uspTagline: "오늘 밤, 클럽에 가지 말고",
    uspTaglineAccent: "클럽을 켜세요.",
    uspSignature: "CLUB ON — 온라인 부킹 라운지",

    howEyebrow: "이용 방식",
    howTitle: "한 테이블에서 시작해, 다른 테이블과 만납니다",
    howBody:
      "ClubOn은 무작위 화상 채팅이 아닙니다. 정해진 시간에 열리고, 그룹으로 입장하며, 매칭은 양측 합의로만 성사됩니다.",
    step1Title: "성인 인증 후 입장",
    step1Body: "생년월일 확인과 개별 동의 절차를 거쳐 회원으로 등록합니다.",
    step2Title: "테이블 구성",
    step2Body:
      "1~4명으로 테이블을 만들거나, 초대 코드로 친구의 테이블에 합류합니다. 혼자여도 바로 상대 라운지를 찾을 수 있습니다.",
    step3Title: "AI 라운지 매니저가 매칭",
    step3Body:
      "관심사, 언어, 대화 에너지를 바탕으로 어울리는 다른 라운지를 찾아 소개합니다.",
    step4Title: "양쪽 테이블이 수락",
    step4Body:
      "두 테이블이 모두 동의해야 합석 룸이 열립니다. 어느 쪽도 강요받지 않습니다.",
    step5Title: "마스크를 쓴 채 대화",
    step5Body:
      "동물 마스크를 쓰고 시작합니다. 외모가 아니라 대화로 먼저 만납니다.",
    step6Title: "두 방장이 수락할 때만 공개",
    step6Body:
      "양쪽 라운지의 방장이 모두 수락하면, 그 순간 방 전체의 마스크가 함께 벗겨집니다.",

    waiterEyebrow: "AI 라운지 매니저",
    waiterTitle: "잘 맞는 라운지를 찾아 연결합니다",
    waiterBody:
      "AI 라운지 매니저는 라운지의 취향과 원하는 상대의 조건을 확인하고, 그 조건에 가장 잘 맞는 라운지를 찾아 왜 어울리는지와 함께 소개합니다. 외모를 평가하거나 순위를 매기지 않으며, 수락을 재촉하지 않습니다.",
    waiterPromise1: "외모 평가·순위 매기기를 하지 않습니다",
    waiterPromise2: "다른 회원의 비공개 프로필 정보를 알려주지 않습니다",
    waiterPromise3: "매칭 성사나 연애 결과를 보장하지 않습니다",
    waiterSample: "대화 예시",
    waiterLine1:
      "안녕하세요. 오늘 저녁은 편안한 대화, 활기찬 분위기, 여행 이야기 중 어느 쪽이 좋으실까요?",
    waiterLine2:
      "말씀하신 조건과 가장 잘 맞는 라운지를 찾았습니다. 소개해 드릴까요?",
    waiterLine3: "양쪽 라운지 모두 수락하셨습니다. 10초 뒤 합석 룸이 열립니다.",

    revealEyebrow: "마스크와 얼굴 공개",
    revealTitle: "공개는 두 방장의 합의로만",
    revealBody:
      "모든 대화는 동물 마스크를 쓴 상태에서 시작합니다. 마스크 해제는 합석한 두 라운지의 방장이 모두 수락한 경우에만, 방 전체에 한꺼번에 적용됩니다.",
    reveal1Title: "두 방장이 모두 수락해야 합니다",
    reveal1Body:
      "한쪽 방장이 제안하면 상대 라운지의 방장에게 확인 요청이 전달됩니다. 거절해도 이유가 표시되지 않습니다.",
    reveal2Title: "방 전체가 함께 공개됩니다",
    reveal2Body:
      "합의가 확정되면 양쪽 라운지의 모든 참가자가 동시에 마스크를 벗습니다. 다만 내가 차단한 상대는 계속 마스크로 보입니다.",
    reveal3Title: "언제든 다시 마스크를 쓸 수 있습니다",
    reveal3Body:
      "어느 방장이든 되돌리면 참가자 전원이 즉시 마스크 상태로 돌아갑니다. 방장이 나가거나 세션이 끝날 때도 마찬가지입니다.",

    safetyEyebrow: "안전과 신뢰",
    safetyTitle: "편안하려면 먼저 안전해야 합니다",
    safety1Title: "성인 전용",
    safety1Body:
      "생년월일 확인과 본인확인 절차를 거친 회원만 입장할 수 있습니다.",
    safety2Title: "그룹 단위 대화",
    safety2Body:
      "대화는 라운지 단위로 합석합니다. 합석 룸은 최소 2명으로 시작합니다.",
    safety3Title: "실시간 모더레이션",
    safety3Body:
      "메시지는 전달 전에 검사되며, 위반은 단계적으로 조치되고 관리자가 검토합니다.",
    safety4Title: "촬영·녹화 금지",
    safety4Body:
      "동의 절차와 워터마크로 억제하고, 위반 신고 시 이용정지 등 조치가 이루어집니다.",
    safetyNote:
      "모더레이션은 자동 검사와 사람의 검토를 함께 사용하지만 모든 위반을 완벽하게 걸러낸다고 보장하지 않습니다. 또한 플랫폼은 모든 스크린샷과 외부 촬영을 기술적으로 차단할 수 없습니다. 그래서 마스크 기본 착용, 방장 합의 공개, 워터마크, 신고 절차를 함께 운영합니다.",

    hoursTitle: "매일 저녁 6시부터 새벽 4시까지",
    hoursBody:
      "클럽이 닫힌 시간에도 가입, 프로필 수정, 친구 초대, 테이블 예약은 가능합니다.",
    hoursCta: "먼저 가입해 두기",

    closingLine1: "대화로 먼저 만나는 저녁,",
    closingLine2: "오늘 열립니다.",
    closingBody: "더 진짜에 가까운 만남을, 더 낮은 부담으로.",
    closingSecondary: "멤버십 살펴보기",
  },
  /**
   * 방 안에 남는 안내 문구.
   *
   * 저장되는 것은 이 키이고, 문장은 보는 사람의 언어로 만들어집니다
   * (`buildRoomView`). 한 방에 서로 다른 언어를 쓰는 사람이 함께 있기 때문입니다.
   */
  roomChat: {
    system: "시스템",
    opened:
      "두 라운지가 합석했습니다. 오늘 자리는 {waiter} 매니저가 안내합니다. 얼굴 공개는 양쪽 라운지의 방장이 모두 수락할 때만 이루어지며, 그때 방 전체의 마스크가 함께 벗겨집니다.",
    noRecording:
      "다른 참가자의 영상·음성·개인정보를 캡처, 녹화, 촬영하거나 공유하는 행위는 금지됩니다.",
    left: "{nickname}님이 나갔습니다.",
    ended: "세션이 종료되었습니다. ({reason})",
    endedByHost: "호스트가 종료했습니다.",
    paused: "참가자가 최소 인원({min}명) 아래로 줄어 대화를 일시 정지했습니다.",
    resumed: "인원이 회복되어 대화를 재개합니다.",

    action: "{nickname}님에게 커뮤니티 기준에 따른 조치가 적용되었습니다: {action}",
    actionLogOnly: "기록만",
    actionReviewMute: "관리자 검토 대기 · 음소거",
    actionMute: "음소거",
    actionBlur: "영상 블러 처리",
    actionWarn: "경고",

    revealProposed:
      "{nickname} 방장이 얼굴 공개를 제안했습니다. 상대 라운지 방장이 수락하면 방 전체의 마스크가 벗겨집니다.",
    revealDeclined:
      "상대 라운지 방장이 이번에는 얼굴 공개를 원하지 않았습니다. 모두 마스크를 유지합니다.",
    revealed:
      "양쪽 라운지 방장이 모두 수락해 이 방 참가자 전원의 마스크가 벗겨졌습니다. 어느 방장이든 언제든지 다시 마스크를 씌울 수 있습니다.",
    remasked: "방장이 마스크를 다시 씌웠습니다. 참가자 전원이 마스크 상태로 돌아갑니다.",
    hostLeftRemask: "공개를 결정한 방장이 나가 참가자 전원이 다시 마스크를 착용했습니다.",

    sim1: "안녕하세요! 반가워요 :)",
    sim2: "다들 오늘 어떤 하루 보내셨어요?",
    sim3: "저는 요즘 퇴근하고 산책하는 게 낙이에요.",
    sim4: "이 라운지 분위기 좋네요.",
    sim5: "최근에 본 것 중에 추천할 만한 거 있으세요?",
    sim6: "여행 얘기 나오면 밤새울 수 있어요.",
    sim7: "음악 취향이 비슷한 것 같아 반갑네요.",

    ice1: "가장 최근에 '이건 진짜 좋았다' 싶었던 순간은 언제였나요?",
    ice2: "다음에 꼭 다시 가고 싶은 도시가 있다면 어디인가요?",
    ice3: "요즘 반복해서 듣는 곡 하나만 알려주세요.",
    ice4: "완벽한 주말 하루를 마음대로 짠다면 어떤 하루일까요?",
  },
  room: {
    extendHint:
      "대화가 잘 이어지고 있다면 시간을 늘릴 수 있습니다. 매치 횟수는 쓰지 않고 결제로만 늘어납니다.",
    extendGiftHint:
      "이 자리를 연 회원 대신 방 시간을 늘려 줄 수 있습니다. 늘어난 시간은 모두에게 함께 적용됩니다.",

    stateLive: "대화 중",
    statePaused: "일시 정지",
    stateLocked: "잠금",
    stateEnded: "종료됨",
    participantCount: "참가자 {count}명",
    revealedNote: "얼굴이 공개된 상태입니다.",
    maskedNote: "음성으로 대화하고, 얼굴은 방장 합의 후 함께 공개됩니다.",
    pausedNote:
      "참가자가 최소 인원(2명) 아래로 줄어 대화가 일시 정지되었습니다. 인원이 회복되면 자동으로 재개됩니다.",
    endedNote: "세션이 종료되었습니다.",
    extendFailed: "연장 결제를 시작하지 못했습니다.",
    extendChecking:
      "연장 결제를 확인하는 중입니다. 확인이 끝나면 남은 시간이 자동으로 늘어납니다.",
    micOff: "마이크 끄기",
    micOn: "마이크 켜기",
    camOff: "카메라 끄기",
    camOn: "카메라 켜기",
    endSession: "세션 종료",
    leave: "나가기",
    mutedNote: "모더레이션 조치로 마이크가 잠겨 있습니다. 관리자 검토 후 해제됩니다.",
    extendErrors: {
      no_usage: "아직 영상이 시작되지 않아 늘릴 시간이 없습니다.",
      closed: "이미 종료된 자리라 시간을 늘릴 수 없습니다.",
      unavailable: "지금은 구매할 수 없는 상품입니다.",
      not_configured: "결제가 아직 연결되지 않았습니다. 잠시 후 다시 시도해 주세요.",
      creem_error: "결제 페이지를 열지 못했습니다. 잠시 후 다시 시도해 주세요.",
    },

    timerLabel: "라운지 남은 시간",
    timeLeft: "남은 시간",
    extendedApplied: "연장 {minutes}분 적용됨",
    warn1: "1분 뒤 영상 연결이 종료됩니다.",
    warn5: "5분 뒤 영상 연결이 종료됩니다.",
    timeUp: "{minutes}분이 끝나 영상 연결이 종료되었습니다.",
    timeUpHasMatches:
      "남은 방 매치가 {count}회 있습니다. 새로 입장 신청을 하면 다음 {minutes}분이 시작됩니다.",
    timeUpNoMatches: "방 매치를 1회 더 사면 새 자리를 열 수 있습니다.",
    newSeat: "새 자리 신청하기",
    topUpMatches: "방 매치 채우기",

    revealLabel: "얼굴 공개",
    revealAccept: "수락 · 전원 공개",
    revealDecline: "거절",
    remask: "다시 마스크",
    proposeReveal: "상대 방장에게 공개 제안",
    revealHostNote:
      "방장인 두 분이 모두 수락해야 공개되며, 공개는 방에 있는 모든 참가자에게 함께 적용됩니다.",
    revealGuestNote:
      "얼굴 공개는 양쪽 라운지의 방장이 결정합니다. 공개 후에도 내가 차단한 상대는 계속 마스크로 보입니다.",
    revealHeadRevealed: "양쪽 방장이 수락해 방 전체가 얼굴을 공개했습니다.",
    revealHeadAsked: "{name} 방장이 얼굴 공개를 제안했습니다.",
    revealHeadWaiting: "상대 라운지 방장의 응답을 기다리는 중입니다.",
    revealHeadDiscussing: "두 방장이 얼굴 공개를 논의하고 있습니다.",
    revealHeadCancelled: "이번에는 공개하지 않기로 했습니다. 모두 마스크 상태입니다.",
    revealHeadRemasked: "다시 마스크 상태로 돌아왔습니다.",
    revealHeadMasked: "모든 참가자가 마스크를 쓰고 있습니다.",
    otherLounge: "상대 라운지",

    chatTitle: "대화",
    chatNotice:
      "메시지는 자동 검사를 거칩니다. 자동 탐지는 모든 위반을 완벽하게 잡아내지 못할 수 있습니다.",
    chatLogLabel: "대화 내용",
    chatBlocked: "전송되지 않음",
    chatFlagged: "검토 대상",
    chatPlaceholder: "메시지 입력",
    chatPlaceholderDisabled: "지금은 메시지를 보낼 수 없습니다",
    chatSend: "메시지 보내기",

    me: "나",
    host: "방장",
    revealedBadge: "공개됨",
    demo: "데모",
    statusWarned: "경고",
    statusRestricted: "영상 제한",
    statusMuted: "음소거 조치",
    statusRemoved: "퇴장 조치",
    blurredNote: "모더레이션 조치로 영상이 흐리게 표시됩니다.",
    micIsOn: "마이크 켜짐",
    micIsOff: "마이크 꺼짐",
    blockedNote: "차단한 참가자입니다.",
    report: "신고",
    block: "차단",
    maskAria: "{mask} 마스크",

    reportTitle: "{nickname}님 신고",
    reportIntro:
      "접수된 신고는 모더레이터가 검토합니다. 관련 대화 기록은 검토가 끝날 때까지 보존됩니다.",
    reportReason: "사유",
    reportReasonPlaceholder: "사유를 선택하세요",
    reportDetail: "상세 설명 (선택)",
    reportDetailPlaceholder:
      "어떤 일이 있었는지 알려주시면 검토에 도움이 됩니다.",
    reportBlockToo:
      "이 회원을 차단합니다. 차단하면 상대의 메시지가 보이지 않고, 공개 권한도 즉시 취소됩니다.",
    reportCancel: "취소",
    reportSubmit: "신고 접수",
    reportPending: "접수 중…",

    videoConnecting: "화상 연결 중…",
    videoNoMatches: "남은 방 매치 횟수가 없어 영상에 들어갈 수 없습니다.",
    videoNoMatchesBody:
      "방에 들어갈 때 각자 매치 1회를 씁니다. 1회만 더 사면 바로 이어서 참여할 수 있고, 그동안 채팅은 그대로 이어집니다.",
    videoTopUp: "매치 횟수 채우기",
    videoExpired: "이 라운지의 {minutes}분이 끝났습니다.",
    videoUnconfigured:
      "화상 서버가 설정되지 않아 음성·영상 없이 채팅으로만 진행합니다.",
    videoError: "화상 연결에 실패했습니다. 채팅과 마스크 대화는 그대로 이어집니다.",
    cameraPreviewLabel: "내 카메라 미리보기",
    cameraOff: "카메라 꺼짐",
    cameraDenied: "카메라 권한이 없어 아바타로 참여합니다.",
    cameraOpening: "카메라 여는 중…",
  },
  feedback: {
    metaTitle: "세션 피드백",
    roomMetaTitle: "마스크 대화방",
    eyebrow: "세션 마무리",
    title: "오늘 자리는 어떠셨나요?",
    intro:
      "남겨주신 평가는 다음 매칭 품질을 높이는 데만 쓰이며, 다른 참가자에게 공개되지 않습니다.",
    already: "이미 이 세션에 대한 피드백을 남기셨습니다. ({rating}점{vibe})",
    backToLobby: "로비로 돌아가기",
    myRecords: "내 기록 보기",

    editEyebrow: "프로필",
    editTitle: "프로필 수정",
    editIntro:
      "라운지 매니저가 자리를 안내할 때 참고하는 정보입니다. 저장하면 다음 매칭부터 반영됩니다.",
    saveChanges: "변경사항 저장",
    backToDashboard: "대시보드로 돌아가기",

    ratingLegend: "이번 자리는 어땠나요?",
    ratingPoint: "{n}점",
    vibeLegend: "분위기 (선택)",
    vibeRelaxed: "편안했어요",
    vibeFun: "즐거웠어요",
    vibeDeep: "깊이 있었어요",
    vibeDisappointing: "아쉬웠어요",
    rematch: "이 라운지와 다시 만나고 싶어요.",
    comment: "남기고 싶은 말 (선택)",
    commentPlaceholder: "운영에 참고할 의견을 남겨주세요.",
    submit: "피드백 보내기",
    pending: "보내는 중…",
  },
  /**
   * 모더레이션 사유 — 보낸 사람에게만 보입니다.
   *
   * 규칙은 모듈이 로드될 때 한 번 만들어지므로 문장을 담을 수 없습니다.
   * 키만 담아 두고 화면에서 옮깁니다.
   */
  moderation: {
    minorContact: "미성년자 관련 표현은 허용되지 않습니다.",
    prostitution: "성매매·알선으로 판단되는 표현은 허용되지 않습니다.",
    threat: "협박으로 판단되는 표현은 허용되지 않습니다.",
    sexualHarassment: "성적 괴롭힘으로 판단되는 표현은 허용되지 않습니다.",
    hateSpeech: "혐오 표현은 허용되지 않습니다.",
    harassment: "모욕적인 표현은 허용되지 않습니다.",
    paymentSolicitation: "금전 요구로 판단되는 표현은 허용되지 않습니다.",
    contactInfo:
      "전화번호·이메일 등 외부 연락처는 클럽 밖 위험을 키울 수 있어 공유할 수 없습니다.",
    socialHandle: "외부 SNS 계정 공유는 권장되지 않습니다.",
    spam: "외부 링크는 검토 대상입니다.",
    repeat: "같은 문자를 반복하는 도배는 허용되지 않습니다.",
    blockedFallback: "메시지를 보낼 수 없습니다.",
    flaggedFallback: "검토 대상 메시지입니다.",
    notParticipant: "이 룸에 참여하고 있지 않습니다.",
    emptyMessage: "빈 메시지는 보낼 수 없습니다.",
    reportInvalid: "신고 내용을 확인해 주세요.",
    reportSelf: "자기 자신은 신고할 수 없습니다.",
    feedbackInvalid: "평가를 선택해 주세요.",
  },
  /** 마스크 이름 — 키는 `MaskId`입니다. */
  masks: {
    fox: "여우",
    cat: "고양이",
    rabbit: "토끼",
    bear: "곰",
    wolf: "늑대",
  },
  /**
   * 신고 사유 — 저장값은 한국어 문자열이라 표기만 여기서 찾습니다
   * (`match-options`의 관심사와 같은 이유).
   */
  reportCategories: {
    harassment: "괴롭힘 · 모욕",
    hate: "혐오 표현",
    sexual: "성적 괴롭힘",
    threat: "협박",
    recording: "촬영 · 녹화 정황",
    minor: "미성년자로 의심됨",
    spam: "스팸 · 외부 유도",
    other: "기타",
  },
  wallet: {
    title: "내 방 매치",
    buyEntry: "입장료 결제",
    requestEntry: "입장 신청",
    remaining: "남은 방 매치",
    remainingHint: "1회 = {minutes}분 대화 한 자리",
    purchased: "누적 구매",
    purchasedHint: "환불 회수분 포함 총 구매량",
    times: "{count}회",
    spendNote:
      "방 매치는 영상방에 실제로 들어갈 때 1회 빠집니다. 매칭을 기다리는 동안에는 빠지지 않습니다.",
    pricingLink: "요금 안내",

    payments: "구매 내역",
    paymentsEmpty: "아직 구매 내역이 없습니다.",
    matchesGiven: "방 매치 {count}회",
    refundedAt: "환불 {at}",
    statusPaid: "결제 완료",
    statusPending: "확인 중",
    statusRefunded: "환불됨",
    statusFailed: "실패",

    seats: "내가 연 자리",
    seatsHint:
      "매칭을 요청해 내가 연 방입니다. 초대받아 합류한 자리는 여기 나오지 않지만, 매치 횟수는 각자 1회씩 빠집니다.",
    seatsEmpty: "아직 연 자리가 없습니다.",
    seat: "{minutes}분 자리",
    extendedBy: "연장 {minutes}분",
    usageActive: "진행 중",
    usageEnded: "종료",
    usageExpired: "시간 만료",
  },
  onboarding: {
    stepsLabel: "입장 준비 단계",
    stepAdult: "성인 확인",
    stepConsent: "동의",
    stepProfile: "프로필",
    stepDone: "완료",

    adultTitle: "성인 확인",
    adultIntro:
      "ClubOn은 만 19세 이상 성인만 이용할 수 있습니다. 확인을 위해 출생 연도를 입력해 주세요.",
    birthYear: "출생 연도",
    birthYearHint:
      "연 단위만 확인하며, 생년월일 원본이나 신분증 이미지는 저장하지 않습니다.",
    birthYearPlaceholder: "예: 1994",
    adultCheckbox: "만 19세 이상이며, ClubOn이 성인 전용 서비스임을 이해했습니다.",
    adultSubmit: "확인하고 다음 단계로",
    adultPending: "확인 중…",

    consentTitle: "동의 항목",
    consentIntro:
      "각 항목의 내용을 확인하고 동의해 주세요. 선택 항목은 동의하지 않아도 입장할 수 있습니다.",
    consentNotice:
      "자동 모더레이션은 모든 위반을 완벽하게 탐지한다고 보장하지 않습니다. 또한 플랫폼은 스크린샷이나 외부 기기 촬영을 기술적으로 완전히 차단할 수 없습니다.",
    required: "필수",
    optional: "선택",
    consentSubmit: "동의하고 프로필 설정하기",
    consentPending: "저장 중…",

    profileTitle: "프로필 설정",
    profileIntro:
      "라운지 매니저가 자리를 안내할 때 참고하는 정보입니다. 외모에 대한 항목은 수집하지 않습니다.",
  },
  /**
   * 동의 항목 — 키는 `ConsentType`입니다.
   *
   * 회원이 실제로 동의하는 문장이라, 번역문은 법무 검토를 거친 뒤에 켜야 합니다.
   */
  consent: {
    terms_of_service: {
      title: "이용약관",
      body: "ClubOn 이용약관에 동의합니다.",
    },
    privacy_policy: {
      title: "개인정보 처리방침",
      body: "개인정보의 수집·이용 목적과 보유 기간에 동의합니다.",
    },
    adult_only: {
      title: "성인 전용 서비스",
      body: "만 19세 이상이며, 성인 전용 서비스임을 이해했습니다.",
    },
    camera_microphone: {
      title: "카메라·마이크 사용",
      body: "화상 대화를 위해 카메라와 마이크를 사용하는 것에 동의합니다.",
    },
    ai_text_moderation: {
      title: "AI 텍스트 모더레이션",
      body: "채팅 메시지가 자동 검사 대상이 됨에 동의합니다. 자동 탐지는 모든 위반을 완벽하게 잡아내지 못할 수 있습니다.",
    },
    anti_recording: {
      title: "촬영·녹화 금지",
      body: "다른 참가자의 영상·음성·개인정보를 캡처, 녹화, 촬영하거나 공유하지 않겠습니다. 위반 시 영구 이용정지 및 법적 책임이 따를 수 있습니다.",
    },
    community_standards: {
      title: "커뮤니티 기준",
      body: "괴롭힘·혐오 표현·성적 괴롭힘을 하지 않으며, 상호 존중하는 대화에 참여합니다.",
    },
    mutual_face_reveal: {
      title: "얼굴 공개 방식",
      body: "얼굴 공개는 합석한 두 라운지의 방장이 모두 수락한 경우에만 이루어지며, 확정되면 방 전체 참가자에게 함께 적용됨을 이해했습니다.",
    },
    ai_video_moderation: {
      title: "AI 영상 안전 검사 (선택)",
      body: "영상 프레임의 안전 검사에 동의합니다. 영상 원본은 저장되지 않으며 판정 메타데이터만 기록됩니다.",
    },
    face_tracking: {
      title: "얼굴 추적 기반 마스크 (선택)",
      body: "마스크 정합을 위한 얼굴 위치 추적에 동의합니다. 추적 실패 시 얼굴을 노출하지 않고 블러 처리합니다.",
    },
  },
  profile: {
    nickname: "닉네임",
    nicknameHint: "클럽에서 표시될 이름입니다. 실명은 권장하지 않습니다.",
    nicknamePlaceholder: "2~20자",
    gender: "성별",
    genderLocked: "가입할 때 선택한 값이라 변경할 수 없습니다.",
    ageBand: "연령대",
    vibe: "대화할 때 나는",
    interests: "관심사 (1개 이상)",
    languages: "사용 언어",
    region: "지역 (선택)",
    regionPlaceholder: "예: 서울",
    bio: "한 줄 소개 (선택)",
    bioPlaceholder: "어떤 대화를 좋아하는지 짧게 적어주세요.",
    save: "프로필 저장하고 입장하기",
    savePending: "저장 중…",
    errors: {
      nicknameShort: "닉네임은 2자 이상이어야 합니다.",
      nicknameLong: "닉네임은 20자 이하여야 합니다.",
      interestsEmpty: "관심사를 1개 이상 골라주세요.",
      genderMissing: "성별을 선택해 주세요.",
      invalid: "입력을 확인해 주세요.",
      adultUnchecked: "만 19세 이상임을 확인해 주세요.",
      birthYearInvalid: "출생 연도를 정확히 입력해 주세요.",
      tooYoung: "만 {age}세 이상만 이용할 수 있는 성인 전용 서비스입니다.",
      consentMissing: "필수 항목에 모두 동의해야 입장할 수 있습니다.",
    },
  },
  /** AI 라운지 매니저 소개 — 키는 매니저 id입니다. */
  waiters: {
    fallbackName: "라운지 매니저",
    dohyun: {
      name: "도현",
      epithet: "정통 라운지 매니저",
      outfit: "클래식 블랙타이 턱시도",
      tagline: "흠잡을 데 없는 격식으로 첫 자리를 엽니다.",
      personality: "차분하고 예의 바르며, 어떤 순간에도 품위를 잃지 않습니다.",
      s1: "첫 만남의 긴장 완화",
      s2: "정중한 응대",
      s3: "격식 있는 진행",
      specialty:
        "처음 라운지에 든 회원이 편안히 자리 잡도록, 예우를 갖춘 소개와 안내로 분위기를 정돈합니다.",
    },
    ian: {
      name: "이서",
      epithet: "대화 큐레이터",
      outfit: "쓰리피스 테일러드 수트",
      tagline: "취향을 읽고, 오늘의 화제를 우아하게 고릅니다.",
      personality: "지적이고 세심하며, 상대의 관심사를 빠르게 포착합니다.",
      s1: "대화 주제 큐레이션",
      s2: "취향 파악",
      s3: "매끄러운 화제 전환",
      specialty:
        "테이블의 관심사를 살펴 어울리는 이야깃거리를 제안하고, 대화가 자연스럽게 이어지도록 돕습니다.",
    },
    jaeha: {
      name: "재하",
      epithet: "친근한 호스트",
      outfit: "니트 · 슬랙스 캐주얼",
      tagline: "격식보다 편안함. 어색함을 눈 녹듯 풀어냅니다.",
      personality: "따뜻하고 스스럼없어, 곁에 있으면 마음이 놓입니다.",
      s1: "어색함 해소",
      s2: "편안한 분위기",
      s3: "자연스러운 아이스브레이킹",
      specialty:
        "가벼운 질문과 유쾌한 리액션으로, 처음 만난 사이도 오래 알던 것처럼 편안하게 만듭니다.",
    },
    taeo: {
      name: "태오",
      epithet: "트렌드세터",
      outfit: "오버사이즈 스트리트 · 체인",
      tagline: "젊고 활기차게, 라운지에 에너지를 채웁니다.",
      personality: "자유롭고 에너제틱하며, 트렌드에 밝습니다.",
      s1: "활기찬 분위기",
      s2: "트렌디한 화제",
      s3: "즉흥적인 재미",
      specialty:
        "요즘 뜨는 이야기와 리듬감 있는 진행으로, 라운지를 생기 있게 달굽니다.",
    },
    sunwoo: {
      name: "세린",
      epithet: "케미 조율가",
      outfit: "벨벳 스모킹 재킷",
      tagline: "두 사람의 결이 맞는 순간을 읽어냅니다.",
      personality: "부드럽고 감각적이며, 분위기의 미묘한 흐름에 예민합니다.",
      s1: "케미 감지",
      s2: "상호 영상 부킹 타이밍",
      s3: "섬세한 진행",
      specialty:
        "대화의 온도를 살펴, 서로 마음이 통할 때 상호 영상 부킹을 자연스럽게 제안합니다.",
    },
    seojun: {
      name: "서준",
      epithet: "여행가",
      outfit: "화이트 디너 재킷",
      tagline: "취향과 여행으로 이어지는 공통점을 찾습니다.",
      personality: "여유롭고 낭만적이며, 이야기 속 장면을 잘 그립니다.",
      s1: "공통 관심사 발굴",
      s2: "여행·취향 매칭",
      s3: "여유로운 리드",
      specialty:
        "좋아하는 도시와 취향을 실마리 삼아, 테이블이 함께 설렐 만한 화제를 엮어냅니다.",
    },
    yujin: {
      name: "유진",
      epithet: "조율된 침묵",
      outfit: "미니멀 올블랙 테일러드",
      tagline: "말수가 적은 이의 속도를 존중합니다.",
      personality: "차분하고 사려 깊으며, 상대의 침묵을 편안하게 만듭니다.",
      s1: "내향적인 분 배려",
      s2: "편안한 페이스 조절",
      s3: "경청",
      specialty:
        "재촉하지 않는 진행으로, 말수가 적은 회원도 자기 속도로 대화에 스며들게 합니다.",
    },
    haram: {
      name: "하린",
      epithet: "문화통",
      outfit: "브리티시 트위드 재킷",
      tagline: "깊이 있는 대화, 예술과 문화의 결로.",
      personality: "지적이고 클래식하며, 이야기에 품위 있는 여운을 남깁니다.",
      s1: "깊이 있는 대화",
      s2: "예술·문화 화제",
      s3: "사려 깊은 질문",
      specialty:
        "책·음악·전시 같은 취향의 결을 짚어, 오래 기억에 남는 대화를 이끕니다.",
    },
    jin: {
      name: "진",
      epithet: "위트메이커",
      outfit: "락 시크 레더 재킷",
      tagline: "대담하고 재치있게, 빠르게 케미를 만듭니다.",
      personality: "위트 넘치고 대담하며, 분위기를 순식간에 살립니다.",
      s1: "빠른 케미",
      s2: "재치있는 진행",
      s3: "유머",
      specialty:
        "가벼운 농담과 순발력 있는 진행으로, 처음의 어색함을 웃음으로 바꿉니다.",
    },
    noah: {
      name: "노아",
      epithet: "세심한 수호자",
      outfit: "스탠드칼라 호스피탈리티 화이트",
      tagline: "안전과 매너를 가장 먼저 살핍니다.",
      personality: "다정하고 배려 깊으며, 모두가 존중받는 자리를 지향합니다.",
      s1: "안전·매너 우선",
      s2: "세심한 배려",
      s3: "편안한 진행",
      specialty:
        "경계와 예의를 부드럽게 챙겨, 누구나 존중받으며 편안히 머무는 라운지를 만듭니다.",
    },
  },
  waiterGallery: {
    metaTitle: "AI 라운지 매니저 선택",
    eyebrow: "AI 라운지 매니저",
    titleLine1: "오늘 저녁,",
    titleAccent: " 어떤 매니저",
    titleLine1Tail: "에게",
    titleLine2: "자리를 맡기시겠어요?",
    intro:
      "유럽 귀족가의 품격에 저마다의 개성을 더한 열 명의 라운지 매니저입니다. 카드를 눌러 각 매니저의 장점과 특징, 개성을 확인하고 마음에 드는 이를 선택하세요.",
    strengths: "장점",
    specialty: "특징",
    startWith: "{name} 매니저로 시작하기",
    avatarAlt: "라운지 매니저 {name}",
    avatarAltWithOutfit: "라운지 매니저 {name} — {outfit}",
  },
  lobby: {
    eyebrow: "클럽 로비",
    welcome: "환영합니다,",
    welcomeSuffix: "님",
    openNow: "지금 영업 중입니다",
    openUntil: "지금 영업 중입니다 · {time}까지",
    staffOnly:
      "관리자 콘솔은 관리자·모더레이터 계정만 볼 수 있습니다. 상단의 회원 전환기에서 '관리자'를 고르면 로그인 없이 확인할 수 있어요.",
    activeLounge: "진행 중인 라운지",
    memberCount: "{count}명 참여",
    backToLounge: "라운지로 돌아가기",
    entryTitle: "입장 신청하기",
    entryBody:
      "지역과 AI 라운지 매니저를 고르고 원하는 상대를 알려 주시면, 매니저가 같은 지역에서 조건에 맞는 자리를 찾아 드립니다.",
    entryCta: "신청하고 시작하기",
    joinTitle: "초대코드로 참여",
    joinBody: "친구에게 받은 초대코드로 이미 만들어진 라운지에 합류하세요.",
    joinCta: "코드 입력하기",
    waitersTitle: "AI 라운지 매니저 만나보기",
    waitersBody: "열 명의 매니저 중 오늘의 호스트를 골라보세요",
    groupNote:
      "모든 대화는 최소 2명 이상의 그룹으로 시작합니다. 합석은 양쪽 라운지가 모두 수락해야 열립니다.",
  },
  closed: {
    eyebrow: "클럽 마감",
    titleLine1: "지금은 클럽이",
    titleLine2: "닫혀 있습니다.",
    nextOpen: "다음 오픈",
    nextOpenUnknown: "곧 안내됩니다",
    body: "클럽은 매일 저녁 6시부터 새벽 4시까지 열립니다. 닫힌 시간에도 프로필 수정, 친구 초대, 다음 방문 준비는 계속할 수 있습니다.",
    toDashboard: "대시보드로 이동",
    toHome: "홈으로",
  },
  join: {
    eyebrow: "초대코드로 참여",
    title: "친구의 라운지로",
    intro:
      "한 라운지는 최대 4명까지 함께할 수 있습니다. 합석은 두 라운지를 합쳐 최소 2명이 모여야 열립니다.",
    codeHint: "라운지 호스트에게 받은 6자리 코드를 입력하세요.",
    codePlaceholder: "예: JAZZ42",
    submit: "라운지 합류하기",
    pending: "확인 중…",
    backToLobby: "로비로 돌아가기",
  },
  match: {
    metaTitle: "매치 제안",
    eyebrow: "라운지 매니저의 제안",
    title: "합석해 보시겠어요?",
    intro:
      "양쪽 라운지가 모두 수락해야 자리가 열립니다. 한쪽이라도 넘기면 두 라운지 모두 대기 상태로 돌아갑니다.",
    backToLounge: "라운지로 돌아가 다시 찾기",

    statePending: "매치 제안",
    stateAccepted: "합석 확정",
    stateDeclined: "성사되지 않음",
    stateExpired: "만료됨",
    foundByWaiter: "{name} 매니저가 가장 잘 맞는 라운지를 찾았어요",

    counterpart: "상대 라운지",
    counterpartCount: "{count}명 참여",
    totalAfterJoin: "합석 시 총 {count}명",
    fit: "적합도 {score}점",
    genderOther: "기타",

    commonGround: "공통점",
    reasonGender: "원하는 성별({gender}) 일치",
    reasonInterests: "공통 관심사: {values}",
    reasonEnergy: "대화 분위기 일치",
    reasonAgeBands: "연령대: {values}",

    maskNotice:
      "입장하면 동물 마스크를 쓴 상태로 대화가 시작됩니다. 얼굴은 상대와 내가 모두 동의했을 때만, 그 상대에게만 공개됩니다.",
    recordingNotice:
      "다른 참가자의 영상·음성·개인정보를 캡처, 녹화, 촬영하거나 공유하는 행위는 금지됩니다. 위반 시 영구 이용정지 및 관련 법률에 따른 법적 책임이 따를 수 있습니다.",

    waitingForOther: "내 라운지는 수락했습니다. 상대 라운지의 응답을 기다리는 중입니다.",
    accept: "수락하고 합석하기",
    decline: "이번엔 넘기기",
    demoNotice:
      "상대 라운지는 데모 참가자로 구성되어 있어, 수락하면 라운지 매니저가 상대 측 응답을 대신 처리합니다.",
    counterpartResponse: "상대 라운지 응답: {response}",
    responseAccepted: "수락",
    responseDeclined: "거절",
    responsePending: "대기 중",
  },
  lounge: {
    metaTitle: "내 라운지",
    hostedBy: "{name} 매니저가 오늘 저녁 {nickname}님의 자리를 안내합니다.",
    myLounge: "내 라운지",
    leave: "라운지 나가기",
    declined: "제안이 성사되지 않았습니다. 다른 조건으로 다시 찾아보세요.",
    noMatchYet:
      "조건에 맞는 상대 라운지를 아직 찾지 못했어요. 조건을 조금 넓혀 다시 시도해 보세요.",
    liveSession: "합석 진행 중",
    liveSessionBody: "이미 열려 있는 마스크 대화방이 있습니다.",
    enterRoom: "대화방으로 입장",
    proposalArrived: "매치 제안 도착",
    proposalBody:
      "라운지 매니저가 상대 라운지를 찾았습니다. 수락 여부를 알려주세요.",
    viewProposal: "제안 확인하기",
    whoTitle: "어떤 분과 만나고 싶으세요?",
    whoBody:
      "원하는 상대의 스타일을 알려주시면, {name}가 공통점이 가장 많은 라운지를 찾아 부킹해 드립니다.",
    editingNote: "이전 제안은 취소되었습니다. 새 조건으로 다시 찾습니다.",
    errors: {
      too_small:
        "합석하려면 이 라운지에 참가자가 한 명 이상 있어야 합니다. 초대코드를 공유해 주세요.",
      invalid: "입력한 조건을 다시 확인해 주세요.",
    },
    members: "라운지 멤버 {count}/{max}",
    inviteCode: "초대코드",
    noMembers: "아직 멤버가 없습니다.",
    needMoreToMatch: "라운지에 한 명 이상 모이면 상대를 찾을 수 있습니다.",
    searching: "상대를 찾는 중…",
    shortRule: "합석은 두 라운지를 합쳐 최소 2명이 필요합니다.",
    shortCount:
      "이 라운지에 {count}명이 더 모여야 상대를 찾을 수 있어요. 위 초대코드를 친구에게 보내주세요.",
    addDemoCompanion: "데모 동반자 합류시키기",
    demoCompanionHint:
      "혼자서도 전체 흐름을 볼 수 있도록 데모 회원을 넣어줍니다.",
    readyToMatch: "매칭 가능 인원 충족",
  },
  pricing: {
    eyebrow: "이용 안내",
    metaTitle: "이용 안내 · 요금",
    metaDescription:
      "ClubOn 라운지 입장료 {price} — 방 매치 {matches}회 포함. 남녀 동일 금액이며 구독이 아닙니다.",
    title: "입장료 한 번으로 다섯 자리",
    intro:
      "입장료 {price}에 방 매치 {matches}회가 들어 있습니다. 매치 1회가 {minutes}분 대화 한 자리이며, 구독이 아니라 쓰는 만큼 씁니다. 남성과 여성이 내는 금액은 같습니다.",
    matchesLabel: "방 매치 {count}회",
    perMatch: "1회당 {price}",
    buy: "구매하기",
    buyAria: "{name} 구매하기 — {price}",
    buyPending: "결제 페이지로 이동 중…",
    preparing: "결제 준비 중",
    basic: "기본",
    note: "모든 가격은 USD 기준이며 결제 시점에 표시된 금액이 청구됩니다. 매치 횟수는 영상방에 실제로 들어갈 때 1회 빠지며, 매칭을 기다리는 동안에는 빠지지 않습니다. 방에 들어가면 참가자 각자에게서 1회씩 빠집니다.",
    extendTitle: "시간이 모자랄 때",
    extendIntro:
      "대화가 잘 풀리면 그 자리의 시간을 늘릴 수 있습니다. 연장은 매치 횟수를 쓰지 않고 영상방 안에서 시간이 얼마 남지 않았을 때 구매하며, 늘어난 시간은 그 방에 있는 모두에게 함께 적용됩니다.",
    extendInRoom: "영상방 안에서 구매합니다.",
    extendPreparing: "결제 준비 중입니다.",
  },
};

/**
 * 사전의 모양 — 다른 언어 사전이 이 타입을 따릅니다(부분 채움 허용).
 *
 * `as const`를 붙이지 않는 이유는, 값이 리터럴 타입으로 굳으면 다른 언어의
 * 번역문이 "한국어 문장과 다르다"는 이유로 타입 오류가 되기 때문입니다.
 * 여기서 고정하고 싶은 것은 값이 아니라 **키 구조**입니다.
 */
export type Dictionary = typeof ko;
