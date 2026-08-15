import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { IssueGiftForm } from "@/components/passes/pass-code-forms";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { isOwner } from "@/lib/owner";
import { listGiftCodes } from "@/lib/pass-gifts";
import { requireOnboardedSession } from "@/lib/session";

export default async function OwnerPage() {
  const { user } = await requireOnboardedSession("/owner");
  if (!isOwner(user)) redirect("/lobby?staff=required");
  const gifts = await listGiftCodes(user.id);
  return <Container className="py-12 sm:py-16">
    <p className="label-caps">OWNER CONTROL</p><h1 className="mt-3 font-display text-4xl text-ivory">사장 대시보드</h1>
    <p className="mt-3 text-sm text-muted">사장 계정은 이용권 차감 없이 모든 매칭과 화상방을 테스트할 수 있습니다.</p>
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <Card hairline><CardBody><h2 className="font-display text-2xl text-ivory">가상 방 매치 QA</h2><p className="mt-2 text-sm text-muted">20·30·40·50대와 취향별 매칭부터 카메라 입장까지 확인합니다.</p><ButtonLink href="/owner/match-test" className="mt-5">테스트 방 고르기</ButtonLink></CardBody></Card>
      <Card hairline><CardBody><h2 className="font-display text-2xl text-ivory">회원에게 1회권 선물</h2><p className="mt-2 mb-5 text-sm text-muted">지정한 계정에서만 한 번 등록할 수 있고 30일 후 만료됩니다.</p><IssueGiftForm /></CardBody></Card>
    </div>
    <Card hairline className="mt-6"><CardBody><h2 className="font-display text-xl text-ivory">최근 발급 내역</h2><ul className="mt-4 divide-y divide-line">{gifts.length ? gifts.map((g) => <li key={g.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span className="text-ivory">{g.recipientEmail}</span><span className="text-muted">{g.status === "redeemed" ? "사용 완료" : "사용 대기"} · {new Date(g.createdAt).toLocaleDateString("ko-KR")}</span></li>) : <li className="py-3 text-sm text-muted">아직 발급한 코드가 없습니다.</li>}</ul></CardBody></Card>
  </Container>;
}
