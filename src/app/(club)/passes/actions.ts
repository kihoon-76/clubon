"use server";

import { revalidatePath } from "next/cache";

import { getDb } from "@/lib/db";
import { isOwner } from "@/lib/owner";
import { issueGiftCode, redeemGiftCode } from "@/lib/pass-gifts";
import { requireOnboardedSession } from "@/lib/session";

export type PassActionState = { ok: boolean; message: string; code?: string };

export async function grantTestPass(): Promise<void> {
  const { user } = await requireOnboardedSession("/entry");
  await getDb().adjustMatches(user.id, 5);
  revalidatePath("/entry");
  revalidatePath("/lobby");
}

export async function redeemGiftAction(_state: PassActionState, formData: FormData): Promise<PassActionState> {
  const { user } = await requireOnboardedSession("/lobby");
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { ok: false, message: "선물 코드를 입력해 주세요." };
  const result = await redeemGiftCode(user.id, code);
  if (!result.ok) {
    const messages = { invalid: "유효하지 않은 코드입니다.", recipient: "이 코드는 지정된 회원만 사용할 수 있습니다.", used: "이미 사용된 코드입니다.", expired: "사용 기간이 지난 코드입니다." };
    return { ok: false, message: messages[result.reason] };
  }
  revalidatePath("/entry"); revalidatePath("/lobby");
  return { ok: true, message: "방 이용권 1회가 충전되었습니다." };
}

export async function issueGiftAction(_state: PassActionState, formData: FormData): Promise<PassActionState> {
  const { user } = await requireOnboardedSession("/owner");
  if (!isOwner(user)) return { ok: false, message: "사장 계정 전용 기능입니다." };
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const recipient = await getDb().getUserByEmail(email);
  if (!recipient) return { ok: false, message: "가입된 회원 이메일을 찾을 수 없습니다." };
  if (recipient.id === user.id) return { ok: false, message: "본인에게는 선물할 필요가 없습니다. 사장 계정은 무제한입니다." };
  const code = await issueGiftCode(user.id, recipient.id);
  revalidatePath("/owner");
  return { ok: true, message: `${email} 회원 전용 1회 이용권입니다. 이 화면에서만 원문 코드를 보여줍니다.`, code };
}
