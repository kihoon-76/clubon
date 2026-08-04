import type {
  ConversationEnergy,
  DesiredGender,
  Profile,
} from "@/lib/db/types";

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

export interface ScoreResult {
  eligible: boolean;
  score: number;
  reasons: string[];
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
  const ageBands = new Set(candidateProfiles.map((p) => p.ageBand));

  let score = 0;
  const reasons: string[] = [];

  if (pref.desiredGender !== "any") {
    score += 3;
    reasons.push(
      `원하는 성별(${pref.desiredGender === "female" ? "여성" : "남성"}) 일치`,
    );
  }

  const commonInterests = pref.interests.filter((i) => interests.has(i));
  if (commonInterests.length > 0) {
    score += commonInterests.length * 2;
    reasons.push(`공통 관심사: ${commonInterests.join(", ")}`);
  }

  if (candidateEnergy && candidateEnergy === pref.energy) {
    score += 2;
    reasons.push("대화 분위기 일치");
  }

  const commonAges = pref.ageBands.filter((a) => ageBands.has(a));
  if (commonAges.length > 0) {
    score += commonAges.length;
    reasons.push(`연령대: ${commonAges.join(", ")}`);
  }

  return { eligible: score > 0, score, reasons };
}
