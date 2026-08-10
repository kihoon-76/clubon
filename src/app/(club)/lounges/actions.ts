"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { isSeededDemoLounge } from "@/lib/db/memory";
import type { Booking, ConversationEnergy, DesiredGender } from "@/lib/db/types";
import { requireOnboardedSession } from "@/lib/session";
import {
  createSession,
  hasBlockBetween,
  isSimulatedUser,
  markSimulatedUser,
} from "@/lib/runtime/store";
import { getWaiter } from "@/lib/waiters";
import {
  AGE_BAND_OPTIONS,
  ENERGY_OPTIONS,
  GENDER_OPTIONS,
  INTEREST_OPTIONS,
} from "@/lib/match-options";

export interface LoungeFormState {
  error?: string;
}

/** 데모 동반자로 초대할 수 있는 계정 — 시드 데이터에 있을 때만 사용됩니다. */
const DEMO_COMPANION_IDS = [
  "aaaaaaaa-0000-0000-0000-000000000003", // 하나
  "aaaaaaaa-0000-0000-0000-000000000005", // 서연
  "aaaaaaaa-0000-0000-0000-000000000006", // 지호
];

/* ------------------------------------------------------------ 라운지 개설 */

/**
 * 매니저 소개 화면에서 고른 매니저를 들고 입장 신청으로 넘어갑니다.
 *
 * 여기서 라운지를 바로 열지 않는 이유는, 자리를 열려면 **지역**이 함께
 * 있어야 하기 때문입니다. 매칭이 지역으로 갈리므로 지역 없는 라운지는
 * 아무와도 이어지지 않습니다. 고른 매니저만 넘기고 나머지는 입장 신청
 * 화면에서 받습니다.
 */
export async function startWithWaiter(formData: FormData): Promise<void> {
  await requireOnboardedSession("/entry");

  const waiter = getWaiter(String(formData.get("waiterId") ?? ""));
  if (!waiter) redirect("/waiters");

  redirect(`/entry?waiter=${encodeURIComponent(waiter.id)}`);
}

/* ------------------------------------------------------------ 초대 · 합류 */

export async function joinByCode(
  _prev: LoungeFormState,
  formData: FormData,
): Promise<LoungeFormState> {
  const { user } = await requireOnboardedSession();

  const code = String(formData.get("code") ?? "").trim();
  if (!/^[A-Za-z0-9]{4,10}$/.test(code)) {
    return { error: "초대코드 형식이 올바르지 않습니다." };
  }

  const result = await getDb().joinTableByCode(user.id, code);
  if (result.ok) redirect(`/lounges/${result.table.id}`);

  const messages: Record<typeof result.reason, string> = {
    not_found: "그런 초대코드를 가진 라운지가 없습니다.",
    full: "이미 정원이 찬 라운지입니다.",
    closed: "이미 종료된 라운지입니다.",
    already_member: "이미 참여 중인 라운지입니다.",
    in_other: "다른 라운지에 참여 중입니다. 먼저 나간 뒤 시도해 주세요.",
  };
  return { error: messages[result.reason] };
}

/** 즉석 생성되는 데모 동반자의 프로필 재료. */
const DEMO_COMPANION_NAMES = ["연우", "수아", "가온", "리안", "해든", "다온"];

/**
 * 혼자서도 전체 플로우를 확인할 수 있도록 데모 회원을 내 라운지에 합류시킵니다.
 *
 * ⚠️ 데모 전용 — 인메모리 어댑터(DATABASE_URL 미설정)에서만 동작합니다.
 * 시드 데모 계정이 모두 다른 라운지에 있으면 새 데모 계정을 만들어 채웁니다.
 */
export async function addDemoCompanion(tableId: string): Promise<void> {
  if (process.env.DATABASE_URL) redirect(`/lounges/${tableId}`);

  const { user } = await requireOnboardedSession();
  const db = getDb();

  const myTable = await db.getActiveTableForUser(user.id);
  if (!myTable || myTable.id !== tableId) redirect("/lobby");

  const members = await db.getActiveTableMembers(tableId);
  if (members.length >= myTable.maxSize) redirect(`/lounges/${tableId}`);
  const taken = new Set(members.map((m) => m.userId));

  for (const candidateId of DEMO_COMPANION_IDS) {
    if (taken.has(candidateId)) continue;
    const candidate = await db.getUser(candidateId);
    if (!candidate) continue;
    if (await db.getActiveTableForUser(candidateId)) continue;
    await db.addMemberToTable(tableId, candidateId);
    markSimulatedUser(candidateId);
    revalidatePath(`/lounges/${tableId}`);
    return;
  }

  // 시드 계정이 모두 사용 중이면 새 데모 회원을 만듭니다.
  const seq = Date.now().toString(36).slice(-5);
  const name = DEMO_COMPANION_NAMES[members.length % DEMO_COMPANION_NAMES.length];
  const created = await db.createUser({
    email: `demo-${seq}@clubon.test`,
    // 로그인 불가 — 데모 참가자 표시 전용 계정입니다.
    passwordHash: "",
  });
  await db.confirmAdult(created.id, 1994);
  await db.markConsentCompleted(created.id);
  await db.markOnboardingCompleted(created.id);
  await db.upsertProfile(created.id, {
    nickname: name,
    gender: members.length % 2 === 0 ? "female" : "male",
    ageBand: "20대 후반",
    region: "서울",
    languages: ["한국어"],
    interests: ["여행", "음악", "영화"],
    groupVibe: "balanced",
    conversationStyle: null,
  });
  await db.addMemberToTable(tableId, created.id);
  markSimulatedUser(created.id);

  revalidatePath(`/lounges/${tableId}`);
}

