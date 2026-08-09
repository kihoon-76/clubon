"use client";

import { useRef } from "react";
import { Globe } from "lucide-react";

import { setLocale } from "@/app/i18n-actions";
import { useLocale, useT } from "@/lib/i18n/client";
import { LOCALES } from "@/lib/i18n/locales";

/**
 * 언어 선택.
 *
 * `<select>`를 그대로 씁니다 — 모바일에서 OS 기본 선택기가 열려 스크롤과
 * 검색이 공짜로 따라오고, 11개 언어를 직접 그린 목록보다 훨씬 다루기 쉽습니다.
 *
 * 자바스크립트 없이도 동작해야 하므로 form 안에 두고, 있을 때는 고르는 즉시
 * 제출합니다(제출 버튼은 JS가 없을 때만 보입니다).
 */
export function LanguagePicker() {
  const locale = useLocale();
  const t = useT();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={setLocale} className="flex items-center gap-1.5">
      <Globe aria-hidden className="size-4 shrink-0 text-champagne" />
      <label htmlFor="locale" className="sr-only">
        {t("common.language")}
      </label>
      <select
        id="locale"
        name="locale"
        defaultValue={locale}
        onChange={() => formRef.current?.requestSubmit()}
        className="cursor-pointer rounded-[var(--radius-control)] border border-transparent bg-transparent py-1 pr-1 text-sm text-muted transition-colors hover:text-ivory focus:border-champagne-dim focus:outline-none"
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code} className="bg-surface text-ivory">
            {l.label}
          </option>
        ))}
      </select>
      {/* JS가 꺼져 있으면 onChange가 돌지 않으므로 제출 수단을 남겨 둡니다. */}
      <noscript>
        <button
          type="submit"
          className="rounded-[var(--radius-control)] border border-line px-2 py-1 text-xs text-muted"
        >
          OK
        </button>
      </noscript>
    </form>
  );
}
