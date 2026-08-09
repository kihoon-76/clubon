import { ClubHeader } from "@/components/layout/club-header";
import { getDb } from "@/lib/db";
import { describeClubStatus } from "@/lib/club/status";
import { getT } from "@/lib/i18n/server";
import { isAuthenticated, requireOnboardedSession } from "@/lib/session";
import { now } from "@/lib/time";

/**
 * 로그인 이후의 일반 영역(대시보드 등). 클럽 운영시간 게이트는 적용하지
 * 않으므로, 영업 시간 밖에서도 프로필·기록을 확인할 수 있습니다.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await requireOnboardedSession("/dashboard");

  const db = getDb();
  const club = await db.getPrimaryClub();
  const hours = await db.getOperatingHours(club.id);
  const t = await getT();
  const status = describeClubStatus(club, hours, now(), t);

  return (
    <div className="club-ambience flex min-h-screen flex-col bg-ink">
      <ClubHeader
        userId={user.id}
        nickname={profile?.nickname ?? t("dashboard.member")}
        isOpen={status.isOpen}
        statusText={status.short}
        isStaff={user.role === "admin" || user.role === "moderator"}
        isAuthenticated={await isAuthenticated()}
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
