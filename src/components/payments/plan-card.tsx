"use client";

import { useState } from "react";
import { Check, Loader2, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import {
  type CreditProduct,
  formatUsd,
  pricePerMatch,
  productFeatures,
  productName,
  productTagline,
} from "@/lib/payments/catalog";

/**
 * 매치 횟수 상품 카드 — 입장료와 추가 매치.
 *
 * 가격·제공량은 전부 `CREDIT_PRODUCTS`에서 내려옵니다. 이 파일에는 값이
 * 없습니다.
 *
 * 결제 시작은 GET 링크가 아니라 form POST입니다 — 프리페치나 크롤러가 결제
 * 세션을 만들지 못하게 합니다.
 */
export function PlanCard({
  product,
  purchasable,
}: {
  product: CreditProduct;
  /** Creem 상품 ID가 연결되어 실제 결제가 가능한 상태인지 */
  purchasable: boolean;
}) {
  const t = useT();
  // 결제 페이지로 이동하는 동안 버튼을 잠가 중복 결제를 막습니다.
  const [submitting, setSubmitting] = useState(false);

  // 입장료가 이 서비스의 기본 상품입니다. 추가 매치는 모자랄 때만 사는
  // 보조 상품이라, 시각적 무게를 같게 두지 않습니다.
  const hero = product.code === "entry_pass";
  const name = productName(t, product.code);

  return (
    <article
      className={cn(
        "relative flex flex-col rounded-[var(--radius-card)] border p-6 transition-colors",
        hero
          ? "border-champagne bg-champagne/[0.04] shadow-[0_0_0_1px_var(--color-champagne-dim),0_18px_60px_-12px_rgba(216,190,134,0.35)]"
          : "border-line bg-surface-raised",
      )}
    >
      {hero ? (
        <div className="absolute -top-3 left-6">
          <Badge tone="gold">{t("pricing.basic")}</Badge>
        </div>
      ) : null}

      <h2
        className={cn(
          "font-display tracking-wide text-ivory",
          hero ? "text-2xl" : "text-xl",
        )}
      >
        {name}
      </h2>
      <p className="mt-1.5 text-sm break-keep text-faint">
        {productTagline(t, product.code)}
      </p>

      <p
        className={cn(
          "mt-6 font-display text-champagne",
          hero ? "text-5xl" : "text-4xl",
        )}
      >
        {formatUsd(product.priceCents)}
      </p>
      <p className="mt-2 text-sm text-muted">
        {t("pricing.matchesLabel", { count: product.matches })}
        {product.matches > 1 ? (
          <span className="text-faint">
            {" · "}
            {t("pricing.perMatch", { price: pricePerMatch(product) })}
          </span>
        ) : null}
      </p>

      <ul className="mt-6 flex-1 space-y-2.5">
        {productFeatures(t, product).map((feature) => (
          <li
            key={feature}
            className="flex gap-2.5 text-[0.9375rem] leading-relaxed break-keep text-muted"
          >
            <Check
              aria-hidden
              className={cn(
                "mt-1 size-4 shrink-0",
                hero ? "text-champagne" : "text-champagne-dim",
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
          <input type="hidden" name="code" value={product.code} />
          {/* 결제를 마치면 입장 신청 화면으로 돌아옵니다 — 요금 안내 페이지에
              머무르게 두면 방금 산 횟수로 무엇을 해야 할지 알 수 없습니다. */}
          <input type="hidden" name="next" value="/entry" />
          <button
            type="submit"
            disabled={submitting}
            aria-label={t("pricing.buyAria", {
              name,
              price: formatUsd(product.priceCents),
            })}
            className={cn(
              "flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] font-medium",
              "transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-champagne",
              "disabled:pointer-events-none disabled:opacity-60",
              hero
                ? "bg-linear-to-r from-champagne-soft via-champagne to-champagne-soft text-ink hover:brightness-110"
                : "border border-line bg-surface text-ivory hover:border-champagne-dim hover:bg-surface-overlay",
            )}
          >
            {submitting ? (
              <>
                <Loader2 aria-hidden className="size-4 animate-spin" />
                {t("pricing.buyPending")}
              </>
            ) : (
              t("pricing.buy")
            )}
          </button>
        </form>
      ) : (
        <p className="mt-8 flex h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-line bg-surface px-4 text-center text-sm text-faint">
          <Lock aria-hidden className="size-4 shrink-0" />
          {t("pricing.preparing")}
        </p>
      )}
    </article>
  );
}
