"use client";

import { useState } from "react";
import { Check, Loader2, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  type PassPlan,
  formatUsd,
  pricePerPass,
} from "@/lib/payments/catalog";

/**
 * 이용권 상품 카드.
 *
 * 가격·혜택은 전부 `PASS_PLANS`에서 내려옵니다. 이 파일에는 값이 없습니다.
 *
 * 결제 시작은 GET 링크가 아니라 form POST입니다 — 프리페치나 크롤러가 결제
 * 세션을 만들지 못하게 합니다.
 */
export function PlanCard({
  plan,
  purchasable,
}: {
  plan: PassPlan;
  /** Creem 상품 ID가 연결되어 실제 결제가 가능한 상태인지 */
  purchasable: boolean;
}) {
  // 결제 페이지로 이동하는 동안 버튼을 잠가 중복 결제를 막습니다.
  const [submitting, setSubmitting] = useState(false);

  const hero = plan.emphasis === "hero";
  const luxury = plan.emphasis === "luxury";

  return (
    <article
      className={cn(
        // h-full은 쓰지 않습니다 — 그리드가 이미 같은 높이로 늘려 주는데,
        // 높이를 100%로 못 박으면 GOLD의 확대(-my-3)가 먹히지 않습니다.
        "relative flex flex-col rounded-[var(--radius-card)] border p-6 transition-colors",
        hero &&
          // GOLD만 위아래로 더 크게 + 골드 테두리 + 글로우로 시선을 모읍니다.
          "border-champagne bg-champagne/[0.04] shadow-[0_0_0_1px_var(--color-champagne-dim),0_18px_60px_-12px_rgba(216,190,134,0.35)] lg:-my-4 lg:py-10",
        luxury && "border-champagne-dim/50 bg-ink",
        !hero && !luxury && "border-line bg-surface-raised",
      )}
    >
      {plan.badge ? (
        <div className="absolute -top-3 left-6">
          <Badge tone="gold">{plan.badge}</Badge>
        </div>
      ) : null}

      <h2
        className={cn(
          "font-display tracking-wide text-ivory",
          hero ? "text-2xl" : "text-xl",
        )}
      >
        {plan.name}
      </h2>
      <p className="mt-1.5 text-sm break-keep text-faint">{plan.tagline}</p>

      <p
        className={cn(
          "mt-6 font-display text-champagne",
          hero ? "text-5xl" : "text-4xl",
        )}
      >
        {formatUsd(plan.priceCents)}
      </p>
      <p className="mt-2 text-sm text-muted">
        30분 이용권 {plan.passes}회
        <span className="text-faint"> · 1회당 {pricePerPass(plan)}</span>
      </p>

      <ul className="mt-6 flex-1 space-y-2.5">
        {plan.features.map((feature) => (
          <li
            key={feature}
            className="flex gap-2.5 text-[0.9375rem] leading-relaxed break-keep text-muted"
          >
            <Check
              aria-hidden
              className={cn(
                "mt-1 size-4 shrink-0",
                hero || luxury ? "text-champagne" : "text-champagne-dim",
              )}
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {purchasable ? (
        <form
          action="/api/payments/checkout"
          method="post"
          onSubmit={() => setSubmitting(true)}
          className="mt-8"
        >
          <input type="hidden" name="code" value={plan.code} />
          <button
            type="submit"
            disabled={submitting}
            aria-label={`${plan.name} 구매하기 — ${formatUsd(plan.priceCents)}`}
            className={cn(
              "flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] font-medium",
              "transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-champagne",
              "disabled:pointer-events-none disabled:opacity-60",
              hero
                ? // GOLD만 골드 그라데이션
                  "bg-linear-to-r from-champagne-soft via-champagne to-champagne-soft text-ink hover:brightness-110"
                : "border border-line bg-surface text-ivory hover:border-champagne-dim hover:bg-surface-overlay",
            )}
          >
            {submitting ? (
              <>
                <Loader2 aria-hidden className="size-4 animate-spin" />
                결제 페이지로 이동 중…
              </>
            ) : (
              "구매하기"
            )}
          </button>
        </form>
      ) : (
        <p className="mt-8 flex h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-line bg-surface px-4 text-center text-sm text-faint">
          <Lock aria-hidden className="size-4 shrink-0" />
          결제 준비 중
        </p>
      )}
    </article>
  );
}
