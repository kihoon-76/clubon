"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { REPORT_CATEGORIES } from "@/lib/moderation/report-categories";
import { requireOnboardedSession } from "@/lib/session";
import * as room from "@/lib/runtime/store";

/** 이 사용자가 해당 세션의 활성 참가자인지 확인합니다. */
async function requireParticipant(sessionId: string) {
  const { user } = await requireOnboardedSession(`/room/${sessionId}`);
  const participant = room.getParticipant(sessionId, user.id);
  const session = room.getSession(sessionId);
  if (!session || !participant || participant.status === "removed") {
    redirect("/lobby");
  }
  return { user, participant, session };
}

/* -------------------------------------------------------------------- 채팅 */

export interface ChatFormState {
  error?: string;
  /** flagged 판정 시 사용자에게 보여줄 주의 문구 */
  warning?: string;
  /** 폼 초기화를 유도하기 위한 제출 카운터 */
  submissions: number;
}

export async function sendMessage(
  prev: ChatFormState,
  formData: FormData,
): Promise<ChatFormState> {
  const sessionId = String(formData.get("sessionId") ?? "");
  const { user } = await requireParticipant(sessionId);

  const body = String(formData.get("body") ?? "");
  if (!body.trim()) return { ...prev, error: undefined, warning: undefined };

  const result = room.postMessage(sessionId, user.id, body);
  const submissions = prev.submissions + 1;

  const t = await getT();
  if (result.status === "blocked") {
    return {
      error: t(result.reasonKey ?? "moderation.blockedFallback"),
      submissions,
    };
  }
  if (result.status === "flagged") {
    return {
      warning: t(result.reasonKey ?? "moderation.flaggedFallback"),
      submissions,
    };
  }
  return { submissions };
}

/* -------------------------------------------------------------- 미디어 제어 */

export async function toggleMedia(
  sessionId: string,
  patch: { micOn?: boolean; camOn?: boolean },
): Promise<void> {
  const { user } = await requireParticipant(sessionId);
  room.setMedia(sessionId, user.id, patch);
}

/* ------------------------------------------------------------- 신고 · 차단 */

export interface ReportFormState {
  error?: string;
  done?: boolean;
}

const reportSchema = z.object({
  targetId: z.string().min(1),
  category: z.enum(REPORT_CATEGORIES),
  description: z.string().trim().max(1000),
  block: z.boolean(),
});

export async function reportParticipant(
  _prev: ReportFormState,
  formData: FormData,
): Promise<ReportFormState> {
  const sessionId = String(formData.get("sessionId") ?? "");
  const { user } = await requireParticipant(sessionId);

  const parsed = reportSchema.safeParse({
    targetId: formData.get("targetId"),
    category: formData.get("category"),
    description: formData.get("description") ?? "",
    block: formData.get("block") === "on",
  });
  const t = await getT();
  if (!parsed.success) return { error: t("moderation.reportInvalid") };
  if (parsed.data.targetId === user.id) {
    return { error: t("moderation.reportSelf") };
  }

  room.reportUser({
    sessionId,
    reporterId: user.id,
    reportedUserId: parsed.data.targetId,
    category: parsed.data.category,
    description: parsed.data.description,
  });

  if (parsed.data.block) {
    room.blockUser(user.id, parsed.data.targetId);
  }

  revalidatePath(`/room/${sessionId}`);
  return { done: true };
}

export async function blockParticipant(
  sessionId: string,
  targetId: string,
): Promise<void> {
  const { user } = await requireParticipant(sessionId);
  if (targetId === user.id) return;
  room.blockUser(user.id, targetId);
  revalidatePath(`/room/${sessionId}`);
}

/* -------------------------------------------------------------- 퇴장 · 종료 */

export async function leaveRoom(sessionId: string): Promise<void> {
  const { user } = await requireParticipant(sessionId);
  room.leaveSession(sessionId, user.id);

  // 내 라운지는 다시 대기 상태로 돌립니다.
  const db = getDb();
  const myTable = await db.getActiveTableForUser(user.id);
  if (myTable) await db.setTableState(myTable.id, "READY");

  redirect(`/room/${sessionId}/feedback`);
}

/** 호스트가 세션 전체를 종료합니다. */
export async function endRoom(sessionId: string): Promise<void> {
  const { user } = await requireParticipant(sessionId);
  const db = getDb();

  const myTable = await db.getActiveTableForUser(user.id);
  if (!myTable || myTable.hostUserId !== user.id) {
    redirect(`/room/${sessionId}`);
  }

  room.endSession(sessionId, "roomChat.endedByHost");

  // 이용 기록도 함께 닫습니다. 닫힌 방은 연장 결제로도 되살아나지 않습니다 —
  // 아무도 없는 자리에 시간만 붙는 일을 막습니다.
  await db.endLoungeUsage(sessionId, "ended");

  const session = room.getSession(sessionId);
  if (session) {
    for (const tableId of [session.tableAId, session.tableBId]) {
      await db.setTableState(tableId, "READY");
    }
  }
  redirect(`/room/${sessionId}/feedback`);
}

/* ------------------------------------------------------------------ 피드백 */

export interface FeedbackFormState {
  error?: string;
}

const feedbackSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  vibe: z.string().trim().max(40).optional(),
  wouldRematch: z.boolean(),
  comment: z.string().trim().max(500).optional(),
});

export async function submitFeedback(
  _prev: FeedbackFormState,
  formData: FormData,
): Promise<FeedbackFormState> {
  const sessionId = String(formData.get("sessionId") ?? "");
  const { user } = await requireOnboardedSession();

  // 참가 이력이 있는 세션에만 피드백을 남길 수 있습니다.
  if (!room.getParticipant(sessionId, user.id)) redirect("/lobby");

  const parsed = feedbackSchema.safeParse({
    rating: formData.get("rating"),
    vibe: formData.get("vibe") ?? undefined,
    wouldRematch: formData.get("wouldRematch") === "on",
    comment: formData.get("comment") ?? undefined,
  });
  if (!parsed.success) {
    return { error: (await getT())("moderation.feedbackInvalid") };
  }

  room.saveFeedback({
    sessionId,
    userId: user.id,
    rating: parsed.data.rating,
    vibe: parsed.data.vibe || null,
    wouldRematch: parsed.data.wouldRematch,
    comment: parsed.data.comment || null,
    createdAt: new Date().toISOString(),
  });

  redirect("/dashboard?feedback=1");
}
