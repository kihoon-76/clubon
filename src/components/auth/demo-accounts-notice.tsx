import { KeyRound } from "lucide-react";

import { MockBadge } from "@/components/ui/badge";
import { DEMO_PASSWORD } from "@/lib/db/memory";

const DEMO_ACCOUNTS = [
  { email: "hana@clubon.test", label: "일반 회원 · 하나" },
  { email: "doyun@clubon.test", label: "상대 라운지 호스트 · 도윤" },
  { email: "admin@clubon.test", label: "관리자" },
];

/**
 * 인메모리 어댑터로 동작할 때만 노출되는 데모 계정 안내.
 * DATABASE_URL이 설정된 실제 배포에서는 렌더링되지 않습니다.
 */
export function DemoAccountsNotice() {
  if (process.env.DATABASE_URL) return null;

  return (
    <div className="mt-8 rounded-[var(--radius-card)] border border-line bg-surface/60 p-5">
      <div className="flex items-center gap-2">
        <KeyRound aria-hidden className="size-4 text-champagne" />
        <span className="text-sm text-ivory">데모 계정</span>
        <MockBadge />
      </div>
      <p className="mt-2 text-xs leading-relaxed text-faint">
        아직 데이터베이스가 연결되지 않아 인메모리 데모 데이터로 동작합니다.
        아래 계정으로 바로 둘러볼 수 있으며, 서버가 재시작되면 초기화됩니다.
      </p>
      <ul className="mt-3 space-y-1.5">
        {DEMO_ACCOUNTS.map((a) => (
          <li key={a.email} className="flex flex-wrap items-baseline gap-x-2 text-xs">
            <span className="font-mono text-ivory">{a.email}</span>
            <span className="text-faint">{a.label}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-faint">
        비밀번호 공통 ·{" "}
        <span className="font-mono text-ivory">{DEMO_PASSWORD}</span>
      </p>
    </div>
  );
}
