import { Info } from "lucide-react";
import { redirect } from "next/navigation";

import { BookingResult } from "@/components/lounge/booking-result";
import { PreferenceForm } from "@/components/lounge/preference-form";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { WaiterAvatar } from "@/components/waiter/waiter-avatar";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getWaiter } from "@/lib/waiters";

export const metadata = { title: "내 라운지" };

export default async function LoungePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const session = await getSession();
  if (!session) redirect("/login");

  const db = getDb();

  // 자신이 속한 라운지만 접근 가능.
  const myTable = await db.getActiveTableForUser(session.user.id);
  if (!myTable || myTable.id !== id) redirect("/lobby");

  const table = myTable;
  const waiter = table.waiterId ? getWaiter(table.waiterId) : undefined;
  const members = await db.getProfilesForTable(id);
  const booking = await db.getBookingForTable(id);

  const editing = sp.edit === "1";
  const searched = sp.searched === "1";

  const matchedTable =
    booking && !editing ? await db.getTable(booking.matchedTableId) : null;
  const matchedProfiles =
    booking && matchedTable ? await db.getProfilesForTable(matchedTable.id) : [];

  const showResult = !!booking && !!matchedTable && !editing;

  return (
    <Container className="py-14 sm:py-16">
      {/* 담당 웨이터 */}
      {waiter ? (
        <div className="flex items-center gap-4 rounded-[var(--radius-card)] border border-champagne-dim/30 bg-ink p-5">
          <WaiterAvatar waiter={waiter} className="w-16 shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-xl text-ivory">
                {waiter.name}
              </span>
              <Badge tone="gold">{waiter.epithet}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted">
              {waiter.name} 웨이터가 오늘 저녁{" "}
              {session.profile?.nickname ?? "회원"}님의 자리를 안내합니다.
            </p>
          </div>
        </div>
      ) : null}

      {/* 라운지 요약 */}
      <div className="mt-8">
        <p className="label-caps">내 라운지</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-ivory sm:text-5xl">
          {table.name}
        </h1>
        <p className="mt-3 text-sm text-muted">
          초대코드{" "}
          <span className="font-mono tracking-widest text-ivory">
            {table.inviteCode}
          </span>{" "}
          · {members.length}명 참여
        </p>
      </div>

      <div className="mt-10">
        {showResult && booking && matchedTable ? (
          <BookingResult
            booking={booking}
            matchedTable={matchedTable}
            matchedProfiles={matchedProfiles}
            waiter={waiter}
            tableId={id}
          />
        ) : (
          <div className="max-w-2xl">
            {searched && !booking ? (
              <Card className="mb-6 border-warn/40 bg-warn-dim/40">
                <CardBody className="flex items-start gap-3">
                  <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-warn" />
                  <p className="text-sm leading-relaxed text-ivory">
                    조건에 맞는 상대 라운지를 아직 찾지 못했어요. 조건을 조금
                    넓혀 다시 시도해 보세요.
                  </p>
                </CardBody>
              </Card>
            ) : null}

            <h2 className="font-display text-2xl text-ivory">
              어떤 분과 만나고 싶으세요?
            </h2>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
              원하는 상대의 스타일을 알려주시면, {waiter?.name ?? "웨이터"}가
              공통점이 가장 많은 라운지를 찾아 부킹해 드립니다.
            </p>
            <div className="mt-8">
              <PreferenceForm tableId={id} />
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}
