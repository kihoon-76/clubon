import Link from "next/link";
import { redirect } from "next/navigation";

import { GoogleButton } from "@/components/auth/google-button";
import { LoginForm } from "@/components/auth/login-form";
import { DemoAccountsNotice } from "@/components/auth/demo-accounts-notice";
import { Card, CardBody } from "@/components/ui/card";
import { FormError } from "@/components/ui/field";
import { getT } from "@/lib/i18n/server";
import { isAuthenticated } from "@/lib/session";

export async function generateMetadata() {
  return { title: (await getT())("nav.login") };
}

/**
 * 소셜 로그인 실패 사유. 라우트 핸들러는 화면을 그리지 않으므로 코드만
 * 넘겨주고, 문구는 여기서 붙입니다. 모르는 코드는 무시합니다.
 */
const ERROR_CODES = new Set([
  "google_unavailable",
  "google_cancelled",
  "google_state",
  "google_failed",
  "account_restricted",
]);

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (await isAuthenticated()) redirect("/lobby");

  const sp = await searchParams;
  const t = await getT();
  const next = typeof sp.next === "string" ? sp.next : undefined;
  const error =
    typeof sp.error === "string" && ERROR_CODES.has(sp.error)
      ? t(`auth.errors.${sp.error}`)
      : undefined;

  return (
    <>
      <div className="text-center">
        <p className="label-caps">{t("auth.loginEyebrow")}</p>
        <h1 className="mt-3 font-display text-4xl text-ivory">
          {t("auth.loginTitle")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed break-keep text-muted">
          {t("auth.loginIntro")}
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
        {t("auth.noAccount")}{" "}
        <Link href="/signup" className="text-champagne hover:text-champagne-soft">
          {t("nav.signup")}
        </Link>
      </p>

      <DemoAccountsNotice />
    </>
  );
}
