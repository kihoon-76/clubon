import type {
  ConversationEnergy,
  DesiredGender,
  Profile,
} from "@/lib/db/types";
import type { Translate } from "@/lib/i18n/types";
import {
  AGE_BAND_OPTIONS,
  ageBandLabel,
  genderLabel,
  interestLabel,
} from "@/lib/match-options";

/**
 * 라운지 매칭 공통 점수 로직. 인메모리/Postgres 어댑터가 동일하게 사용합니다.
 * 원하는 상대 스타일(성별·관심사·분위기·연령대)과 후보 라운지의 공통점으로
 * 점수를 매깁니다.
 */
export interface MatchPreferenceValues {
  desiredGender: DesiredGender;
  energy: ConversationEnergy;
  interests: string[];
  ageBands: string[];
}

/**
 * 두 라운지가 왜 어울리는지 — **문장이 아니라 사실**로 남깁니다.
 *
 * 이 값은 부킹 행에 저장되고 양쪽 라운지가 함께 봅니다. 두 라운지의 회원이
 * 서로 다른 언어를 쓸 수 있으므로, 저장 시점에 문장으로 굳히면 누군가는
 * 읽지 못하는 이유를 보게 됩니다. 그래서 사실만 담고 문장은 화면에서
 * 각자의 언어로 만듭니다(`describeReason`).
 */
export type MatchReason =
  | { kind: "gender"; gender: Exclude<DesiredGender, "any"> }
  | { kind: "interests"; values: string[] }
  | { kind: "energy" }
  | { kind: "ageBands"; values: string[] };

export interface ScoreResult {
  eligible: boolean;
  score: number;
  reasons: MatchReason[];
}

export function scoreCandidate(
  pref: MatchPreferenceValues,
  candidateProfiles: Profile[],
  candidateEnergy: ConversationEnergy | null,
): ScoreResult {
  const genders = new Set(candidateProfiles.map((p) => p.gender));

  // 성별 선호가 명확하면 해당 성별이 있는 라운지만 후보로 인정.
  if (pref.desiredGender !== "any" && !genders.has(pref.desiredGender)) {
    return { eligible: false, score: 0, reasons: [] };
  }

  const interests = new Set(candidateProfiles.flatMap((p) => p.interests));
  const ageBands = new Set(
    candidateProfiles.map((profile) =>
      AGE_BAND_OPTIONS.find((band) => profile.ageBand.startsWith(band)) ??
      profile.ageBand,
    ),
  );

  let score = 0;
  const reasons: MatchReason[] = [];

  if (pref.desiredGender !== "any") {
    score += 3;
    reasons.push({ kind: "gender", gender: pref.desiredGender });
  }

  const commonInterests = pref.interests.filter((i) => interests.has(i));
  if (commonInterests.length > 0) {
    score += commonInterests.length * 2;
    reasons.push({ kind: "interests", values: commonInterests });
  }

  if (candidateEnergy && candidateEnergy === pref.energy) {
    score += 2;
    reasons.push({ kind: "energy" });
  }

  const commonAges = pref.ageBands.filter((a) => ageBands.has(a));
  if (commonAges.length > 0) {
    score += commonAges.length;
    reasons.push({ kind: "ageBands", values: commonAges });
  }

  return { eligible: score > 0, score, reasons };
}

/**
 * 저장된 사유를 읽는 사람의 언어로 옮깁니다.
 *
 * 구조가 바뀌기 전에 저장된 부킹에는 문장이 그대로 들어 있습니다. 부킹은
 * 만료되는 값이라 곧 사라지지만, 그때까지 화면이 비어 보이지 않도록 문자열은
 * 그대로 통과시킵니다.
 */
export function describeReason(t: Translate, reason: MatchReason | string): string {
  if (typeof reason === "string") return reason;

  switch (reason.kind) {
    case "gender":
      return t("match.reasonGender", {
        gender: genderLabel(t, reason.gender),
      });
    case "interests":
      return t("match.reasonInterests", {
        values: reason.values.map((v) => interestLabel(t, v)).join(", "),
      });
    case "energy":
      return t("match.reasonEnergy");
    case "ageBands":
      return t("match.reasonAgeBands", {
        values: reason.values.map((v) => ageBandLabel(t, v)).join(", "),
      });
  }
}
