"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getDb } from "@/lib/db";
import type { ConversationEnergy, DesiredGender } from "@/lib/db/types";
import { getT } from "@/lib/i18n/server";
import { getRegion } from "@/lib/regions";
import { hasBlockBetween } from "@/lib/runtime/store";
import { requireOnboardedSession } from "@/lib/session";
import { getWaiter } from "@/lib/waiters";
import {
  AGE_BAND_OPTIONS,
  ENERGY_OPTIONS,
  GENDER_OPTIONS,
  INTEREST_OPTIONS,
} from "@/lib/match-options";

/**
 * 입장 신청.
 *
 * 신청 내용(지역·매니저·원하는 상대)은 **내 라운지에 저장**됩니다. 별도의
 * 신청 테이블을 두지 않은 이유는, 결제하러 Creem에 다녀오는 동안 내용을
 * 어딘가에 붙들어 둬야 하는데 내 라운지가 이미 그 역할을 하기 때문입니다.
 * 돌아오면 라운지가 그대로 있으므로 처음부터 다시 고르지 않아도 됩니다.
 *
 * 매치 횟수는 여기서 빠지지 않습니다. 실제 차감은 **영상방에 들어갈 때**
 * 일어납니다(`/api/rooms/[id]/video`) — 매칭이 성사되지 않았는데 횟수만
 * 사라지는 일을 만들지 않기 위해서입니다.
 */

const entrySchema = z.object({
  waiterId: z.string().min(1),
  desiredGender: z.enum(
    GENDER_OPTIONS.map((o) => o.value) as [string, ...string[]],
  ),
  energy: z.enum(ENERGY_OPTIONS.map((o) => o.value) as [string, ...string[]]),
  interests: z.array(z.enum(INTEREST_OPTIONS)).max(12),
  ageBands: z.array(z.enum(AGE_BAND_OPTIONS)).max(4),
});

export async function submitEntry(formData: FormData): Promise<void> {
  const { user, profile } = await requireOnboardedSession("/entry");
  const db = getDb();

  // 지역 코드는 폼에서 오므로 카탈로그에 있는 값인지 서버가 다시 확인합니다.
  const regionCode = String(formData.get("regionCode") ?? "").trim();
  const region = getRegion(regionCode);
  if (!region) redirect("/entry?error=region");

  const parsed = entrySchema.safeParse({
    waiterId: formData.get("waiterId"),
    desiredGender: formData.get("desiredGender"),
    energy: formData.get("energy"),
    interests: formData.getAll("interests"),
    ageBands: formData.getAll("ageBands"),
  });
  if (!parsed.success) redirect("/entry?error=invalid");

  const waiter = getWaiter(parsed.data.waiterId);
  if (!waiter) redirect("/entry?error=invalid");

  // 자리 이름은 **저장되고 상대 라운지에도 보입니다**. 만든 사람의 언어로
  // 굳으므로 고유명사처럼 읽히는 짧은 형태로 둡니다.
  const t = await getT();
  const table = await db.createLounge({
    userId: user.id,
    waiterId: waiter.id,
    name: t("entry.seatName", {
      nickname: profile?.nickname ?? t("dashboard.member"),
    }),
    regionCode: region.code,
  });

  await db.setMatchPreference(table.id, {
    desiredGender: parsed.data.desiredGender as DesiredGender,
    energy: parsed.data.energy as ConversationEnergy,
    interests: [...parsed.data.interests],
    ageBands: [...parsed.data.ageBands],
  });

  redirect("/entry");
}

/**
 * 신청 내용을 지우고 처음부터 다시 고릅니다.
 *
 * 라운지 자체를 닫습니다 — 신청 내용이 라운지에 얹혀 있으므로, 라운지를
 * 남겨 둔 채 "다시 고르기"만 하면 옛 조건이 매칭 후보로 계속 떠다닙니다.
 */
export async function resetEntry(): Promise<void> {
  const { user } = await requireOnboardedSession("/entry");
  const db = getDb();

  const table = await db.getActiveTableForUser(user.id);
  if (table) await db.leaveTable(user.id, table.id);

  redirect("/entry");
}

/**
 * 매칭 시작 — 신청한 조건으로 상대 라운지를 찾습니다.
 *
 * 여기서도 횟수는 빠지지 않습니다. 상대를 찾지 못하면 대기 상태로 남고,
 * 찾으면 양쪽 수락을 거쳐 방이 열립니다.
 */
export async function startMatching(): Promise<void> {
  const { user } = await requireOnboardedSession("/entry");
  const db = getDb();

  const myTable = await db.getActiveTableForUser(user.id);
  if (!myTable) redirect("/entry");

  const match = await db.findBestMatch(myTable.id);
  if (!match) redirect("/entry?searched=1");

  // 하드 필터: 차단 관계가 있는 상대는 제외합니다.
  const members = await db.getActiveTableMembers(myTable.id);
  const myIds = members.map((m) => m.userId);
  const blocked = match.profiles.some((p) =>
    myIds.some((mine) => hasBlockBetween(mine, p.userId)),
  );
  if (blocked) redirect("/entry?searched=1");

  const booking = await db.createBooking(myTable.id, match, myTable.waiterId);
  redirect(`/match/${booking.id}`);
}
