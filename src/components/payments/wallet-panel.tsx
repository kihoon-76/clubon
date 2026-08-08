import Link from "next/link";
import { Crown, Ticket, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import type { LoungeUsage, PassWallet, PaymentRecord } from "@/lib/db/types";
import { formatUsd, getPurchasable } from "@/lib/payments/catalog";

/**
 * 마이페이지의 이용권 지갑 · 구매 내역 · 이용 내역.
 *
 * 잔액과 내역은 모두 서버에서 조회한 값이며, 화면에서 계산하지 않습니다.
 */

const PAYMENT_STATUS_LABEL: Record<string, { label: string; tone: "success" | "warn" | "danger" | "neutral" }> = {
  paid: { label: "결제 완료", tone: "success" },
  pending: { label: "확인 중", tone: "warn" },
  refunded: { label: "환불됨", tone: "neutral" },
  failed: { label: "실패", tone: "danger" },
};

const USAGE_STATUS_LABEL: Record<string, string> = {
  active: "진행 중",
  ended: "종료",
  expired: "시간 만료",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WalletPanel({
  wallet,
  payments,
  usages,
}: {
  wallet: PassWallet;
  payments: PaymentRecord[];
  usages: LoungeUsage[];
}) {
  const isVip = wallet.membershipType === "vip";

  return (
    <div className="space-y-6">
      <Card hairline={isVip}>
        <CardBody>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CardTitle>내 이용권</CardTitle>
              {isVip ? (
                <Badge tone="gold">
                  <Crown aria-hidden className="size-3" />
                  BLACK VIP
                </Badge>
              ) : null}
            </div>
            <ButtonLink href="/membership" size="sm">
              이용권 구매
            </ButtonLink>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Stat
              icon={<Ticket aria-hidden className="size-4 text-champagne" />}
              label="남은 이용권"
              value={`${wallet.remainingPasses}회`}
              hint="30분 라운지 기준"
            />
            <Stat
              icon={<Zap aria-hidden className="size-4 text-champagne" />}
              label="우선 매칭"
              value={`${wallet.priorityMatchingCredits}회`}
              hint={isVip ? "VIP 혜택" : "BLACK VIP 구매 시 제공"}
            />
            <Stat
              icon={<Crown aria-hidden className="size-4 text-champagne" />}
              label="누적 구매"
              value={`${wallet.totalPurchasedPasses}회`}
              hint="환불 회수분 포함 총 구매량"
            />
          </div>

          {isVip ? (
            <ul className="mt-6 grid gap-2 text-sm text-muted sm:grid-cols-2">
              {[
                "VIP 프로필 배지",
                "우선 매칭",
                "조건 지정 매칭",
                "VIP 전용 라운지 입장",
              ].map((benefit) => (
                <li key={benefit} className="flex gap-2">
                  <span aria-hidden className="text-champagne">
                    ·
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-sm leading-relaxed break-keep text-faint">
              BLACK VIP를 구매하면 VIP 배지, 우선 매칭 10회, 조건 지정 매칭, VIP
              전용 라운지 입장이 함께 열립니다.{" "}
              <Link
                href="/membership"
                className="text-champagne underline-offset-4 hover:underline"
              >
                자세히 보기
              </Link>
            </p>
          )}
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody>
            <CardTitle>구매 내역</CardTitle>
            {payments.length === 0 ? (
              <p className="mt-4 text-sm text-faint">아직 구매 내역이 없습니다.</p>
            ) : (
              <ul className="mt-4 divide-y divide-line/70">
                {payments.map((p) => {
                  const item = getPurchasable(p.planCode);
                  const status =
                    PAYMENT_STATUS_LABEL[p.paymentStatus] ??
                    PAYMENT_STATUS_LABEL.pending;
                  return (
                    <li
                      key={p.paymentId}
                      className="flex flex-wrap items-center justify-between gap-2 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-ivory">
                          {item?.name ?? p.planCode}
                          {p.purchasedPasses > 0 ? (
                            <span className="text-faint">
                              {" "}
                              · 이용권 {p.purchasedPasses}회
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-xs text-faint">
                          {formatDateTime(p.createdAt)}
                          {p.refundedAt
                            ? ` · 환불 ${formatDateTime(p.refundedAt)}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-champagne">
                          {formatUsd(p.amount)}
                        </span>
                        <Badge tone={status.tone}>{status.label}</Badge>
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
            <CardTitle>라운지 이용 내역</CardTitle>
            <p className="mt-1.5 text-xs text-faint">
              내가 이용권을 부담해 연 라운지입니다. 초대받아 참여한 자리는
              차감되지 않습니다.
            </p>
            {usages.length === 0 ? (
              <p className="mt-4 text-sm text-faint">
                아직 이용한 라운지가 없습니다.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-line/70">
                {usages.map((u) => (
                  <li
                    key={u.sessionId}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-ivory">
                        30분 라운지
                        <span className="text-faint">
                          {" "}
                          · 이용권 {u.deductedPasses}회 차감
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-faint">
                        {formatDateTime(u.startedAt)}
                      </p>
                    </div>
                    <Badge tone={u.sessionStatus === "active" ? "success" : "neutral"}>
                      {USAGE_STATUS_LABEL[u.sessionStatus] ?? u.sessionStatus}
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
