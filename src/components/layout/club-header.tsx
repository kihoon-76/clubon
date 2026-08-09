import Link from "next/link";
import { LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";

import { logout } from "@/app/(auth)/actions";
import { Container } from "@/components/layout/container";
import { DemoUserSwitcher } from "@/components/layout/demo-user-switcher";
import { Wordmark } from "@/components/brand/wordmark";
import { getT } from "@/lib/i18n/server";

/**
 * 클럽 내부 공용 헤더. 클럽 영업 상태와 회원 정보, 대시보드·관리자 진입점을
 * 제공합니다. 로그인 없이 둘러보는 중이면 데모 회원 전환기를 함께 노출합니다.
 */
export async function ClubHeader({
  userId,
  nickname,
  isOpen,
  statusText,
  isStaff = false,
  isAuthenticated = false,
}: {
  userId: string;
  nickname: string;
  isOpen: boolean;
  statusText: string;
  isStaff?: boolean;
  /** 실제 로그인 세션으로 들어온 회원인지 */
  isAuthenticated?: boolean;
}) {
  const t = await getT();

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/80 backdrop-blur-md">
      <Container className="flex min-h-16 flex-wrap items-center justify-between gap-3 py-2.5">
        <Link href="/lobby" aria-label={t("nav.toLobby")} className="shrink-0">
          <Wordmark />
        </Link>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span
            className="hidden items-center gap-2 rounded-full border border-line px-3 py-1.5 text-[0.6875rem] tracking-wide text-muted md:inline-flex"
            title={statusText}
          >
            <span
              aria-hidden
              className={
                isOpen
                  ? "size-1.5 rounded-full bg-success"
                  : "size-1.5 rounded-full bg-faint"
              }
            />
            <span className={isOpen ? "text-success" : "text-muted"}>
              {isOpen ? t("nav.open") : t("nav.closed")}
            </span>
          </span>

          {isAuthenticated ? null : <DemoUserSwitcher currentUserId={userId} />}

          {isStaff ? (
            <IconLink href="/admin" label={t("nav.adminConsole")}>
              <ShieldCheck aria-hidden className="size-4" />
            </IconLink>
          ) : null}

          <IconLink href="/dashboard" label={t("nav.myDashboard")}>
            <LayoutDashboard aria-hidden className="size-4" />
            <span className="hidden text-sm text-ivory sm:inline">{nickname}</span>
          </IconLink>

          {isAuthenticated ? (
            <form action={logout}>
              <button
                type="submit"
                aria-label={t("nav.logout")}
                title={t("nav.logout")}
                className="flex size-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-champagne-dim hover:text-ivory"
              >
                <LogOut aria-hidden className="size-4" />
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="flex h-9 items-center rounded-full border border-line px-3 text-xs text-muted transition-colors hover:border-champagne-dim hover:text-ivory"
            >
              {t("nav.login")}
            </Link>
          )}
        </div>
      </Container>
    </header>
  );
}

function IconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      className="flex h-9 items-center gap-2 rounded-full border border-line px-3 text-muted transition-colors hover:border-champagne-dim hover:text-ivory"
    >
      {children}
    </Link>
  );
}
