"use client";

import { useActionState } from "react";

import { saveProfile, type OnboardingFormState } from "@/app/(onboarding)/actions";
import { Field, Fieldset, FormError, Input, PillOption, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Profile } from "@/lib/db/types";
import { AGE_BAND_OPTIONS, ENERGY_OPTIONS, INTEREST_OPTIONS } from "@/lib/match-options";

const GENDERS = [
  { value: "female", label: "여성" },
  { value: "male", label: "남성" },
  { value: "other", label: "밝히지 않음" },
];

const LANGUAGES = ["한국어", "English", "日本語", "中文"];

/** 프로필 설정·수정 폼. 외모 점수는 수집하지 않습니다. */
export function ProfileForm({
  profile,
  submitLabel = "프로필 저장하고 입장하기",
}: {
  profile?: Profile | null;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState<OnboardingFormState, FormData>(
    saveProfile,
    {},
  );

  return (
    <form action={formAction} className="space-y-7">
      <FormError message={state.error} />

      <Field
        label="닉네임"
        htmlFor="nickname"
        hint="클럽에서 표시될 이름입니다. 실명은 권장하지 않습니다."
      >
        <Input
          id="nickname"
          name="nickname"
          required
          minLength={2}
          maxLength={20}
          defaultValue={profile?.nickname ?? ""}
          placeholder="2~20자"
        />
      </Field>

      <Fieldset legend="성별">
        <div className="flex flex-wrap gap-2.5">
          {GENDERS.map((g, i) => (
            <PillOption
              key={g.value}
              type="radio"
              name="gender"
              value={g.value}
              label={g.label}
              required={i === 0}
              defaultChecked={(profile?.gender ?? "other") === g.value}
            />
          ))}
        </div>
      </Fieldset>

      <Fieldset legend="연령대">
        <div className="flex flex-wrap gap-2.5">
          {AGE_BAND_OPTIONS.map((band, i) => (
            <PillOption
              key={band}
              type="radio"
              name="ageBand"
              value={band}
              label={band}
              required={i === 0}
              defaultChecked={profile?.ageBand === band}
            />
          ))}
        </div>
      </Fieldset>

      <Fieldset legend="대화할 때 나는">
        <div className="flex flex-wrap gap-2.5">
          {ENERGY_OPTIONS.map((o) => (
            <PillOption
              key={o.value}
              type="radio"
              name="groupVibe"
              value={o.value}
              label={o.label}
              defaultChecked={(profile?.groupVibe ?? "balanced") === o.value}
            />
          ))}
        </div>
      </Fieldset>

      <Fieldset legend="관심사 (1개 이상)">
        <div className="flex flex-wrap gap-2.5">
          {INTEREST_OPTIONS.map((o) => (
            <PillOption
              key={o}
              type="checkbox"
              name="interests"
              value={o}
              label={o}
              defaultChecked={profile?.interests.includes(o)}
            />
          ))}
        </div>
      </Fieldset>

      <Fieldset legend="사용 언어">
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

      <Field label="지역 (선택)" htmlFor="region">
        <Input
          id="region"
          name="region"
          maxLength={40}
          defaultValue={profile?.region ?? ""}
          placeholder="예: 서울"
        />
      </Field>

      <Field label="한 줄 소개 (선택)" htmlFor="conversationStyle">
        <Textarea
          id="conversationStyle"
          name="conversationStyle"
          rows={3}
          maxLength={200}
          defaultValue={profile?.conversationStyle ?? ""}
          placeholder="어떤 대화를 좋아하는지 짧게 적어주세요."
        />
      </Field>

      <SubmitButton className="w-full gold-glow" pendingLabel="저장 중…">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
