import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { readSessionUserId } from "@/lib/auth/cookie";
import { getDb } from "@/lib/db";
import { DEFAULT_GUEST_USER_ID } from "@/lib/db/memory";
import type { Profile, User } from "@/lib/db/types";

/**
 * 현재 사용자.
 *
 * **로그인은 선택 사항입니다.** 미리보기 단계에서는 로그인 없이도 모든 기능을
 * 쓸 수 있도록, 세션 쿠키가 없으면 데모 회원으로 자동 입장시킵니다.
 *
 * 우선순위:
 *   1. 로그인 세션 쿠키(`clubon_session`) — 실제 로그인한 회원
 *   2. 데모 회원 전환 쿠키(`clubon_dev_user`) — 헤더의 회원 전환기
 *   3. 기본 데모 회원(JOHN)
 *
 * DATABASE_URL이 설정된 실제 배포에서는 시드 데모 계정이 없으므로 2·3은
 * 동작하지 않고, 로그인한 회원만 통과합니다.
 */

export const DEMO_USER_COOKIE = "clubon_dev_user";

export interface Session {
  user: User;
  profile: Profile | null;
}

export async function getCurrentUser(): Promise<User | null> {
  const db = getDb();

  const sessionUserId = await readSessionUserId();
  if (sessionUserId) {
    const user = await db.getUser(sessionUserId);
    if (user) return user;
  }

  const cookieStore = await cookies();
  const demoUserId = cookieStore.get(DEMO_USER_COOKIE)?.value;
  if (demoUserId) {
    const user = await db.getUser(demoUserId);
    if (user) return user;
  }

  return db.getUser(DEFAULT_GUEST_USER_ID);
}

/** 로그인 세션 쿠키로 들어온 '진짜' 로그인 회원인지. */
export async function isAuthenticated(): Promise<boolean> {
  return (await readSessionUserId()) !== null;
}

export async function getSession(): Promise<Session | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const profile = await getDb().getProfile(user.id);
  return { user, profile };
}

/**
 * 사용자 컨텍스트가 필요한 화면용. 데모 회원이 있으면 로그인 없이 통과하며,
 * 아무도 없을 때(실 DB 배포)만 로그인 화면으로 보냅니다.
 */
export async function requireSession(returnTo?: string): Promise<Session> {
  const session = await getSession();
  if (!session) {
    redirect(returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : "/login");
  }
  return session;
}

/**
 * 클럽 입장 게이트.
 *
 * 정지·차단 계정만 막고, 온보딩(성인확인·동의·프로필)이 남아 있으면 해당
 * 단계로 안내합니다. 데모 회원은 이미 온보딩이 끝나 있어 그대로 통과합니다.
 */
export async function requireOnboardedSession(
  returnTo?: string,
): Promise<Session> {
  const session = await requireSession(returnTo);
  const { user, profile } = session;

  if (user.status === "suspended" || user.status === "banned") {
    redirect("/safety?account=restricted");
  }
  if (!user.adultConfirmedAt) redirect("/onboarding/adult");
  if (!user.consentCompletedAt) redirect("/onboarding/consent");
  if (!profile) redirect("/onboarding/profile");

  return session;
}

/**
 * 관리자·모더레이터 전용 게이트.
 * 로그인 없이 둘러볼 때는 헤더의 회원 전환기로 관리자 계정을 고르면 됩니다.
 */
export async function requireStaffSession(): Promise<Session> {
  const session = await requireSession("/admin");
  if (session.user.role !== "admin" && session.user.role !== "moderator") {
    redirect("/lobby?staff=required");
  }
  return session;
}
