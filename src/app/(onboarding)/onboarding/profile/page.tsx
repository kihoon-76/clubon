import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/onboarding/profile-form";
import { OnboardingSteps } from "@/components/onboarding/steps";
import { Card, CardBody } from "@/components/ui/card";
import { getDb } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { requireSession } from "@/lib/session";

export async function generateMetadata() {
  return { title: (await getT())("onboarding.profileTitle") };
}

export default async function ProfileSetupPage() {
  const { user } = await requireSession("/onboarding/profile");
  if (!user.adultConfirmedAt) redirect("/onboarding/adult");
  if (!user.consentCompletedAt) redirect("/onboarding/consent");
  const t = await getT();

  const profile = await getDb().getProfile(user.id);

  return (
    <>
      <OnboardingSteps current="profile" />

      <h1 className="mt-8 font-display text-3xl text-ivory sm:text-4xl">
        {t("onboarding.profileTitle")}
      </h1>
      <p className="mt-3 text-[0.9375rem] leading-relaxed break-keep text-muted">
        {t("onboarding.profileIntro")}
      </p>

      <Card hairline className="mt-8">
        <CardBody>
          <ProfileForm profile={profile} lockedGender={user.gender} />
        </CardBody>
      </Card>
    </>
  );
}
