"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import type { MatchCandidate } from "@/lib/db/adapter";
import { isOwner } from "@/lib/owner";
import { requireOnboardedSession } from "@/lib/session";

const TEST_IDS = new Set([
  "b2000000-0000-4000-8000-000000000020",
  "b2000000-0000-4000-8000-000000000030",
  "b2000000-0000-4000-8000-000000000040",
  "b2000000-0000-4000-8000-000000000050",
]);

export async function startVirtualMatch(formData: FormData): Promise<void> {
  const { user, profile } = await requireOnboardedSession("/owner/match-test");
  if (!isOwner(user)) redirect("/lobby?staff=required");
  const targetId = String(formData.get("tableId") ?? "");
  if (!TEST_IDS.has(targetId)) redirect("/owner/match-test?error=invalid");
  const db = getDb();
  const target = await db.getTable(targetId);
  if (!target?.isTest) redirect("/owner/match-test?error=invalid");
  const targetProfiles = await db.getProfilesForTable(targetId);
  const targetPref = await db.getTablePreferences(targetId);
  if (!targetProfiles.length || !targetPref) redirect("/owner/match-test?error=unavailable");

  let myTable = await db.getActiveTableForUser(user.id);
  if (!myTable) {
    myTable = await db.createLounge({
      userId: user.id,
      waiterId: target.waiterId,
      name: `${profile?.nickname ?? "OWNER"} 테스트 자리`,
      regionCode: "KR-11",
    });
  }
  await db.setMatchPreference(myTable.id, {
    desiredGender: "female",
    energy: targetPref.energy,
    interests: targetPref.interests,
    ageBands: targetPref.ageBands,
  });
  await db.setTableState(target.id, "WAITING");
  const candidate: MatchCandidate = { table: target, profiles: targetProfiles, score: 98, reasons: [] };
  let booking = await db.createBooking(myTable.id, candidate, target.waiterId);
  booking = (await db.respondToBooking(booking.id, "matched", "accepted")) ?? booking;
  redirect(`/match/${booking.id}`);
}
