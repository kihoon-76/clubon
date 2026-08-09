import Link from "next/link";
import { Crown, Ticket } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import type { LoungeUsage, PassWallet, PaymentRecord } from "@/lib/db/types";
import { getLocale, getT } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/locales";
import {
  LOUNGE_MINUTES,
  formatUsd,
  getPurchasable,
  productName,
} from "@/lib/payments/catalog";

/**
 * 마이페이지의 방 매치 지갑 · 구매 내역 · 이용 내역.
 *
 * 잔액과 내역은 모두 서버에서 조회한 값이며, 화면에서 계산하지 않습니다.
 */

const PAYMENT_TONE: Record<string, "success" | "warn" | "danger" | "neutral"> = {
  paid: "success",
  pending: "warn",
  refunded: "neutral",
  failed: "danger",
};

const PAYMENT_STATUS_KEY: Record<string, string> = {
  paid: "wallet.statusPaid",
  pending: "wallet.statusPending",
  refunded: "wallet.statusRefunded",
  failed: "wallet.statusFailed",
};

const USAGE_STATUS_KEY: Record<string, string> = {
  active: "wallet.usageActive",
  ended: "wallet.usageEnded",
  expired: "wallet.usageExpired",
};

function formatDateTime(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function WalletPanel({
  wallet,
  payments,
  usages,
}: {
  wallet: PassWallet;
  payments: PaymentRecord[];
  usages: LoungeUsage[];
}) {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const empty = wallet.remainingMatches === 0;

  return (
    <div className="space-y-6">
      <Card hairline={!empty}>
        <CardBody>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle>{t("wallet.title")}</CardTitle>
            <ButtonLink href="/entry" size="sm">
              {empty ? t("wallet.buyEntry") : t("wallet.requestEntry")}
            </ButtonLink>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Stat
              icon={<Ticket aria-hidden className="size-4 text-champagne" />}
              label={t("wallet.remaining")}
              value={t("wallet.times", { count: wallet.remainingMatches })}
              hint={t("wallet.remainingHint", { minutes: LOUNGE_MINUTES })}
            />
            <Stat
              icon={<Crown aria-hidden className="size-4 text-champagne" />}
              label={t("wallet.purchased")}
              value={t("wallet.times", { count: wallet.totalPurchasedMatches })}
              hint={t("wallet.purchasedHint")}
            />
          </div>

          <p className="mt-6 text-sm leading-relaxed break-keep text-faint">
            {t("wallet.spendNote")}{" "}
            <Link
              href="/membership"
              className="text-champagne underline-offset-4 hover:underline"
            >
              {t("wallet.pricingLink")}
            </Link>
          </p>
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody>
            <CardTitle>{t("wallet.payments")}</CardTitle>
            {payments.length === 0 ? (
              <p className="mt-4 text-sm text-faint">
                {t("wallet.paymentsEmpty")}
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-line/70">
                {payments.map((p) => {
                  const item = getPurchasable(p.planCode);
                  const tone = PAYMENT_TONE[p.paymentStatus] ?? "warn";
                  const statusKey =
                    PAYMENT_STATUS_KEY[p.paymentStatus] ?? "wallet.statusPending";
                  return (
                    <li
                      key={p.paymentId}
                      className="flex flex-wrap items-center justify-between gap-2 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-ivory">
                          {item ? productName(t, item.code) : p.planCode}
                          {p.purchasedMatches > 0 ? (
                            <span className="text-faint">
                              {" · "}
                              {t("wallet.matchesGiven", {
                                count: p.purchasedMatches,
                              })}
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-xs text-faint">
                          {formatDateTime(p.createdAt, locale)}
                          {p.refundedAt
                            ? ` · ${t("wallet.refundedAt", {
                                at: formatDateTime(p.refundedAt, locale),
                              })}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-champagne">
                          {formatUsd(p.amount)}
                        </span>
                        <Badge tone={tone}>{t(statusKey)}</Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <CardTitle>{t("wallet.seats")}</CardTitle>
            <p className="mt-1.5 text-xs break-keep text-faint">
              {t("wallet.seatsHint")}
            </p>
            {usages.length === 0 ? (
              <p className="mt-4 text-sm text-faint">{t("wallet.seatsEmpty")}</p>
            ) : (
              <ul className="mt-4 divide-y divide-line/70">
                {usages.map((u) => (
                  <li
                    key={u.sessionId}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-ivory">
                        {t("wallet.seat", { minutes: LOUNGE_MINUTES })}
                        {u.extendedMinutes > 0 ? (
                          <span className="text-faint">
                            {" · "}
                            {t("wallet.extendedBy", {
                              minutes: u.extendedMinutes,
                            })}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-xs text-faint">
                        {formatDateTime(u.startedAt, locale)}
                      </p>
                    </div>
                    <Badge tone={u.sessionStatus === "active" ? "success" : "neutral"}>
                      {t(USAGE_STATUS_KEY[u.sessionStatus] ?? u.sessionStatus)}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[var(--radius-control)] border border-line bg-surface p-4">
      <p className="flex items-center gap-2 text-xs text-faint">
        {icon}
        {label}
      </p>
      <p className="mt-2 font-display text-2xl text-ivory">{value}</p>
      <p className="mt-1 text-xs break-keep text-faint">{hint}</p>
    </div>
  );
}
