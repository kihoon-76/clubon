import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Wordmark } from "@/components/brand/wordmark";

const NAV = [
  { href: "/#how", label: "이용 방식" },
  { href: "/#safety", label: "안전" },
  { href: "/membership", label: "멤버십" },
  { href: "/safety", label: "안전 센터" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link
          href="/"
          className="shrink-0"
          aria-label="ClubOn 홈으로 이동"
        >
          <Wordmark />
        </Link>

        <nav aria-label="주요 메뉴" className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
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
          <ButtonLink href="/lobby" variant="ghost" size="sm">
            로그인
          </ButtonLink>
          <ButtonLink href="/lobby" size="sm">
            입장 신청
          </ButtonLink>
        </div>
      </Container>
    </header>
  );
}
