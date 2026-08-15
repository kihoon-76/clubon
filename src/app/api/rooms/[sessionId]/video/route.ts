import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { LOUNGE_MINUTES } from "@/lib/payments/catalog";
import { roomOwnerId } from "@/lib/runtime/store";
import { buildRoomView } from "@/lib/runtime/view";
import { getCurrentUser } from "@/lib/session";
import { isOwner } from "@/lib/owner";
import {
  createMeetingToken,
  ensureRoom,
  isDailyConfigured,
  roomNameFor,
} from "@/lib/video/daily";

/**
 * 화상 입장 정보 발급.
 *
 * 이 자리는 사람과 사람이 아니라 **공간과 공간**을 잇습니다. 한 라운지의
 * 회원들은 한 방에 함께 있으므로 기기도 한 대만 통화에 들어옵니다. 그래서
 * 토큰은 **그 라운지의 방장에게만** 내려가고, 나머지 회원에게는 자리에
 * 있다는 사실만 알려 줍니다(`role: "audience"`).
 *
 * 매치 차감은 역할과 무관하게 지금까지처럼 참가자마다 일어납니다 — 화상
 * 구조를 바꾸는 것과 값을 매기는 방식을 바꾸는 것은 별개입니다.
 *
 * 참가 자격은 요청 때마다 서버에서 다시 계산하므로, 클라이언트가 보낸 값은
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

  // --------------------------------------------------------- 매치 횟수 차감
  //
  // 입장료를 낸 사람은 방 매치 5회를 받고, 방에 들어갈 때 **각자 1회**를
  // 씁니다. 한 방에 네 명이 들어오면 네 사람에게서 한 번씩 빠집니다.
  //
  // 여기가 "영상 세션이 실제로 시작되는" 지점입니다. 매칭 대기나 라운지 구성
  // 단계에서는 이 라우트가 불리지 않으므로 횟수가 빠지지 않습니다.
  //
  // (sessionId, userId) 기준 멱등이라 새로고침·재접속으로는 두 번 빠지지
  // 않습니다. 방의 남은 시간은 먼저 들어온 사람이 연 시각을 함께 씁니다.
  const ownerUserId = roomOwnerId(sessionId) ?? user.id;
  const iAmRoomOwner = ownerUserId === user.id;

  const usage = await getDb().startLoungeUsage({
    sessionId,
    userId: user.id,
    ownerUserId,
    roomId: roomNameFor(sessionId),
    minutes: LOUNGE_MINUTES,
    complimentary: isOwner(user),
  });

  if (!usage.ok) {
    return NextResponse.json(
      { configured: true, blocked: "no_matches", iAmRoomOwner },
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

  // 카메라를 맡지 않은 회원은 통화에 들어오지 않습니다. 같은 방에서 마이크를
  // 여러 개 열면 하울링이 생기고, 어차피 화면과 소리는 방장의 기기가 함께
  // 내보냅니다. 앱에서는 채팅·타이머·신고가 그대로 동작합니다.
  if (!view.isLoungeCamera) {
    return NextResponse.json(
      { configured: true, role: "audience", expiresAt },
      { headers: { "cache-control": "no-store" } },
    );
  }

  try {
    const roomUrl = await ensureRoom(sessionId);
    const token = await createMeetingToken({
      sessionId,
      userId: user.id,
      loungeName: view.myLoungeName,
    });

    return NextResponse.json(
      { configured: true, role: "camera", roomUrl, token, expiresAt },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error("[video] Daily 입장 정보 발급 실패", error);
    return NextResponse.json({ error: "video_unavailable" }, { status: 502 });
  }
}
