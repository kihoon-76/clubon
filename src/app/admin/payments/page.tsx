import { AdminPage, DataTable, StatTile, Td } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { adjustPasses } from "@/app/admin/payments/actions";
import { getDb } from "@/lib/db";
import type { PaymentRecord } from "@/lib/db/types";
import { PASS_PLANS, formatUsd, getPurchasable } from "@/lib/payments/catalog";

export const metadata = { title: "결제 · 이용권" };

/** 최소 화폐 단위 정수 → 표시용. 통화가 섞여 있으면 합산하지 않습니다. */
function sumAmount(payments: PaymentRecord[]): number {
  return payments.reduce((acc, p) => acc + p.amount, 0);
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}
function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminPaymentsPage() {
  const db = getDb();
  const [payments, wallets, usages, users] = await Promise.all([
    db.listPayments(500),
    db.listWallets(500),
    db.listUsages(500),
    db.listUsers(500),
  ]);

  const nicknameOf = new Map(users.map((u) => [u.id, u.email]));

  const paid = payments.filter((p) => p.paymentStatus === "paid");
  const refunded = payments.filter((p) => p.paymentStatus === "refunded");

  // 상품별 판매량 · 매출 · 구매 비율
  const byPlan = PASS_PLANS.map((plan) => {
    const rows = paid.filter((p) => p.planCode === plan.code);
    return {
      plan,
      count: rows.length,
      revenue: sumAmount(rows),
      share: paid.length === 0 ? 0 : (rows.length / paid.length) * 100,
    };
  });

  // 일별 · 월별 매출 (결제 완료 건만)
  const daily = new Map<string, number>();
  const monthly = new Map<string, number>();
  for (const p of paid) {
    daily.set(dayKey(p.createdAt), (daily.get(dayKey(p.createdAt)) ?? 0) + p.amount);
    monthly.set(
      monthKey(p.createdAt),
      (monthly.get(monthKey(p.createdAt)) ?? 0) + p.amount,
    );
  }
  const dailyRows = [...daily.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14);
  const monthlyRows = [...monthly.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 12);

  const totalDeducted = usages.reduce((acc, u) => acc + u.deductedPasses, 0);

  return (
    <AdminPage
      title="결제 · 이용권"
      description="이용권 판매와 사용 현황입니다. 금액은 결제사가 확인한 실제 결제액이며, 수동 조정은 결제 내역에 남지 않고 지갑만 변경합니다."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="총 결제금액"
          value={formatUsd(sumAmount(paid))}
          hint={`결제 완료 ${paid.length}건`}
        />
        <StatTile
          label="환불"
          value={formatUsd(sumAmount(refunded))}
          hint={`${refunded.length}건`}
        />
        <StatTile
          label="판매 이용권"
          value={paid.reduce((a, p) => a + p.purchasedPasses, 0)}
          hint="결제로 지급된 총 횟수"
        />
        <StatTile
          label="사용 이용권"
          value={totalDeducted}
          hint={`라운지 입장 ${usages.length}건`}
        />
      </div>

      {/* 상품별 판매 */}
      <section className="mt-10">
        <h2 className="font-display text-xl text-ivory">상품별 판매</h2>
        <div className="mt-4">
          <DataTable
            headers={["상품", "가격", "판매 건수", "매출", "구매 비율"]}
            empty="아직 결제 건이 없습니다."
          >
            {byPlan.map(({ plan, count, revenue, share }) => (
              <tr key={plan.code}>
                <Td>
                  <span className="text-ivory">{plan.name}</span>
                  <span className="text-faint"> · 이용권 {plan.passes}회</span>
                </Td>
                <Td>{formatUsd(plan.priceCents)}</Td>
                <Td>{count}건</Td>
                <Td className="text-champagne">{formatUsd(revenue)}</Td>
                <Td>{share.toFixed(1)}%</Td>
              </tr>
            ))}
          </DataTable>
        </div>
      </section>

      {/* 매출 추이 */}
      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-xl text-ivory">일별 매출</h2>
          <div className="mt-4">
            <DataTable headers={["날짜", "매출"]} empty="집계할 결제가 없습니다.">
              {dailyRows.map(([day, amount]) => (
                <tr key={day}>
                  <Td>{day}</Td>
                  <Td className="text-champagne">{formatUsd(amount)}</Td>
                </tr>
              ))}
            </DataTable>
          </div>
        </div>
        <div>
          <h2 className="font-display text-xl text-ivory">월별 매출</h2>
          <div className="mt-4">
            <DataTable headers={["월", "매출"]} empty="집계할 결제가 없습니다.">
              {monthlyRows.map(([month, amount]) => (
                <tr key={month}>
                  <Td>{month}</Td>
                  <Td className="text-champagne">{formatUsd(amount)}</Td>
                </tr>
              ))}
            </DataTable>
          </div>
        </div>
      </section>

      {/* 환불 내역 */}
      <section className="mt-10">
        <h2 className="font-display text-xl text-ivory">환불 내역</h2>
        <div className="mt-4">
          <DataTable
            headers={["주문", "회원", "상품", "금액", "환불 시각"]}
            empty="환불 내역이 없습니다."
          >
            {refunded.map((p) => (
              <tr key={p.paymentId}>
                <Td className="font-mono text-xs text-faint">{p.paymentId}</Td>
                <Td>{nicknameOf.get(p.userId) ?? p.userId.slice(0, 8)}</Td>
                <Td>{getPurchasable(p.planCode)?.name ?? p.planCode}</Td>
                <Td>{formatUsd(p.amount)}</Td>
                <Td>{p.refundedAt ? formatDateTime(p.refundedAt) : "—"}</Td>
              </tr>
            ))}
          </DataTable>
        </div>
      </section>

      {/* 회원별 지갑 · 수동 조정 */}
      <section className="mt-10">
        <h2 className="font-display text-xl text-ivory">회원별 잔여 이용권</h2>
        <p className="mt-2 text-sm text-muted">
          수동 지급·회수는 즉시 반영되며 서버 로그에 남습니다. 회수는 잔액
          아래로 내려가지 않습니다.
        </p>
        <div className="mt-4">
          <DataTable
            headers={["회원", "등급", "잔여", "누적 구매", "우선 매칭", "수동 조정"]}
            empty="지갑이 만들어진 회원이 없습니다."
          >
            {wallets.map((w) => (
              <tr key={w.userId}>
                <Td>{nicknameOf.get(w.userId) ?? w.userId.slice(0, 8)}</Td>
                <Td>
                  {w.membershipType === "vip" ? (
                    <Badge tone="gold">VIP</Badge>
                  ) : (
                    <span className="text-faint">일반</span>
                  )}
                </Td>
                <Td className="text-ivory">{w.remainingPasses}회</Td>
                <Td>{w.totalPurchasedPasses}회</Td>
                <Td>{w.priorityMatchingCredits}회</Td>
                <Td>
                  <form action={adjustPasses} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={w.userId} />
                    <label
                      htmlFor={`delta-${w.userId}`}
                      className="sr-only"
                    >{`${nicknameOf.get(w.userId) ?? w.userId} 이용권 조정 수량`}</label>
                    <input
                      id={`delta-${w.userId}`}
                      name="delta"
                      type="number"
                      defaultValue={1}
                      min={-100}
                      max={100}
                      className="h-9 w-20 rounded-[var(--radius-control)] border border-line bg-surface px-2 text-sm text-ivory"
                    />
                    <button
                      type="submit"
                      className="h-9 rounded-[var(--radius-control)] border border-line px-3 text-xs text-muted transition-colors hover:border-champagne-dim hover:text-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-champagne"
                    >
                      적용
                    </button>
                  </form>
                </Td>
              </tr>
            ))}
          </DataTable>
        </div>
      </section>

      {/* 차감 기록 */}
      <section className="mt-10">
        <h2 className="font-display text-xl text-ivory">이용권 차감 기록</h2>
        <p className="mt-2 text-sm text-muted">
          영상방 하나당 1회이며, 방을 연 라운지의 방장에게서 차감됩니다.
          같은 방의 다른 참가자는 무료로 참여합니다.
        </p>
        <div className="mt-4">
          <DataTable
            headers={["부담한 회원", "세션", "차감", "시작", "만료", "상태"]}
            empty="차감 기록이 없습니다."
          >
            {usages.map((u) => (
              <tr key={u.sessionId}>
                <Td>
                  {nicknameOf.get(u.payerUserId) ?? u.payerUserId.slice(0, 8)}
                </Td>
                <Td className="font-mono text-xs text-faint">
                  {u.sessionId.slice(0, 8)}
                </Td>
                <Td>{u.deductedPasses}회</Td>
                <Td>{formatDateTime(u.startedAt)}</Td>
                <Td>{formatDateTime(u.expiresAt)}</Td>
                <Td>
                  <Badge tone={u.sessionStatus === "active" ? "success" : "neutral"}>
                    {u.sessionStatus}
                  </Badge>
                </Td>
              </tr>
            ))}
          </DataTable>
        </div>
      </section>
    </AdminPage>
  );
}
