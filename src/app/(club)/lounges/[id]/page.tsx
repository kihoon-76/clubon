import { ArrowRight, DoorOpen, Info } from "lucide-react";
import { redirect } from "next/navigation";

import { leaveLounge } from "@/app/(club)/lounges/actions";
import { LoungeRoster } from "@/components/lounge/lounge-roster";
import { PreferenceForm } from "@/components/lounge/preference-form";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { WaiterAvatar } from "@/components/waiter/waiter-avatar";
import { getDb } from "@/lib/db";
import { requireOnboardedSession } from "@/lib/session";
import { getWaiter } from "@/lib/waiters";

export const metadata = { title: "내 라운지" };

const NOTICES: Record<string, string> = {
  too_small:
    "합석하려면 이 라운지에 최소 2명이 필요합니다. 초대코드를 공유해 주세요.",
  invalid: "입력한 조건을 다시 확인해 주세요.",
};

export default async function LoungePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const { user, profile } = await requireOnboardedSession(`/lounges/${id}`);
  const db = getDb();

  // 자신이 속한 라운지만 접근 가능.
  const myTable = await db.getActiveTableForUser(user.id);
  if (!myTable || myTable.id !== id) redirect("/lobby");

  const table = myTable;
  const waiter = table.waiterId ? getWaiter(table.waiterId) : undefined;
  const club = await db.getPrimaryClub();
  const members = await db.getActiveTableMembers(id);
  const profiles = await db.getProfilesForTable(id);
  const booking = await db.getBookingForTable(id);

  // 진행 중인 제안이 있으면 제안 화면으로 유도합니다.
  const livePropose = booking?.state === "PENDING" ? booking : null;
  const liveSession =
    booking?.state === "ACCEPTED" && booking.sessionId ? booking : null;

  // 데모 동반자 버튼은 인메모리 데모 모드에서만 노출합니다.
  const canAddDemoCompanion = !process.env.DATABASE_URL;

  const editing = sp.edit === "1";
  const searched = sp.searched === "1";
  const declined = sp.declined === "1";
  const notice = typeof sp.error === "string" ? NOTICES[sp.error] : undefined;

  return (
    <Container className="py-14 sm:py-16">
      {/* 담당 웨이터 */}
      {waiter ? (
        <div className="flex items-center gap-4 rounded-[var(--radius-card)] border border-champagne-dim/30 bg-ink p-5">
          <WaiterAvatar waiter={waiter} className="w-16 shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-xl text-ivory">{waiter.name}</span>
              <Badge tone="gold">{waiter.epithet}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted">
              {waiter.name} 웨이터가 오늘 저녁 {profile?.nickname ?? "회원"}님의
              자리를 안내합니다.
            </p>
          </div>
        </div>
      ) : null}

      {/* 라운지 요약 */}
      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps">내 라운지</p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-ivory sm:text-5xl">
            {table.name}
          </h1>
        </div>
        <form action={leaveLounge.bind(null, id)}>
          <Button type="submit" variant="ghost" size="sm">
            <DoorOpen aria-hidden className="size-4" />
            라운지 나가기
          </Button>
        </form>
      </div>

      {notice ? <Notice tone="warn">{notice}</Notice> : null}
      {declined ? (
        <Notice tone="warn">
          제안이 성사되지 않았습니다. 다른 조건으로 다시 찾아보세요.
        </Notice>
      ) : null}
      {searched ? (
        <Notice tone="warn">
          조건에 맞는 상대 라운지를 아직 찾지 못했어요. 조건을 조금 넓혀 다시
          시도해 보세요.
        </Notice>
      ) : null}

      <div className="mt-8">
        <LoungeRoster
          table={table}
          members={members}
          profiles={profiles}
          minSize={club.minTableSize}
          canAddDemoCompanion={canAddDemoCompanion}
        />
      </div>

      {/* 진행 중인 제안 · 세션 */}
      {liveSession ? (
        <Card hairline className="mt-8">
          <CardBody className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Badge tone="success">합석 진행 중</Badge>
              <p className="mt-2 text-sm text-muted">
                이미 열려 있는 마스크 대화방이 있습니다.
              </p>
            </div>
            <ButtonLink href={`/room/${liveSession.sessionId}`}>
              대화방으로 입장
              <ArrowRight aria-hidden className="size-4" />
            </ButtonLink>
          </CardBody>
        </Card>
      ) : livePropose ? (
        <Card hairline className="mt-8">
          <CardBody className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Badge tone="gold">매치 제안 도착</Badge>
              <p className="mt-2 text-sm text-muted">
                웨이터가 상대 라운지를 찾았습니다. 수락 여부를 알려주세요.
              </p>
            </div>
            <ButtonLink href={`/match/${livePropose.id}`}>
              제안 확인하기
              <ArrowRight aria-hidden className="size-4" />
            </ButtonLink>
          </CardBody>
        </Card>
      ) : (
        <div className="mt-10 max-w-2xl">
          <h2 className="font-display text-2xl text-ivory">
            어떤 분과 만나고 싶으세요?
          </h2>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
            원하는 상대의 스타일을 알려주시면, {waiter?.name ?? "웨이터"}가
            공통점이 가장 많은 라운지를 찾아 부킹해 드립니다.
          </p>
          <div className="mt-8">
            <PreferenceForm
              tableId={id}
              disabled={profiles.length < club.minTableSize}
            />
          </div>
          {editing ? (
            <p className="mt-4 text-xs text-faint">
              이전 제안은 취소되었습니다. 새 조건으로 다시 찾습니다.
            </p>
          ) : null}
        </div>
      )}
    </Container>
  );
}

function Notice({
  tone,
  children,
}: {
  tone: "warn";
  children: React.ReactNode;
}) {
  return (
    <div
      role="status"
      className={
        tone === "warn"
          ? "mt-6 flex items-start gap-3 rounded-[var(--radius-control)] border border-warn/40 bg-warn-dim/40 p-4"
          : ""
      }
    >
      <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-warn" />
      <p className="text-sm leading-relaxed text-ivory">{children}</p>
    </div>
  );
}
