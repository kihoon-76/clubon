import { Container } from "@/components/layout/container";
import { ProfileForm } from "@/components/onboarding/profile-form";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { getDb } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { requireOnboardedSession } from "@/lib/session";

export async function generateMetadata() {
  return { title: (await getT())("feedback.editTitle") };
}

export default async function EditProfilePage() {
  const { user } = await requireOnboardedSession("/dashboard/profile");
  const profile = await getDb().getProfile(user.id);
  const t = await getT();

  return (
    <Container className="py-14 sm:py-16">
      <div className="mx-auto max-w-xl">
        <p className="label-caps">{t("feedback.editEyebrow")}</p>
        <h1 className="mt-3 font-display text-4xl text-ivory">
          {t("feedback.editTitle")}
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed break-keep text-muted">
          {t("feedback.editIntro")}
        </p>

        <Card hairline className="mt-8">
          <CardBody>
            <ProfileForm
              profile={profile}
              lockedGender={user.gender}
              submitLabel={t("feedback.saveChanges")}
            />
          </CardBody>
        </Card>

        <div className="mt-6">
          <ButtonLink href="/dashboard" variant="ghost" size="sm">
            {t("feedback.backToDashboard")}
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}
