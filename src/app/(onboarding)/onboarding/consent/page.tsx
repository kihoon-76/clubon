import { redirect } from "next/navigation";
import { Info } from "lucide-react";

import { ConsentForm } from "@/components/onboarding/consent-form";
import { OnboardingSteps } from "@/components/onboarding/steps";
import { Card, CardBody } from "@/components/ui/card";
import { getDb } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { requireSession } from "@/lib/session";

export async function generateMetadata() {
  return { title: (await getT())("onboarding.stepConsent") };
}

export default async function ConsentPage() {
  const { user } = await requireSession("/onboarding/consent");
  if (!user.adultConfirmedAt) redirect("/onboarding/adult");
  const t = await getT();

  const consents = await getDb().getConsents(user.id);
  const granted = consents.filter((c) => c.granted).map((c) => c.consentType);

  return (
    <>
      <OnboardingSteps current="consent" />

      <h1 className="mt-8 font-display text-3xl text-ivory sm:text-4xl">
        {t("onboarding.consentTitle")}
      </h1>
      <p className="mt-3 text-[0.9375rem] leading-relaxed break-keep text-muted">
        {t("onboarding.consentIntro")}
      </p>

      <div className="mt-6 flex items-start gap-3 rounded-[var(--radius-control)] border border-line bg-surface/60 p-4">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-champagne" />
        <p className="text-xs leading-relaxed break-keep text-muted">
          {t("onboarding.consentNotice")}
        </p>
      </div>

      <Card hairline className="mt-6">
        <CardBody>
          <ConsentForm granted={granted} />
        </CardBody>
      </Card>
    </>
  );
}
