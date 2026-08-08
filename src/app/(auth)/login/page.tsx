import Link from "next/link";
import { redirect } from "next/navigation";

import { GoogleButton } from "@/components/auth/google-button";
import { LoginForm } from "@/components/auth/login-form";
import { DemoAccountsNotice } from "@/components/auth/demo-accounts-notice";
import { Card, CardBody } from "@/components/ui/card";
import { FormError } from "@/components/ui/field";
import { isAuthenticated } from "@/lib/session";

export const metadata = { title: "로그인" };

/**
 * 소셜 로그인 실패 사유. 라우트 핸들러는 화면을 그리지 않으므로 코드만
 * 넘겨주고, 문구는 여기서 붙입니다. 모르는 코드는 무시합니다.
 */
const ERROR_MESSAGES: Record<string, string> = {
  google_unavailable: "Google 로그인이 아직 설정되지 않았습니다.",
  google_cancelled: "Google 로그인을 취소했습니다.",
  google_state:
    "로그인 요청이 만료되었거나 올바르지 않습니다. 다시 시도해 주세요.",
  google_failed: "Google 계정을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
  account_restricted: "이용이 제한된 계정입니다. 안전센터로 문의해 주세요.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (await isAuthenticated()) redirect("/lobby");

  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  const error =
    typeof sp.error === "string" ? ERROR_MESSAGES[sp.error] : undefined;

  return (
    <>
      <div className="text-center">
        <p className="label-caps">회원 입장</p>
        <h1 className="mt-3 font-display text-4xl text-ivory">다시 오셨군요</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          오늘 저녁 자리를 안내해 드릴게요.
        </p>
      </div>

      {error ? (
        <div className="mt-8">
          <FormError message={error} />
        </div>
      ) : null}

      <Card hairline className="mt-8">
        <CardBody className="space-y-6">
          <LoginForm next={next} />
          <GoogleButton next={next} />
        </CardBody>
      </Card>

      <p className="mt-6 text-center text-sm text-muted">
        아직 회원이 아니신가요?{" "}
        <Link href="/signup" className="text-champagne hover:text-champagne-soft">
          가입하기
        </Link>
      </p>

      <DemoAccountsNotice />
    </>
  );
}
