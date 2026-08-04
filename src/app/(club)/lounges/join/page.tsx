import { redirect } from "next/navigation";

import { Container } from "@/components/layout/container";
import { JoinForm } from "@/components/lounge/join-form";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { getDb } from "@/lib/db";
import { requireOnboardedSession } from "@/lib/session";

export const metadata = { title: "초대코드로 참여" };

export default async function JoinLoungePage() {
  const { user } = await requireOnboardedSession("/lounges/join");

  // 이미 라운지에 있으면 그쪽으로 보냅니다.
  const active = await getDb().getActiveTableForUser(user.id);
  if (active) redirect(`/lounges/${active.id}`);

  return (
    <Container className="py-14 sm:py-20">
      <div className="mx-auto max-w-md">
        <p className="label-caps">초대코드로 참여</p>
        <h1 className="mt-3 font-display text-4xl text-ivory">
          친구의 라운지로
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          한 라운지는 최대 4명까지 함께할 수 있습니다. 합석은 두 라운지를 합쳐
          최소 4명이 모여야 열립니다.
        </p>

        <Card hairline className="mt-8">
          <CardBody>
            <JoinForm />
          </CardBody>
        </Card>

        <div className="mt-6 text-center">
          <ButtonLink href="/lobby" variant="ghost" size="sm">
            로비로 돌아가기
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}
