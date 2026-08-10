import "server-only";

import { checkText } from "@/lib/moderation/text";
import { getWaiter } from "@/lib/waiters";
import type {
  Block,
  ChatMessage,
  ModerationEvent,
  Participant,
  ParticipantStatus,
  Report,
  SessionFeedback,
  VideoSession,
} from "./types";

/**
 * 라이브 룸 런타임 (Phase 1 — 인메모리).
 *
 * 설계서의 `services/` 계층에 해당합니다. Phase 2에서 LiveKit/Agora +
 * Supabase Realtime으로 교체할 수 있도록 이 모듈의 함수 시그니처만
 * 앱 코드가 사용합니다. 프로세스 재시작 시 초기화됩니다.
 *
 * 화상·음성 원본은 저장하지 않습니다. 저장되는 것은 상태 메타데이터뿐입니다.
 */

interface Runtime {
  sessions: Map<string, VideoSession>;
  participants: Participant[];
  messages: ChatMessage[];
  moderationEvents: ModerationEvent[];
  reports: Report[];
  blocks: Block[];
  feedback: SessionFeedback[];
  /** 시뮬레이션 참가자가 마지막으로 발화한 시각 (세션별) */
  lastSimChatAt: Map<string, number>;
  /** 데모 동반자로 투입된 사용자 — 룸에서 시뮬레이션으로 동작합니다. */
  simulatedUserIds: Set<string>;
}

const globalRuntime = globalThis as unknown as { __clubonRuntime?: Runtime };

function rt(): Runtime {
  globalRuntime.__clubonRuntime ??= {
    sessions: new Map(),
    participants: [],
    messages: [],
    moderationEvents: [],
    reports: [],
    blocks: [],
    feedback: [],
    lastSimChatAt: new Map(),
    simulatedUserIds: new Set(),
  };
  return globalRuntime.__clubonRuntime;
}

/**
 * 데모 동반자로 투입된 사용자를 등록합니다.
 * ⚠️ 데모 전용 — 이 사용자는 룸에서 자동으로 발화·응답합니다.
 */
export function markSimulatedUser(userId: string): void {
  rt().simulatedUserIds.add(userId);
}

export function isSimulatedUser(userId: string): boolean {
  return rt().simulatedUserIds.has(userId);
}

const nowIso = () => new Date().toISOString();

/** 위반 감쇠 시간 — 30분간 추가 위반이 없으면 누적이 1 줄어듭니다. */
const STRIKE_DECAY_MS = 30 * 60 * 1000;
/** 시뮬레이션 참가자의 발화 간격 */
const SIM_CHAT_INTERVAL_MS = 18_000;

/* ------------------------------------------------------------------ 세션 */

export interface CreateSessionMember {
  userId: string;
  tableId: string;
  nickname: string;
  /** 실제 로그인 사용자가 아닌 데모 참가자 */
  simulated: boolean;
}

export function createSession(input: {
  bookingId: string;
  tableAId: string;
  tableBId: string;
  /** 각 라운지의 방장 — 그 라운지의 카메라·마이크를 맡는 두 사람 */
  hostAUserId: string | null;
  hostBUserId: string | null;
  waiterId: string | null;
  members: CreateSessionMember[];
}): VideoSession {
  const r = rt();

  // 같은 부킹으로 이미 만들어진 세션이 있으면 재사용합니다.
  const existing = [...r.sessions.values()].find(
    (s) => s.bookingId === input.bookingId && s.state !== "ended",
  );
  if (existing) return { ...existing };

  const session: VideoSession = {
    id: globalThis.crypto.randomUUID(),
    bookingId: input.bookingId,
    tableAId: input.tableAId,
    tableBId: input.tableBId,
    hostAUserId: input.hostAUserId,
    hostBUserId: input.hostBUserId,
    state: "live",
    pausedSince: null,
    startedAt: nowIso(),
    endedAt: null,
  };
  r.sessions.set(session.id, session);

  input.members.forEach((m) => {
    r.participants.push({
      sessionId: session.id,
      userId: m.userId,
      tableId: m.tableId,
      nickname: m.nickname,
      micOn: true,
      camOn: true,
      videoState: "ok",
      status: "ok",
      strikes: 0,
      lastStrikeAt: null,
      simulated: m.simulated,
      joinedAt: nowIso(),
      leftAt: null,
    });
  });

  pushSystemMessage(
    session.id,
    "waiter",
    waiterNameKey(input.waiterId),
    "roomChat.opened",
    { waiterKey: waiterNameKey(input.waiterId) },
  );
  pushSystemMessage(session.id, "system", SYSTEM_KEY, "roomChat.noRecording");

  return { ...session };
}

