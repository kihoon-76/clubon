"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb } from "@/lib/db";
import type { AccountStatus } from "@/lib/db/types";
import { resolveReport } from "@/lib/runtime/store";
import { requireStaffSession } from "@/lib/session";

const statusSchema = z.enum(["active", "suspended", "banned"]);
const reportStatusSchema = z.enum(["open", "reviewing", "resolved", "dismissed"]);

/** 계정 상태 변경 — admin만 가능합니다(모더레이터는 정지까지). */
export async function setUserStatus(
  userId: string,
  status: string,
): Promise<void> {
  const { user } = await requireStaffSession();

  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return;
  // 영구 차단(banned)은 관리자만 지정할 수 있습니다.
  if (parsed.data === "banned" && user.role !== "admin") return;
  // 자기 자신의 상태는 바꿀 수 없습니다.
  if (userId === user.id) return;

  await getDb().setUserStatus(userId, parsed.data as AccountStatus);
  revalidatePath("/admin/users");
}

export async function updateReportStatus(
  reportId: string,
  status: string,
): Promise<void> {
  const { user } = await requireStaffSession();

  const parsed = reportStatusSchema.safeParse(status);
  if (!parsed.success) return;

  resolveReport(reportId, parsed.data, user.id);
  revalidatePath("/admin/reports");
  revalidatePath("/admin");
}
