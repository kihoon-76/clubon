import Link from "next/link";

import { Wordmark } from "@/components/brand/wordmark";
import { Container } from "@/components/layout/container";
import { SiteFooter } from "@/components/layout/site-footer";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="club-ambience flex min-h-screen flex-col bg-ink">
      <header className="border-b border-line/70">
        <Container className="flex h-16 items-center">
          <Link href="/" aria-label="ClubOn 홈으로 이동">
            <Wordmark />
          </Link>
        </Container>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-14">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