export function getSession(id: string): VideoSession | null {
  const s = rt().sessions.get(id);
  return s ? { ...s } : null;
}

/**
 * 이 방을 연 회원 — 매칭을 요청한 라운지(A)의 방장.
 *
 * 방 시간은 모두가 함께 쓰므로 "누가 연 자리인가"가 명확해야 합니다.
 * A 라운지에 방장이 없으면(퇴장 등) B 라운지 방장이 이어받습니다.
 */
export function roomOwnerId(sessionId: string): string | null {
  const session = rt().sessions.get(sessionId);
  if (!session) return null;
  return session.hostAUserId ?? session.hostBUserId ?? null;
}

export function getParticipants(sessionId: string): Participant[] {
  return rt()
    .participants.filter((p) => p.sessionId === sessionId)
    .map((p) => ({ ...p }));
}

export function getParticipant(
  sessionId: string,
  userId: string,
): Participant | null {
  const p = rt().participants.find(
    (x) => x.sessionId === sessionId && x.userId === userId,
  );
  return p ? { ...p } : null;
}

/** 사용자가 참여 중인 진행 세션을 찾습니다. */
export function findActiveSessionForUser(userId: string): VideoSession | null {
  const r = rt();
  const membership = r.participants.find(
    (p) => p.userId === userId && p.leftAt === null && p.status !== "removed",
  );
  if (!membership) return null;
  const session = r.sessions.get(membership.sessionId);
  if (!session || session.state === "ended") return null;
  return { ...session };
}

/**
 * 마이크·카메라를 켜고 끕니다.
 *
 * 통화에 들어와 있는 기기는 라운지당 한 대(방장)뿐이므로, **그 한 대만**
 * 이 조작이 의미가 있습니다. 나머지 회원의 기기는 애초에 통화에 없어서
 * 켤 것도 끌 것도 없고, 잘못 불려도 아무 일이 없어야 합니다.
 */
export function setMedia(
  sessionId: string,
  userId: string,
  patch: { micOn?: boolean; camOn?: boolean },
): void {
  if (!isRoomHost(sessionId, userId)) return;

  const p = rt().participants.find(
    (x) => x.sessionId === sessionId && x.userId === userId,
  );
  if (!p) return;
  // 음소거 조치를 받은 참가자는 스스로 마이크를 켤 수 없습니다.
  if (patch.micOn !== undefined && p.status !== "muted") p.micOn = patch.micOn;
  if (patch.camOn !== undefined) {
    p.camOn = patch.camOn;
    p.videoState = patch.camOn ? "ok" : "avatar";
  }
}

/** 룸에서 나갑니다. 남은 인원이 최소치 미만이면 세션을 일시정지합니다. */
export function leaveSession(sessionId: string, userId: string): void {
  const r = rt();
  const p = r.participants.find(
    (x) => x.sessionId === sessionId && x.userId === userId,
  );
  if (!p || p.leftAt) return;
  p.leftAt = nowIso();

  pushSystemMessage(sessionId, "system", SYSTEM_KEY, "roomChat.left", {
    nickname: p.nickname,
  });
  reconcileSessionState(sessionId);
}

/** `reasonKey`는 종료 사유의 사전 키입니다(`roomChat.*`). */
export function endSession(sessionId: string, reasonKey: string): void {
  const r = rt();
  const s = r.sessions.get(sessionId);
  if (!s || s.state === "ended") return;
  s.state = "ended";
  s.endedAt = nowIso();
  for (const p of r.participants.filter((x) => x.sessionId === sessionId)) {
    if (!p.leftAt) p.leftAt = s.endedAt;
  }
  pushSystemMessage(sessionId, "system", SYSTEM_KEY, "roomChat.ended", {
    reasonKey,
  });
}

/**
 * 최소 참가 인원(2명) 불변식을 강제합니다.
 * 인원이 모자라면 PAUSED, 회복되면 LIVE로 되돌립니다.
 */
const MIN_ROOM_PARTICIPANTS = 2;

