import type { Waiter, WaiterStyle } from "@/lib/waiters";
import { cn } from "@/lib/utils";

/**
 * 라운지 매니저 일러스트 아바타. 복장 스타일에 따라 의상·칼라 디테일이 달라집니다.
 * `photoUrl`이 채워지면 사진을 우선 사용합니다(추후 실사 교체용).
 *
 * 사진처럼 사실적인 얼굴이 아닌, 브랜드 톤의 절제된 일러스트입니다.
 */

const SKIN = "#e7c6a2";
const SKIN_SHADOW = "#d3ac86";
const HAIR = "#211a15";

interface OutfitSpec {
  garment: string;
  /** 목/칼라 디테일 렌더 */
  detail: (accent: string) => React.ReactNode;
}

function outfitFor(style: WaiterStyle): OutfitSpec {
  switch (style) {
    case "tuxedo":
      return {
        garment: "#0f1013",
        detail: (a) => (
          <>
            {/* 셔츠 V */}
            <path d="M43 64 L50 84 L57 64 Z" fill="#f4f1ea" />
            {/* 보타이 */}
            <path d="M45 70 L50 73 L45 76 Z" fill={a} />
            <path d="M55 70 L50 73 L55 76 Z" fill={a} />
            <rect x="49" y="71.5" width="2" height="3" rx="0.6" fill={a} />
          </>
        ),
      };
    case "suit":
      return {
        garment: "#23262c",
        detail: (a) => (
          <>
            <path d="M44 64 L50 82 L56 64 Z" fill="#eceae4" />
            <rect x="48.6" y="66" width="2.8" height="18" rx="0.8" fill={a} />
          </>
        ),
      };
    case "casual":
      return {
        garment: "#3a3d45",
        detail: () => (
          <ellipse cx="50" cy="66" rx="9" ry="5" fill={SKIN} />
        ),
      };
    case "hiphop":
      return {
        garment: "#1b1d22",
        detail: (a) => (
          <>
            {/* 후드 */}
            <path d="M34 66 Q50 60 66 66 L64 74 Q50 68 36 74 Z" fill="#2a2d33" />
            {/* 체인 */}
            {[40, 44, 48, 52, 56, 60].map((x, i) => (
              <circle key={x} cx={x} cy={72 + Math.abs(i - 2.5)} r="1.3" fill={a} />
            ))}
          </>
        ),
      };
    case "smoking":
      return {
        garment: "#2a2130",
        detail: (a) => (
          <>
            {/* 새틴 라펠 */}
            <path d="M42 64 L50 84 L44 64 Z" fill={a} opacity="0.85" />
            <path d="M58 64 L50 84 L56 64 Z" fill={a} opacity="0.85" />
            <path d="M47 64 L50 80 L53 64 Z" fill="#f4f1ea" />
          </>
        ),
      };
    case "resort":
      return {
        garment: "#e9e6dd",
        detail: (a) => (
          <>
            <path d="M44 64 L50 82 L56 64 Z" fill="#0f1013" />
            {/* 포켓 스퀘어 */}
            <path d="M58 70 l4 0 l-2 3 Z" fill={a} />
          </>
        ),
      };
    case "allblack":
      return {
        garment: "#101114",
        // 터틀넥: 목을 덮는 높은 칼라
        detail: () => (
          <path d="M40 62 Q50 70 60 62 L60 68 Q50 74 40 68 Z" fill="#16171a" />
        ),
      };
    case "tweed":
      return {
        garment: "#4a4436",
        detail: (a) => (
          <>
            <path d="M44 64 L50 82 L56 64 Z" fill="#efece4" />
            <rect x="48.6" y="66" width="2.8" height="17" rx="0.8" fill={a} />
          </>
        ),
      };
    case "leather":
      return {
        garment: "#17181b",
        detail: (a) => (
          <>
            {/* 칼라 노치 */}
            <path d="M42 64 L50 74 L44 66 Z" fill="#26272b" />
            <path d="M58 64 L50 74 L56 66 Z" fill="#26272b" />
            {/* 지퍼 */}
            <rect x="49.3" y="66" width="1.4" height="18" rx="0.5" fill={a} />
          </>
        ),
      };
    case "hospitality":
      return {
        garment: "#e9e6dd",
        detail: (a) => (
          <>
            {/* 스탠드 칼라 + 트림 */}
            <path d="M42 63 Q50 69 58 63 L58 66 Q50 71 42 66 Z" fill="#dcd8cd" />
            <path d="M42 63 Q50 69 58 63" stroke={a} strokeWidth="1.2" fill="none" />
          </>
        ),
      };
  }
}

