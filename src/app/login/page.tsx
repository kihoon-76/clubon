import Link from "next/link";

import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { Wordmark } from "@/components/brand/wordmark";
import { Container } from "@/components/layout/container";
import { Card, CardBody } from "@/components/ui/card";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <main className="club-ambience flex min-h-screen items-center py-16">
      <Container className="w-full">
        <div className="mx-auto max-w-md">
          <Link href="/" aria-label="ClubOn 홈으로 이동">
            <Wordmark />
          </Link>

          <Card hairline className="mt-8">
            <CardBody className="p-7 sm:p-9">
              <p className="label-caps">Welcome to ClubOn</p>
              <h1 className="mt-4 font-display text-4xl text-ivory">
                다시 만나서 반가워요
              </h1>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
                Google 계정으로 안전하게 로그인하고 ClubOn을 시작하세요.
              </p>

              {error ? (
                <p
                  role="alert"
                  className="mt-6 rounded-[var(--radius-control)] border border-danger/40 bg-danger-dim px-4 py-3 text-sm text-danger"
                >
                  인증을 완료하지 못했습니다. 다시 시도해 주세요.
                </p>
              ) : null}

              <div className="mt-8">
                <GoogleLoginButton />
              </div>

              <p className="mt-6 text-xs leading-relaxed text-faint">
                계속하면 ClubOn의{" "}
                <Link href="/terms" className="text-muted underline hover:text-ivory">
                  이용약관
                </Link>
                과{" "}
                <Link href="/privacy" className="text-muted underline hover:text-ivory">
                  개인정보처리방침
                </Link>
                에 동의하게 됩니다.
              </p>
            </CardBody>
          </Card>
        </div>
      </Container>
    </main>
  );
}