function reconcileSessionState(sessionId: string): void {
  const r = rt();
  const s = r.sessions.get(sessionId);
  if (!s || s.state === "ended" || s.state === "locked") return;

  const active = r.participants.filter(
    (p) => p.sessionId === sessionId && !p.leftAt && p.status !== "removed",
  ).length;

  if (active < MIN_ROOM_PARTICIPANTS && s.state === "live") {
    s.state = "paused";
    s.pausedSince = nowIso();
    pushSystemMessage(sessionId, "system", SYSTEM_KEY, "roomChat.paused", {
      min: MIN_ROOM_PARTICIPANTS,
    });
  } else if (active >= MIN_ROOM_PARTICIPANTS && s.state === "paused") {
    s.state = "live";
    s.pausedSince = null;
    pushSystemMessage(sessionId, "system", SYSTEM_KEY, "roomChat.resumed");
  }
}

/* -------------------------------------------------------------------- 채팅 */

/** 시스템 안내의 발신자 이름 키. */
const SYSTEM_KEY = "roomChat.system";

/** 매니저 이름 키 — 매니저가 지정되지 않았으면 총칭으로 떨어집니다. */
function waiterNameKey(waiterId: string | null | undefined): string {
  return waiterId && getWaiter(waiterId)
    ? `waiters.${waiterId}.name`
    : "waiters.fallbackName";
}

/**
 * 시스템·매니저 안내를 남깁니다.
 *
 * 문장이 아니라 **사전 키**를 넘깁니다 — 이유는 `ChatMessage` 주석 참고.
 */
function pushSystemMessage(
  sessionId: string,
  kind: "system" | "waiter",
  senderKey: string,
  bodyKey: string,
  bodyVars?: Record<string, string | number>,
): void {
  rt().messages.push({
    id: globalThis.crypto.randomUUID(),
    sessionId,
    senderId: null,
    senderName: null,
    senderKey,
    kind,
    body: "",
    bodyKey,
    bodyVars: bodyVars ?? null,
    moderationStatus: "allowed",
    moderationReason: null,
    createdAt: nowIso(),
  });
}

export interface PostMessageResult {
  status: "allowed" | "flagged" | "blocked";
  /** 발신자에게 보여줄 사유의 사전 키 */
  reasonKey: string | null;
}

/** 텍스트 모더레이션을 통과시키고 메시지를 저장합니다. */
export function postMessage(
  sessionId: string,
  userId: string,
  rawBody: string,
): PostMessageResult {
  const r = rt();
  const p = r.participants.find(
    (x) => x.sessionId === sessionId && x.userId === userId,
  );
  if (!p || p.leftAt || p.status === "removed") {
    return { status: "blocked", reasonKey: "moderation.notParticipant" };
  }

  const body = rawBody.trim().slice(0, 1000);
  if (!body) {
    return { status: "blocked", reasonKey: "moderation.emptyMessage" };
  }

  const verdict = checkText(body);

  r.messages.push({
    id: globalThis.crypto.randomUUID(),
    sessionId,
    senderId: userId,
    senderName: p.nickname,
    senderKey: null,
    kind: "user",
    body,
    bodyKey: null,
    bodyVars: null,
    moderationStatus: verdict.status,
    moderationReason: verdict.reasonKey,
    createdAt: nowIso(),
  });

  if (verdict.status !== "allowed" && verdict.severity) {
    applyModerationStrike({
      sessionId,
      userId,
      context: "chat",
      category: verdict.category,
      severity: verdict.severity,
      detail: verdict.reasonKey ?? "moderation.blockedFallback",
      blocked: verdict.status === "blocked",
    });
  }

  return { status: verdict.status, reasonKey: verdict.reasonKey };
}

/**
 * 사용자가 볼 수 있는 메시지만 반환합니다.
 * blocked 메시지는 발신자에게만, 사유와 함께 보입니다.
 * 차단한 상대의 메시지는 숨깁니다.
 */
export function getVisibleMessages(
  sessionId: string,
  viewerId: string,
): ChatMessage[] {
  const r = rt();
  const blockedIds = new Set(
    r.blocks.filter((b) => b.blockerId === viewerId).map((b) => b.blockedId),
  );
  return r.messages
    .filter((m) => m.sessionId === sessionId)
    .filter((m) => m.moderationStatus !== "blocked" || m.senderId === viewerId)
    .filter((m) => !(m.senderId && blockedIds.has(m.senderId)))
    .map((m) => ({ ...m }));
}

/* --------------------------------------------------------------- 모더레이션 */

/**
 * 위반 누적에 따른 단계적 조치.
 * OK → WARNED → RESTRICTED(블러) → MUTED. critical은 즉시 관리자 검토 대상.
 * 단일 불확실 판정으로 룸 전체를 종료하지 않습니다.
 */
