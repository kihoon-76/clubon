import "server-only";
import { cookies } from "next/headers";

import { getDb } from "@/lib/db";
import type { Profile, User } from "@/lib/db/types";

/**
 * 현재 로그인 사용자. 인증 기능 구현 전까지는 개발용 데모 사용자를 사용합니다.
 *
 * 개발 편의: `clubon_dev_user` 쿠키에 사용자 ID를 넣으면 해당 데모 사용자로
 * 전환됩니다(멀티 유저 플로우 테스트용). 기본값은 데모 사용자 "하나"입니다.
 * 실제 Supabase 인증은 인증 단계에서 이 함수를 대체합니다.
 */
const DEFAULT_DEV_USER_ID = "aaaaaaaa-0000-0000-0000-000000000003"; // 하나

export interface Session {
  user: User;
  profile: Profile | null;
}

export async function getCurrentUser(): Promise<User | null> {
  const db = getDb();
  const cookieStore = await cookies();
  const devUserId = cookieStore.get("clubon_dev_user")?.value;
  const userId = devUserId || DEFAULT_DEV_USER_ID;

  const user = await db.getUser(userId);
  if (user) return user;
  // 쿠키가 유효하지 않으면 기본 데모 사용자로 폴백합니다.
  return db.getUser(DEFAULT_DEV_USER_ID);
}

export async function getSession(): Promise<Session | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const profile = await getDb().getProfile(user.id);
  return { user, profile };
}
