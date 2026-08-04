"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getDb } from "@/lib/db";
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

  if (result.status === "blocked") {
    return { error: result.reason ?? "메시지를 보낼 수 없습니다.", submissions };
  }
  if (result.status === "flagged") {
    return { warning: result.reason ?? "검토 대상 메시지입니다.", submissions };
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

/* ------------------------------------------------------------- 얼굴 공개 */

export async function requestReveal(
  sessionId: string,
  targetId: string,
): Promise<void> {
  const { user } = await requireParticipant(sessionId);
  if (targetId === user.id) return;
  room.requestReveal(sessionId, user.id, targetId);
}

export async function respondReveal(
  sessionId: string,
  otherId: string,
  accept: boolean,
): Promise<void> {
  const { user } = await requireParticipant(sessionId);
  room.respondReveal(sessionId, user.id, otherId, accept);
}

export async function remask(
  sessionId: string,
  otherId: string,
): Promise<void> {
  const { user } = await requireParticipant(sessionId);
  room.remask(sessionId, user.id, otherId);
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
  if (!parsed.success) return { error: "신고 내용을 확인해 주세요." };
  if (parsed.data.targetId === user.id) {
    return { error: "자기 자신은 신고할 수 없습니다." };
  }

  room.reportUser({
    sessionId,
    reporterId: user.id,
    reportedUserId: parsed.data.targetId,
    category: parsed.data.category,
    description: parsed.data.description,
  });

  if (parsed.data.block) {
    room.blockUser(user.id, parsed.data.targetId, sessionId);
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
  room.blockUser(user.id, targetId, sessionId);
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

  room.endSession(sessionId, "호스트가 종료했습니다.");

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
  if (!parsed.success) return { error: "평가를 선택해 주세요." };

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
