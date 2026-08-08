"use server";

import { revalidatePath } from "next/cache";

import { getDb } from "@/lib/db";
import { requireStaffSession } from "@/lib/session";

/**
 * 관리자 수동 지급·회수.
 *
 * 결제를 거치지 않는 조정이므로 결제 내역(payments)에는 남기지 않고 지갑만
 * 움직입니다. 회수는 잔액 아래로 내려가지 않습니다.
 */
export async function adjustPasses(formData: FormData): Promise<void> {
  const { user } = await requireStaffSession();

  const userId = String(formData.get("userId") ?? "");
  const delta = Number(formData.get("delta") ?? 0);
  if (!userId || !Number.isInteger(delta) || delta === 0) return;

  // 한 번의 실수로 대량 지급이 일어나지 않도록 조정 폭을 제한합니다.
  const clamped = Math.max(-100, Math.min(100, delta));

  const wallet = await getDb().adjustPasses(userId, clamped);
  console.info(
    `[admin] ${user.id}가 ${userId}의 이용권을 ${clamped > 0 ? "+" : ""}${clamped}회 조정 (잔여 ${wallet.remainingPasses})`,
  );

  revalidatePath("/admin/payments");
}
