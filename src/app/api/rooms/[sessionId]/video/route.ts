import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { LOUNGE_MINUTES } from "@/lib/payments/catalog";
import { roomOwnerId } from "@/lib/runtime/store";
import { buildRoomView } from "@/lib/runtime/view";
import { getCurrentUser } from "@/lib/session";
import {
  createMeetingToken,
  ensureRoom,
  isDailyConfigured,
  roomNameFor,
} from "@/lib/video/daily";

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

  // ------------------------------------------------------------ 이용권 차감
  //
  // 영상방은 세션당 **하나**이고 그 안의 사람들이 다 함께 이야기합니다.
  // 그래서 이용권도 참가자 수와 무관하게 **방 하나당 1회**만 빠지며, 부담자는
  // 매칭을 요청해 이 방을 연 라운지의 방장입니다. 나머지 참가자는 무료입니다.
  //
  // 여기가 "영상 세션이 실제로 시작되는" 지점입니다. 매칭 대기나 라운지 구성
  // 단계에서는 이 라우트가 불리지 않으므로 이용권이 빠지지 않습니다.
  //
  // sessionId 기준 멱등이라 새로고침·재접속은 물론 **다른 참가자가 들어와도**
  // 차감은 최초 1회뿐입니다.
  const payerUserId = roomOwnerId(sessionId) ?? user.id;
  const iAmPayer = payerUserId === user.id;

  const usage = await getDb().startLoungeUsage({
    sessionId,
    payerUserId,
    roomId: roomNameFor(sessionId),
    minutes: LOUNGE_MINUTES,
  });

  if (!usage.ok) {
    return NextResponse.json(
      { configured: true, blocked: "no_passes", iAmPayer },
      { status: 402, headers: { "cache-control": "no-store" } },
    );
  }

  // 30분이 지난 세션에는 새 토큰을 발급하지 않습니다. 클라이언트 타이머를
  // 우회해 다시 붙는 경로를 서버에서 막습니다.
  const expiresAt = usage.usage.expiresAt;
  if (Date.parse(expiresAt) <= Date.now()) {
    await getDb().endLoungeUsage(sessionId, "expired");
    return NextResponse.json(
      { configured: true, blocked: "expired", expiresAt },
      { status: 402, headers: { "cache-control": "no-store" } },
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
      { configured: true, roomUrl, token, expiresAt },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error("[video] Daily 입장 정보 발급 실패", error);
    return NextResponse.json({ error: "video_unavailable" }, { status: 502 });
  }
}
