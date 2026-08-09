import { Info } from "lucide-react";

import { Container } from "@/components/layout/container";
import { PlanCard } from "@/components/payments/plan-card";
import { FormError } from "@/components/ui/field";
import {
  CREDIT_PRODUCTS,
  ENTRY_PASS,
  EXTENSION_ADDONS,
  LOUNGE_MINUTES,
  addonDescription,
  formatUsd,
  productName,
} from "@/lib/payments/catalog";
import { purchasableCodes } from "@/lib/payments/creem";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return {
    title: t("pricing.metaTitle"),
    description: t("pricing.metaDescription", {
      price: formatUsd(ENTRY_PASS.priceCents),
      matches: ENTRY_PASS.matches,
    }),
  };
}

/** 결제 시작이 실패했을 때 되돌아오며 붙는 코드. */
const ERROR_CODES = new Set([
  "not_configured",
  "unavailable",
  "unknown",
  "creem_error",
]);

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const t = await getT();
  const error =
    typeof sp.error === "string" && ERROR_CODES.has(sp.error)
      ? t(`entry.errors.${sp.error}`)
      : null;

  // 실제로 Creem 상품이 연결된 것만 결제 버튼을 활성화합니다.
  // 연결 전에는 "결제 준비 중"으로 두고, 가짜 성공 경로를 만들지 않습니다.
  const available = purchasableCodes();

  return (
    <Container className="py-20 sm:py-24">
      <div className="max-w-2xl">
        <p className="label-caps">{t("pricing.eyebrow")}</p>
        <h1 className="mt-4 font-display text-4xl leading-tight break-keep text-ivory sm:text-5xl">
          {t("pricing.title")}
        </h1>
        <p className="mt-6 text-[1.0625rem] leading-relaxed break-keep text-muted">
          {t("pricing.intro", {
            price: formatUsd(ENTRY_PASS.priceCents),
            matches: ENTRY_PASS.matches,
            minutes: LOUNGE_MINUTES,
          })}
        </p>
      </div>

      {error ? (
        <div className="mt-8 max-w-2xl">
          <FormError message={error} />
        </div>
      ) : null}

      <div className="mt-14 grid gap-5 sm:grid-cols-2">
        {CREDIT_PRODUCTS.map((product) => (
          <PlanCard
            key={product.code}
            product={product}
            purchasable={available.has(product.code)}
          />
        ))}
      </div>

      <p className="mt-10 flex items-start gap-2 text-xs leading-relaxed break-keep text-faint">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
        {t("pricing.note")}
      </p>

      {/* 시간 연장 */}
      <section className="mt-20">
        <h2 className="font-display text-2xl text-ivory">
          {t("pricing.extendTitle")}
        </h2>
        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed break-keep text-muted">
          {t("pricing.extendIntro")}
        </p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {EXTENSION_ADDONS.map((addon) => (
            <li
              key={addon.code}
              className="rounded-[var(--radius-card)] border border-line bg-surface-raised p-5"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-[0.9375rem] font-medium text-ivory">
                  {productName(t, addon.code)}
                </h3>
                <span className="font-display text-lg text-champagne">
                  {formatUsd(addon.priceCents)}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed break-keep text-muted">
                {addonDescription(t, addon.code)}
              </p>
              <p className="mt-3 text-xs text-faint">
                {available.has(addon.code)
                  ? t("pricing.extendInRoom")
                  : t("pricing.extendPreparing")}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </Container>
  );
}
