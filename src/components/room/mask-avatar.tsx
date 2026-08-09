import type { Translate } from "@/lib/i18n/types";
import type { MaskId } from "@/lib/runtime/types";
import { cn } from "@/lib/utils";

/**
 * 동물 마스크 아바타.
 *
 * ⚠️ 실시간 얼굴 추적 기반 마스크 렌더는 Phase 2 범위입니다. 여기서는
 * 참가자별로 배정된 마스크를 도형으로 표현하며, 어떤 경우에도 원본 얼굴을
 * 노출하지 않습니다.
 */

export function maskLabel(t: Translate, mask: MaskId): string {
  return t(`masks.${mask}`);
}

const MASK_ACCENT: Record<MaskId, string> = {
  fox: "#c08a55",
  cat: "#9a8fb0",
  rabbit: "#c2b6a8",
  bear: "#8a7059",
  wolf: "#7b8794",
};

/** 마스크별 귀 모양 (viewBox 0 0 100 100 기준) */
const EARS: Record<MaskId, React.ReactNode> = {
  fox: (
    <>
      <path d="M22 34 L26 8 L46 24 Z" />
      <path d="M78 34 L74 8 L54 24 Z" />
    </>
  ),
  cat: (
    <>
      <path d="M24 32 L28 10 L48 26 Z" />
      <path d="M76 32 L72 10 L52 26 Z" />
    </>
  ),
  rabbit: (
    <>
      <ellipse cx="38" cy="16" rx="8" ry="20" />
      <ellipse cx="62" cy="16" rx="8" ry="20" />
    </>
  ),
  bear: (
    <>
      <circle cx="26" cy="26" r="13" />
      <circle cx="74" cy="26" r="13" />
    </>
  ),
  wolf: (
    <>
      <path d="M20 36 L22 6 L48 26 Z" />
      <path d="M80 36 L78 6 L52 26 Z" />
    </>
  ),
};

export function MaskAvatar({
  mask,
  t,
  className,
  dimmed = false,
}: {
  mask: MaskId;
  /** 대체 텍스트에 마스크 이름이 들어갑니다. */
  t: Translate;
  className?: string;
  /** 블러 처리 등으로 흐리게 표시 */
  dimmed?: boolean;
}) {
  const accent = MASK_ACCENT[mask];

  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={t("room.maskAria", { mask: maskLabel(t, mask) })}
      className={cn("size-full", dimmed && "opacity-40 blur-[3px]", className)}
    >
      <defs>
        <linearGradient id={`mask-${mask}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.95" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.55" />
        </linearGradient>
      </defs>

      <g fill={`url(#mask-${mask})`}>{EARS[mask]}</g>

      {/* 얼굴 판 */}
      <ellipse
        cx="50"
        cy="58"
        rx="30"
        ry="32"
        fill={`url(#mask-${mask})`}
        stroke="rgba(216,190,134,0.45)"
        strokeWidth="1.2"
      />

      {/* 눈구멍 — 마스크임을 분명히 하는 요소 */}
      <ellipse cx="39" cy="54" rx="6.5" ry="4.5" fill="#0b0b0c" />
      <ellipse cx="61" cy="54" rx="6.5" ry="4.5" fill="#0b0b0c" />

      {/* 코·주둥이 */}
      <path
        d="M50 64 L44 72 Q50 78 56 72 Z"
        fill="#0b0b0c"
        opacity="0.85"
      />

      {/* 골드 헤어라인 장식 */}
      <path
        d="M30 44 Q50 36 70 44"
        fill="none"
        stroke="rgba(216,190,134,0.7)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * 상호 공개가 확정된 뒤 표시되는 아바타.
 *
 * ⚠️ 실제 화상 스트림이 연결되기 전 단계이므로, 공개 상태에서도 실사 얼굴이
 * 아니라 회원의 표시용 아바타를 보여줍니다. 상태 전이 자체는 실제 서버
 * 기록을 따릅니다.
 */
export function RevealedAvatar({
  nickname,
  className,
}: {
  nickname: string;
  className?: string;
}) {
  const initial = nickname.trim().slice(0, 1) || "?";
  return (
    <div
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-gradient-to-b from-champagne/35 to-champagne-dim/20",
        className,
      )}
    >
      <span className="font-display text-4xl text-champagne-soft">{initial}</span>
    </div>
  );
}
