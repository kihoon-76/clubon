import { redirect } from "next/navigation";

import { Container } from "@/components/layout/container";
import { JoinForm } from "@/components/lounge/join-form";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { getDb } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { requireOnboardedSession } from "@/lib/session";

export async function generateMetadata() {
  return { title: (await getT())("join.eyebrow") };
}

export default async function JoinLoungePage() {
  const { user } = await requireOnboardedSession("/lounges/join");

  // 이미 라운지에 있으면 그쪽으로 보냅니다.
  const active = await getDb().getActiveTableForUser(user.id);
  if (active) redirect(`/lounges/${active.id}`);
  const t = await getT();

  return (
    <Container className="py-14 sm:py-20">
      <div className="mx-auto max-w-md">
        <p className="label-caps">{t("join.eyebrow")}</p>
        <h1 className="mt-3 font-display text-4xl break-keep text-ivory">
          {t("join.title")}
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed break-keep text-muted">
          {t("join.intro")}
        </p>

        <Card hairline className="mt-8">
          <CardBody>
            <JoinForm />
          </CardBody>
        </Card>

        <div className="mt-6 text-center">
          <ButtonLink href="/lobby" variant="ghost" size="sm">
            {t("join.backToLobby")}
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}
