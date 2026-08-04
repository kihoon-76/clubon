import Link from "next/link";

import { Wordmark } from "@/components/brand/wordmark";
import { Container } from "@/components/layout/container";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="club-ambience flex min-h-screen flex-col bg-ink">
      <header className="border-b border-line/70">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" aria-label="ClubOn 홈으로 이동">
            <Wordmark />
          </Link>
          <span className="label-caps">입장 준비</span>
        </Container>
      </header>
      <main className="flex flex-1 justify-center px-5 py-12 sm:py-16">
        <div className="w-full max-w-xl">{children}</div>
      </main>
    </div>
  );
}
