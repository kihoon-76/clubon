import Link from "next/link";
import { LogOut } from "lucide-react";

import { logout } from "@/app/(auth)/actions";
import { Wordmark } from "@/components/brand/wordmark";
import { Container } from "@/components/layout/container";
import { getT } from "@/lib/i18n/server";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getT();

  return (
    <div className="club-ambience flex min-h-screen flex-col bg-ink">
      <header className="border-b border-line/70">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" aria-label="ClubOn 홈으로 이동">
            <Wordmark />
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="flex h-11 items-center gap-2 rounded-full border border-line px-3 text-sm text-muted transition-colors hover:border-champagne-dim hover:text-ivory sm:h-9"
            >
              <LogOut aria-hidden className="size-4" />
              {t("nav.logout")}
            </button>
          </form>
        </Container>
      </header>
      <main className="flex flex-1 justify-center px-5 py-12 sm:py-16">
        <div className="w-full max-w-xl">{children}</div>
      </main>
    </div>
  );
}
