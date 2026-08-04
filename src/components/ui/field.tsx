import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";

const control =
  "w-full rounded-[var(--radius-control)] border border-line bg-surface px-4 text-[0.9375rem] text-ivory " +
  "placeholder:text-faint transition-colors focus:border-champagne-dim hover:border-line-strong " +
  "disabled:opacity-45";

export function Input({ className, ...props }: ComponentPropsWithoutRef<"input">) {
  return <input className={cn(control, "h-11", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: ComponentPropsWithoutRef<"textarea">) {
  return <textarea className={cn(control, "py-3 leading-relaxed", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentPropsWithoutRef<"select">) {
  return <select className={cn(control, "h-11", className)} {...props} />;
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="label-caps block">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs leading-relaxed text-faint">{hint}</p> : null}
    </div>
  );
}

/** 서버 액션이 돌려준 오류 메시지를 접근성 있게 표시합니다. */
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-[var(--radius-control)] border border-danger/40 bg-danger-dim/50 px-4 py-3 text-sm text-ivory"
    >
      <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0 text-danger" />
      {message}
    </p>
  );
}

/** 선택형 알약(pill) 옵션 — 라운지 선호 폼과 프로필 폼이 공유합니다. */
export function PillOption({
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

/** 제출 중 비활성화되는 버튼 — 클라이언트 컴포넌트에서 useFormStatus와 함께 사용. */
export function Fieldset({
  legend,
  children,
}: {
  legend: string;
  children: ReactNode;
}) {
  return (
    <fieldset>
      <legend className="label-caps mb-3">{legend}</legend>
      {children}
    </fieldset>
  );
}
