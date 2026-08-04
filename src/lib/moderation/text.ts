/**
 * 규칙 기반 텍스트 모더레이션.
 *
 * ⚠️ 자동 탐지는 모든 위반을 완벽하게 잡아내지 못합니다. UI 문구에서도
 * 한계를 명시하며, 최종 판단은 신고·관리자 검토 경로가 담당합니다.
 *
 * `ModerationProvider` 인터페이스를 만족하므로, 추후 외부 API 구현으로
 * 교체할 수 있습니다.
 */

export type ModerationStatus = "allowed" | "flagged" | "blocked";
export type Severity = "low" | "medium" | "high" | "critical";

export type ModerationCategory =
  | "harassment"
  | "hate_speech"
  | "threat"
  | "sexual_harassment"
  | "spam"
  | "contact_info"
  | "social_handle"
  | "payment_solicitation"
  | "prostitution"
  | "minor_contact";

export interface ModerationVerdict {
  status: ModerationStatus;
  category: ModerationCategory | null;
  severity: Severity | null;
  /** 발신자에게 보여줄 사유 */
  reason: string | null;
}

interface Rule {
  category: ModerationCategory;
  severity: Severity;
  status: ModerationStatus;
  pattern: RegExp;
  reason: string;
}

/**
 * 규칙은 한국어·영어를 함께 다룹니다. 정규식은 과잉 차단을 피하기 위해
 * 되도록 구체적으로 작성하고, 애매한 경우 blocked 대신 flagged로 둡니다.
 */
const RULES: Rule[] = [
  {
    category: "minor_contact",
    severity: "critical",
    status: "blocked",
    pattern: /(미성년|중학생|고등학생|초등학생|하이틴|\b1[0-8]\s*살|\b1[0-8]\s*세)\b/i,
    reason: "미성년자 관련 표현은 허용되지 않습니다.",
  },
  {
    category: "prostitution",
    severity: "critical",
    status: "blocked",
    pattern: /(조건\s*만남|성매매|출장\s*안마|스폰|sugar\s*daddy|escort)/i,
    reason: "성매매·알선으로 판단되는 표현은 허용되지 않습니다.",
  },
  {
    category: "threat",
    severity: "high",
    status: "blocked",
    pattern: /(죽여|죽인다|찾아가서\s*(패|때)|신상\s*털|가만\s*안\s*둬|kill you)/i,
    reason: "협박으로 판단되는 표현은 허용되지 않습니다.",
  },
  {
    category: "sexual_harassment",
    severity: "high",
    status: "blocked",
    pattern: /(가슴\s*사이즈|몸매\s*좀|벗어\s*봐|야한\s*거|섹스|자위|nudes?\b|sext)/i,
    reason: "성적 괴롭힘으로 판단되는 표현은 허용되지 않습니다.",
  },
  {
    category: "hate_speech",
    severity: "high",
    status: "blocked",
    pattern: /(한남충|김치녀|된장녀|틀딱|급식충|장애인\s*새끼|병신|정신병자\s*같|faggot|retard)/i,
    reason: "혐오 표현은 허용되지 않습니다.",
  },
  {
    category: "harassment",
    severity: "medium",
    status: "blocked",
    pattern: /(씨발|시발|개새끼|좆|지랄|꺼져\s*새끼|fuck you|bitch)/i,
    reason: "모욕적인 표현은 허용되지 않습니다.",
  },
  {
    category: "payment_solicitation",
    severity: "medium",
    status: "blocked",
    pattern: /(계좌번호|입금\s*해|송금\s*해|후원\s*계좌|비트코인\s*보내|투자\s*리딩)/i,
    reason: "금전 요구로 판단되는 표현은 허용되지 않습니다.",
  },
  {
    category: "contact_info",
    severity: "medium",
    status: "blocked",
    pattern: /(01[016-9][ -.]?\d{3,4}[ -.]?\d{4})|(\b[\w.+-]+@[\w-]+\.[a-z]{2,}\b)/i,
    reason:
      "전화번호·이메일 등 외부 연락처는 클럽 밖 위험을 키울 수 있어 공유할 수 없습니다.",
  },
  {
    category: "social_handle",
    severity: "low",
    status: "flagged",
    pattern: /(카톡|카카오톡|텔레\s*그램|telegram|인스타|instagram|@[a-z0-9._]{3,})/i,
    reason: "외부 SNS 계정 공유는 권장되지 않습니다.",
  },
  {
    category: "spam",
    severity: "low",
    status: "flagged",
    pattern: /(https?:\/\/|www\.)\S+/i,
    reason: "외부 링크는 검토 대상입니다.",
  },
];

const ALLOWED: ModerationVerdict = {
  status: "allowed",
  category: null,
  severity: null,
  reason: null,
};

export function checkText(body: string): ModerationVerdict {
  const text = body.normalize("NFKC");

  // 같은 문자를 길게 반복하는 도배
  if (/(.)\1{14,}/.test(text)) {
    return {
      status: "blocked",
      category: "spam",
      severity: "low",
      reason: "같은 문자를 반복하는 도배는 허용되지 않습니다.",
    };
  }

  for (const rule of RULES) {
    if (rule.pattern.test(text)) {
      return {
        status: rule.status,
        category: rule.category,
        severity: rule.severity,
        reason: rule.reason,
      };
    }
  }
  return ALLOWED;
}
