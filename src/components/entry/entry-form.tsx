"use client";

import { useActionState, useState } from "react";

import {
  submitEntry,
  type EntryActionState,
} from "@/app/(club)/entry/actions";
import { RegionPicker } from "@/components/entry/region-picker";
import { SubmitButton } from "@/components/ui/submit-button";
import { useT } from "@/lib/i18n/client";
import { WaiterAvatar } from "@/components/waiter/waiter-avatar";
import { cn } from "@/lib/utils";
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
import { WAITERS, waiterEpithet, waiterName } from "@/lib/waiters";

/**
 * 입장 신청 — 지역, AI 라운지 매니저, 원하는 상대를 한 번에 받습니다.
 *
 * 이 폼을 내면 내 라운지가 열리고 신청 내용이 거기 저장됩니다. 결제가 필요해
 * Creem으로 다녀오는 동안에도 라운지가 남아 있어, 돌아오면 처음부터 다시
 * 고르지 않고 이어서 진행합니다.
 *
 * 매니저는 회원이 직접 고릅니다 — 고른 매니저가 이 신청의 조건을 들고
 * 상대 라운지를 찾습니다.
 */
export function EntryForm({
  defaultRegion = null,
  defaultWaiterId = null,
}: {
  defaultRegion?: string | null;
  defaultWaiterId?: string | null;
}) {
  const t = useT();
  const [waiterId, setWaiterId] = useState(defaultWaiterId ?? WAITERS[0].id);
  const [desiredGender, setDesiredGender] = useState("");
  const [energy, setEnergy] = useState("balanced");
  const [interests, setInterests] = useState<string[]>([]);
  const [ageBands, setAgeBands] = useState<string[]>([]);
  const initialState: EntryActionState = { error: null };
  const [state, formAction] = useActionState(submitEntry, initialState);

  return (
    <form action={formAction} className="space-y-8 sm:space-y-10">
      <Section step={1} title={t("entry.step1Title")} hint={t("entry.step1Hint")}>
        <RegionPicker defaultValue={defaultRegion} />
      </Section>

      <Section step={2} title={t("entry.step2Title")} hint={t("entry.step2Hint")}>
        <input type="hidden" name="waiterId" value={waiterId} />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {WAITERS.map((waiter) => {
            const active = waiter.id === waiterId;
            return (
              <li key={waiter.id}>
                <button
                  type="button"
                  onClick={() => setWaiterId(waiter.id)}
                  aria-pressed={active}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[var(--radius-card)] border bg-surface-raised p-3 text-left transition-all",
                    active
                      ? "border-champagne-dim gold-glow"
                      : "border-line hover:border-champagne-dim/70",
                  )}
                >
                  <WaiterAvatar waiter={waiter} t={t} className="w-11 shrink-0" />
                  <span className="min-w-0">
                    <span className="block truncate font-display text-[0.9375rem] text-ivory">
                      {waiterName(t, waiter)}
                    </span>
                    <span className="block truncate text-[0.6875rem] uppercase tracking-[0.12em] text-champagne/80">
                      {waiterEpithet(t, waiter)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-[0.6875rem] leading-relaxed text-faint">
          {t("entry.aiDisclaimer")}
        </p>
      </Section>

      <Section step={3} title={t("entry.step3Title")} hint={t("entry.step3Hint")}>
        <div className="space-y-7 sm:space-y-8">
          <Fieldset legend={t("entry.desiredGender")}>
            <Pills>
              {GENDER_OPTIONS.map((o, i) => (
                <PillOption
                  key={o.value}
                  type="radio"
                  name="desiredGender"
                  value={o.value}
                  label={genderLabel(t, o.value)}
                  checked={desiredGender === o.value}
                  onCheckedChange={() => setDesiredGender(o.value)}
                  required={i === 0}
                />
              ))}
            </Pills>
          </Fieldset>

          <Fieldset legend={t("entry.energy")}>
            <Pills>
              {ENERGY_OPTIONS.map((o) => (
                <PillOption
                  key={o.value}
                  type="radio"
                  name="energy"
                  value={o.value}
                  label={energyLabel(t, o.value)}
                  checked={energy === o.value}
                  onCheckedChange={() => setEnergy(o.value)}
                />
              ))}
            </Pills>
          </Fieldset>

          <Fieldset legend={t("entry.interests")}>
            <Pills>
              {INTEREST_OPTIONS.map((o) => (
                <PillOption
                  key={o}
                  type="checkbox"
                  name="interests"
                  value={o}
                  label={interestLabel(t, o)}
                  checked={interests.includes(o)}
                  onCheckedChange={(checked) =>
                    setInterests((current) =>
                      checked
                        ? [...current, o]
                        : current.filter((value) => value !== o),
                    )
                  }
                />
              ))}
            </Pills>
          </Fieldset>

          <Fieldset legend={t("entry.ageBands")}>
            <Pills>
              {AGE_BAND_OPTIONS.map((o) => (
                <PillOption
                  key={o}
                  type="checkbox"
                  name="ageBands"
                  value={o}
                  label={ageBandLabel(t, o)}
                  checked={ageBands.includes(o)}
                  onCheckedChange={(checked) =>
                    setAgeBands((current) =>
                      checked
                        ? [...current, o]
                        : current.filter((value) => value !== o),
                    )
                  }
                />
              ))}
            </Pills>
          </Fieldset>
        </div>
      </Section>

      {state.error ? (
        <p
          role="alert"
          aria-live="polite"
          className="rounded-[var(--radius-control)] border border-danger/40 bg-danger-dim/40 px-4 py-3 text-sm break-keep text-ivory"
        >
          {t(`entry.errors.${state.error}`)}
        </p>
      ) : null}

      <SubmitButton
        className="w-full gold-glow"
        pendingLabel={t("entry.submitPending")}
      >
        {t("entry.submit")}
      </SubmitButton>
    </form>
  );
}

function Section({
  step,
  title,
  hint,
  children,
}: {
  step: number;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline gap-3">
        <span
          aria-hidden
          className="flex size-7 shrink-0 items-center justify-center rounded-full border border-champagne-dim/60 font-mono text-xs text-champagne"
        >
          {step}
        </span>
        <div>
          <h2 className="font-display text-xl text-ivory">{title}</h2>
          <p className="mt-1 text-sm break-keep text-muted">{hint}</p>
        </div>
      </div>
      <div className="mt-5 sm:pl-10">{children}</div>
    </section>
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

function Pills({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2.5">{children}</div>;
}

function PillOption({
  type,
  name,
  value,
  label,
  checked,
  onCheckedChange,
  required,
}: {
  type: "radio" | "checkbox";
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  required?: boolean;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer select-none items-center rounded-full border border-line bg-surface-raised px-4 py-2 text-sm text-muted transition-colors has-[:checked]:border-champagne has-[:checked]:bg-champagne/10 has-[:checked]:text-champagne hover:border-champagne-dim/70">
      <input
        type={type}
        name={name}
        value={value}
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
        required={required}
        className="peer sr-only"
      />
      {label}
    </label>
  );
}
