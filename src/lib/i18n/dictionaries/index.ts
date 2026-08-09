import type { Locale } from "@/lib/i18n/locales";
import type { DeepPartial } from "@/lib/i18n/types";
import { ko, type Dictionary } from "@/lib/i18n/dictionaries/ko";
import { en } from "@/lib/i18n/dictionaries/en";

/**
 * 언어별 사전.
 *
 * 아직 번역문이 없는 언어는 빈 사전입니다. 빠진 문구는 영어로, 영어에도 없으면
 * 한국어로 떨어집니다(`resolve`). 언어를 목록에서 빼는 대신 빈 사전을 두는
 * 이유는, 언어 선택 자체는 이미 동작해야 하기 때문입니다 — 사전만 채우면
 * 코드를 건드리지 않고 그 언어가 켜집니다.
 */
export const DICTIONARIES: Record<Locale, DeepPartial<Dictionary>> = {
  ko,
  en,
  es: {},
  ja: {},
  zh: {},
  hi: {},
  id: {},
  th: {},
  fr: {},
  de: {},
  vi: {},
};

export type { Dictionary };
export { ko, en };
