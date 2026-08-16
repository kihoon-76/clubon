import Image from "next/image";
import { MapPin, Plus, Users } from "lucide-react";

import { requestPublicMatch } from "./actions";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { getDb } from "@/lib/db";
import type { Table } from "@/lib/db/types";
import { isOwner } from "@/lib/owner";
import { requireOnboardedSession } from "@/lib/session";

const ERRORS: Record<string, string> = {
  unavailable: "이 라운지는 지금 합석을 받을 수 없습니다. 다른 방을 골라 주세요.",
  pass_required: "라운지 합석에는 이용권이 필요합니다. 이용권을 먼저 준비해 주세요.",
};

export default async function EntryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { user } = await requireOnboardedSession("/entry");
  const gender = sp.gender === "female" || sp.gender === "male" ? sp.gender : undefined;
  const db = getDb();
  const owner = isOwner(user);
  const [myTable, rooms, wallet] = await Promise.all([
    db.getActiveTableForUser(user.id),
    db.listDiscoverableLounges({ viewerUserId: user.id, gender, includeTests: owner }),
    db.getWallet(user.id),
  ]);
  const roomCards = await Promise.all(
    rooms.map(async (table) => ({
      table,
      members: await db.getActiveTableMembers(table.id),
    })),
  );
  const error = typeof sp.error === "string" ? ERRORS[sp.error] : null;

  return (
    <Container className="py-12 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="label-caps">LOUNGE DIRECTORY</p>
          <h1 className="mt-3 font-display text-4xl text-ivory">오늘 열려 있는 라운지</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            도현은 이용 방법만 안내합니다. 마음에 드는 방은 직접 보고 직접 합석을 요청하세요.
          </p>
        </div>
        <ButtonLink href="/entry/new"><Plus className="size-4" />내 라운지 만들기</ButtonLink>
      </div>

      {sp.created === "1" ? <Notice>내 라운지가 공개되었습니다. 이제 다른 방에 합석을 요청할 수 있어요.</Notice> : null}
      {sp.purchase === "processing" ? <Notice>Creem 결제 확인 후 이용권 5회가 자동 지급됩니다. 현재 잔여 이용권은 <strong className="text-ivory">{wallet.remainingMatches}회</strong>입니다. 잠시 후 새로고침해 주세요.</Notice> : null}
      {error ? <Notice danger>{error}{sp.error === "pass_required" ? <span className="ml-2"><ButtonLink href="/membership" size="sm">이용권 결제하기</ButtonLink></span> : null}</Notice> : null}
      {myTable ? (
        <div className="mt-6 rounded-[var(--radius-control)] border border-champagne-dim/50 bg-ink px-5 py-4 text-sm text-muted">
          내 라운지 <strong className="text-ivory">{myTable.name}</strong> · 정보는 언제든 다시 수정할 수 있습니다.
        </div>
      ) : null}

      <nav className="mt-8 flex flex-wrap gap-2" aria-label="라운지 성별 필터">
        <Filter href="/entry" active={!gender}>전체</Filter>
        <Filter href="/entry?gender=female" active={gender === "female"}>여성 라운지</Filter>
        <Filter href="/entry?gender=male" active={gender === "male"}>남성 라운지</Filter>
      </nav>

      {roomCards.length ? (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {roomCards.map(({ table, members }) => (
            <LoungeCard key={table.id} table={table} memberCount={members.length} owner={owner} hasMyTable={Boolean(myTable)} />
          ))}
        </div>
      ) : (
        <Card hairline className="mt-8"><CardBody className="py-12 text-center text-muted">아직 이 구역에 공개된 라운지가 없습니다.</CardBody></Card>
      )}
    </Container>
  );
}

function LoungeCard({ table, memberCount, owner, hasMyTable }: { table: Table; memberCount: number; owner: boolean; hasMyTable: boolean }) {
  return (
    <Card hairline className="overflow-hidden">
      {table.testImageUrl ? (
        <div className="relative aspect-[16/9]"><Image src={table.testImageUrl} alt={`${table.name} 가상 테스트 이미지`} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" /></div>
      ) : null}
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={table.loungeGender === "female" ? "gold" : "neutral"}>{table.loungeGender === "female" ? "여성 라운지" : "남성 라운지"}</Badge>
          {table.isTest ? <Badge tone="gold">가상 테스트방 · 실제 회원 아님</Badge> : null}
        </div>
        <div><h2 className="font-display text-2xl text-ivory">{table.name}</h2><p className="mt-2 min-h-10 text-sm leading-relaxed text-muted">{table.description || "편하게 합석할 분을 기다리고 있어요."}</p></div>
        <div className="flex flex-wrap gap-4 text-sm text-muted">
          <span className="flex items-center gap-1.5"><MapPin className="size-4 text-champagne" />{table.regionText || "지역 미정"}</span>
          <span className="flex items-center gap-1.5"><Users className="size-4 text-champagne" />현재 {memberCount}명 · 정원 {table.maxSize}명</span>
        </div>
        <form action={requestPublicMatch}>
          <input type="hidden" name="tableId" value={table.id} />
          <Button type="submit" className="w-full" disabled={!owner && !hasMyTable}>
            {table.isTest ? "이 가상방과 화상 매치 테스트" : hasMyTable ? "이 라운지에 합석 요청" : "내 라운지를 먼저 만들어 주세요"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}

function Filter({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return <ButtonLink href={href} variant={active ? "primary" : "secondary"} size="sm">{children}</ButtonLink>;
}

function Notice({ children, danger = false }: { children: React.ReactNode; danger?: boolean }) {
  return <p role="status" className={`mt-6 rounded-[var(--radius-control)] border px-4 py-3 text-sm ${danger ? "border-danger/40 bg-danger-dim/40 text-ivory" : "border-champagne-dim/50 bg-ink text-muted"}`}>{children}</p>;
}
