import { NextResponse } from "next/server";

import {
  OAUTH_COOKIE,
  OAUTH_COOKIE_MAX_AGE,
  buildAuthorizationUrl,
  callbackUrl,
  createHandoff,
  encodeHandoff,
  isGoogleAuthConfigured,
  requestOrigin,
} from "@/lib/auth/google";
import { safeNext } from "@/lib/auth/redirect";

/**
 * Google 로그인 시작.
 *
 * state와 PKCE verifier를 httpOnly 쿠키에 담아두고 Google 동의 화면으로
 * 보냅니다. 쿠키는 응답 객체에 직접 심습니다 — 리디렉트 응답에도 Set-Cookie가
 * 확실히 함께 나가야 콜백에서 왕복 상태를 확인할 수 있습니다.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"));

  if (!isGoogleAuthConfigured()) {
    return NextResponse.redirect(
      new URL("/login?error=google_unavailable", requestOrigin(request)),
    );
  }

  const handoff = createHandoff(next);
  const response = NextResponse.redirect(
    buildAuthorizationUrl({ handoff, redirectUri: callbackUrl(request) }),
  );

  response.cookies.set(OAUTH_COOKIE, encodeHandoff(handoff), {
    httpOnly: true,
    // Google에서 돌아오는 것은 최상위 GET 이동이라 lax로 충분합니다.
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: OAUTH_COOKIE_MAX_AGE,
  });

  return response;
}
