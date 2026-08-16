import { ArrowRight, Check } from "lucide-react";

import { Container } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { WaiterAvatar } from "@/components/waiter/waiter-avatar";
import { getT } from "@/lib/i18n/server";
import { WAITERS, waiterName } from "@/lib/waiters";

export default async function WaitersPage() {
  const t = await getT();
  const dohyun = WAITERS[0];
  return (
    <Container className="py-16 sm:py-20">
      <p className="label-caps">LOUNGE GUIDE</p>
      <h1 className="mt-4 font-display text-4xl text-ivory sm:text-5xl">라운지 안내 매니저, 도현</h1>
      <Card hairline className="mt-10 max-w-3xl"><CardBody className="grid gap-8 sm:grid-cols-[150px_1fr] sm:items-center">
        <WaiterAvatar waiter={dohyun} t={t} className="w-36" />
        <div>
          <h2 className="font-display text-2xl text-ivory">{waiterName(t, dohyun)}</h2>
          <p className="mt-3 leading-relaxed text-muted">도현은 상대를 골라 연결하지 않습니다. 방을 여는 법과 합석 요청 흐름만 쉽고 짧게 안내합니다.</p>
          <ul className="mt-5 space-y-3 text-sm text-muted">
            {["성별·지역·정원·소개를 적어 내 라운지를 엽니다.", "여성 또는 남성 라운지 목록에서 방을 직접 고릅니다.", "합석 요청이 서로 승인되면 30분 화상방이 열립니다."].map((item) => <li key={item} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-champagne" />{item}</li>)}
          </ul>
          <ButtonLink href="/entry" className="mt-6">라운지 둘러보기 <ArrowRight className="size-4" /></ButtonLink>
        </div>
      </CardBody></Card>
    </Container>
  );
}
