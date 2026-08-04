import { redirect } from "next/navigation";

import { Container } from "@/components/layout/container";
import { FeedbackForm } from "@/components/room/feedback-form";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { getFeedback, getParticipant, getSession } from "@/lib/runtime/store";
import { requireOnboardedSession } from "@/lib/session";

export const metadata = { title: "세션 피드백" };

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

  return (
    <Container className="py-14 sm:py-16">
      <div className="mx-auto max-w-xl">
        <p className="label-caps">세션 마무리</p>
        <h1 className="mt-3 font-display text-4xl text-ivory">
          오늘 자리는 어떠셨나요?
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          남겨주신 평가는 다음 매칭 품질을 높이는 데만 쓰이며, 다른 참가자에게
          공개되지 않습니다.
        </p>

        {existing ? (
          <Card hairline className="mt-8">
            <CardBody className="space-y-4">
              <p className="text-sm text-ivory">
                이미 이 세션에 대한 피드백을 남기셨습니다. ({existing.rating}점
                {existing.vibe ? ` · ${existing.vibe}` : ""})
              </p>
              <div className="flex flex-wrap gap-3">
                <ButtonLink href="/lobby">로비로 돌아가기</ButtonLink>
                <ButtonLink href="/dashboard" variant="secondary">
                  내 기록 보기
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
