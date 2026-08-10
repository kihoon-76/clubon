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
 * 한 통화에 들어올 수 있는 기기 수. 라운지 두 곳이 한 대씩입니다.
 *
 * 토큰을 방장에게만 발급하는 것으로 이미 막히지만, 방에도 걸어 둡니다.
 * 앱이 실수로 토큰을 더 내주더라도 Daily가 세 번째 기기를 거절합니다.
 */
const MAX_DEVICES = 2;

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
        max_participants: MAX_DEVICES,
        enable_prejoin_ui: false,
        enable_knocking: false,
        enable_chat: false,
        enable_screenshare: false,
        start_video_off: false,
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
 * 라운지 기기용 미팅 토큰. 서버가 확인한 신원과 권한만 담습니다.
 *
 * **한 라운지는 한 대만 접속합니다.** 이 자리는 사람과 사람이 아니라 공간과
 * 공간을 잇습니다. 같은 라운지의 회원들은 한 방에 함께 있으므로, 회의실에
 * 카메라와 마이크를 한 벌만 두는 것과 같습니다. 그 한 벌을 맡는 기기가
 * 방장의 것이고, 나머지 회원의 기기는 아예 통화에 들어오지 않습니다 —
 * 같은 방에서 마이크를 여러 개 열면 하울링이 생기기 때문입니다.
 *
 * 그래서 이 함수는 **카메라를 맡은 방장에게만** 부릅니다. 나머지 회원에게는
 * 토큰 자체를 발급하지 않으므로, 클라이언트를 고쳐도 통화에 들어올 수
 * 없습니다.
 */
export async function createMeetingToken(input: {
  sessionId: string;
  userId: string;
  /** 화면에 뜨는 이름 — 개인이 아니라 그 라운지를 가리킵니다. */
  loungeName: string;
}): Promise<string> {
  const res = await dailyFetch("/meeting-tokens", {
    method: "POST",
    body: {
      properties: {
        room_name: roomNameFor(input.sessionId),
        user_id: input.userId,
        user_name: input.loungeName,
        is_owner: true,
        start_video_off: false,
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
