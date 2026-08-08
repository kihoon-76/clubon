import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * 세션 쿠키. `<userId>.<expEpochSeconds>.<hmac>` 형태로 서명해 저장합니다.
 * 서버에서만 검증되며, 위조 시 즉시 비로그인으로 처리합니다.
 *
 * 비밀키는 `AUTH_SECRET`. 미설정 시 개발용 고정 키로 폴백하며,
 * 프로덕션(NODE_ENV=production)에서는 반드시 설정해야 합니다.
 */

export const SESSION_COOKIE = "clubon_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14일

function secret(): string {
  const fromEnv = process.env.AUTH_SECRET;
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET이 설정되지 않았습니다. 프로덕션에서는 필수입니다.",
    );
  }
  return "clubon-dev-insecure-secret";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** 서명된 세션 토큰을 만듭니다. */
export function createSessionToken(userId: string): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  const payload = `${userId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

/** 토큰을 검증해 userId를 반환합니다. 위조·만료 시 null. */
export function readSessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expRaw, mac] = parts;
  const payload = `${userId}.${expRaw}`;
  if (!safeEqual(mac, sign(payload))) return null;

  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return null;
  return userId;
}

/**
 * 세션 쿠키 속성. 라우트 핸들러에서 응답 객체에 직접 심을 때도 같은 값을
 * 써야 하므로(Google 로그인 콜백) 한곳에 모아 둡니다.
 */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
} as const;

export async function setSessionCookie(userId: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(userId), SESSION_COOKIE_OPTIONS);
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function readSessionUserId(): Promise<string | null> {
  const store = await cookies();
  return readSessionToken(store.get(SESSION_COOKIE)?.value);
}