export function WaiterAvatar({
  waiter,
  className,
}: {
  waiter: Waiter;
  className?: string;
}) {
  const gid = `wa-${waiter.id}`;
  const spec = outfitFor(waiter.style);

  return (
    <div
      className={cn(
        "relative aspect-square overflow-hidden rounded-full",
        className,
      )}
    >
      {waiter.photoUrl ? (
        // 이미 400px WebP로 최적화된 정적 에셋이라 next/image 리사이즈가 불필요합니다.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={waiter.photoUrl}
          alt={`라운지 매니저 ${waiter.name}`}
          width={400}
          height={400}
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      ) : (
        <svg
          viewBox="0 0 100 100"
          role="img"
          aria-label={`라운지 매니저 ${waiter.name} — ${waiter.outfit}`}
          className="size-full"
        >
          <defs>
            <radialGradient id={`${gid}-bg`} cx="50%" cy="34%" r="75%">
              <stop offset="0%" stopColor={waiter.accent} stopOpacity="0.4" />
              <stop offset="60%" stopColor="#191a1d" stopOpacity="1" />
              <stop offset="100%" stopColor="#0f1013" stopOpacity="1" />
            </radialGradient>
            <clipPath id={`${gid}-clip`}>
              <circle cx="50" cy="50" r="50" />
            </clipPath>
          </defs>

          <g clipPath={`url(#${gid}-clip)`}>
            <rect width="100" height="100" fill={`url(#${gid}-bg)`} />

            {/* 어깨/의상 */}
            <path
              d="M20 100 C20 74 34 64 50 64 C66 64 82 74 82 100 Z"
              fill={spec.garment}
            />

            {/* 여성: 뒤쪽 긴 머리 (머리보다 먼저 그려 뒤에 위치) */}
            {waiter.gender === "female" ? (
              <path
                d="M30 40 Q28 20 50 19 Q72 20 70 40 Q71 58 66 74 L60 74 Q65 55 63 40 Q63 30 50 29 Q37 30 37 40 Q35 55 40 74 L34 74 Q29 58 30 40 Z"
                fill={HAIR}
              />
            ) : null}

            {/* 목 */}
            <rect x="45.5" y="52" width="9" height="14" rx="3" fill={SKIN_SHADOW} />

            {/* 머리 */}
            <ellipse cx="50" cy="40" rx="15" ry="17" fill={SKIN} />

            {/* 헤어(앞머리) */}
            {waiter.gender === "female" ? (
              <path
                d="M33 41 Q32 20 50 20 Q68 20 67 41 Q63 29 50 28 Q37 29 33 41 Z"
                fill={HAIR}
              />
            ) : (
              <>
                <path
                  d="M34 40 Q33 21 50 21 Q67 21 66 40 Q62 31 50 30 Q38 31 34 40 Z"
                  fill={HAIR}
                />
                <path
                  d="M35 39 Q36 33 42 31 Q38 35 38 41 Z"
                  fill={HAIR}
                  opacity="0.8"
                />
              </>
            )}

            {/* 의상 디테일(칼라/타이 등) */}
            {spec.detail(waiter.accent)}
          </g>

          {/* 액센트 링 */}
          <circle
            cx="50"
            cy="50"
            r="49"
            fill="none"
            stroke={waiter.accent}
            strokeOpacity="0.5"
            strokeWidth="1.5"
          />
        </svg>
      )}
    </div>
  );
}
