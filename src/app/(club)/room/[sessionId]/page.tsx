import { redirect } from "next/navigation";

import { Container } from "@/components/layout/container";
import { RoomClient } from "@/components/room/room-client";
import { buildRoomView } from "@/lib/runtime/view";
import { requireOnboardedSession } from "@/lib/session";

export const metadata = { title: "마스크 대화방" };

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

  return (
    <Container className="py-8 sm:py-10">
      <RoomClient initial={view} />
    </Container>
  );
}
