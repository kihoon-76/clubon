"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getDb } from "@/lib/db";
import type { ConversationEnergy, DesiredGender } from "@/lib/db/types";
import { getCurrentUser } from "@/lib/session";
import { getWaiter } from "@/lib/waiters";
import {
  AGE_BAND_OPTIONS,
  ENERGY_OPTIONS,
  GENDER_OPTIONS,
  INTEREST_OPTIONS,
} from "@/lib/match-options";

/** 웨이터를 골라 내 라운지를 열고 입장합니다. */
export async function startWithWaiter(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const waiterId = String(formData.get("waiterId") ?? "");
  const waiter = getWaiter(waiterId);
  if (!waiter) redirect("/waiters");

  const db = getDb();
  const profile = await db.getProfile(user.id);
  const name = `${profile?.nickname ?? "회원"}님의 라운지`;

  const table = await db.createLounge({
    userId: user.id,
    waiterId: waiter.id,
    name,
  });

  redirect(`/lounges/${table.id}`);
}

const prefSchema = z.object({
  desiredGender: z.enum(
    GENDER_OPTIONS.map((o) => o.value) as [string, ...string[]],
  ),
  energy: z.enum(ENERGY_OPTIONS.map((o) => o.value) as [string, ...string[]]),
  interests: z.array(z.enum(INTEREST_OPTIONS)).max(12),
  ageBands: z.array(z.enum(AGE_BAND_OPTIONS)).max(4),
});

/** 원하는 상대 스타일을 저장하고, 공통점이 가장 많은 상대 라운지를 부킹합니다. */
export async function requestBooking(
  tableId: string,
  formData: FormData,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();

  // 현재 유저가 이 라운지의 멤버인지 확인.
  const myTable = await db.getActiveTableForUser(user.id);
  if (!myTable || myTable.id !== tableId) redirect("/lobby");

  const parsed = prefSchema.safeParse({
    desiredGender: formData.get("desiredGender"),
    energy: formData.get("energy"),
    interests: formData.getAll("interests"),
    ageBands: formData.getAll("ageBands"),
  });
  if (!parsed.success) {
    redirect(`/lounges/${tableId}?error=1`);
  }

  await db.setMatchPreference(tableId, {
    desiredGender: parsed.data.desiredGender as DesiredGender,
    energy: parsed.data.energy as ConversationEnergy,
    interests: [...parsed.data.interests],
    ageBands: [...parsed.data.ageBands],
  });

  const match = await db.findBestMatch(tableId);
  if (match) {
    const table = await db.getTable(tableId);
    await db.createBooking(tableId, match, table?.waiterId ?? null);
  }

  redirect(`/lounges/${tableId}?searched=1`);
}
