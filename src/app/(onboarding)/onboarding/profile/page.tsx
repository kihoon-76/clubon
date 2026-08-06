import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/onboarding/profile-form";
import { OnboardingSteps } from "@/components/onboarding/steps";
import { Card, CardBody } from "@/components/ui/card";
import { getDb } from "@/lib/db";
import { requireSession } from "@/lib/session";

export const metadata = { title: "프로필 설정" };

export default async function ProfileSetupPage() {
  const { user } = await requireSession("/onboarding/profile");
  if (!user.adultConfirmedAt) redirect("/onboarding/adult");
  if (!user.consentCompletedAt) redirect("/onboarding/consent");

  const profile = await getDb().getProfile(user.id);

  return (
    <>
      <OnboardingSteps current="profile" />

      <h1 className="mt-8 font-display text-3xl text-ivory sm:text-4xl">
        프로필 설정
      </h1>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
        라운지 매니저가 자리를 안내할 때 참고하는 정보입니다. 외모에 대한 항목은
        수집하지 않습니다.
      </p>

      <Card hairline className="mt-8">
        <CardBody>
          <ProfileForm profile={profile} />
        </CardBody>
      </Card>
    </>
  );
}