function applyModerationStrike(input: {
  sessionId: string;
  userId: string;
  context: "chat" | "video" | "behavior";
  category: ModerationEvent["category"];
  severity: ModerationEvent["severity"];
  detail: string;
  blocked: boolean;
}): void {
  const r = rt();
  const p = r.participants.find(
    (x) => x.sessionId === input.sessionId && x.userId === input.userId,
  );
  if (!p) return;

  // 30분 경과분 감쇠
  if (
    p.lastStrikeAt &&
    Date.now() - Date.parse(p.lastStrikeAt) > STRIKE_DECAY_MS &&
    p.strikes > 0
  ) {
    p.strikes -= 1;
  }

  if (input.blocked) p.strikes += 1;
  p.lastStrikeAt = nowIso();

  let actionKey = "roomChat.actionLogOnly";
  let next: ParticipantStatus = p.status;

  if (input.severity === "critical") {
    next = "muted";
    actionKey = "roomChat.actionReviewMute";
  } else if (p.strikes >= 3) {
    next = "muted";
    actionKey = "roomChat.actionMute";
  } else if (p.strikes === 2) {
    next = "restricted";
    actionKey = "roomChat.actionBlur";
  } else if (p.strikes === 1) {
    next = "warned";
    actionKey = "roomChat.actionWarn";
  }

  if (next !== p.status) {
    p.status = next;
    if (next === "restricted") p.videoState = "blurred";
    if (next === "muted") p.micOn = false;
    pushSystemMessage(input.sessionId, "system", SYSTEM_KEY, "roomChat.action", {
      nickname: p.nickname,
      actionKey,
    });
  }

  r.moderationEvents.push({
    id: globalThis.crypto.randomUUID(),
    sessionId: input.sessionId,
    subjectUserId: input.userId,
    context: input.context,
    contextRef: null,
    category: input.category,
    severity: input.severity,
    actionTaken: actionKey,
    source: "rule",
    detail: input.detail,
    createdAt: nowIso(),
  });
}

export function listModerationEvents(limit = 100): ModerationEvent[] {
  return rt()
    .moderationEvents.slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map((e) => ({ ...e }));
}

/* --------------------------------------------------------------- 방장 */

/** 이 사용자가 세션 양쪽 라운지 중 한쪽의 방장인지. */
export function isRoomHost(sessionId: string, userId: string): boolean {
  const s = rt().sessions.get(sessionId);
  if (!s) return false;
  return s.hostAUserId === userId || s.hostBUserId === userId;
}

/* ------------------------------------------------------------- 신고 · 차단 */

export function reportUser(input: {
  sessionId: string | null;
  reporterId: string;
  reportedUserId: string;
  category: string;
  description: string;
}): Report {
  const r = rt();
  const report: Report = {
    id: globalThis.crypto.randomUUID(),
    sessionId: input.sessionId,
    reporterId: input.reporterId,
    reportedUserId: input.reportedUserId,
    category: input.category,
    description: input.description.slice(0, 1000),
    status: "open",
    resolvedBy: null,
    createdAt: nowIso(),
  };
  r.reports.push(report);

  r.moderationEvents.push({
    id: globalThis.crypto.randomUUID(),
    sessionId: input.sessionId,
    subjectUserId: input.reportedUserId,
    context: "behavior",
    contextRef: report.id,
    category: null,
    severity: "medium",
    actionTaken: "관리자 검토 대기",
    source: "report",
    detail: `신고 접수: ${input.category}`,
    createdAt: nowIso(),
  });

  // 신고 한 건이 방 전체를 바꾸지는 않습니다. 신고와 함께 차단하면 신고자
  // 화면에서만 상대가 가려지고, 위반이 확인되면 모더레이션이 해당 참가자의
  // 영상을 제한합니다.
  return { ...report };
}

export function listReports(limit = 100): Report[] {
  return rt()
    .reports.slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map((r) => ({ ...r }));
}

export function resolveReport(
  reportId: string,
  status: Report["status"],
  resolvedBy: string,
): void {
  const r = rt().reports.find((x) => x.id === reportId);
  if (!r) return;
  r.status = status;
  r.resolvedBy = resolvedBy;
}

export function blockUser(blockerId: string, blockedId: string): void {
  const r = rt();
  if (
    !r.blocks.some((b) => b.blockerId === blockerId && b.blockedId === blockedId)
  ) {
    r.blocks.push({ blockerId, blockedId, createdAt: nowIso() });
  }
  // 차단은 방 전체를 건드리지 않습니다. 차단한 사람의 화면에서만 상대가
  // 가려집니다(뷰 조립 시 blockedByMe로 처리).
}

