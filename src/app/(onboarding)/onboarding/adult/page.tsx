import { redirect } from "next/navigation";

import { AdultCheckForm } from "@/components/onboarding/adult-form";
import { OnboardingSteps } from "@/components/onboarding/steps";
import { Card, CardBody } from "@/components/ui/card";
import { requireSession } from "@/lib/session";

export const metadata = { title: "성인 확인" };

export default async function AdultCheckPage() {
  const { user } = await requireSession("/onboarding/adult");
  if (user.adultConfirmedAt) redirect("/onboarding/consent");

  return (
    <>
      <OnboardingSteps current="adult" />

      <h1 className="mt-8 font-display text-3xl text-ivory sm:text-4xl">
        성인 확인
      </h1>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
        ClubOn은 만 19세 이상 성인만 이용할 수 있습니다. 확인을 위해 출생 연도를
        입력해 주세요.
      </p>

      <Card hairline className="mt-8">
        <CardBody>
          <AdultCheckForm />
        </CardBody>
      </Card>
    </>
  );
}
