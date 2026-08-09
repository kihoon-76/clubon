import Link from "next/link";

import { AdminPage, StatTile } from "@/components/admin/data-table";
import { getDb } from "@/lib/db";
import {
  listModerationEvents,
  listReports,
  listSessions,
} from "@/lib/runtime/store";

export const metadata = { title: "관리자 개요" };

export default async function AdminOverviewPage() {
  const db = getDb();
  const [users, tables, bookings] = await Promise.all([
    db.listUsers(500),
    db.listTables(500),
    db.listBookings(500),
  ]);

  const reports = listReports(500);
  const events = listModerationEvents(500);
  const sessions = listSessions(500);

  const openReports = reports.filter((r) => r.status === "open").length;
  const liveSessions = sessions.filter((s) => s.state !== "ended").length;
  const activeTables = tables.filter(
    (t) => t.state !== "CLOSED" && !t.closedAt,
  ).length;
  const suspended = users.filter((u) => u.status !== "active").length;

  return (
    <AdminPage
      title="개요"
      description="클럽 운영 현황 요약입니다. 모든 자동 조치는 기록에 남으며 관리자가 검토·번복할 수 있습니다."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="회원" value={users.length} hint={`제한 계정 ${suspended}명`} />
        <StatTile label="활성 라운지" value={activeTables} hint={`전체 ${tables.length}개`} />
        <StatTile label="진행 중 세션" value={liveSessions} hint={`전체 ${sessions.length}개`} />
        <StatTile
          label="미처리 신고"
          value={openReports}
          hint={`전체 신고 ${reports.length}건`}
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="매치 제안" value={bookings.length} />
        <StatTile
          label="수락된 제안"
          value={bookings.filter((b) => b.state === "ACCEPTED").length}
        />
        <StatTile label="모더레이션 이벤트" value={events.length} />
        <StatTile
          label="심각도 high 이상"
          value={
            events.filter((e) => e.severity === "high" || e.severity === "critical")
              .length
          }
        />
      </div>

      <div className="mt-8 rounded-[var(--radius-card)] border border-line bg-surface-raised p-6">
        <h2 className="font-display text-xl text-ivory">바로 가기</h2>
        <ul className="mt-4 flex flex-wrap gap-4 text-sm">
          {[
            { href: "/admin/reports", label: "신고 검토" },
            { href: "/admin/moderation", label: "모더레이션 로그" },
            { href: "/admin/sessions", label: "세션 목록" },
            { href: "/admin/payments", label: "결제 · 방 매치" },
            { href: "/admin/users", label: "회원 관리" },
          ].map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="text-champagne underline-offset-4 hover:underline"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </AdminPage>
  );
}
