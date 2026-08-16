import { ArrowRight, DoorOpen, Info } from "lucide-react";
import { redirect } from "next/navigation";

import { leaveLounge } from "@/app/(club)/lounges/actions";
import { LoungeRoster } from "@/components/lounge/lounge-roster";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { WaiterAvatar } from "@/components/waiter/waiter-avatar";
import { getDb } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { requireOnboardedSession } from "@/lib/session";
import { getWaiter, waiterEpithet, waiterName } from "@/lib/waiters";

export async function generateMetadata() {
  return { title: (await getT())("lounge.metaTitle") };
}

const NOTICE_CODES = new Set(["too_small", "invalid"]);

export default async function LoungePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const { user } = await requireOnboardedSession(`/lounges/${id}`);
  const db = getDb();

  // 자신이 속한 라운지만 접근 가능.
  const myTable = await db.getActiveTableForUser(user.id);
  if (!myTable || myTable.id !== id) redirect("/lobby");

  const table = myTable;
  const waiter = table.waiterId ? getWaiter(table.waiterId) : undefined;
  const members = await db.getActiveTableMembers(id);
  const profiles = await db.getProfilesForTable(id);
  const booking = await db.getBookingForTable(id);

  // 진행 중인 제안이 있으면 제안 화면으로 유도합니다.
  const livePropose = booking?.state === "PENDING" ? booking : null;
  const liveSession =
    booking?.state === "ACCEPTED" && booking.sessionId ? booking : null;

  // 데모 동반자 버튼은 인메모리 데모 모드에서만 노출합니다.

  const editing = sp.edit === "1";
  const searched = sp.searched === "1";
  const declined = sp.declined === "1";
  const t = await getT();
  const notice =
    typeof sp.error === "string" && NOTICE_CODES.has(sp.error)
      ? t(`lounge.errors.${sp.error}`)
      : undefined;

  return (
    <Container className="py-14 sm:py-16">
      {/* 담당 라운지 매니저 */}
      {waiter ? (
        <div className="flex items-center gap-4 rounded-[var(--radius-card)] border border-champagne-dim/30 bg-ink p-5">
          <WaiterAvatar waiter={waiter} t={t} className="w-16 shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-xl text-ivory">
                {waiterName(t, waiter)}
              </span>
              <Badge tone="gold">{waiterEpithet(t, waiter)}</Badge>
            </div>
            <p className="mt-1 text-sm break-keep text-muted">도현은 매칭을 대신하지 않고 라운지 이용 방법만 안내합니다.</p>
          </div>
        </div>
      ) : null}

      {/* 라운지 요약 */}
      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps">{t("lounge.myLounge")}</p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-ivory sm:text-5xl">
            {table.name}
          </h1>
        </div>
        <form action={leaveLounge.bind(null, id)}>
          <Button type="submit" variant="ghost" size="sm">
            <DoorOpen aria-hidden className="size-4" />
            {t("lounge.leave")}
          </Button>
        </form>
      </div>

      {notice ? <Notice tone="warn">{notice}</Notice> : null}
      {declined ? <Notice tone="warn">{t("lounge.declined")}</Notice> : null}
      {searched ? <Notice tone="warn">{t("lounge.noMatchYet")}</Notice> : null}

      <div className="mt-8">
        <LoungeRoster table={table} members={members} profiles={profiles} />
      </div>

      {/* 진행 중인 제안 · 세션 */}
      {liveSession ? (
        <Card hairline className="mt-8">
          <CardBody className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Badge tone="success">{t("lounge.liveSession")}</Badge>
              <p className="mt-2 text-sm break-keep text-muted">
                {t("lounge.liveSessionBody")}
              </p>
            </div>
            <ButtonLink href={`/room/${liveSession.sessionId}`}>
              {t("lounge.enterRoom")}
              <ArrowRight aria-hidden className="size-4" />
            </ButtonLink>
          </CardBody>
        </Card>
      ) : livePropose ? (
        <Card hairline className="mt-8">
          <CardBody className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Badge tone="gold">{t("lounge.proposalArrived")}</Badge>
              <p className="mt-2 text-sm break-keep text-muted">
                {t("lounge.proposalBody")}
              </p>
            </div>
            <ButtonLink href={`/match/${livePropose.id}`}>
              {t("lounge.viewProposal")}
              <ArrowRight aria-hidden className="size-4" />
            </ButtonLink>
          </CardBody>
        </Card>
      ) : (
        <div className="mt-10 max-w-2xl">
          <h2 className="font-display text-2xl break-keep text-ivory">마음에 드는 라운지를 직접 골라 보세요</h2>
          <p className="mt-2 text-[0.9375rem] leading-relaxed break-keep text-muted">여성 라운지와 남성 라운지를 둘러보고 방 소개, 지역, 정원을 확인한 뒤 합석을 요청할 수 있습니다.</p>
          <div className="mt-6 flex flex-wrap gap-3"><ButtonLink href="/entry">라운지 둘러보기</ButtonLink><ButtonLink href="/entry/new" variant="secondary">내 방 정보 수정</ButtonLink></div>
          {editing ? (
            <p className="mt-4 text-xs break-keep text-faint">
              {t("lounge.editingNote")}
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
