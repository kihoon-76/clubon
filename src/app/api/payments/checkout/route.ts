import { NextResponse } from "next/server";

import { requestOrigin } from "@/lib/auth/google";
import { getPlan, getPurchasable } from "@/lib/payments/catalog";
import { createCheckout, isCreemConfigured } from "@/lib/payments/creem";
import { getCurrentUser, isAuthenticated } from "@/lib/session";

/**
 * 결제 시작 — Creem 체크아웃 세션을 만들고 결제 페이지로 보냅니다.
 *
 * POST만 받습니다. 링크(GET)로 열리면 크롤러나 프리페치가 결제 세션을 만들 수
 * 있기 때문입니다.
 *
 * 로그인하지 않았으면 로그인 화면으로 보내되, `next`에 이 상품으로 돌아오는
 * 경로를 실어 결제 흐름이 끊기지 않게 합니다.
 */
export async function POST(request: Request) {
  const origin = requestOrigin(request);
  const form = await request.formData();
  const code = String(form.get("code") ?? "");

  // 이용권 상품만 판매합니다.
  //
  // 추가 과금(연장·재매칭·선물)은 카탈로그와 서버 인터페이스는 준비되어
  // 있지만 **이행 로직이 아직 없습니다**. 결제를 받아 놓고 아무것도 주지 못하는
  // 상황을 막기 위해, 이행이 붙기 전까지는 결제 자체를 시작하지 않습니다.
  const plan = getPlan(code);
  if (!plan) {
    const known = Boolean(getPurchasable(code));
    return NextResponse.redirect(
      new URL(`/membership?error=${known ? "unavailable" : "unknown"}`, origin),
      303,
    );
  }

  // 미리보기 단계의 데모 회원이 아니라 '진짜 로그인'을 요구합니다 —
  // 결제는 계정에 귀속되어야 하기 때문입니다.
  if (!(await isAuthenticated())) {
    const next = `/membership?plan=${encodeURIComponent(code)}`;
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent(next)}`, origin),
      303,
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", origin), 303);
  }

  if (!isCreemConfigured()) {
    return NextResponse.redirect(
      new URL("/membership?error=not_configured", origin),
      303,
    );
  }

  const result = await createCheckout({
    code: plan.code,
    userId: user.id,
    userEmail: user.email,
    // 결제 성공 여부는 여기서 판단하지 않습니다. 이 화면은 "확인 중" 안내만
    // 하고, 실제 지급은 웹훅이 확인한 뒤에 이루어집니다.
    successUrl: `${origin}/dashboard?purchase=processing`,
  });

  if (!result.ok) {
    const reason =
      result.reason === "unknown_product" ? "unavailable" : result.reason;
    return NextResponse.redirect(
      new URL(`/membership?error=${reason}`, origin),
      303,
    );
  }

  return NextResponse.redirect(result.checkoutUrl, 303);
}
