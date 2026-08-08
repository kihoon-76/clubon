import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { GoogleButton } from "@/components/auth/google-button";
import { SignupForm } from "@/components/auth/signup-form";
import { Card, CardBody } from "@/components/ui/card";
import { isAuthenticated } from "@/lib/session";

export const metadata = { title: "회원가입" };

export default async function SignupPage() {
  if (await isAuthenticated()) redirect("/lobby");

  return (
    <>
      <div className="text-center">
        <p className="label-caps">입장 신청</p>
        <h1 className="mt-3 font-display text-4xl text-ivory">
          클럽에 등록하기
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          만 19세 이상 성인 전용입니다. 가입 후 성인 확인과 동의 절차가
          이어집니다.
        </p>
      </div>

      <Card hairline className="mt-8">
        <CardBody className="space-y-6">
          <SignupForm />
          <GoogleButton label="Google로 가입하기" />
        </CardBody>
      </Card>

      <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-faint">
        <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-champagne-dim" />
        가입 시{" "}
        <Link href="/terms" className="text-muted underline underline-offset-2">
          이용약관
        </Link>{" "}
        및{" "}
        <Link href="/privacy" className="text-muted underline underline-offset-2">
          개인정보 처리방침
        </Link>
        에 대한 동의를 다음 단계에서 받습니다.
      </p>

      <p className="mt-6 text-center text-sm text-muted">
        이미 회원이신가요?{" "}
        <Link href="/login" className="text-champagne hover:text-champagne-soft">
          로그인
        </Link>
      </p>
    </>
  );
}
