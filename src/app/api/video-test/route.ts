import { NextResponse } from "next/server";

import {
  createMeetingToken,
  ensureRoom,
  isDailyConfigured,
} from "@/lib/video/daily";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = new URL(request.url).searchParams.get("secret");
  if (!process.env.VIDEO_TEST_SECRET || secret !== process.env.VIDEO_TEST_SECRET) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!isDailyConfigured()) {
    return NextResponse.json({ configured: false }, { headers: { "cache-control": "no-store" } });
  }

  const sessionId = crypto.randomUUID();
  try {
    const roomUrl = await ensureRoom(sessionId);
    const token = await createMeetingToken({
      sessionId,
      userId: crypto.randomUUID(),
      loungeName: "내 테스트 라운지",
    });
    return NextResponse.json(
      {
        configured: true,
        role: "camera",
        roomUrl,
        token,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error("[video-test] Daily room creation failed", error);
    return NextResponse.json({ error: "video_unavailable" }, { status: 502 });
  }
}
