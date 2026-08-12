import { KeyRound } from "lucide-react";

import { MockBadge } from "@/components/ui/badge";
import { DEMO_PASSWORD } from "@/lib/db/memory";
import { getT } from "@/lib/i18n/server";

const DEMO_ACCOUNTS = [
  { email: "hana@clubon.test", key: "auth.demoMember" },
  { email: "doyun@clubon.test", key: "auth.demoHost" },
  { email: "admin@clubon.test", key: "auth.demoAdmin" },
];

/**
 * 인메모리 어댑터로 동작할 때만 노출되는 데모 계정 안내.
 * DATABASE_URL이 설정된 실제 배포에서는 렌더링되지 않습니다.
 */
export async function DemoAccountsNotice() {
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) return null;
  const t = await getT();

  return (
    <div className="mt-8 rounded-[var(--radius-card)] border border-line bg-surface/60 p-5">
      <div className="flex items-center gap-2">
        <KeyRound aria-hidden className="size-4 text-champagne" />
        <span className="text-sm text-ivory">{t("auth.demoTitle")}</span>
        <MockBadge />
      </div>
      <p className="mt-2 text-xs leading-relaxed break-keep text-faint">
        {t("auth.demoIntro")}
      </p>
      <ul className="mt-3 space-y-1.5">
        {DEMO_ACCOUNTS.map((a) => (
          <li key={a.email} className="flex flex-wrap items-baseline gap-x-2 text-xs">
            <span className="font-mono text-ivory">{a.email}</span>
            <span className="text-faint">{t(a.key)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-faint">
        {t("auth.demoPassword")} ·{" "}
        <span className="font-mono text-ivory">{DEMO_PASSWORD}</span>
      </p>
    </div>
  );
}
