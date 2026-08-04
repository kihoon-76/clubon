import "server-only";

import { checkText } from "@/lib/moderation/text";
import { getWaiter } from "@/lib/waiters";
import type {
  Block,
  ChatMessage,
  MaskId,
  ModerationEvent,
  Participant,
  ParticipantStatus,
  Report,
  RevealPair,
  RevealState,
  SessionFeedback,
  VideoSession,
} from "./types";
import { MASK_IDS } from "./types";

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
  reveals: RevealPair[];
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
    reveals: [],
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
    state: "live",
    pausedSince: null,
    startedAt: nowIso(),
    endedAt: null,
  };
  r.sessions.set(session.id, session);

  // 마스크는 참가자마다 겹치지 않게 배정합니다.
  input.members.forEach((m, i) => {
    r.participants.push({
      sessionId: session.id,
      userId: m.userId,
      tableId: m.tableId,
      nickname: m.nickname,
      mask: MASK_IDS[i % MASK_IDS.length] as MaskId,
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

  const waiter = input.waiterId ? getWaiter(input.waiterId) : undefined;
  pushSystemMessage(
    session.id,
    "waiter",
    waiter?.name ?? "라운지 매니저",
    `두 라운지가 합석했습니다. 오늘 자리는 ${
      waiter?.name ?? "라운지 매니저"
    } 웨이터가 안내합니다. 서로의 얼굴은 양쪽이 모두 동의할 때만 공개됩니다.`,
  );
  pushSystemMessage(
    session.id,
    "system",
    "시스템",
    "다른 참가자의 영상·음성·개인정보를 캡처, 녹화, 촬영하거나 공유하는 행위는 금지됩니다.",
  );

  return { ...session };
}

export function getSession(id: string): VideoSession | null {
  const s = rt().sessions.get(id);
  return s ? { ...s } : null;
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

export function setMedia(
  sessionId: string,
  userId: string,
  patch: { micOn?: boolean; camOn?: boolean },
): void {
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

  // 퇴장은 해당 사용자의 모든 공개 권한을 즉시 취소합니다.
  revokeAllRevealsFor(sessionId, userId);
  pushSystemMessage(sessionId, "system", "시스템", `${p.nickname}님이 나갔습니다.`);
  reconcileSessionState(sessionId);
}

export function endSession(sessionId: string, reason: string): void {
  const r = rt();
  const s = r.sessions.get(sessionId);
  if (!s || s.state === "ended") return;
  s.state = "ended";
  s.endedAt = nowIso();
  for (const p of r.participants.filter((x) => x.sessionId === sessionId)) {
    if (!p.leftAt) p.leftAt = s.endedAt;
  }
  // 세션 종료는 모든 공개 권한을 취소합니다.
  for (const pair of r.reveals.filter((x) => x.sessionId === sessionId)) {
    pair.state = "REMASKED";
    pair.updatedAt = s.endedAt!;
  }
  pushSystemMessage(sessionId, "system", "시스템", `세션이 종료되었습니다. (${reason})`);
}

/**
 * 최소 참가 인원(4명) 불변식을 강제합니다.
 * 인원이 모자라면 PAUSED, 회복되면 LIVE로 되돌립니다.
 */
const MIN_ROOM_PARTICIPANTS = 4;

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
    pushSystemMessage(
      sessionId,
      "system",
      "시스템",
      `참가자가 최소 인원(${MIN_ROOM_PARTICIPANTS}명) 아래로 줄어 대화를 일시 정지했습니다.`,
    );
  } else if (active >= MIN_ROOM_PARTICIPANTS && s.state === "paused") {
    s.state = "live";
    s.pausedSince = null;
    pushSystemMessage(sessionId, "system", "시스템", "인원이 회복되어 대화를 재개합니다.");
  }
}

/* -------------------------------------------------------------------- 채팅 */

function pushSystemMessage(
  sessionId: string,
  kind: "system" | "waiter",
  senderName: string,
  body: string,
): void {
  rt().messages.push({
    id: globalThis.crypto.randomUUID(),
    sessionId,
    senderId: null,
    senderName,
    kind,
    body,
    moderationStatus: "allowed",
    moderationReason: null,
    createdAt: nowIso(),
  });
}

export interface PostMessageResult {
  status: "allowed" | "flagged" | "blocked";
  reason: string | null;
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
    return { status: "blocked", reason: "이 룸에 참여하고 있지 않습니다." };
  }

  const body = rawBody.trim().slice(0, 1000);
  if (!body) return { status: "blocked", reason: "빈 메시지는 보낼 수 없습니다." };

  const verdict = checkText(body);

  r.messages.push({
    id: globalThis.crypto.randomUUID(),
    sessionId,
    senderId: userId,
    senderName: p.nickname,
    kind: "user",
    body,
    moderationStatus: verdict.status,
    moderationReason: verdict.reason,
    createdAt: nowIso(),
  });

  if (verdict.status !== "allowed" && verdict.severity) {
    applyModerationStrike({
      sessionId,
      userId,
      context: "chat",
      category: verdict.category,
      severity: verdict.severity,
      detail: verdict.reason ?? "규칙 위반",
      blocked: verdict.status === "blocked",
    });
  }

  return { status: verdict.status, reason: verdict.reason };
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

  let action = "기록만";
  let next: ParticipantStatus = p.status;

  if (input.severity === "critical") {
    next = "muted";
    action = "관리자 검토 대기 · 음소거";
  } else if (p.strikes >= 3) {
    next = "muted";
    action = "음소거";
  } else if (p.strikes === 2) {
    next = "restricted";
    action = "영상 블러 처리";
  } else if (p.strikes === 1) {
    next = "warned";
    action = "경고";
  }

  if (next !== p.status) {
    p.status = next;
    if (next === "restricted") p.videoState = "blurred";
    if (next === "muted") p.micOn = false;
    pushSystemMessage(
      input.sessionId,
      "system",
      "시스템",
      `${p.nickname}님에게 커뮤니티 기준에 따른 조치가 적용되었습니다: ${action}`,
    );
  }

  r.moderationEvents.push({
    id: globalThis.crypto.randomUUID(),
    sessionId: input.sessionId,
    subjectUserId: input.userId,
    context: input.context,
    contextRef: null,
    category: input.category,
    severity: input.severity,
    actionTaken: action,
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

/* ------------------------------------------------------------ 얼굴 공개 */

function pairKey(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function findPair(
  sessionId: string,
  a: string,
  b: string,
): RevealPair | undefined {
  const [x, y] = pairKey(a, b);
  return rt().reveals.find(
    (p) => p.sessionId === sessionId && p.userAId === x && p.userBId === y,
  );
}

export function getRevealPairsFor(
  sessionId: string,
  userId: string,
): RevealPair[] {
  return rt()
    .reveals.filter(
      (p) =>
        p.sessionId === sessionId &&
        (p.userAId === userId || p.userBId === userId),
    )
    .map((p) => ({ ...p }));
}

export function getRevealState(
  sessionId: string,
  a: string,
  b: string,
): RevealState {
  return findPair(sessionId, a, b)?.state ?? "MASKED";
}

/** A가 B에게 얼굴 공개를 요청합니다. */
export function requestReveal(
  sessionId: string,
  requesterId: string,
  targetId: string,
): void {
  const r = rt();
  const [x, y] = pairKey(requesterId, targetId);
  const existing = findPair(sessionId, requesterId, targetId);

  if (existing) {
    // 이미 공개된 쌍이면 재요청하지 않습니다.
    if (existing.state === "REVEALED") return;
    existing.state = "REVEAL_REQUESTED";
    existing.requesterId = requesterId;
    existing.updatedAt = nowIso();
    return;
  }

  r.reveals.push({
    sessionId,
    userAId: x,
    userBId: y,
    state: "REVEAL_REQUESTED",
    requesterId,
    updatedAt: nowIso(),
  });
}

/** 요청을 받은 쪽이 응답합니다. 양측 동의가 확정되면 REVEALED. */
export function respondReveal(
  sessionId: string,
  responderId: string,
  otherId: string,
  accept: boolean,
): void {
  const pair = findPair(sessionId, responderId, otherId);
  if (!pair || pair.state !== "REVEAL_REQUESTED") return;
  // 요청자 본인은 응답할 수 없습니다.
  if (pair.requesterId === responderId) return;

  pair.updatedAt = nowIso();
  if (!accept) {
    pair.state = "REVEAL_CANCELLED";
    return;
  }
  // 서버가 양측 동의를 확정한 뒤 동시에 공개합니다.
  pair.state = "REVEALED";

  const names = getParticipants(sessionId)
    .filter((p) => p.userId === responderId || p.userId === otherId)
    .map((p) => p.nickname)
    .join(" · ");
  pushSystemMessage(
    sessionId,
    "system",
    "시스템",
    `${names} 두 분이 서로 얼굴을 공개했습니다. 다른 참가자에게는 계속 마스크가 적용됩니다.`,
  );
}

/** 어느 한쪽이 마스크를 복구하면 양방향 모두 즉시 마스크로 돌아갑니다. */
export function remask(
  sessionId: string,
  userId: string,
  otherId: string,
): void {
  const pair = findPair(sessionId, userId, otherId);
  if (!pair) return;
  pair.state = "REMASKED";
  pair.updatedAt = nowIso();
}

function revokeAllRevealsFor(sessionId: string, userId: string): void {
  for (const pair of rt().reveals) {
    if (pair.sessionId !== sessionId) continue;
    if (pair.userAId !== userId && pair.userBId !== userId) continue;
    pair.state = "REMASKED";
    pair.updatedAt = nowIso();
  }
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

  // 신고는 해당 쌍의 공개 권한을 즉시 취소합니다.
  if (input.sessionId) {
    const pair = findPair(
      input.sessionId,
      input.reporterId,
      input.reportedUserId,
    );
    if (pair) {
      pair.state = "REMASKED";
      pair.updatedAt = nowIso();
    }
  }
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

export function blockUser(
  blockerId: string,
  blockedId: string,
  sessionId: string | null,
): void {
  const r = rt();
  if (
    !r.blocks.some((b) => b.blockerId === blockerId && b.blockedId === blockedId)
  ) {
    r.blocks.push({ blockerId, blockedId, createdAt: nowIso() });
  }
  // 차단은 즉시 공개 권한을 취소합니다.
  if (sessionId) {
    const pair = findPair(sessionId, blockerId, blockedId);
    if (pair) {
      pair.state = "REMASKED";
      pair.updatedAt = nowIso();
    }
  }
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

const SIM_LINES = [
  "안녕하세요! 반가워요 :)",
  "다들 오늘 어떤 하루 보내셨어요?",
  "저는 요즘 퇴근하고 산책하는 게 낙이에요.",
  "이 라운지 분위기 좋네요.",
  "최근에 본 것 중에 추천할 만한 거 있으세요?",
  "여행 얘기 나오면 밤새울 수 있어요.",
  "음악 취향이 비슷한 것 같아 반갑네요.",
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

  // 1) 대기 중인 얼굴 공개 요청에 응답합니다.
  for (const pair of r.reveals) {
    if (pair.sessionId !== sessionId) continue;
    if (pair.state !== "REVEAL_REQUESTED") continue;
    const responderId =
      pair.requesterId === pair.userAId ? pair.userBId : pair.userAId;
    const responder = sims.find((p) => p.userId === responderId);
    if (!responder) continue;
    // 요청 후 3초가 지나면 수락합니다.
    if (Date.now() - Date.parse(pair.updatedAt) < 3000) continue;
    respondReveal(sessionId, responderId, pair.requesterId!, true);
  }

  // 2) 일정 간격으로 한 명이 발화합니다.
  const last = r.lastSimChatAt.get(sessionId) ?? 0;
  if (Date.now() - last < SIM_CHAT_INTERVAL_MS) return;
  r.lastSimChatAt.set(sessionId, Date.now());

  const count = r.messages.filter((m) => m.sessionId === sessionId).length;
  const speaker = sims[count % sims.length];
  const line = SIM_LINES[count % SIM_LINES.length];

  r.messages.push({
    id: globalThis.crypto.randomUUID(),
    sessionId,
    senderId: speaker.userId,
    senderName: speaker.nickname,
    kind: "user",
    body: line,
    moderationStatus: "allowed",
    moderationReason: null,
    createdAt: nowIso(),
  });

  // 웨이터가 가끔 아이스브레이커를 던집니다.
  if (count > 0 && count % 5 === 0) {
    const waiter = waiterId ? getWaiter(waiterId) : undefined;
    pushSystemMessage(
      sessionId,
      "waiter",
      waiter?.name ?? "라운지 매니저",
      ICEBREAKERS[(count / 5) % ICEBREAKERS.length],
    );
  }
}

const ICEBREAKERS = [
  "가장 최근에 '이건 진짜 좋았다' 싶었던 순간은 언제였나요?",
  "다음에 꼭 다시 가고 싶은 도시가 있다면 어디인가요?",
  "요즘 반복해서 듣는 곡 하나만 알려주세요.",
  "완벽한 주말 하루를 마음대로 짠다면 어떤 하루일까요?",
];
