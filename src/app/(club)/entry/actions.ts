"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getDb } from "@/lib/db";
import type { MatchCandidate } from "@/lib/db/adapter";
import { isOwner } from "@/lib/owner";
import { requireOnboardedSession } from "@/lib/session";

const loungeSchema = z.object({
  name: z.string().trim().min(2).max(40),
  loungeGender: z.enum(["female", "male"]),
  regionText: z.string().trim().min(2).max(40),
  description: z.string().trim().min(5).max(300),
  maxSize: z.coerce.number().int().min(2).max(6),
});

export async function savePublicLounge(formData: FormData): Promise<void> {
  const { user } = await requireOnboardedSession("/entry/new");
  const parsed = loungeSchema.safeParse({
    name: formData.get("name"),
    loungeGender: formData.get("loungeGender"),
    regionText: formData.get("regionText"),
    description: formData.get("description"),
    maxSize: formData.get("maxSize"),
  });
  if (!parsed.success) redirect("/entry/new?error=invalid");

  await getDb().createLounge({
    userId: user.id,
    waiterId: "dohyun",
    name: parsed.data.name,
    regionCode: "global",
    loungeGender: parsed.data.loungeGender,
    regionText: parsed.data.regionText,
    description: parsed.data.description,
    maxSize: parsed.data.maxSize,
  });
  redirect("/entry?created=1");
}

export async function requestPublicMatch(formData: FormData): Promise<void> {
  const { user, profile } = await requireOnboardedSession("/entry");
  const db = getDb();
  const targetId = String(formData.get("tableId") ?? "");
  const target = await db.getTable(targetId);
  if (!target || target.closedAt || target.hostUserId === user.id) {
    redirect("/entry?error=unavailable");
  }
  if (target.isTest && !isOwner(user)) redirect("/entry?error=unavailable");
  if (!isOwner(user) && (await db.getWallet(user.id)).remainingMatches < 1) {
    redirect("/entry?error=pass_required");
  }

  let myTable = await db.getActiveTableForUser(user.id);
  if (!myTable) {
    if (!isOwner(user)) redirect("/entry/new?required=1");
    myTable = await db.createLounge({
      userId: user.id,
      waiterId: "dohyun",
      name: `${profile?.nickname ?? "OWNER"}의 테스트 라운지`,
      regionCode: "global",
      loungeGender: profile?.gender === "female" ? "female" : "male",
      regionText: profile?.region ?? "서울",
      description: "사장 계정 화상 연결 점검용 라운지입니다.",
      maxSize: 4,
    });
  }

  const profiles = await db.getProfilesForTable(target.id);
  if (!profiles.length) redirect("/entry?error=unavailable");
  if (target.isTest) await db.setTableState(target.id, "WAITING");

  const candidate: MatchCandidate = {
    table: target,
    profiles,
    score: 100,
    reasons: [],
  };
  let booking = await db.createBooking(myTable.id, candidate, "dohyun");
  if (target.isTest) {
    booking = (await db.respondToBooking(booking.id, "matched", "accepted")) ?? booking;
  }
  redirect(`/match/${booking.id}`);
}
