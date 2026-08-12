import { requestBooking } from "@/app/(club)/lounges/actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { getT } from "@/lib/i18n/server";
import {
  AGE_BAND_OPTIONS,
  ENERGY_OPTIONS,
  GENDER_OPTIONS,
  INTEREST_OPTIONS,
  ageBandLabel,
  energyLabel,
  genderLabel,
  interestLabel,
} from "@/lib/match-options";

/**
 * 원하는 상대 스타일 입력 폼. 라운지 매니저가 이 조건과 공통점이 가장 많은 상대
 * 라운지를 찾아 부킹합니다. 서버 액션(requestBooking)으로 제출됩니다.
 */
export async function PreferenceForm({
  tableId,
  disabled = false,
}: {
  tableId: string;
  /** 라운지 인원이 최소치에 못 미치면 제출을 막습니다. */
  disabled?: boolean;
}) {
  const t = await getT();

  return (
    <form action={requestBooking.bind(null, tableId)} className="space-y-8">
      <Fieldset legend={t("entry.desiredGender")}>
        <div className="flex flex-wrap gap-2.5">
          {GENDER_OPTIONS.map((o, i) => (
            <PillOption
              key={o.value}
              type="radio"
              name="desiredGender"
              value={o.value}
              label={genderLabel(t, o.value)}
              required={i === 0}
            />
          ))}
        </div>
      </Fieldset>

      <Fieldset legend={t("entry.energy")}>
        <div className="flex flex-wrap gap-2.5">
          {ENERGY_OPTIONS.map((o) => (
            <PillOption
              key={o.value}
              type="radio"
              name="energy"
              value={o.value}
              label={energyLabel(t, o.value)}
              defaultChecked={o.value === "balanced"}
            />
          ))}
        </div>
      </Fieldset>

      <Fieldset legend={t("entry.interests")}>
        <div className="flex flex-wrap gap-2.5">
          {INTEREST_OPTIONS.map((o) => (
            <PillOption
              key={o}
              type="checkbox"
              name="interests"
              value={o}
              label={interestLabel(t, o)}
            />
          ))}
        </div>
      </Fieldset>

      <Fieldset legend={t("entry.ageBands")}>
        <div className="flex flex-wrap gap-2.5">
          {AGE_BAND_OPTIONS.map((o) => (
            <PillOption
              key={o}
              type="checkbox"
              name="ageBands"
              value={o}
              label={ageBandLabel(t, o)}
            />
          ))}
        </div>
      </Fieldset>

      {disabled ? (
        <p className="rounded-[var(--radius-control)] border border-line bg-surface px-4 py-3 text-sm text-muted">
          {t("lounge.needMoreToMatch")}
        </p>
      ) : (
        <SubmitButton
          className="w-full gold-glow"
          pendingLabel={t("lounge.searching")}
        >
          {t("entry.findMatch")}
        </SubmitButton>
      )}
    </form>
  );
}

function Fieldset({
  legend,
  children,
}: {
  legend: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="label-caps mb-3">{legend}</legend>
      {children}
    </fieldset>
  );
}

function PillOption({
  type,
  name,
  value,
  label,
  defaultChecked,
  required,
}: {
  type: "radio" | "checkbox";
  name: string;
  value: string;
  label: string;
  defaultChecked?: boolean;
  required?: boolean;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer select-none items-center rounded-full border border-line bg-surface-raised px-4 py-2 text-sm text-muted transition-colors has-[:checked]:border-champagne has-[:checked]:bg-champagne/10 has-[:checked]:text-champagne hover:border-champagne-dim/70">
      <input
        type={type}
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        required={required}
        className="peer sr-only"
      />
      {label}
    </label>
  );
}
