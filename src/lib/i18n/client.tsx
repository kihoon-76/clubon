"use client";

import { createContext, useContext, useMemo } from "react";

import { createTranslate } from "@/lib/i18n/translate";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";
import type { Translate } from "@/lib/i18n/types";

/**
 * 클라이언트 컴포넌트용 언어 전달.
 *
 * 사전 전체를 직렬화해 내려보내지 않고 **언어 코드 하나만** 넘깁니다. 사전은
 * 번들에 이미 들어 있으므로, 페이지마다 같은 문구를 HTML로 다시 실어 보낼
 * 이유가 없습니다.
 */

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function useT(): Translate {
  const locale = useLocale();
  return useMemo(() => createTranslate(locale), [locale]);
}