export function getBlockedIds(userId: string): string[] {
  return rt()
    .blocks.filter((b) => b.blockerId === userId)
    .map((b) => b.blockedId);
}

/** 양방향 차단 관계 — 매칭 하드 필터에서 사용합니다. */
export function hasBlockBetween(a: string, b: string): boolean {
  return rt().blocks.some(
    (x) =>
      (x.blockerId === a && x.blockedId === b) ||
      (x.blockerId === b && x.blockedId === a),
  );
}

/* -------------------------------------------------------------- 피드백 */

export function saveFeedback(input: SessionFeedback): void {
  const r = rt();
  const existing = r.feedback.find(
    (f) => f.sessionId === input.sessionId && f.userId === input.userId,
  );
  if (existing) Object.assign(existing, input);
  else r.feedback.push({ ...input });
}

export function getFeedback(
  sessionId: string,
  userId: string,
): SessionFeedback | null {
  const f = rt().feedback.find(
    (x) => x.sessionId === sessionId && x.userId === userId,
  );
  return f ? { ...f } : null;
}

export function listSessions(limit = 50): VideoSession[] {
  return [...rt().sessions.values()]
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, limit)
    .map((s) => ({ ...s }));
}

export function listFeedback(limit = 100): SessionFeedback[] {
  return rt()
    .feedback.slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map((f) => ({ ...f }));
}

/** 사용자가 참여했던 모든 세션 (대시보드 기록용) */
export function listSessionsForUser(userId: string): VideoSession[] {
  const r = rt();
  const ids = new Set(
    r.participants.filter((p) => p.userId === userId).map((p) => p.sessionId),
  );
  return [...ids]
    .map((id) => r.sessions.get(id))
    .filter((s): s is VideoSession => !!s)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .map((s) => ({ ...s }));
}

/* --------------------------------------------------- 데모 참가자 시뮬레이션 */

/** 데모 참가자의 대사 — 문구는 사전(`roomChat.sim*`)에 있습니다. */
const SIM_LINE_KEYS = [
  "roomChat.sim1",
  "roomChat.sim2",
  "roomChat.sim3",
  "roomChat.sim4",
  "roomChat.sim5",
  "roomChat.sim6",
  "roomChat.sim7",
];

/**
 * 데모 참가자의 발화·응답을 시뮬레이션합니다. 읽기 시점(폴링)에 호출되며,
 * 실제 사용자 참가자에게는 아무 영향도 주지 않습니다.
 *
 * ⚠️ 데모 전용 — 실서비스에서는 실제 참가자의 입력으로 대체됩니다.
 */
export function simulateDemoActivity(sessionId: string, waiterId: string | null): void {
  const r = rt();
  const session = r.sessions.get(sessionId);
  if (!session || session.state !== "live") return;

  const sims = r.participants.filter(
    (p) => p.sessionId === sessionId && p.simulated && !p.leftAt,
  );
  if (sims.length === 0) return;

  // 일정 간격으로 한 명이 발화합니다.
  const last = r.lastSimChatAt.get(sessionId) ?? 0;
  if (Date.now() - last < SIM_CHAT_INTERVAL_MS) return;
  r.lastSimChatAt.set(sessionId, Date.now());

  const count = r.messages.filter((m) => m.sessionId === sessionId).length;
  const speaker = sims[count % sims.length];
  r.messages.push({
    id: globalThis.crypto.randomUUID(),
    sessionId,
    senderId: speaker.userId,
    senderName: speaker.nickname,
    senderKey: null,
    kind: "user",
    body: "",
    bodyKey: SIM_LINE_KEYS[count % SIM_LINE_KEYS.length],
    bodyVars: null,
    moderationStatus: "allowed",
    moderationReason: null,
    createdAt: nowIso(),
  });

  // 라운지 매니저가 가끔 아이스브레이커를 던집니다.
  if (count > 0 && count % 5 === 0) {
    pushSystemMessage(
      sessionId,
      "waiter",
      waiterNameKey(waiterId),
      ICEBREAKER_KEYS[(count / 5) % ICEBREAKER_KEYS.length],
    );
  }
}

const ICEBREAKER_KEYS = [
  "roomChat.ice1",
  "roomChat.ice2",
  "roomChat.ice3",
  "roomChat.ice4",
];
