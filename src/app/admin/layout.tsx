import Link from "next/link";

import { logout } from "@/app/(auth)/actions";
import { Wordmark } from "@/components/brand/wordmark";
import { Container } from "@/components/layout/container";
import { DemoUserSwitcher } from "@/components/layout/demo-user-switcher";
import { Badge } from "@/components/ui/badge";
import { isAuthenticated, requireStaffSession } from "@/lib/session";

const NAV = [
  { href: "/admin", label: "개요" },
  { href: "/admin/reports", label: "신고" },
  { href: "/admin/moderation", label: "모더레이션" },
  { href: "/admin/sessions", label: "세션" },
  { href: "/admin/payments", label: "결제" },
  { href: "/admin/users", label: "회원" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await requireStaffSession();
  const loggedIn = await isAuthenticated();

  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <header className="border-b border-line/70 bg-surface/60">
        <Container className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/lobby" aria-label="클럽으로 돌아가기">
              <Wordmark />
            </Link>
            <Badge tone="gold">
              {user.role === "admin" ? "관리자" : "모더레이터"}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline">
              {profile?.nickname ?? user.email}
            </span>
            {loggedIn ? (
              <form action={logout}>
                <button
                  type="submit"
                  className="text-sm text-muted transition-colors hover:text-ivory"
                >
                  로그아웃
                </button>
              </form>
            ) : (
              <DemoUserSwitcher currentUserId={user.id} />
            )}
          </div>
        </Container>

        <Container>
          <nav aria-label="관리자 메뉴" className="-mb-px flex gap-1 overflow-x-auto">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap border-b-2 border-transparent px-4 py-3 text-sm text-muted transition-colors hover:border-champagne-dim hover:text-ivory"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </Container>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
