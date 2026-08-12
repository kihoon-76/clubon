import { NextResponse } from "next/server";

import { readSessionUserId } from "@/lib/auth/cookie";
import { countOnlineUsers, touchPresence } from "@/lib/presence";

export const dynamic = "force-dynamic";

export async function GET() {
  const onlineUsers = await countOnlineUsers();

  return NextResponse.json(
    {
      onlineUsers,
      updatedAt: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST() {
  const userId = await readSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const updated = await touchPresence(userId);
  if (!updated) {
    return NextResponse.json({ error: "presence_unavailable" }, { status: 503 });
  }

  return new NextResponse(null, { status: 204 });
}
