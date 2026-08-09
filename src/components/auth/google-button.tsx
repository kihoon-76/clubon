import { isGoogleAuthConfigured } from "@/lib/auth/google";
import { getT } from "@/lib/i18n/server";

/**
 * Google 계속하기 버튼 + 구분선.
 *
 * 폼이 아니라 링크입니다 — OAuth 시작은 서버 액션(POST)이 아니라 라우트
 * 핸들러(GET)를 거쳐야 Google 동의 화면으로 최상위 이동이 됩니다.
 *
 * 키가 설정되지 않은 환경에서는 아무것도 그리지 않습니다. 눌러도 안 되는
 * 버튼을 보여주는 것보다 없는 편이 낫습니다.
 */
export async function GoogleButton({
  next,
  label,
}: {
  next?: string;
  label?: string;
}) {
  if (!isGoogleAuthConfigured()) return null;

  const t = await getT();
  const href = next
    ? `/api/auth/google?next=${encodeURIComponent(next)}`
    : "/api/auth/google";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4" aria-hidden>
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs text-faint">{t("auth.or")}</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <a
        href={href}
        className="flex h-11 w-full items-center justify-center gap-3 rounded-[var(--radius-control)] border border-line bg-surface-raised px-5 text-[0.9375rem] font-medium text-ivory transition-colors hover:border-champagne-dim hover:bg-surface-overlay"
      >
        <GoogleMark />
        {label ?? t("auth.google")}
      </a>
    </div>
  );
}

/** Google 공식 브랜드 마크. 색상은 브랜드 가이드 값이라 팔레트를 따르지 않습니다. */
function GoogleMark() {
  return (
    <svg aria-hidden viewBox="0 0 18 18" className="size-[18px] shrink-0">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}
