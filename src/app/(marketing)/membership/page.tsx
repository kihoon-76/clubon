import type { Metadata } from "next";
import { Info } from "lucide-react";

import { Container } from "@/components/layout/container";
import { PlanCard } from "@/components/payments/plan-card";
import { FormError } from "@/components/ui/field";
import { ADDONS, PASS_PLANS, formatUsd } from "@/lib/payments/catalog";
import { purchasableCodes } from "@/lib/payments/creem";

export const metadata: Metadata = {
  title: "멤버십",
  description:
    "ClubOn 30분 라운지 이용권 — ONE TIME $4.99부터. 구독이 아니라 쓰는 만큼 구매합니다.",
};

/** 결제 시작이 실패했을 때 되돌아오며 붙는 코드. */
const ERROR_MESSAGES: Record<string, string> = {
  not_configured: "결제가 아직 연결되지 않았습니다. 잠시 후 다시 시도해 주세요.",
  unavailable: "지금은 구매할 수 없는 상품입니다.",
  unknown: "알 수 없는 상품입니다.",
  creem_error: "결제 페이지를 열지 못했습니다. 잠시 후 다시 시도해 주세요.",
};

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? ERROR_MESSAGES[sp.error] : null;

  // 실제로 Creem 상품이 연결된 것만 결제 버튼을 활성화합니다.
  // 연결 전에는 "결제 준비 중"으로 두고, 가짜 성공 경로를 만들지 않습니다.
  const available = purchasableCodes();

  // 모바일에서는 GOLD를 맨 앞으로 올려 먼저 보이게 합니다(데스크톱은 원래 순서).
  const mobileOrder = [...PASS_PLANS].sort(
    (a, b) => Number(b.emphasis === "hero") - Number(a.emphasis === "hero"),
  );

  return (
    <Container className="py-20 sm:py-24">
      <div className="max-w-2xl">
        <p className="label-caps">멤버십</p>
        <h1 className="mt-4 font-display text-4xl leading-tight break-keep text-ivory sm:text-5xl">
          조용하고 안전한 자리를 위한 회원제
        </h1>
        <p className="mt-6 text-[1.0625rem] leading-relaxed break-keep text-muted">
          라운지 이용권 1회는 30분 대화 한 자리입니다. 구독이 아니라 쓰는 만큼
          구매하며, 구매한 이용권에는 유효기간이 없습니다.
        </p>
      </div>

      {error ? (
        <div className="mt-8 max-w-2xl">
          <FormError message={error} />
        </div>
      ) : null}

      {/* 모바일: GOLD 우선 세로 배치 */}
      <div className="mt-14 grid gap-5 lg:hidden">
        {mobileOrder.map((plan) => (
          <PlanCard
            key={plan.code}
            plan={plan}
            purchasable={available.has(plan.code)}
          />
        ))}
      </div>

      {/* 데스크톱: 카탈로그 순서대로 4열, GOLD가 핵심 위치에 옵니다 */}
      <div className="mt-14 hidden gap-5 lg:grid lg:grid-cols-4">
        {PASS_PLANS.map((plan) => (
          <PlanCard
            key={plan.code}
            plan={plan}
            purchasable={available.has(plan.code)}
          />
        ))}
      </div>

      <p className="mt-10 flex items-start gap-2 text-xs leading-relaxed break-keep text-faint">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
        모든 가격은 USD 기준이며 결제 시점에 표시된 금액이 청구됩니다. 이용권은
        영상 라운지에 실제로 입장할 때 1회 차감되며, 매칭을 기다리는 동안에는
        차감되지 않습니다.
      </p>

      {/* 추가 과금 */}
      <section className="mt-20">
        <h2 className="font-display text-2xl text-ivory">필요할 때만 추가로</h2>
        <p className="mt-2 text-[0.9375rem] leading-relaxed break-keep text-muted">
          대화가 잘 풀릴 때 시간을 늘리거나, 다음 자리를 더 빨리 잡고 싶을 때
          쓰는 선택 항목입니다. 가격은 확정되었지만 아직 판매를 시작하지
          않았습니다.
        </p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ADDONS.map((addon) => {
            return (
              <li
                key={addon.code}
                className="rounded-[var(--radius-card)] border border-line bg-surface-raised p-5"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-[0.9375rem] font-medium text-ivory">
                    {addon.name}
                  </h3>
                  <span className="font-display text-lg text-champagne">
                    {formatUsd(addon.priceCents)}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed break-keep text-muted">
                  {addon.description}
                </p>
                <p className="mt-3 text-xs text-faint">준비 중입니다.</p>
              </li>
            );
          })}
        </ul>
      </section>
    </Container>
  );
}
