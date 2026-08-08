import type {
  AccountStatus,
  Booking,
  Club,
  Consent,
  ConsentType,
  ConversationEnergy,
  DesiredGender,
  Gender,
  LoungeSessionStatus,
  LoungeUsage,
  OperatingHour,
  PassWallet,
  PaymentRecord,
  Profile,
  Table,
  TableMember,
  TablePreferences,
  TableState,
  User,
} from "./types";

export interface CreateLoungeInput {
  userId: string;
  waiterId: string | null;
  name: string;
}

export interface MatchPreferenceInput {
  desiredGender: DesiredGender;
  energy: ConversationEnergy;
  interests: string[];
  ageBands: string[];
}

/** 매칭 후보 라운지 1건과 그 공통점 근거 */
export interface MatchCandidate {
  table: Table;
  score: number;
  reasons: string[];
  profiles: Profile[];
}

export interface CreateUserInput {
  email: string;
  /** Google 로그인처럼 비밀번호가 없는 가입 경로에서는 null입니다. */
  passwordHash: string | null;
  /** Google 계정의 불변 식별자(id_token의 sub). 소셜 가입일 때만 채웁니다. */
  googleSub?: string | null;
}

/** 로그인 검증용 — 비밀번호 해시는 이 경로 밖으로 나가지 않습니다. */
export interface Credentials {
  user: User;
  passwordHash: string | null;
}

export interface ProfileInput {
  nickname: string;
  gender: Gender;
  ageBand: string;
  region: string | null;
  languages: string[];
  interests: string[];
  groupVibe: ConversationEnergy;
  conversationStyle: string | null;
}

export interface ConsentInput {
  consentType: ConsentType;
  granted: boolean;
}

/** 결제 1건을 기록하며 지급할 내용. Creem 웹훅이 확인한 값만 넘어옵니다. */
export interface RecordPurchaseInput {
  /** Creem 주문 식별자. 멱등 키입니다. */
  paymentId: string;
  userId: string;
  productId: string;
  planCode: string;
  /** 실제 결제 금액(최소 화폐 단위 정수) */
  amount: number;
  currency: string;
  /** 지급할 이용권 수 */
  purchasedPasses: number;
  /** 지급할 우선 매칭 크레딧 */
  priorityMatchingCredits: number;
  /** vip이면 등급을 올립니다(standard로 내리지는 않습니다). */
  membershipType: "standard" | "vip";
}

/**
 * 이용권 차감 결과.
 *
 * `charged`가 false면 이미 이 세션에서 차감된 적이 있다는 뜻입니다(재접속).
 */
export type StartUsageResult =
  | { ok: true; usage: LoungeUsage; charged: boolean }
  | { ok: false; reason: "no_passes" };

/** 초대코드 합류 결과 — 실패 사유를 UI가 구분해 안내합니다. */
export type JoinResult =
  | { ok: true; table: Table }
  | {
      ok: false;
      reason: "not_found" | "full" | "closed" | "already_member" | "in_other";
    };

/**
 * 데이터 접근 계약. 앱 코드는 이 인터페이스에만 의존하며,
 * 환경에 따라 DevMemoryAdapter 또는 PostgresAdapter로 교체됩니다.
 */
export interface DataAdapter {
  /** MVP는 단일 활성 클럽을 운영합니다. */
  getPrimaryClub(): Promise<Club>;
  getOperatingHours(clubId: string): Promise<OperatingHour[]>;

  /* ---------------------------------------------------------- 계정 · 인증 */
  getUser(id: string): Promise<User | null>;
  /** 비밀번호를 거치지 않는 조회(소셜 로그인의 기존 계정 찾기 등). */
  getUserByEmail(email: string): Promise<User | null>;
  /**
   * Google 계정의 불변 식별자로 회원을 찾습니다. 이메일과 달리 바뀌지 않으므로
   * 한 번 연결한 뒤로는 이 경로가 우선입니다.
   */
  getUserByGoogleSub(sub: string): Promise<User | null>;
  /** 기존 회원에게 Google 계정을 연결합니다(최초 1회). */
  linkGoogleAccount(userId: string, sub: string): Promise<void>;
  /** Google 쪽에서 주소가 바뀐 경우 따라갑니다. */
  updateUserEmail(userId: string, email: string): Promise<void>;
  getCredentialsByEmail(email: string): Promise<Credentials | null>;
  createUser(input: CreateUserInput): Promise<User>;
  /** 성인 확인(생년) 기록. */
  confirmAdult(userId: string, birthYear: number): Promise<void>;
  saveConsents(
    userId: string,
    version: string,
    entries: ConsentInput[],
  ): Promise<void>;
  getConsents(userId: string): Promise<Consent[]>;
  /** 필수 동의를 모두 마쳤음을 기록. */
  markConsentCompleted(userId: string): Promise<void>;
  markOnboardingCompleted(userId: string): Promise<void>;

  /* -------------------------------------------------------------- 프로필 */
  getProfile(userId: string): Promise<Profile | null>;
  upsertProfile(userId: string, input: ProfileInput): Promise<Profile>;

