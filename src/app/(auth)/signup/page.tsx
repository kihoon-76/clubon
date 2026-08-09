import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { GoogleButton } from "@/components/auth/google-button";
import { SignupForm } from "@/components/auth/signup-form";
import { Card, CardBody } from "@/components/ui/card";
import { getT } from "@/lib/i18n/server";
import { isAuthenticated } from "@/lib/session";

export async function generateMetadata() {
  return { title: (await getT())("auth.signupTitle") };
}

export default async function SignupPage() {
  if (await isAuthenticated()) redirect("/lobby");
  const t = await getT();

  return (
    <>
      <div className="text-center">
        <p className="label-caps">{t("auth.signupEyebrow")}</p>
        <h1 className="mt-3 font-display text-4xl text-ivory">
          {t("auth.signupHeadline")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed break-keep text-muted">
          {t("auth.signupIntro")}
        </p>
      </div>

      <Card hairline className="mt-8">
        <CardBody className="space-y-6">
          <SignupForm />
          <GoogleButton label={t("auth.googleSignup")} />
        </CardBody>
      </Card>

      <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed break-keep text-faint">
        <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-champagne-dim" />
        <span>
          {t("auth.legalNoticeBefore")}{" "}
          <Link href="/terms" className="text-muted underline underline-offset-2">
            {t("footer.terms")}
          </Link>{" "}
          {t("auth.legalNoticeBetween")}{" "}
          <Link
            href="/privacy"
            className="text-muted underline underline-offset-2"
          >
            {t("footer.privacy")}
          </Link>
          {t("auth.legalNoticeAfter")}
        </span>
      </p>

      <p className="mt-6 text-center text-sm text-muted">
        {t("auth.haveAccount")}{" "}
        <Link href="/login" className="text-champagne hover:text-champagne-soft">
          {t("nav.login")}
        </Link>
      </p>
    </>
  );
}
