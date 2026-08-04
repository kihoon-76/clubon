import { requestBooking } from "@/app/(club)/lounges/actions";
import { Button } from "@/components/ui/button";
import {
  AGE_BAND_OPTIONS,
  ENERGY_OPTIONS,
  GENDER_OPTIONS,
  INTEREST_OPTIONS,
} from "@/lib/match-options";

/**
 * 원하는 상대 스타일 입력 폼. 웨이터가 이 조건과 공통점이 가장 많은 상대
 * 라운지를 찾아 부킹합니다. 서버 액션(requestBooking)으로 제출됩니다.
 */
export function PreferenceForm({ tableId }: { tableId: string }) {
  return (
    <form action={requestBooking.bind(null, tableId)} className="space-y-8">
      <Fieldset legend="원하는 상대의 성별">
        <div className="flex flex-wrap gap-2.5">
          {GENDER_OPTIONS.map((o, i) => (
            <PillOption
              key={o.value}
              type="radio"
              name="desiredGender"
              value={o.value}
              label={o.label}
              defaultChecked={o.value === "any"}
              required={i === 0}
            />
          ))}
        </div>
      </Fieldset>

      <Fieldset legend="대화 분위기">
        <div className="flex flex-wrap gap-2.5">
          {ENERGY_OPTIONS.map((o) => (
            <PillOption
              key={o.value}
              type="radio"
              name="energy"
              value={o.value}
              label={o.label}
              defaultChecked={o.value === "balanced"}
            />
          ))}
        </div>
      </Fieldset>

      <Fieldset legend="관심사 (여러 개 선택 가능)">
        <div className="flex flex-wrap gap-2.5">
          {INTEREST_OPTIONS.map((o) => (
            <PillOption
              key={o}
              type="checkbox"
              name="interests"
              value={o}
              label={o}
            />
          ))}
        </div>
      </Fieldset>

      <Fieldset legend="선호 연령대 (여러 개 선택 가능)">
        <div className="flex flex-wrap gap-2.5">
          {AGE_BAND_OPTIONS.map((o) => (
            <PillOption
              key={o}
              type="checkbox"
              name="ageBands"
              value={o}
              label={o}
            />
          ))}
        </div>
      </Fieldset>

      <Button type="submit" size="lg" className="w-full gold-glow">
        이 조건으로 상대 찾기
      </Button>
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
    <label className="cursor-pointer select-none rounded-full border border-line bg-surface-raised px-4 py-2 text-sm text-muted transition-colors has-[:checked]:border-champagne has-[:checked]:bg-champagne/10 has-[:checked]:text-champagne hover:border-champagne-dim/70">
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
