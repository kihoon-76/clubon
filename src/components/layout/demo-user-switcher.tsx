import { switchDemoUser } from "@/app/demo-actions";
import { DEMO_ACCOUNTS } from "@/lib/db/memory";

const ROLE_LABEL: Record<string, string> = {
  admin: "관리자",
  moderator: "모더레이터",
  user: "회원",
};

/**
 * 로그인 없이 둘러볼 때 쓰는 데모 회원 전환기.
 *
 * ⚠️ 데모 전용 — DATABASE_URL이 없는 인메모리 모드에서만 노출됩니다.
 * 관리자 화면처럼 역할이 필요한 기능도 로그인 없이 확인할 수 있게 해줍니다.
 */
export function DemoUserSwitcher({ currentUserId }: { currentUserId: string }) {
  if (process.env.DATABASE_URL) return null;

  return (
    <form action={switchDemoUser} className="flex items-center gap-1.5">
      <label htmlFor="demo-user" className="sr-only">
        데모 회원 전환
      </label>
      <select
        id="demo-user"
        name="userId"
        defaultValue={currentUserId}
        className="h-9 max-w-36 rounded-full border border-line bg-surface-raised px-3 text-xs text-muted transition-colors hover:border-champagne-dim"
        title="로그인 없이 둘러보기 — 데모 회원 전환"
      >
        {DEMO_ACCOUNTS.map((a) => (
          <option key={a.id} value={a.id}>
            {a.nickname} · {ROLE_LABEL[a.role] ?? a.role}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="h-9 rounded-full border border-line px-3 text-xs text-muted transition-colors hover:border-champagne-dim hover:text-ivory"
      >
        전환
      </button>
    </form>
  );
}
