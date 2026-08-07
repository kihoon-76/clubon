import "server-only";

/**
 * Daily 화상 연동 (REST).
 *
 * 방은 세션 1건당 1개이며 이름을 sessionId에서 결정적으로 만들기 때문에,
 * 별도 저장 없이 언제든 같은 방을 다시 찾을 수 있습니다. 방 생성은 첫 참가
 * 요청 때 지연 생성하며 이미 있으면 그대로 재사용합니다(멱등).
 *
 * 브라우저에는 API 키를 절대 내려보내지 않습니다. 클라이언트는 방 URL과
 * 수명이 짧은 미팅 토큰만 받습니다.
 */

const API_BASE = "https://api.daily.co/v1";

/** 방 수명. 클럽 세션 한 판보다 넉넉하게 잡습니다. */
const ROOM_TTL_SECONDS = 4 * 60 * 60;
/** 미팅 토큰 수명. 만료되면 재입장 시 새로 발급받습니다. */
const TOKEN_TTL_SECONDS = 2 * 60 * 60;

export function isDailyConfigured(): boolean {
  return Boolean(process.env.DAILY_API_KEY);
}

function apiKey(): string {
  const key = process.env.DAILY_API_KEY;
  if (!key) throw new Error("DAILY_API_KEY가 설정되지 않았습니다.");
  return key;
}

interface DailyRoom {
  name: string;
  url: string;
}

async function dailyFetch(
  path: string,
  init: { method: "GET" | "POST"; body?: unknown },
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: init.method,
    headers: {
      authorization: `Bearer ${apiKey()}`,
      ...(init.body ? { "content-type": "application/json" } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

/**
 * 세션 ID에서 Daily 방 이름을 만듭니다. Daily 방 이름에는 하이픈이 허용되지만
 * 길이 제한이 있어 UUID의 하이픈을 제거해 짧게 씁니다.
 */
export function roomNameFor(sessionId: string): string {
  return `clubon-${sessionId.replace(/-/g, "")}`;
}

/**
 * 세션용 방을 확보하고 URL을 돌려줍니다. 이미 있으면 조회해서 재사용합니다.
 *
 * 방은 private이라 미팅 토큰 없이는 입장할 수 없습니다. 프리조인 화면과
 * Daily 자체 채팅은 끕니다 — 채팅은 앱 안에 이미 있고, 모더레이션도 앱을
 * 거쳐야 하기 때문입니다.
 */
export async function ensureRoom(sessionId: string): Promise<string> {
  const name = roomNameFor(sessionId);

  const created = await dailyFetch("/rooms", {
    method: "POST",
    body: {
      name,
      privacy: "private",
      properties: {
        exp: Math.floor(Date.now() / 1000) + ROOM_TTL_SECONDS,
        eject_at_room_exp: true,
        enable_prejoin_ui: false,
        enable_knocking: false,
        enable_chat: false,
        enable_screenshare: false,
        // 마스크 상태로 입장하는 것이 기본값입니다. 얼굴 공개는 방장 합의
        // 이후 토큰과 클라이언트 양쪽에서 열립니다.
        start_video_off: true,
        start_audio_off: false,
      },
    },
  });

  if (created.ok) return (created.data as DailyRoom).url;

  // 이미 만들어진 방이면 400이 오므로 조회해서 씁니다.
  const existing = await dailyFetch(`/rooms/${name}`, { method: "GET" });
  if (existing.ok) return (existing.data as DailyRoom).url;

  throw new Error(
    `Daily 방을 준비하지 못했습니다 (생성 ${created.status}, 조회 ${existing.status}).`,
  );
}

/**
 * 참가자 1인용 미팅 토큰. 서버가 확인한 신원과 권한만 담습니다.
 *
 * `startVideoOff`는 방이 아직 공개 전이면 true입니다. 토큰으로 한 번 더
 * 막아두면 클라이언트 코드가 잘못 동작해도 카메라가 먼저 켜지지 않습니다.
 */
export async function createMeetingToken(input: {
  sessionId: string;
  userId: string;
  userName: string;
  isOwner: boolean;
  startVideoOff: boolean;
}): Promise<string> {
  const res = await dailyFetch("/meeting-tokens", {
    method: "POST",
    body: {
      properties: {
        room_name: roomNameFor(input.sessionId),
        user_id: input.userId,
        user_name: input.userName,
        is_owner: input.isOwner,
        start_video_off: input.startVideoOff,
        exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
        eject_at_token_exp: true,
        // 녹화는 켜지 않습니다. `enable_recording`은 불리언이 아니라
        // "cloud" 같은 문자열 enum이라, 끄려면 아예 넘기지 않는 것이 맞습니다.
        enable_screenshare: false,
      },
    },
  });

  if (!res.ok) {
    throw new Error(`Daily 미팅 토큰 발급에 실패했습니다 (${res.status}).`);
  }
  return (res.data as { token: string }).token;
}