  /* -------------------------------------------------------------- 라운지 */
  /** 사용자가 현재 속한 활성 라운지(퇴장하지 않은 멤버십)를 반환합니다. */
  getActiveTableForUser(userId: string): Promise<Table | null>;
  getTable(id: string): Promise<Table | null>;
  /** 활성 멤버(퇴장하지 않은) 목록을 joined_at 순으로 반환합니다. */
  getActiveTableMembers(tableId: string): Promise<TableMember[]>;
  /** 라운지 활성 멤버들의 프로필 */
  getProfilesForTable(tableId: string): Promise<Profile[]>;
  getTablePreferences(tableId: string): Promise<TablePreferences | null>;

  /** 라운지 생성(호스트 입장). 이미 활성 라운지가 있으면 라운지 매니저만 갱신해 반환. */
  createLounge(input: CreateLoungeInput): Promise<Table>;
  /** 초대코드로 기존 라운지에 합류합니다. */
  joinTableByCode(userId: string, code: string): Promise<JoinResult>;
  /** 지정한 사용자를 라운지 멤버로 추가합니다(데모 동반자 등). */
  addMemberToTable(tableId: string, userId: string): Promise<void>;
  /** 라운지에서 나갑니다. 호스트가 나가면 남은 최고참 멤버가 승계합니다. */
  leaveTable(userId: string, tableId: string): Promise<void>;
  setTableState(tableId: string, state: TableState): Promise<void>;

  /* -------------------------------------------------------------- 매칭 */
  /** 원하는 상대 스타일(선호)을 저장하고 라운지를 매칭 대기 상태로 전환. */
  setMatchPreference(
    tableId: string,
    pref: MatchPreferenceInput,
  ): Promise<void>;
  /** 선호와 공통점이 가장 많은 상대 라운지를 찾습니다. */
  findBestMatch(tableId: string): Promise<MatchCandidate | null>;

  createBooking(
    requesterTableId: string,
    candidate: MatchCandidate,
    waiterId: string | null,
  ): Promise<Booking>;
  getBookingForTable(tableId: string): Promise<Booking | null>;
  getBooking(id: string): Promise<Booking | null>;
  /** 한쪽 라운지의 수락/거절을 기록하고 갱신된 제안을 반환합니다. */
  respondToBooking(
    bookingId: string,
    side: "requester" | "matched",
    response: "accepted" | "declined",
  ): Promise<Booking | null>;
  /** 양측 수락 후 개설된 화상 세션 id를 연결합니다. */
  attachSessionToBooking(bookingId: string, sessionId: string): Promise<void>;

  /* --------------------------------------------------- 이용권 지갑 · 결제 */

  /** 지갑을 반환합니다. 없으면 0으로 채운 기본 지갑을 만들어 돌려줍니다. */
  getWallet(userId: string): Promise<PassWallet>;

  /**
   * 결제를 기록하고 이용권을 지급합니다.
   *
   * `paymentId` 기준 멱등 — 같은 결제가 다시 들어오면 아무것도 바꾸지 않고
   * `applied: false`를 돌려줍니다. 기록과 지급은 한 트랜잭션에서 일어납니다.
   */
  recordPurchase(input: RecordPurchaseInput): Promise<{ applied: boolean }>;

  /**
   * 환불 처리. 이미 써 버린 이용권은 되돌릴 수 없으므로 **남아 있는 만큼만**
   * 회수합니다(잔액이 음수가 되지 않습니다).
   */
  refundPayment(
    paymentId: string,
  ): Promise<{ applied: boolean; reclaimed: number }>;

  getPayment(paymentId: string): Promise<PaymentRecord | null>;
  listPaymentsForUser(userId: string, limit?: number): Promise<PaymentRecord[]>;

  /** 관리자 수동 지급·회수. 양수면 지급, 음수면 회수(0 미만으로는 안 내려감). */
  adjustPasses(userId: string, delta: number): Promise<PassWallet>;

  /* ------------------------------------------------------- 라운지 이용 기록 */

  /**
   * 영상방이 처음 열릴 때 이용권 1회를 차감하고 이용 기록을 만듭니다.
   *
   * **차감은 방 하나당 1회**이며 `payerUserId`(방을 연 라운지의 방장)에게서
   * 빠집니다. 같은 방에 다른 참가자가 더 들어와도 추가 차감은 없습니다.
   *
   * `sessionId` 기준 멱등 — 새로고침·재접속·다른 참가자의 입장으로 다시
   * 불려도 기존 기록을 그대로 돌려주며 잔액은 건드리지 않습니다. 부담자의
   * 잔여가 0이면 차감하지 않고 `no_passes`를 돌려줍니다.
   */
  startLoungeUsage(input: {
    sessionId: string;
    payerUserId: string;
    roomId: string;
    minutes: number;
  }): Promise<StartUsageResult>;

  getLoungeUsage(sessionId: string): Promise<LoungeUsage | null>;
  endLoungeUsage(
    sessionId: string,
    status: LoungeSessionStatus,
  ): Promise<void>;
  /** 이 회원이 **이용권을 부담한** 라운지 기록. */
  listUsagesForUser(userId: string, limit?: number): Promise<LoungeUsage[]>;

  /* -------------------------------------------------------------- 관리자 */
  listUsers(limit?: number): Promise<User[]>;
  listPayments(limit?: number): Promise<PaymentRecord[]>;
  listUsages(limit?: number): Promise<LoungeUsage[]>;
  listWallets(limit?: number): Promise<PassWallet[]>;
  setUserStatus(userId: string, status: AccountStatus): Promise<void>;
  listTables(limit?: number): Promise<Table[]>;
  listBookings(limit?: number): Promise<Booking[]>;
}
