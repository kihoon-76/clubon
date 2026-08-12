import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { LanguagePicker } from "@/components/layout/language-picker";
import { Wordmark } from "@/components/brand/wordmark";
import { getT } from "@/lib/i18n/server";

export async function SiteHeader() {
  const t = await getT();

  const nav = [
    { href: "/#how", label: t("footer.howItWorks") },
    { href: "/membership", label: t("nav.pricing") },
    { href: "/safety", label: t("footer.safetyCenter") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link href="/" className="shrink-0" aria-label="ClubOn">
          <Wordmark />
        </Link>

        <nav
          aria-label={t("nav.mainMenu")}
          className="hidden items-center gap-7 md:flex"
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted transition-colors hover:text-ivory"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <LanguagePicker />
          </div>
          <ButtonLink href="/login" variant="ghost" size="sm">
            {t("nav.login")}
          </ButtonLink>
          {/* 미리보기 단계 — 로그인 없이 바로 클럽에 입장할 수 있습니다. */}
          <ButtonLink href="/lobby" size="sm">
            {t("nav.enterNow")}
          </ButtonLink>
        </div>
      </Container>
    </header>
  );
}
