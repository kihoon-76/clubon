import type { User } from "@/lib/db/types";

/**
 * 로그인 성공 후 어디로 보낼지 정하는 규칙.
 *
 * 이메일/비밀번호 로그인(서버 액션)과 Google 로그인(라우트 핸들러)이 같은
 * 규칙을 써야 하므로 별도 모듈로 둡니다. `"use server"` 파일은 async 함수만
 * export할 수 있어 액션 파일 안에 둘 수 없습니다.
 */

/** 안전한 내부 경로만 허용합니다(오픈 리디렉트 방지). */
export function safeNext(next: unknown): string | null {
  if (typeof next !== "string") return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

/** 로그인 후 다음 단계 — 온보딩 미완료 시 해당 단계로 보냅니다. */
export function nextStepFor(user: User, profileExists: boolean): string {
  if (!user.adultConfirmedAt) return "/onboarding/adult";
  if (!user.consentCompletedAt) return "/onboarding/consent";
  if (!profileExists) return "/onboarding/profile";
  return "/lobby";
}
