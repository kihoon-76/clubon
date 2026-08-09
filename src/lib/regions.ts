/**
 * 라운지 지역 카탈로그 — 지역 구분의 단일 출처.
 *
 * 지역은 두 단계로 고릅니다.
 *
 *   1단계  대한민국 · 또는 그 밖의 국가
 *   2단계  대한민국이면 시·도, 그 밖이면 없음(국가가 곧 지역)
 *
 * 표기 언어가 단계마다 다릅니다. 국내 지역은 한국어로, 해외 국가는 **영어**로
 * 적습니다. 해외 회원이 자기 나라를 찾을 때 한국어 표기는 아무 도움이 되지
 * 않기 때문입니다.
 *
 * 지역 코드는 DB와 URL에 그대로 들어가므로 바꾸지 마세요. 국내는 `kr-*`,
 * 해외는 ISO 3166-1 alpha-2 소문자입니다.
 */

import type { Translate } from "@/lib/i18n/types";

export interface Region {
  /** 저장·URL용 코드 (변경 금지) */
  code: string;
  /** 화면 표기 — 국내는 한국어, 해외는 영어 */
  label: string;
}

/* ------------------------------------------------------------ 대한민국 */

/**
 * 시·도 15구분.
 *
 * 마지막 `kr-islands`는 행정구역이 아니라 **도서지역**을 하나로 묶은 칸입니다.
 * 백령·연평·흑산·울릉처럼 육지 시·도에 속하지만 생활권이 뚜렷이 다른 섬을
 * 위한 자리로, 인구가 적어 자기 시·도에서는 매칭이 잘 성사되지 않습니다.
 */
export const KR_REGIONS: readonly Region[] = [
  { code: "kr-seoul", label: "서울" },
  { code: "kr-gyeonggi", label: "경기" },
  { code: "kr-incheon", label: "인천" },
  { code: "kr-daejeon", label: "대전" },
  { code: "kr-daegu", label: "대구" },
  { code: "kr-busan", label: "부산" },
  { code: "kr-gwangju", label: "광주" },
  { code: "kr-jeju", label: "제주" },
  { code: "kr-chungnam", label: "충남" },
  { code: "kr-chungbuk", label: "충북" },
  { code: "kr-jeonbuk", label: "전북" },
  { code: "kr-jeonnam", label: "전남" },
  { code: "kr-gyeongbuk", label: "경북" },
  { code: "kr-gyeongnam", label: "경남" },
  { code: "kr-islands", label: "도서지역 (백령·연평·흑산·울릉 등)" },
] as const;

/* ---------------------------------------------------------------- 해외 */

/**
 * 대륙 구분 — 국가가 100개를 넘어서, 고르는 화면에서 묶어 주지 않으면
 * 자기 나라를 찾기 어렵습니다.
 */
export type Continent =
  | "asia"
  | "europe"
  | "americas"
  | "africa"
  | "oceania";

export const CONTINENT_LABEL: Record<Continent, string> = {
  asia: "Asia & Middle East",
  europe: "Europe",
  americas: "Americas",
  africa: "Africa",
  oceania: "Oceania",
};

export interface Country extends Region {
  continent: Continent;
  /**
   * 인구 3천만 미만이지만 K-POP·한류 팬층이 두터워 따로 넣은 나라.
   *
   * 인구만으로 자르면 불가리아·몽골·조지아·대만처럼 실제 이용자가 나올 곳이
   * 통째로 빠집니다. 화면에서 이 나라들을 따로 표시하지는 않고, 목록에 들어간
   * 이유를 코드에 남겨 두는 용도입니다.
   */
  kpop?: true;
}

/**
 * 선정 기준은 두 가지입니다.
 *
 *   · 인구 3천만 명 이상인 국가
 *   · 인구와 무관하게 K-POP 팬층이 두터운 국가 (`kpop: true`)
 *
 * 인구는 2020년대 중반 추계 기준의 근사값으로, 3천만 명 경계에 걸친 나라는
 * 해에 따라 오르내릴 수 있습니다. 서비스를 정상적으로 제공하기 어려운 곳
 * (북한 등)은 인구와 무관하게 제외했습니다.
 */
