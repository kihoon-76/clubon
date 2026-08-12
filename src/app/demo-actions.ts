"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { clearSessionCookie } from "@/lib/auth/cookie";
import { DEMO_ACCOUNTS } from "@/lib/db/memory";
import { DEMO_USER_COOKIE } from "@/lib/session";

/**
 * 로그인 없이 둘러볼 때 사용할 데모 회원을 바꿉니다.
 *
 * ⚠️ 데모 전용 — 인메모리 어댑터(DATABASE_URL 미설정)에서만 동작합니다.
 * 실제 배포에서는 아무 일도 하지 않습니다.
 */
export async function switchDemoUser(formData: FormData): Promise<void> {
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) redirect("/lobby");

  const userId = String(formData.get("userId") ?? "");
  if (!DEMO_ACCOUNTS.some((a) => a.id === userId)) redirect("/lobby");

  // 데모 회원으로 보는 동안에는 로그인 세션을 비웁니다.
  await clearSessionCookie();

  const store = await cookies();
  store.set(DEMO_USER_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  const account = DEMO_ACCOUNTS.find((a) => a.id === userId);
  redirect(account?.role === "user" ? "/lobby" : "/admin");
}
