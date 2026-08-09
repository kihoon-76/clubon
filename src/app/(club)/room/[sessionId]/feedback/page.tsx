import { redirect } from "next/navigation";

import { Container } from "@/components/layout/container";
import { FeedbackForm } from "@/components/room/feedback-form";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { getT } from "@/lib/i18n/server";
import { getFeedback, getParticipant, getSession } from "@/lib/runtime/store";
import { requireOnboardedSession } from "@/lib/session";

export async function generateMetadata() {
  return { title: (await getT())("feedback.metaTitle") };
}

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const { user } = await requireOnboardedSession(`/room/${sessionId}/feedback`);

  const session = getSession(sessionId);
  const participant = getParticipant(sessionId, user.id);
  if (!session || !participant) redirect("/lobby");

  const existing = getFeedback(sessionId, user.id);
  const t = await getT();

  return (
    <Container className="py-14 sm:py-16">
      <div className="mx-auto max-w-xl">
        <p className="label-caps">{t("feedback.eyebrow")}</p>
        <h1 className="mt-3 font-display text-4xl break-keep text-ivory">
          {t("feedback.title")}
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed break-keep text-muted">
          {t("feedback.intro")}
        </p>

        {existing ? (
          <Card hairline className="mt-8">
            <CardBody className="space-y-4">
              <p className="text-sm break-keep text-ivory">
                {t("feedback.already", {
                  rating: t("feedback.ratingPoint", { n: existing.rating }),
                  vibe: existing.vibe ? ` · ${existing.vibe}` : "",
                })}
              </p>
              <div className="flex flex-wrap gap-3">
                <ButtonLink href="/lobby">{t("feedback.backToLobby")}</ButtonLink>
                <ButtonLink href="/dashboard" variant="secondary">
                  {t("feedback.myRecords")}
                </ButtonLink>
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card hairline className="mt-8">
            <CardBody>
              <FeedbackForm sessionId={sessionId} />
            </CardBody>
          </Card>
        )}
      </div>
    </Container>
  );
}