export const COUNTRIES: readonly Country[] = [
  /* ---- Asia & Middle East ---- */
  { code: "in", label: "India", continent: "asia" },
  { code: "cn", label: "China", continent: "asia" },
  { code: "id", label: "Indonesia", continent: "asia" },
  { code: "pk", label: "Pakistan", continent: "asia" },
  { code: "bd", label: "Bangladesh", continent: "asia" },
  { code: "jp", label: "Japan", continent: "asia" },
  { code: "ph", label: "Philippines", continent: "asia" },
  { code: "vn", label: "Vietnam", continent: "asia" },
  { code: "ir", label: "Iran", continent: "asia" },
  { code: "tr", label: "Türkiye", continent: "asia" },
  { code: "th", label: "Thailand", continent: "asia" },
  { code: "mm", label: "Myanmar", continent: "asia" },
  { code: "iq", label: "Iraq", continent: "asia" },
  { code: "af", label: "Afghanistan", continent: "asia" },
  { code: "sa", label: "Saudi Arabia", continent: "asia" },
  { code: "uz", label: "Uzbekistan", continent: "asia" },
  { code: "my", label: "Malaysia", continent: "asia" },
  { code: "ye", label: "Yemen", continent: "asia" },
  { code: "np", label: "Nepal", continent: "asia" },
  { code: "sy", label: "Syria", continent: "asia" },
  { code: "lk", label: "Sri Lanka", continent: "asia" },
  { code: "kz", label: "Kazakhstan", continent: "asia", kpop: true },
  { code: "kh", label: "Cambodia", continent: "asia", kpop: true },
  { code: "tw", label: "Taiwan", continent: "asia", kpop: true },
  { code: "hk", label: "Hong Kong", continent: "asia", kpop: true },
  { code: "sg", label: "Singapore", continent: "asia", kpop: true },
  { code: "mn", label: "Mongolia", continent: "asia", kpop: true },
  { code: "ge", label: "Georgia", continent: "asia", kpop: true },
  { code: "ae", label: "United Arab Emirates", continent: "asia", kpop: true },
  { code: "il", label: "Israel", continent: "asia", kpop: true },
  { code: "jo", label: "Jordan", continent: "asia", kpop: true },
  { code: "la", label: "Laos", continent: "asia", kpop: true },
  { code: "kg", label: "Kyrgyzstan", continent: "asia", kpop: true },
  { code: "am", label: "Armenia", continent: "asia", kpop: true },
  { code: "az", label: "Azerbaijan", continent: "asia", kpop: true },

  /* ---- Europe ---- */
  { code: "ru", label: "Russia", continent: "europe" },
  { code: "de", label: "Germany", continent: "europe" },
  { code: "gb", label: "United Kingdom", continent: "europe" },
  { code: "fr", label: "France", continent: "europe" },
  { code: "it", label: "Italy", continent: "europe" },
  { code: "es", label: "Spain", continent: "europe" },
  { code: "pl", label: "Poland", continent: "europe" },
  { code: "ua", label: "Ukraine", continent: "europe" },
  { code: "ro", label: "Romania", continent: "europe", kpop: true },
  { code: "nl", label: "Netherlands", continent: "europe", kpop: true },
  { code: "be", label: "Belgium", continent: "europe", kpop: true },
  { code: "cz", label: "Czechia", continent: "europe", kpop: true },
  { code: "se", label: "Sweden", continent: "europe", kpop: true },
  { code: "pt", label: "Portugal", continent: "europe", kpop: true },
  { code: "gr", label: "Greece", continent: "europe", kpop: true },
  { code: "hu", label: "Hungary", continent: "europe", kpop: true },
  { code: "at", label: "Austria", continent: "europe", kpop: true },
  { code: "ch", label: "Switzerland", continent: "europe", kpop: true },
  { code: "bg", label: "Bulgaria", continent: "europe", kpop: true },
  { code: "rs", label: "Serbia", continent: "europe", kpop: true },
  { code: "dk", label: "Denmark", continent: "europe", kpop: true },
  { code: "fi", label: "Finland", continent: "europe", kpop: true },
  { code: "no", label: "Norway", continent: "europe", kpop: true },
  { code: "ie", label: "Ireland", continent: "europe", kpop: true },
  { code: "sk", label: "Slovakia", continent: "europe", kpop: true },
  { code: "hr", label: "Croatia", continent: "europe", kpop: true },
  { code: "lt", label: "Lithuania", continent: "europe", kpop: true },

  /* ---- Americas ---- */
  { code: "us", label: "United States", continent: "americas" },
  { code: "br", label: "Brazil", continent: "americas" },
  { code: "mx", label: "Mexico", continent: "americas" },
  { code: "co", label: "Colombia", continent: "americas" },
  { code: "ar", label: "Argentina", continent: "americas" },
  { code: "ca", label: "Canada", continent: "americas" },
  { code: "pe", label: "Peru", continent: "americas" },
  { code: "ve", label: "Venezuela", continent: "americas" },
  { code: "cl", label: "Chile", continent: "americas", kpop: true },
  { code: "gt", label: "Guatemala", continent: "americas" },
  { code: "ec", label: "Ecuador", continent: "americas", kpop: true },
  { code: "bo", label: "Bolivia", continent: "americas", kpop: true },
  { code: "do", label: "Dominican Republic", continent: "americas", kpop: true },
  { code: "cu", label: "Cuba", continent: "americas" },
  { code: "ht", label: "Haiti", continent: "americas" },
  { code: "cr", label: "Costa Rica", continent: "americas", kpop: true },
  { code: "pa", label: "Panama", continent: "americas", kpop: true },
  { code: "uy", label: "Uruguay", continent: "americas", kpop: true },
  { code: "py", label: "Paraguay", continent: "americas", kpop: true },

  /* ---- Africa ---- */
  { code: "ng", label: "Nigeria", continent: "africa" },
  { code: "et", label: "Ethiopia", continent: "africa" },
  { code: "eg", label: "Egypt", continent: "africa" },
  { code: "cd", label: "DR Congo", continent: "africa" },
  { code: "tz", label: "Tanzania", continent: "africa" },
  { code: "za", label: "South Africa", continent: "africa" },
  { code: "ke", label: "Kenya", continent: "africa" },
  { code: "sd", label: "Sudan", continent: "africa" },
  { code: "ug", label: "Uganda", continent: "africa" },
  { code: "dz", label: "Algeria", continent: "africa" },
  { code: "ma", label: "Morocco", continent: "africa" },
  { code: "ao", label: "Angola", continent: "africa" },
  { code: "mz", label: "Mozambique", continent: "africa" },
  { code: "gh", label: "Ghana", continent: "africa" },
  { code: "mg", label: "Madagascar", continent: "africa" },
  { code: "ci", label: "Côte d'Ivoire", continent: "africa" },
  { code: "cm", label: "Cameroon", continent: "africa" },
  { code: "ne", label: "Niger", continent: "africa" },
  { code: "ml", label: "Mali", continent: "africa" },
  { code: "bf", label: "Burkina Faso", continent: "africa" },
  { code: "mw", label: "Malawi", continent: "africa" },
  { code: "zm", label: "Zambia", continent: "africa" },
  { code: "td", label: "Chad", continent: "africa" },
  { code: "so", label: "Somalia", continent: "africa" },
  { code: "sn", label: "Senegal", continent: "africa" },
  { code: "zw", label: "Zimbabwe", continent: "africa" },
  { code: "gn", label: "Guinea", continent: "africa" },
  { code: "rw", label: "Rwanda", continent: "africa" },
  { code: "bj", label: "Benin", continent: "africa" },
  { code: "bi", label: "Burundi", continent: "africa" },
  { code: "tn", label: "Tunisia", continent: "africa", kpop: true },
  { code: "ss", label: "South Sudan", continent: "africa" },

  /* ---- Oceania ---- */
  { code: "au", label: "Australia", continent: "oceania" },
  { code: "nz", label: "New Zealand", continent: "oceania", kpop: true },
] as const;

