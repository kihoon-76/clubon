import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Google 로그인 (OAuth 2.0 Authorization Code + PKCE).
 *
 * 브라우저에는 client_secret도, Google 토큰도 내려보내지 않습니다. 콜백에서
 * 신원을 확인한 뒤에는 이 앱의 기존 세션 쿠키(`clubon_session`)로 갈아타므로,
 * 로그인 이후의 모든 코드는 인증 수단을 구분할 필요가 없습니다.
 *
 * 필요한 환경 변수: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
 * 둘 중 하나라도 없으면 Google 로그인 버튼이 화면에 나타나지 않습니다.
 */

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

/** id_token의 iss 클레임으로 Google이 쓰는 두 가지 표기. */
const ISSUERS = new Set(["https://accounts.google.com", "accounts.google.com"]);

/** 시계 오차 허용치. 서버 시각이 조금 밀려도 로그인이 깨지지 않게 합니다. */
const CLOCK_SKEW_SECONDS = 60;

export const OAUTH_COOKIE = "clubon_oauth";
/** 인가 화면에 머무는 시간을 고려한 여유. 지나면 처음부터 다시 시작합니다. */
export const OAUTH_COOKIE_MAX_AGE = 10 * 60;

export function isGoogleAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function clientId(): string {
  const v = process.env.GOOGLE_CLIENT_ID;
  if (!v) throw new Error("GOOGLE_CLIENT_ID가 설정되지 않았습니다.");
  return v;
}

function clientSecret(): string {
  const v = process.env.GOOGLE_CLIENT_SECRET;
  if (!v) throw new Error("GOOGLE_CLIENT_SECRET이 설정되지 않았습니다.");
  return v;
}

/* ------------------------------------------------------------ 왕복 상태 */

export interface OAuthHandoff {
  /** CSRF 방지용 난수. 콜백 쿼리의 state와 일치해야 합니다. */
  state: string;
  /** PKCE code_verifier. 인가 코드가 가로채여도 교환을 막습니다. */
  verifier: string;
  /** 로그인 후 돌아갈 내부 경로. */
  next: string | null;
}

export function createHandoff(next: string | null): OAuthHandoff {
  return {
    state: randomBytes(32).toString("base64url"),
    verifier: randomBytes(64).toString("base64url"),
    next,
  };
}

/** 왕복 상태를 쿠키 한 개에 담기 위한 직렬화. 서명은 하지 않습니다 — */
/** httpOnly 쿠키라 브라우저 스크립트가 읽을 수 없고, 값 자체가 일회용 난수입니다. */
export function encodeHandoff(h: OAuthHandoff): string {
  return Buffer.from(JSON.stringify(h), "utf8").toString("base64url");
}

export function decodeHandoff(raw: string | undefined): OAuthHandoff | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (
      typeof parsed?.state !== "string" ||
      typeof parsed?.verifier !== "string"
    ) {
      return null;
    }
    return {
      state: parsed.state,
      verifier: parsed.verifier,
      next: typeof parsed.next === "string" ? parsed.next : null,
    };
  } catch {
    return null;
  }
}

/** state 비교 — 길이가 달라도 던지지 않고 false를 돌려줍니다. */
export function statesMatch(a: string, b: string | null): boolean {
  if (!b) return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/* -------------------------------------------------------- 인가 요청 URL */

export function buildAuthorizationUrl(input: {
  handoff: OAuthHandoff;
  redirectUri: string;
}): string {
  const challenge = createHash("sha256")
    .update(input.handoff.verifier)
    .digest("base64url");

  const url = new URL(AUTH_ENDPOINT);
  url.searchParams.set("client_id", clientId());
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", input.handoff.state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  // 리프레시 토큰을 보관하지 않으므로 online으로 충분합니다.
  url.searchParams.set("access_type", "online");
  // 여러 구글 계정을 쓰는 회원이 어떤 계정으로 들어갈지 고를 수 있게 합니다.
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

/* ------------------------------------------------------------- 신원 확인 */

export interface GoogleIdentity {
  /** Google 계정의 불변 식별자. */
  sub: string;
  email: string;
  name: string | null;
}

/**
 * id_token(JWT)의 페이로드를 읽고 클레임을 검증합니다.
 *
 * 서명 검증은 하지 않습니다. 이 토큰은 브라우저를 거치지 않고 서버가 Google
 * 토큰 엔드포인트에서 TLS로 직접 받아온 것이라, Google 문서도 이 경로에서는
 * 서명 검증을 생략해도 된다고 안내합니다. 대신 발급자·수신자·만료는
 * 반드시 확인합니다.
 */
export function parseIdToken(idToken: string): GoogleIdentity {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("id_token 형식이 올바르지 않습니다.");

  let claims: Record<string, unknown>;
  try {
    claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    throw new Error("id_token을 해석하지 못했습니다.");
  }

  if (!ISSUERS.has(String(claims.iss))) {
    throw new Error("id_token 발급자가 Google이 아닙니다.");
  }
  if (claims.aud !== clientId()) {
    throw new Error("id_token이 이 앱을 대상으로 발급되지 않았습니다.");
  }
  const exp = Number(claims.exp);
  if (!Number.isFinite(exp) || exp + CLOCK_SKEW_SECONDS < Date.now() / 1000) {
    throw new Error("id_token이 만료되었습니다.");
  }

  const sub = typeof claims.sub === "string" ? claims.sub : "";
  const email = typeof claims.email === "string" ? claims.email : "";
  if (!sub || !email) {
    throw new Error("Google 계정에서 이메일을 확인하지 못했습니다.");
  }
  // 미인증 이메일을 신뢰하면 남의 주소로 만든 계정에 올라탈 수 있습니다.
  if (claims.email_verified !== true) {
    throw new Error("이메일이 확인되지 않은 Google 계정입니다.");
  }

  return {
    sub,
    email: email.trim().toLowerCase(),
    name: typeof claims.name === "string" ? claims.name : null,
  };
}

/** 인가 코드를 토큰으로 바꾸고, 그 안의 id_token에서 신원을 꺼냅니다. */
export async function exchangeCodeForIdentity(input: {
  code: string;
  verifier: string;
  redirectUri: string;
}): Promise<GoogleIdentity> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: input.code,
      client_id: clientId(),
      client_secret: clientSecret(),
      redirect_uri: input.redirectUri,
      grant_type: "authorization_code",
      code_verifier: input.verifier,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `Google 토큰 교환에 실패했습니다 (${res.status}) ${detail.slice(0, 200)}`,
    );
  }

  const data = (await res.json()) as { id_token?: string };
  if (!data.id_token) throw new Error("Google 응답에 id_token이 없습니다.");
  return parseIdToken(data.id_token);
}

/* --------------------------------------------------------- 콜백 주소 */

/**
 * 이 요청이 실제로 도착한 주소를 기준으로 redirect_uri를 만듭니다.
 *
 * 인가 요청과 토큰 교환의 redirect_uri는 **문자 단위로 같아야** 하고, Google
 * Cloud Console에 등록된 값과도 같아야 합니다. 요청에서 유도하면 로컬 개발과
 * 배포 도메인이 각각 알아서 맞습니다.
 */
export function callbackUrl(request: Request): string {
  return `${requestOrigin(request)}/api/auth/google/callback`;
}

/** 브라우저가 실제로 사용한 origin. 프록시(Vercel) 뒤에서도 정확합니다. */
export function requestOrigin(request: Request): string {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${proto}://${host}`;
}
