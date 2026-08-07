import { NextResponse } from "next/server";

import { buildRoomView } from "@/lib/runtime/view";
import { getCurrentUser } from "@/lib/session";
import { createMeetingToken, ensureRoom, isDailyConfigured } from "@/lib/video/daily";

/**
 * 화상 입장 정보 발급.
 *
 * 방 URL과 미팅 토큰은 이 세션의 활성 참가자에게만 내려갑니다. 참가 자격과
 * 공개 여부는 요청 때마다 서버에서 다시 계산하므로, 클라이언트가 보낸 값은
 * 신뢰하지 않습니다.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;
  const view = await buildRoomView(sessionId, user.id);
  if (!view) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (view.state === "ended" || view.me.status === "removed") {
    return NextResponse.json({ error: "not_joinable" }, { status: 409 });
  }

  // 키가 없으면 화상 없이 동작합니다(로컬 목업 개발). 오류가 아닙니다.
  if (!isDailyConfigured()) {
    return NextResponse.json(
      { configured: false },
      { headers: { "cache-control": "no-store" } },
    );
  }

  try {
    const roomUrl = await ensureRoom(sessionId);
    const token = await createMeetingToken({
      sessionId,
      userId: user.id,
      userName: view.me.nickname,
      isOwner: view.isHost,
      startVideoOff: !view.me.revealed,
    });

    return NextResponse.json(
      { configured: true, roomUrl, token },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error("[video] Daily 입장 정보 발급 실패", error);
    return NextResponse.json({ error: "video_unavailable" }, { status: 502 });
  }
}
