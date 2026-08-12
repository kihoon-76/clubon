import type { Club, OperatingHour } from "@/lib/db/types";
import type { Translate } from "@/lib/i18n/types";

export interface ClubStatusView {
  isOpen: boolean;
  short: string;
  opensAtText: string | null;
  closesAtText: string | null;
}

/** ClubOn은 전 세계 사용자를 위해 연중무휴 24시간 운영됩니다. */
export function describeClubStatus(
  _club: Club,
  _hours: OperatingHour[],
  _now: Date,
  t: Translate,
): ClubStatusView {
  return {
    isOpen: true,
    short: t("club.alwaysOpen"),
    opensAtText: null,
    closesAtText: null,
  };
}
