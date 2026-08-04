import { NextResponse } from "next/server";

import { buildRoomView } from "@/lib/runtime/view";
import { getCurrentUser } from "@/lib/session";

/**
 * 룸 상태 폴링 엔드포인트.
 * Phase 2에서 Supabase Realtime 구독으로 교체할 지점입니다.
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

  return NextResponse.json(view, {
    headers: { "cache-control": "no-store" },
  });
}
