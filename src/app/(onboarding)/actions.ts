"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { CONSENT_ITEMS, CONSENT_VERSION, REQUIRED_CONSENT_TYPES } from "@/lib/consent/items";
import { getDb } from "@/lib/db";
import type { ConversationEnergy, Gender } from "@/lib/db/types";
import { getT } from "@/lib/i18n/server";
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
  const t = await getT();

  if (formData.get("adultCheck") !== "on") {
    return { error: t("profile.errors.adultUnchecked") };
  }

  const birthYear = Number(formData.get("birthYear"));
  const thisYear = new Date().getFullYear();
  if (!Number.isInteger(birthYear) || birthYear < 1900 || birthYear > thisYear) {
    return { error: t("profile.errors.birthYearInvalid") };
  }
  // 생년월일 원본은 저장하지 않고 연 단위로만 확인합니다.
  if (thisYear - birthYear < MIN_ADULT_AGE) {
    return { error: t("profile.errors.tooYoung", { age: MIN_ADULT_AGE }) };
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
    return { error: (await getT())("profile.errors.consentMissing") };
  }

  const db = getDb();
  await db.saveConsents(user.id, CONSENT_VERSION, entries);
  await db.markConsentCompleted(user.id);
  redirect("/onboarding/profile");
}

/* ------------------------------------------------------------------ 프로필 */

/**
 * 검증 메시지는 **문장이 아니라 사전 키**입니다.
 *
 * 이 스키마는 모듈이 로드될 때 한 번만 만들어지므로 요청마다 다른 언어를
 * 담을 수 없습니다. 그래서 키만 담아 두고, 돌려줄 때 그 요청의 언어로
 * 옮깁니다.
 */
const profileSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(2, "profile.errors.nicknameShort")
    .max(20, "profile.errors.nicknameLong"),
  gender: z.enum(["female", "male"]).optional(),
  ageBand: z.enum(AGE_BAND_OPTIONS),
  region: z.string().trim().max(40).optional(),
  groupVibe: z.enum(
    ENERGY_OPTIONS.map((o) => o.value) as [string, ...string[]],
  ),
  interests: z
    .array(z.enum(INTEREST_OPTIONS))
    .min(1, "profile.errors.interestsEmpty")
    .max(12),
  languages: z.array(z.string().trim().max(20)).max(6),
  conversationStyle: z.string().trim().max(200).optional(),
});

export async function saveProfile(
  _prev: OnboardingFormState,
  formData: FormData,
): Promise<OnboardingFormState> {
  const { user } = await requireSession();
  const t = await getT();
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
    // 메시지 자리에 든 것은 사전 키입니다. 스키마가 직접 만든 기본 메시지
    // (타입 불일치 등)는 키가 아니므로 t()가 그대로 돌려주는데, 그런 값은
    // 회원에게 보여 줄 만한 문장이 아니라 일반 안내로 바꿉니다.
    const key = parsed.error.issues[0]?.message ?? "";
    const known = key.startsWith("profile.errors.");
    return { error: t(known ? key : "profile.errors.invalid") };
  }

  const gender = parsed.data.gender as Gender | undefined;
  if (!gender) return { error: t("profile.errors.genderMissing") };

  const db = getDb();
  await db.updateGender(user.id, gender);
  await db.upsertProfile(user.id, {
    nickname: parsed.data.nickname,
    gender,
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
