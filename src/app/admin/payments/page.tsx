import { AdminPage, DataTable, StatTile, Td } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { adjustPasses } from "@/app/admin/payments/actions";
import { getDb } from "@/lib/db";
import type { PaymentRecord } from "@/lib/db/types";
import {
  CREDIT_PRODUCTS,
  EXTENSION_ADDONS,
  formatUsd,
  getPurchasable,
  productName,
} from "@/lib/payments/catalog";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "결제 · 방 매치" };

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
  const t = await getT();
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
  const byProduct = CREDIT_PRODUCTS.map((product) => {
    const rows = paid.filter((p) => p.planCode === product.code);
    return {
      product,
      count: rows.length,
      revenue: sumAmount(rows),
      share: paid.length === 0 ? 0 : (rows.length / paid.length) * 100,
    };
  });

  // 시간 연장은 매치 횟수를 늘리지 않고 방 시간을 늘립니다. 판매량을 횟수와
  // 섞으면 "판매 매치"가 실제와 어긋나므로 따로 셉니다.
  const byExtension = EXTENSION_ADDONS.map((addon) => {
    const rows = paid.filter((p) => p.planCode === addon.code);
    return {
      addon,
      count: rows.length,
      revenue: sumAmount(rows),
      minutes: rows.length * addon.extendMinutes,
    };
  });
  const extensionRevenue = byExtension.reduce((a, x) => a + x.revenue, 0);
  const extendedMinutes = usages.reduce((a, u) => a + u.extendedMinutes, 0);

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

  // 쓴 횟수는 지갑에서 셉니다 — 차감 기록은 (방, 사람) 단위라 방 목록만으로는
  // 알 수 없고, "산 만큼 - 남은 만큼"이 정확히 쓴 양입니다.
  const totalUsed = wallets.reduce(
    (acc, w) => acc + Math.max(0, w.totalPurchasedMatches - w.remainingMatches),
    0,
  );

  return (
    <AdminPage
      title="결제 · 방 매치"
      description="입장료·추가 매치 판매와 사용 현황입니다. 금액은 결제사가 확인한 실제 결제액이며, 수동 조정은 결제 내역에 남지 않고 지갑만 변경합니다."
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
          label="판매 매치"
          value={paid.reduce((a, p) => a + p.purchasedMatches, 0)}
          hint="결제로 지급된 총 횟수"
        />
        <StatTile
          label="사용 매치"
          value={totalUsed}
          hint={`열린 방 ${usages.length}개`}
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
            {byProduct.map(({ product, count, revenue, share }) => (
              <tr key={product.code}>
                <Td>
                  <span className="text-ivory">
                    {productName(t, product.code)}
                  </span>
                  <span className="text-faint"> · 매치 {product.matches}회</span>
                </Td>
                <Td>{formatUsd(product.priceCents)}</Td>
                <Td>{count}건</Td>
                <Td className="text-champagne">{formatUsd(revenue)}</Td>
                <Td>{share.toFixed(1)}%</Td>
              </tr>
            ))}
          </DataTable>
        </div>
      </section>

      {/* 시간 연장 판매 */}
      <section className="mt-10">
        <h2 className="font-display text-xl text-ivory">시간 연장 판매</h2>
        <p className="mt-2 text-sm break-keep text-muted">
          매치 횟수를 쓰지 않고 방의 만료 시각만 뒤로 미는 상품입니다. 판매한 분
          수와 실제로 늘어난 분 수가 다르면(닫힌 방에 결제가 도착한 경우) 서버
          로그에 환불 필요로 남아 있습니다.
        </p>
        <div className="mt-4">
          <DataTable
            headers={["상품", "가격", "판매 건수", "매출", "판매한 시간"]}
            empty="아직 연장 결제가 없습니다."
          >
            {byExtension.map(({ addon, count, revenue, minutes }) => (
              <tr key={addon.code}>
                <Td>
                  <span className="text-ivory">
                    {productName(t, addon.code)}
                  </span>
                  <span className="text-faint">
                    {" "}
                    · {addon.inRoomBuyer === "guest" ? "참가자 선물" : "방장"}
                  </span>
                </Td>
                <Td>{formatUsd(addon.priceCents)}</Td>
                <Td>{count}건</Td>
                <Td className="text-champagne">{formatUsd(revenue)}</Td>
                <Td>{minutes}분</Td>
              </tr>
            ))}
            <tr>
              <Td className="text-faint">합계</Td>
              <Td>—</Td>
              <Td>{byExtension.reduce((a, x) => a + x.count, 0)}건</Td>
              <Td className="text-champagne">{formatUsd(extensionRevenue)}</Td>
              <Td className="text-ivory">적용 {extendedMinutes}분</Td>
            </tr>
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
                <Td>
                  {(() => {
                    const item = getPurchasable(p.planCode);
                    return item ? productName(t, item.code) : p.planCode;
                  })()}
                </Td>
                <Td>{formatUsd(p.amount)}</Td>
                <Td>{p.refundedAt ? formatDateTime(p.refundedAt) : "—"}</Td>
              </tr>
            ))}
          </DataTable>
        </div>
      </section>

      {/* 회원별 지갑 · 수동 조정 */}
      <section className="mt-10">
        <h2 className="font-display text-xl text-ivory">회원별 잔여 매치</h2>
        <p className="mt-2 text-sm text-muted">
          수동 지급·회수는 즉시 반영되며 서버 로그에 남습니다. 회수는 잔액
          아래로 내려가지 않습니다.
        </p>
        <div className="mt-4">
          <DataTable
            headers={["회원", "잔여", "누적 구매", "쓴 횟수", "수동 조정"]}
            empty="지갑이 만들어진 회원이 없습니다."
          >
            {wallets.map((w) => (
              <tr key={w.userId}>
                <Td>{nicknameOf.get(w.userId) ?? w.userId.slice(0, 8)}</Td>
                <Td className="text-ivory">{w.remainingMatches}회</Td>
                <Td>{w.totalPurchasedMatches}회</Td>
                <Td>
                  {Math.max(0, w.totalPurchasedMatches - w.remainingMatches)}회
                </Td>
                <Td>
                  <form action={adjustPasses} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={w.userId} />
                    <label
                      htmlFor={`delta-${w.userId}`}
                      className="sr-only"
                    >{`${nicknameOf.get(w.userId) ?? w.userId} 매치 횟수 조정 수량`}</label>
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
        <h2 className="font-display text-xl text-ivory">열린 방 기록</h2>
        <p className="mt-2 text-sm text-muted">
          방 하나당 1행입니다. 매치 횟수는 방에 들어온 참가자 각자에게서 1회씩
          빠지므로, 이 표의 행 수와 사용된 횟수는 일치하지 않습니다.
        </p>
        <div className="mt-4">
          <DataTable
            headers={["연 회원", "세션", "연장", "시작", "만료", "상태"]}
            empty="열린 방이 없습니다."
          >
            {usages.map((u) => (
              <tr key={u.sessionId}>
                <Td>
                  {nicknameOf.get(u.ownerUserId) ?? u.ownerUserId.slice(0, 8)}
                </Td>
                <Td className="font-mono text-xs text-faint">
                  {u.sessionId.slice(0, 8)}
                </Td>
                <Td>{u.extendedMinutes > 0 ? `${u.extendedMinutes}분` : "—"}</Td>
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
