import { redirect } from "next/navigation";

import { AdultCheckForm } from "@/components/onboarding/adult-form";
import { OnboardingSteps } from "@/components/onboarding/steps";
import { Card, CardBody } from "@/components/ui/card";
import { getT } from "@/lib/i18n/server";
import { requireSession } from "@/lib/session";

export async function generateMetadata() {
  return { title: (await getT())("onboarding.adultTitle") };
}

export default async function AdultCheckPage() {
  const { user } = await requireSession("/onboarding/adult");
  if (user.adultConfirmedAt) redirect("/onboarding/consent");
  const t = await getT();

  return (
    <>
      <OnboardingSteps current="adult" />

      <h1 className="mt-8 font-display text-3xl text-ivory sm:text-4xl">
        {t("onboarding.adultTitle")}
      </h1>
      <p className="mt-3 text-[0.9375rem] leading-relaxed break-keep text-muted">
        {t("onboarding.adultIntro")}
      </p>

      <Card hairline className="mt-8">
        <CardBody>
          <AdultCheckForm />
        </CardBody>
      </Card>
    </>
  );
}
