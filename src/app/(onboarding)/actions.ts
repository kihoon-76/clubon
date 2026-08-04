"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { CONSENT_ITEMS, CONSENT_VERSION, REQUIRED_CONSENT_TYPES } from "@/lib/consent/items";
import { getDb } from "@/lib/db";
import type { ConversationEnergy, Gender } from "@/lib/db/types";
import { AGE_BAND_OPTIONS, ENERGY_OPTIONS, INTEREST_OPTIONS } from "@/lib/match-options";
import { requireSession } from "@/lib/session";

export interface OnboardingFormState {
  error?: string;
}

/* --------------------------------------------------------------- 성인 확인 */

const MIN_ADULT_AGE = 19;

export async function confirmAdult(
  _prev: OnboardingFormState,
  formData: FormData,
): Promise<OnboardingFormState> {
  const { user } = await requireSession();

  if (formData.get("adultCheck") !== "on") {
    return { error: "만 19세 이상임을 확인해 주세요." };
  }

  const birthYear = Number(formData.get("birthYear"));
  const thisYear = new Date().getFullYear();
  if (!Number.isInteger(birthYear) || birthYear < 1900 || birthYear > thisYear) {
    return { error: "출생 연도를 정확히 입력해 주세요." };
  }
  // 생년월일 원본은 저장하지 않고 연 단위로만 확인합니다.
  if (thisYear - birthYear < MIN_ADULT_AGE) {
    return {
      error: `만 ${MIN_ADULT_AGE}세 이상만 이용할 수 있는 성인 전용 서비스입니다.`,
    };
  }

  await getDb().confirmAdult(user.id, birthYear);
  redirect("/onboarding/consent");
}

/* -------------------------------------------------------------------- 동의 */

export async function saveConsents(
  _prev: OnboardingFormState,
  formData: FormData,
): Promise<OnboardingFormState> {
  const { user } = await requireSession();

  const entries = CONSENT_ITEMS.map((item) => ({
    consentType: item.type,
    granted: formData.get(`consent:${item.type}`) === "on",
  }));

  const missing = entries.filter(
    (e) => !e.granted && REQUIRED_CONSENT_TYPES.includes(e.consentType),
  );
  if (missing.length > 0) {
    return { error: "필수 항목에 모두 동의해야 입장할 수 있습니다." };
  }

  const db = getDb();
  await db.saveConsents(user.id, CONSENT_VERSION, entries);
  await db.markConsentCompleted(user.id);
  redirect("/onboarding/profile");
}

/* ------------------------------------------------------------------ 프로필 */

const profileSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(2, "닉네임은 2자 이상이어야 합니다.")
    .max(20, "닉네임은 20자 이하여야 합니다."),
  gender: z.enum(["female", "male", "other"]),
  ageBand: z.enum(AGE_BAND_OPTIONS),
  region: z.string().trim().max(40).optional(),
  groupVibe: z.enum(
    ENERGY_OPTIONS.map((o) => o.value) as [string, ...string[]],
  ),
  interests: z.array(z.enum(INTEREST_OPTIONS)).min(1, "관심사를 1개 이상 골라주세요.").max(12),
  languages: z.array(z.string().trim().max(20)).max(6),
  conversationStyle: z.string().trim().max(200).optional(),
});

export async function saveProfile(
  _prev: OnboardingFormState,
  formData: FormData,
): Promise<OnboardingFormState> {
  const { user } = await requireSession();
  // 최초 설정이면 로비로, 기존 회원의 수정이면 대시보드로 돌아갑니다.
  const isFirstSetup = !user.onboardingCompletedAt;

  const parsed = profileSchema.safeParse({
    nickname: formData.get("nickname"),
    gender: formData.get("gender"),
    ageBand: formData.get("ageBand"),
    region: formData.get("region") ?? undefined,
    groupVibe: formData.get("groupVibe"),
    interests: formData.getAll("interests"),
    languages: formData.getAll("languages"),
    conversationStyle: formData.get("conversationStyle") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력을 확인해 주세요." };
  }

  const db = getDb();
  await db.upsertProfile(user.id, {
    nickname: parsed.data.nickname,
    gender: parsed.data.gender as Gender,
    ageBand: parsed.data.ageBand,
    region: parsed.data.region || null,
    languages: parsed.data.languages.length ? [...parsed.data.languages] : ["한국어"],
    interests: [...parsed.data.interests],
    groupVibe: parsed.data.groupVibe as ConversationEnergy,
    conversationStyle: parsed.data.conversationStyle || null,
  });
  await db.markOnboardingCompleted(user.id);
  redirect(isFirstSetup ? "/lobby" : "/dashboard");
}
