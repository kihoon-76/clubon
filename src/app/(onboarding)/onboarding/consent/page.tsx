import { redirect } from "next/navigation";
import { Info } from "lucide-react";

import { ConsentForm } from "@/components/onboarding/consent-form";
import { OnboardingSteps } from "@/components/onboarding/steps";
import { Card, CardBody } from "@/components/ui/card";
import { getDb } from "@/lib/db";
import { requireSession } from "@/lib/session";

export const metadata = { title: "동의" };

export default async function ConsentPage() {
  const { user } = await requireSession("/onboarding/consent");
  if (!user.adultConfirmedAt) redirect("/onboarding/adult");

  const consents = await getDb().getConsents(user.id);
  const granted = consents.filter((c) => c.granted).map((c) => c.consentType);

  return (
    <>
      <OnboardingSteps current="consent" />

      <h1 className="mt-8 font-display text-3xl text-ivory sm:text-4xl">
        동의 항목
      </h1>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
        각 항목의 내용을 확인하고 동의해 주세요. 선택 항목은 동의하지 않아도
        입장할 수 있습니다.
      </p>

      <div className="mt-6 flex items-start gap-3 rounded-[var(--radius-control)] border border-line bg-surface/60 p-4">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-champagne" />
        <p className="text-xs leading-relaxed text-muted">
          자동 모더레이션은 모든 위반을 완벽하게 탐지한다고 보장하지 않습니다.
          또한 플랫폼은 스크린샷이나 외부 기기 촬영을 기술적으로 완전히 차단할 수
          없습니다.
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
