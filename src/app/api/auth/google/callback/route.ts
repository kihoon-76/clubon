import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  createSessionToken,
} from "@/lib/auth/cookie";
import {
  OAUTH_COOKIE,
  callbackUrl,
  decodeHandoff,
  exchangeCodeForIdentity,
  isGoogleAuthConfigured,
  requestOrigin,
  statesMatch,
} from "@/lib/auth/google";
import { resolveGoogleUser } from "@/lib/auth/google-account";
import { nextStepFor, safeNext } from "@/lib/auth/redirect";
import { getDb } from "@/lib/db";

/**
 * Google 로그인 콜백.
 *
 * 여기 도착한 요청은 아직 아무것도 증명하지 못한 상태입니다. 순서대로
 * ① state 일치(CSRF) ② 인가 코드 → 토큰 교환(PKCE) ③ id_token 클레임 검증을
 * 통과한 뒤에야 이 앱의 세션을 발급합니다.
 *
 * 실패는 모두 로그인 화면으로 되돌리고 원인은 쿼리로만 알립니다 — 계정 존재
 * 여부 같은 정보는 노출하지 않습니다.
 */
export async function GET(request: Request) {
  const origin = requestOrigin(request);
  const url = new URL(request.url);

  /** 왕복 쿠키는 성공·실패 어느 쪽이든 반드시 지웁니다(1회용). */
  const redirectTo = (path: string) => {
    const res = NextResponse.redirect(new URL(path, origin));
    res.cookies.delete(OAUTH_COOKIE);
    return res;
  };
  const fail = (code: string) => redirectTo(`/login?error=${code}`);

  if (!isGoogleAuthConfigured()) return fail("google_unavailable");

  // 사용자가 Google 동의 화면에서 취소한 경우.
  if (url.searchParams.get("error")) return fail("google_cancelled");

  const handoff = decodeHandoff((await cookies()).get(OAUTH_COOKIE)?.value);
  const code = url.searchParams.get("code");
  if (!handoff || !code) return fail("google_state");
  if (!statesMatch(handoff.state, url.searchParams.get("state"))) {
    return fail("google_state");
  }

  let identity;
  try {
    identity = await exchangeCodeForIdentity({
      code,
      verifier: handoff.verifier,
      redirectUri: callbackUrl(request),
    });
  } catch (error) {
    console.error("[auth] Google 신원 확인 실패", error);
    return fail("google_failed");
  }

  const user = await resolveGoogleUser(identity);
  if (user.status === "banned") return fail("account_restricted");

  const profile = await getDb().getProfile(user.id);
  const response = redirectTo(
    safeNext(handoff.next) ?? nextStepFor(user, !!profile),
  );
  response.cookies.set(
    SESSION_COOKIE,
    createSessionToken(user.id),
    SESSION_COOKIE_OPTIONS,
  );
  return response;
}
