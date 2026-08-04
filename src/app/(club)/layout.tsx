import { ClubHeader } from "@/components/layout/club-header";
import { getDb } from "@/lib/db";
import { describeClubStatus } from "@/lib/club/status";
import { isAuthenticated, requireOnboardedSession } from "@/lib/session";
import { now } from "@/lib/time";

/**
 * 클럽 내부 레이아웃. 로그인·온보딩·정지 여부를 확인하는 접근 게이트이자
 * 클럽 공용 헤더를 제공합니다. 운영시간 게이트는 각 페이지에서 처리합니다.
 */
export default async function ClubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await requireOnboardedSession("/lobby");

  const db = getDb();
  const club = await db.getPrimaryClub();
  const hours = await db.getOperatingHours(club.id);
  const status = describeClubStatus(club, hours, now());

  return (
    <div className="club-ambience flex min-h-screen flex-col bg-ink">
      <ClubHeader
        userId={user.id}
        nickname={profile?.nickname ?? "회원"}
        isOpen={status.isOpen}
        statusText={status.short}
        isStaff={user.role === "admin" || user.role === "moderator"}
        isAuthenticated={await isAuthenticated()}
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
