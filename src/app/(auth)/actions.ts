"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { clearSessionCookie, setSessionCookie } from "@/lib/auth/cookie";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getDb } from "@/lib/db";
import type { User } from "@/lib/db/types";

export interface AuthFormState {
  error?: string;
}

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email("이메일 형식이 올바르지 않습니다."),
  password: z
    .string()
    .min(8, "비밀번호는 8자 이상이어야 합니다.")
    .max(200, "비밀번호가 너무 깁니다."),
});

/** 안전한 내부 경로만 허용합니다(오픈 리디렉트 방지). */
function safeNext(next: unknown): string | null {
  if (typeof next !== "string") return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

/** 로그인 후 다음 단계 — 온보딩 미완료 시 해당 단계로 보냅니다. */
function nextStepFor(user: User, profileExists: boolean): string {
  if (!user.adultConfirmedAt) return "/onboarding/adult";
  if (!user.consentCompletedAt) return "/onboarding/consent";
  if (!profileExists) return "/onboarding/profile";
  return "/lobby";
}

export async function login(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "이메일과 비밀번호를 확인해 주세요." };
  }

  const db = getDb();
  const creds = await db.getCredentialsByEmail(parsed.data.email);
  const ok = await verifyPassword(parsed.data.password, creds?.passwordHash ?? null);
  // 계정 존재 여부를 노출하지 않도록 동일한 메시지를 사용합니다.
  if (!creds || !ok) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }
  if (creds.user.status === "banned") {
    return { error: "이용이 제한된 계정입니다. 안전센터로 문의해 주세요." };
  }

  await setSessionCookie(creds.user.id);

  const profile = await db.getProfile(creds.user.id);
  redirect(safeNext(formData.get("next")) ?? nextStepFor(creds.user, !!profile));
}

export async function signup(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력을 확인해 주세요." };
  }
  if (formData.get("password") !== formData.get("passwordConfirm")) {
    return { error: "비밀번호가 서로 일치하지 않습니다." };
  }

  const db = getDb();
  if (await db.getCredentialsByEmail(parsed.data.email)) {
    return { error: "이미 가입된 이메일입니다. 로그인해 주세요." };
  }

  const user = await db.createUser({
    email: parsed.data.email,
    passwordHash: await hashPassword(parsed.data.password),
  });

  await setSessionCookie(user.id);
  redirect("/onboarding/adult");
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
  redirect("/");
}
