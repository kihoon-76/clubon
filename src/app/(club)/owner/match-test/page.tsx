import Image from "next/image";
import { redirect } from "next/navigation";
import { startVirtualMatch } from "./actions";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { getDb } from "@/lib/db";
import { isOwner } from "@/lib/owner";
import { requireOnboardedSession } from "@/lib/session";

const TEST_IDS = [
  "b2000000-0000-4000-8000-000000000020",
  "b2000000-0000-4000-8000-000000000030",
  "b2000000-0000-4000-8000-000000000040",
  "b2000000-0000-4000-8000-000000000050",
];

export default async function OwnerMatchTestPage() {
  const { user } = await requireOnboardedSession("/owner/match-test");
  if (!isOwner(user)) redirect("/lobby?staff=required");
  const db = getDb();
  const rooms = (await Promise.all(TEST_IDS.map(async (id) => {
    const table = await db.getTable(id);
    if (!table?.isTest) return null;
    return { table, profiles: await db.getProfilesForTable(id), prefs: await db.getTablePreferences(id) };
  }))).filter((room) => room !== null);

  return <Container className="py-12 sm:py-16">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="label-caps">OWNER QA LAB</p><h1 className="mt-3 font-display text-4xl text-ivory">가상 방 매치 테스트</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">아래 인물과 방은 실제 회원이 아닌 테스트 전용입니다. 원하는 나이대·분위기를 고르면 실제 매칭 승인 화면과 Daily 화상방 입장 흐름을 그대로 점검합니다.</p></div>
      <ButtonLink href="/owner" variant="secondary">사장 대시보드</ButtonLink>
    </div>
    <div className="mt-10 grid gap-6 md:grid-cols-2">
      {rooms.map(({ table, profiles, prefs }) => <Card key={table.id} hairline className="overflow-hidden">
        {table.testImageUrl ? <div className="relative aspect-[16/9]"><Image src={table.testImageUrl} alt={`${table.name} 가상 테스트 인물`} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" /></div> : null}
        <CardBody className="space-y-4"><div className="flex items-start justify-between gap-3"><div><Badge tone="gold">가상 테스트 라운지</Badge><h2 className="mt-3 font-display text-2xl text-ivory">{table.name}</h2></div><span className="text-xs text-faint">실제 회원 아님</span></div>
        <p className="text-sm text-muted">{profiles.map((p) => `${p.nickname} · ${p.ageBand}`).join(", ")}</p>
        <div className="flex flex-wrap gap-2">{prefs?.interests.map((i) => <span key={i} className="rounded-full border border-line px-3 py-1 text-xs text-muted">{i}</span>)}</div>
        <form action={startVirtualMatch}><input type="hidden" name="tableId" value={table.id}/><Button type="submit" className="w-full gold-glow">이 조건으로 실제 매치 테스트</Button></form>
        </CardBody></Card>)}
    </div>
  </Container>;
}
