/**
 * 지원 언어 — 언어 목록의 단일 출처.
 *
 * 이름은 **그 언어로** 적습니다. 자기 언어를 찾는 사람에게 "베트남어"보다
 * "Tiếng Việt"이 빠르고, 한국어를 못 읽는 사람에게는 후자만이 유일한 단서입니다.
 *
 * 번역문이 아직 없는 언어를 고르면 영어로 떨어집니다(`FALLBACK_LOCALE`).
 * 목록에서 빼 두면 그 언어를 쓰는 회원은 서비스가 자기 언어를 아예 다루지
 * 않는다고 읽게 되므로, 뼈대는 열어 두고 사전만 차차 채웁니다.
 */

export const LOCALES = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
  { code: "hi", label: "हिन्दी" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "th", label: "ไทย" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "vi", label: "Tiếng Việt" },
] as const;

export type Locale = (typeof LOCALES)[number]["code"];

/** 기본 언어 — 아무 단서도 없을 때. */
export const DEFAULT_LOCALE: Locale = "ko";

/**
 * 번역문이 없을 때 떨어질 언어.
 *
 * 한국어가 아니라 영어입니다. 자기 언어가 아직 준비되지 않은 회원에게 한국어를
 * 보여 주면 아무것도 읽을 수 없지만, 영어라면 대개는 읽어 낼 수 있습니다.
 */
export const FALLBACK_LOCALE: Locale = "en";

/** 언어 선택을 담아 두는 쿠키 이름. */
export const LOCALE_COOKIE = "clubon_locale";

const CODES = new Set<string>(LOCALES.map((l) => l.code));

export function isLocale(value: string): value is Locale {
  return CODES.has(value);
}

export function localeLabel(code: Locale): string {
  return LOCALES.find((l) => l.code === code)?.label ?? code;
}

/**
 * `Accept-Language` 헤더에서 가장 잘 맞는 언어를 고릅니다.
 *
 * `zh-Hant`, `pt-BR`처럼 지역이 붙은 태그는 앞의 언어 코드만 봅니다. 품질값(q)
 * 순서는 브라우저가 이미 정렬해 보내므로 앞에서부터 처음 맞는 것을 씁니다.
 */
export function localeFromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  for (const part of header.split(",")) {
    const tag = part.split(";")[0]!.trim().toLowerCase();
    const base = tag.split("-")[0]!;
    if (isLocale(base)) return base;
  }
  return null;
}