export async function leaveLounge(tableId: string): Promise<void> {
  const { user } = await requireOnboardedSession();
  await getDb().leaveTable(user.id, tableId);
  redirect("/lobby");
}

/* ---------------------------------------------------------------- 매칭 */

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
  const { user } = await requireOnboardedSession();
  const db = getDb();

  const myTable = await db.getActiveTableForUser(user.id);
  if (!myTable || myTable.id !== tableId) redirect("/lobby");

  // 불변식: 합석 룸은 총 2명 이상 — 라운지당 최소 1명이 필요합니다.
  const club = await db.getPrimaryClub();
  const members = await db.getActiveTableMembers(tableId);
  if (members.length < club.minTableSize) {
    redirect(`/lounges/${tableId}?error=too_small`);
  }

  const parsed = prefSchema.safeParse({
    desiredGender: formData.get("desiredGender"),
    energy: formData.get("energy"),
    interests: formData.getAll("interests"),
    ageBands: formData.getAll("ageBands"),
  });
  if (!parsed.success) {
    redirect(`/lounges/${tableId}?error=invalid`);
  }

  await db.setMatchPreference(tableId, {
    desiredGender: parsed.data.desiredGender as DesiredGender,
    energy: parsed.data.energy as ConversationEnergy,
    interests: [...parsed.data.interests],
    ageBands: [...parsed.data.ageBands],
  });

  const match = await db.findBestMatch(tableId);
  if (!match) redirect(`/lounges/${tableId}?searched=1`);

  // 하드 필터: 차단 관계가 있는 상대는 제외합니다.
  const myIds = members.map((m) => m.userId);
  const blocked = match.profiles.some((p) =>
    myIds.some((mine) => hasBlockBetween(mine, p.userId)),
  );
  if (blocked) redirect(`/lounges/${tableId}?searched=1`);

  const booking = await db.createBooking(tableId, match, myTable.waiterId);
  redirect(`/match/${booking.id}`);
}

/** 조건을 다시 잡기 위해 대기 상태로 되돌립니다. */
export async function rematch(tableId: string): Promise<void> {
  const { user } = await requireOnboardedSession();
  const db = getDb();
  const myTable = await db.getActiveTableForUser(user.id);
  if (!myTable || myTable.id !== tableId) redirect("/lobby");

  await db.setTableState(tableId, "READY");
  redirect(`/lounges/${tableId}?edit=1`);
}

/* ------------------------------------------------------- 매치 제안 응답 */

/**
 * 내 라운지 쪽의 수락/거절을 기록합니다. 양측이 모두 수락하면 룸을 개설합니다.
 *
 * 상대가 시드 데모 라운지라면, 실제 응답자가 없으므로 라운지 매니저가 대신
 * 수락 처리합니다(데모 전용 · UI에 명시).
 */
export async function respondToProposal(
  bookingId: string,
  response: "accepted" | "declined",
): Promise<void> {
  const { user } = await requireOnboardedSession();
  const db = getDb();

  const myTable = await db.getActiveTableForUser(user.id);
  if (!myTable) redirect("/lobby");

  const booking = await db.getBooking(bookingId);
  if (!booking) redirect("/lobby");

  const side =
    booking.requesterTableId === myTable.id
      ? ("requester" as const)
      : booking.matchedTableId === myTable.id
        ? ("matched" as const)
        : null;
  if (!side) redirect("/lobby");

  let updated = await db.respondToBooking(bookingId, side, response);

  if (response === "declined") {
    redirect(`/lounges/${myTable.id}?declined=1`);
  }

  // 상대가 데모 라운지면 자동으로 수락합니다.
  const counterpartId =
    side === "requester" ? booking.matchedTableId : booking.requesterTableId;
  if (updated?.state === "PENDING" && isSeededDemoLounge(counterpartId)) {
    updated = await db.respondToBooking(
      bookingId,
      side === "requester" ? "matched" : "requester",
      "accepted",
    );
  }

  if (updated?.state === "ACCEPTED") {
    const sessionId = await openRoom(updated, user.id);
    redirect(`/room/${sessionId}`);
  }

  redirect(`/match/${bookingId}`);
}

/** 양측 수락이 확정된 부킹으로 화상 세션을 개설합니다. */
async function openRoom(booking: Booking, actingUserId: string): Promise<string> {
  const db = getDb();

  if (booking.sessionId) return booking.sessionId;

  const members: {
    userId: string;
    tableId: string;
    nickname: string;
    simulated: boolean;
  }[] = [];

  for (const tableId of [booking.requesterTableId, booking.matchedTableId]) {
    const profiles = await db.getProfilesForTable(tableId);
    for (const p of profiles) {
      members.push({
        userId: p.userId,
        tableId,
        nickname: p.nickname,
        // 시드 데모 라운지의 참가자와 데모 동반자는 시뮬레이션으로 동작합니다.
        simulated:
          p.userId !== actingUserId &&
          (isSeededDemoLounge(tableId) || isSimulatedUser(p.userId)),
      });
    }
  }

  // 각 라운지의 카메라·마이크를 맡을 두 방장을 세션에 고정해 둡니다.
  const [tableA, tableB] = await Promise.all([
    db.getTable(booking.requesterTableId),
    db.getTable(booking.matchedTableId),
  ]);

  const session = createSession({
    bookingId: booking.id,
    tableAId: booking.requesterTableId,
    tableBId: booking.matchedTableId,
    hostAUserId: tableA?.hostUserId ?? null,
    hostBUserId: tableB?.hostUserId ?? null,
    waiterId: booking.waiterId,
    members,
  });

  await db.attachSessionToBooking(booking.id, session.id);
  return session.id;
}
