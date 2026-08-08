import "server-only";

import type { GoogleIdentity } from "@/lib/auth/google";
import { getDb } from "@/lib/db";
import type { User } from "@/lib/db/types";

/**
 * Google 신원을 이 앱의 회원 계정으로 옮기는 규칙.
 *
 * 찾는 순서가 곧 신뢰 순서입니다.
 *   1. `sub` — Google 계정의 불변 식별자. 한 번 연결된 뒤로는 항상 이 경로입니다.
 *      이메일이 바뀌어도 같은 계정으로 들어오고, 예전 주소가 다른 사람에게
 *      재배정되어도 그 사람은 sub가 달라 이 계정에 닿지 못합니다.
 *   2. 확인된 이메일 — 아직 연결된 적 없는 첫 로그인. 기존 계정에 sub를 붙입니다.
 *   3. 둘 다 없으면 신규 가입(비밀번호 없음).
 */
export async function resolveGoogleUser(
  identity: GoogleIdentity,
): Promise<User> {
  const db = getDb();

  const linked = await db.getUserByGoogleSub(identity.sub);
  if (linked) {
    const synced = await syncEmail(linked, identity.email);
    return synced;
  }

  const byEmail = await db.getUserByEmail(identity.email);
  if (byEmail) {
    await db.linkGoogleAccount(byEmail.id, identity.sub);
    return byEmail;
  }

  return db.createUser({
    email: identity.email,
    passwordHash: null,
    googleSub: identity.sub,
  });
}

/**
 * Google 쪽에서 주소가 바뀌었으면 따라갑니다.
 *
 * 단, 그 주소를 이미 다른 회원이 쓰고 있으면 손대지 않습니다 — 이메일은 로그인
 * 식별자라 중복될 수 없고, 남의 계정 주소를 빼앗아 올 수도 없기 때문입니다.
 * 이 경우에도 로그인 자체는 sub로 성사되므로 회원이 막히지는 않습니다.
 */
async function syncEmail(user: User, email: string): Promise<User> {
  if (user.email === email) return user;

  const db = getDb();
  const holder = await db.getUserByEmail(email);
  if (holder && holder.id !== user.id) {
    console.warn(
      `[auth] Google 이메일이 바뀌었지만 다른 계정이 사용 중이라 동기화하지 않았습니다 (user ${user.id})`,
    );
    return user;
  }

  await db.updateUserEmail(user.id, email);
  return (await db.getUser(user.id)) ?? { ...user, email };
}
