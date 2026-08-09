import "server-only";

import { cookies, headers } from "next/headers";

import { createTranslate } from "@/lib/i18n/translate";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  localeFromAcceptLanguage,
  type Locale,
} from "@/lib/i18n/locales";
import type { Translate } from "@/lib/i18n/types";

/**
 * 이 요청의 언어.
 *
 * 순서는 **직접 고른 값(쿠키) → 브라우저 설정(Accept-Language) → 한국어**입니다.
 * 직접 고른 값이 언제나 이깁니다 — 브라우저 언어와 읽고 싶은 언어가 다른
 * 경우(해외 거주자, 공용 PC)가 드물지 않기 때문입니다.
 */
export async function getLocale(): Promise<Locale> {
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (chosen && isLocale(chosen)) return chosen;

  const accept = (await headers()).get("accept-language");
  return localeFromAcceptLanguage(accept) ?? DEFAULT_LOCALE;
}

/** 서버 컴포넌트용 문구 함수. */
export async function getT(): Promise<Translate> {
  return createTranslate(await getLocale());
}
