"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { clearSessionCookie, setSessionCookie } from "@/lib/auth/cookie";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { nextStepFor, safeNext } from "@/lib/auth/redirect";
import { getDb } from "@/lib/db";
import type { Gender } from "@/lib/db/types";

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

  // 성별은 매칭이 갈리는 기준이라 가입할 때 함께 받습니다. 프로필 단계까지
  // 미루면 그전에는 어떤 매칭도 성립하지 않습니다.
  const gender = formData.get("gender");
  if (gender !== "female" && gender !== "male") {
    return { error: "성별을 선택해 주세요." };
  }

  const db = getDb();
  if (await db.getCredentialsByEmail(parsed.data.email)) {
    return { error: "이미 가입된 이메일입니다. 로그인해 주세요." };
  }

  const user = await db.createUser({
    email: parsed.data.email,
    passwordHash: await hashPassword(parsed.data.password),
    gender: gender as Gender,
  });

  await setSessionCookie(user.id);
  redirect("/onboarding/adult");
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
  const cookieStore = await cookies();
  cookieStore.delete("clubon_dev_user");
  redirect("/login");
}
