"use client";

import { useActionState } from "react";

import { saveProfile, type OnboardingFormState } from "@/app/(onboarding)/actions";
import { Field, Fieldset, FormError, Input, PillOption, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Profile } from "@/lib/db/types";
import { useT } from "@/lib/i18n/client";
import {
  AGE_BAND_OPTIONS,
  ENERGY_OPTIONS,
  INTEREST_OPTIONS,
  ageBandLabel,
  energyLabel,
  interestLabel,
} from "@/lib/match-options";

/**
 * 프로필의 성별에는 "밝히지 않음"이 있습니다 — 매칭 조건으로 쓰는
 * `DesiredGender`와는 다른 집합이라 사전 키도 따로 둡니다.
 */
const GENDERS: { value: string; key: string }[] = [
  { value: "female", key: "options.gender.female" },
  { value: "male", key: "options.gender.male" },
  { value: "other", key: "options.gender.other" },
];

const LANGUAGES = ["한국어", "English", "日本語", "中文"];

/** 프로필 설정·수정 폼. 외모 점수는 수집하지 않습니다. */
export function ProfileForm({
  profile,
  lockedGender = null,
  submitLabel,
}: {
  profile?: Profile | null;
  /**
   * 가입할 때 이미 고른 성별. 있으면 다시 묻지 않고 보여 주기만 합니다 —
   * 매칭의 기준이라 상대를 만난 뒤 뒤바꿀 수 있으면 안 됩니다.
   */
  lockedGender?: Profile["gender"] | null;
  submitLabel?: string;
}) {
  const t = useT();
  const [state, formAction] = useActionState<OnboardingFormState, FormData>(
    saveProfile,
    {},
  );

  return (
    <form action={formAction} className="space-y-7">
      <FormError message={state.error} />

      <Field
        label={t("profile.nickname")}
        htmlFor="nickname"
        hint={t("profile.nicknameHint")}
      >
        <Input
          id="nickname"
          name="nickname"
          required
          minLength={2}
          maxLength={20}
          defaultValue={profile?.nickname ?? ""}
          placeholder={t("profile.nicknamePlaceholder")}
        />
      </Field>

      <Fieldset legend={t("profile.gender")}>
        {lockedGender ? (
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <span className="rounded-full border border-champagne bg-champagne/10 px-4 py-2 text-champagne">
              {t(`options.gender.${lockedGender}`)}
            </span>
            <span className="text-xs break-keep text-faint">
              {t("profile.genderLocked")}
            </span>
          </p>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {GENDERS.map((g, i) => (
              <PillOption
                key={g.value}
                type="radio"
                name="gender"
                value={g.value}
                label={t(g.key)}
                required={i === 0}
                defaultChecked={profile?.gender === g.value}
              />
            ))}
          </div>
        )}
      </Fieldset>

      <Fieldset legend={t("profile.ageBand")}>
        <div className="flex flex-wrap gap-2.5">
          {AGE_BAND_OPTIONS.map((band, i) => (
            <PillOption
              key={band}
              type="radio"
              name="ageBand"
              value={band}
              label={ageBandLabel(t, band)}
              required={i === 0}
              defaultChecked={profile?.ageBand === band}
            />
          ))}
        </div>
      </Fieldset>

      <Fieldset legend={t("profile.vibe")}>
        <div className="flex flex-wrap gap-2.5">
          {ENERGY_OPTIONS.map((o) => (
            <PillOption
              key={o.value}
              type="radio"
              name="groupVibe"
              value={o.value}
              label={energyLabel(t, o.value)}
              defaultChecked={(profile?.groupVibe ?? "balanced") === o.value}
            />
          ))}
        </div>
      </Fieldset>

      <Fieldset legend={t("profile.interests")}>
        <div className="flex flex-wrap gap-2.5">
          {INTEREST_OPTIONS.map((o) => (
            <PillOption
              key={o}
              type="checkbox"
              name="interests"
              value={o}
              label={interestLabel(t, o)}
              defaultChecked={profile?.interests.includes(o)}
            />
          ))}
        </div>
      </Fieldset>

      <Fieldset legend={t("profile.languages")}>
        <div className="flex flex-wrap gap-2.5">
          {LANGUAGES.map((l) => (
            <PillOption
              key={l}
              type="checkbox"
              name="languages"
              value={l}
              label={l}
              defaultChecked={(profile?.languages ?? ["한국어"]).includes(l)}
            />
          ))}
        </div>
      </Fieldset>

      <Field label={t("profile.region")} htmlFor="region">
        <Input
          id="region"
          name="region"
          maxLength={40}
          defaultValue={profile?.region ?? ""}
          placeholder={t("profile.regionPlaceholder")}
        />
      </Field>

      <Field label={t("profile.bio")} htmlFor="conversationStyle">
        <Textarea
          id="conversationStyle"
          name="conversationStyle"
          rows={3}
          maxLength={200}
          defaultValue={profile?.conversationStyle ?? ""}
          placeholder={t("profile.bioPlaceholder")}
        />
      </Field>

      <SubmitButton
        className="w-full gold-glow"
        pendingLabel={t("profile.savePending")}
      >
        {submitLabel ?? t("profile.save")}
      </SubmitButton>
    </form>
  );
}