/* ------------------------------------------------------------ 조회 도우미 */

/** 1단계에서 대한민국을 고르면 쓰는 값. 국가 코드 자리에 들어갑니다. */
export const KOREA = "kr";

const KR_BY_CODE = new Map(KR_REGIONS.map((r) => [r.code, r]));
const COUNTRY_BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

/** 대륙별로 묶은 국가 목록 — 고르는 화면이 그대로 렌더합니다. */
export const COUNTRIES_BY_CONTINENT: readonly {
  continent: Continent;
  label: string;
  countries: Country[];
}[] = (
  ["asia", "europe", "americas", "africa", "oceania"] as const
).map((continent) => ({
  continent,
  label: CONTINENT_LABEL[continent],
  countries: COUNTRIES.filter((c) => c.continent === continent).toSorted(
    (a, b) => a.label.localeCompare(b.label, "en"),
  ),
}));

/**
 * 지역 코드가 우리가 아는 값인지 확인하고 표기를 돌려줍니다.
 *
 * 코드는 폼에서 오므로 **반드시 이 함수를 통과시킨 뒤** 저장하세요. 목록에
 * 없는 코드는 null입니다.
 */
export function getRegion(code: string): Region | null {
  return KR_BY_CODE.get(code) ?? COUNTRY_BY_CODE.get(code) ?? null;
}

/** 국내 지역인지 (매칭 범위 안내 문구가 갈립니다). */
export function isKoreaRegion(code: string): boolean {
  return KR_BY_CODE.has(code);
}

/**
 * 시·도 표기 — 읽는 사람의 언어로.
 *
 * `Region.label`은 한국어 고정이라 사전을 먼저 찾고, 사전에 없으면 그 값으로
 * 떨어집니다. 해외 국가명은 원래부터 영어라 번역하지 않습니다.
 */
export function krRegionLabel(region: Region, t: Translate): string {
  const key = `regions.${region.code}`;
  const found = t(key);
  return found === key ? region.label : found;
}

/**
 * 화면에 보여 줄 전체 표기.
 *
 * 국내는 "대한민국 · 서울", 해외는 국가명만 씁니다. 해외 회원에게 국가 앞에
 * 대륙을 붙여 봤자 길기만 하고 알아보기 쉬워지지 않습니다.
 */
export function regionLabel(code: string, t: Translate): string | null {
  const kr = KR_BY_CODE.get(code);
  if (kr) return `${t("regions.korea")} · ${krRegionLabel(kr, t)}`;
  return COUNTRY_BY_CODE.get(code)?.label ?? null;
}
