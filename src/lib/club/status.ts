import type { Club, OperatingHour } from "@/lib/db/types";

import { formatClubTime, getClubStatus } from "./hours";

/**
 * 화면 표시에 필요한 클럽 상태 요약. 게이트 판정과 UI 문구를 한 곳에서
 * 만들어 로비·마감·헤더가 동일한 문구를 공유하도록 합니다.
 */
export interface ClubStatusView {
  isOpen: boolean;
  /** 헤더용 짧은 문구. 예) "내일 04:00까지", "오늘 18:00 오픈" */
  short: string;
  /** 다음 여는 시각(닫혀 있을 때) */
  opensAtText: string | null;
  /** 이번 영업 종료 시각(열려 있을 때) */
  closesAtText: string | null;
}

export function describeClubStatus(
  club: Club,
  hours: OperatingHour[],
  now: Date,
): ClubStatusView {
  // 미리보기 편의: 기본적으로 운영시간 제한을 해제해 항상 영업 중으로 표시합니다.
  // 실제 운영시간 게이트를 적용하려면 CLUBON_ENFORCE_HOURS=1 로 실행하세요.
  if (process.env.CLUBON_ENFORCE_HOURS !== "1") {
    return {
      isOpen: true,
      short: "상시 오픈",
      opensAtText: null,
      closesAtText: null,
    };
  }

  const status = getClubStatus(club, hours, now);
  const tz = club.timezone;

  if (status.isOpen && status.closesAt) {
    const closes = formatClubTime(status.closesAt, tz, now);
    return {
      isOpen: true,
      short: `${closes}까지`,
      opensAtText: null,
      closesAtText: closes,
    };
  }

  if (!status.isOpen && status.opensAt) {
    const opens = formatClubTime(status.opensAt, tz, now);
    return {
      isOpen: false,
      short: `${opens} 오픈`,
      opensAtText: opens,
      closesAtText: null,
    };
  }

  return {
    isOpen: status.isOpen,
    short: status.isOpen ? "영업 중" : "운영시간 미정",
    opensAtText: null,
    closesAtText: null,
  };
}
