import type { Club, OperatingHour } from "@/lib/db/types";

/**
 * 클럽 운영시간 판정. 서버가 진실의 원천이며, 클럽 타임존과 자정 넘김
 * (예: 18:00 → 익일 04:00)을 반영합니다.
 *
 * 참고: 한국(Asia/Seoul)은 DST가 없어 오프셋이 고정입니다. 타임존 변환은
 * 판정 시점의 오프셋을 사용하므로, DST 전환 순간의 경계에서는 미세한 오차가
 * 있을 수 있습니다(MVP 허용 범위).
 */

export interface ClubStatus {
  isOpen: boolean;
  /** 열려 있을 때: 이번 영업이 닫히는 시각 */
  closesAt: Date | null;
  /** 닫혀 있을 때: 다음으로 여는 시각 */
  opensAt: Date | null;
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

interface ZonedParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 0=일 … 6=토
}

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  });
  const parts = fmt.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    weekday: WEEKDAY_INDEX[get("weekday")] ?? 0,
  };
}

/** timeZone 로컬 벽시계 시각(Y-M-D H:M)을 실제 UTC Date로 변환합니다. */
function zonedToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const guessUtc = Date.UTC(year, month - 1, day, hour, minute);
  // guessUtc를 해당 타임존으로 다시 읽어 오프셋을 구하고 보정합니다.
  const p = getZonedParts(new Date(guessUtc), timeZone);
  const rendered = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  const offset = rendered - guessUtc;
  return new Date(guessUtc - offset);
}

function parseMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m ?? 0);
}

export function getClubStatus(
  club: Club,
  hours: OperatingHour[],
  nowDate: Date,
): ClubStatus {
  if (!club.isActive || hours.length === 0) {
    return { isOpen: false, closesAt: null, opensAt: null };
  }

  const tz = club.timezone;
  const p = getZonedParts(nowDate, tz);
  const nowMin = p.hour * 60 + p.minute;
  const byDay = new Map<number, OperatingHour>();
  for (const h of hours) byDay.set(h.dayOfWeek, h);

  // 1) 오늘 시작한 영업으로 열려 있는가
  const today = byDay.get(p.weekday);
  if (today) {
    const o = parseMinutes(today.opensAt);
    const c = parseMinutes(today.closesAt);
    if (!today.closesNextDay && nowMin >= o && nowMin < c) {
      return {
        isOpen: true,
        closesAt: zonedToUtc(p.year, p.month, p.day, Math.floor(c / 60), c % 60, tz),
        opensAt: null,
      };
    }
    if (today.closesNextDay && nowMin >= o) {
      // 익일 closesAt 에 닫힘
      const close = zonedToUtc(p.year, p.month, p.day + 1, Math.floor(c / 60), c % 60, tz);
      return { isOpen: true, closesAt: close, opensAt: null };
    }
  }

  // 2) 어제 시작해 자정을 넘긴 영업으로 열려 있는가
  const yesterday = byDay.get((p.weekday + 6) % 7);
  if (yesterday && yesterday.closesNextDay) {
    const c = parseMinutes(yesterday.closesAt);
    if (nowMin < c) {
      return {
        isOpen: true,
        closesAt: zonedToUtc(p.year, p.month, p.day, Math.floor(c / 60), c % 60, tz),
        opensAt: null,
      };
    }
  }

  // 3) 닫혀 있음 → 다음 여는 시각 탐색 (오늘 포함 7일)
  for (let offset = 0; offset <= 7; offset++) {
    const sched = byDay.get((p.weekday + offset) % 7);
    if (!sched) continue;
    const o = parseMinutes(sched.opensAt);
    const candidate = zonedToUtc(
      p.year,
      p.month,
      p.day + offset,
      Math.floor(o / 60),
      o % 60,
      tz,
    );
    if (candidate.getTime() > nowDate.getTime()) {
      return { isOpen: false, closesAt: null, opensAt: candidate };
    }
  }

  return { isOpen: false, closesAt: null, opensAt: null };
}

const KOREAN_WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * 클럽 로컬 기준으로 사람이 읽기 쉬운 시각 문자열을 만듭니다.
 * 예) "오늘 18:00", "내일 04:00", "금요일 18:00"
 */
export function formatClubTime(
  target: Date,
  timeZone: string,
  reference: Date,
): string {
  const t = getZonedParts(target, timeZone);
  const r = getZonedParts(reference, timeZone);

  const dayDiff = Math.round(
    (Date.UTC(t.year, t.month - 1, t.day) -
      Date.UTC(r.year, r.month - 1, r.day)) /
      86_400_000,
  );

  const hhmm = `${String(t.hour).padStart(2, "0")}:${String(t.minute).padStart(2, "0")}`;
  let label: string;
  if (dayDiff === 0) label = "오늘";
  else if (dayDiff === 1) label = "내일";
  else label = `${KOREAN_WEEKDAYS[t.weekday]}요일`;

  return `${label} ${hhmm}`;
}
