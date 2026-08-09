import { DICTIONARIES } from "@/lib/i18n/dictionaries";
import { FALLBACK_LOCALE, type Locale } from "@/lib/i18n/locales";
import type { Translate, TranslateVars } from "@/lib/i18n/types";

/**
 * 문구 찾기 — 서버와 클라이언트가 함께 쓰는 순수 함수입니다.
 *
 * 찾는 순서는 **고른 언어 → 영어 → 한국어**이고, 셋 다 없으면 키를 그대로
 * 돌려줍니다. 화면이 비어 보이는 것보다 키가 보이는 편이, 빠진 문구를 훨씬
 * 빨리 찾게 해 줍니다.
 */

type Node = unknown;

function lookup(dict: Node, path: string[]): string | null {
  let node = dict;
  for (const key of path) {
    if (typeof node !== "object" || node === null) return null;
    node = (node as Record<string, unknown>)[key];
  }
  return typeof node === "string" ? node : null;
}

/** `{이름}` 자리를 값으로 바꿉니다. 값이 없는 자리는 그대로 둡니다. */
function interpolate(text: string, vars?: TranslateVars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in vars ? String(vars[name]) : whole,
  );
}

export function createTranslate(locale: Locale): Translate {
  // 폴백 사슬을 미리 만들어 둡니다. ko는 기준 사전이라 언제나 마지막입니다.
  const chain = [
    DICTIONARIES[locale],
    DICTIONARIES[FALLBACK_LOCALE],
    DICTIONARIES.ko,
  ];

  return (key, vars) => {
    const path = key.split(".");
    for (const dict of chain) {
      const found = lookup(dict, path);
      if (found !== null) return interpolate(found, vars);
    }
    return key;
  };
}
