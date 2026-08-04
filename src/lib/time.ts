/**
 * 서버 기준 현재 시각. 운영시간·매칭 만료 등 시간 판정의 단일 출처입니다.
 *
 * 개발/테스트 편의를 위해, 프로덕션이 아닐 때에 한해 `CLUBON_DEV_NOW`
 * 환경변수(ISO 문자열)로 "현재 시각"을 고정할 수 있습니다. 프로덕션에서는
 * 항상 실제 시각을 사용합니다.
 */
export function now(): Date {
  if (process.env.NODE_ENV !== "production" && process.env.CLUBON_DEV_NOW) {
    const overridden = new Date(process.env.CLUBON_DEV_NOW);
    if (!Number.isNaN(overridden.getTime())) return overridden;
  }
  return new Date();
}
