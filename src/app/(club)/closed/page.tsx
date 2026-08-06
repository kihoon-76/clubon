import { CalendarClock, Moon } from "lucide-react";
import { redirect } from "next/navigation";

import { Container } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { getDb } from "@/lib/db";
import { describeClubStatus } from "@/lib/club/status";
import { getSession } from "@/lib/session";
import { now } from "@/lib/time";

export const metadata = { title: "클럽 마감" };

export default async function ClosedPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const db = getDb();
  const club = await db.getPrimaryClub();
  const hours = await db.getOperatingHours(club.id);
  const status = describeClubStatus(club, hours, now());

  // 이미 영업 중이면 로비로.
  if (status.isOpen) redirect("/lobby");

  return (
    <Container className="flex min-h-[70dvh] flex-col justify-center py-16 sm:py-20">
      <div className="max-w-xl">
        <span
          aria-hidden
          className="flex size-12 items-center justify-center rounded-full border border-champagne-dim/60 text-champagne"
        >
          <Moon className="size-5" />
        </span>
        <p className="mt-6 label-caps">클럽 마감</p>
        <h1 className="mt-4 font-display text-4xl leading-tight text-ivory sm:text-5xl">
          지금은 클럽이
          <br />
          <span className="text-champagne">닫혀 있습니다.</span>
        </h1>

        <Card hairline className="mt-8 overflow-hidden">
          <CardBody className="flex items-center gap-4">
            <span
              aria-hidden
              className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-champagne"
            >
              <CalendarClock className="size-5" />
            </span>
            <div>
              <p className="text-sm text-muted">다음 오픈</p>
              <p className="mt-0.5 font-display text-xl text-ivory">
                {status.opensAtText ?? "곧 안내됩니다"}
              </p>
            </div>
          </CardBody>
        </Card>

        <p className="mt-8 text-[0.9375rem] leading-relaxed text-muted">
          클럽은 매일 저녁 6시부터 새벽 4시까지 열립니다. 닫힌 시간에도 프로필
          수정, 친구 초대, 다음 방문 준비는 계속할 수 있습니다.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/dashboard" variant="secondary">
            대시보드로 이동
          </ButtonLink>
          <ButtonLink href="/" variant="ghost">
            홈으로
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}
