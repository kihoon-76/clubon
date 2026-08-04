import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { DemoAccountsNotice } from "@/components/auth/demo-accounts-notice";
import { Card, CardBody } from "@/components/ui/card";
import { isAuthenticated } from "@/lib/session";

export const metadata = { title: "로그인" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (await isAuthenticated()) redirect("/lobby");

  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;

  return (
    <>
      <div className="text-center">
        <p className="label-caps">회원 입장</p>
        <h1 className="mt-3 font-display text-4xl text-ivory">다시 오셨군요</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          오늘 저녁 자리를 안내해 드릴게요.
        </p>
      </div>

      <Card hairline className="mt-8">
        <CardBody>
          <LoginForm next={next} />
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
