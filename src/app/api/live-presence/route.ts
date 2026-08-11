import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

const ACTIVE_STATES = new Set([
  "FORMING",
  "READY",
  "WAITING",
  "MATCH_PROPOSED",
  "MATCH_ACCEPTED",
  "LIVE",
]);

export async function GET() {
  const db = getDb();
  const tables = (await db.listTables(500)).filter(
    (table) => !table.closedAt && ACTIVE_STATES.has(table.state),
  );
  const memberLists = await Promise.all(
    tables.map((table) => db.getActiveTableMembers(table.id)),
  );
  const onlineUsers = new Set(
    memberLists.flatMap((members) => members.map((member) => member.userId)),
  ).size;

  return NextResponse.json(
    {
      onlineUsers,
      waitingLounges: tables.filter((table) =>
        ["READY", "WAITING", "MATCH_PROPOSED"].includes(table.state),
      ).length,
      liveRooms: tables.filter((table) => table.state === "LIVE").length,
      updatedAt: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
