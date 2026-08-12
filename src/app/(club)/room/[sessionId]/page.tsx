import { redirect } from "next/navigation";

import { Container } from "@/components/layout/container";
import { RoomClient } from "@/components/room/room-client";
import { getT } from "@/lib/i18n/server";
import { buildRoomView } from "@/lib/runtime/view";
import { requireOnboardedSession } from "@/lib/session";

export async function generateMetadata() {
  return { title: (await getT())("feedback.roomMetaTitle") };
}

export default async function RoomPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const { user } = await requireOnboardedSession(`/room/${sessionId}`);

  const view = await buildRoomView(sessionId, user.id);
  // 참가자가 아니거나 없는 세션이면 로비로.
  if (!view) redirect("/lobby");
  if (view.state === "ended") redirect(`/room/${sessionId}/feedback`);

  // 연장 결제를 마치고(또는 시작하지 못하고) 돌아온 경우의 안내.
  // 이 값들은 안내 문구를 고르는 데만 쓰입니다 — 시간이 실제로 늘어났는지는
  // 서버가 저장한 만료 시각으로만 판단합니다.
  return (
    <Container className="py-8 sm:py-10">
      <RoomClient initial={view} />
    </Container>
  );
}
