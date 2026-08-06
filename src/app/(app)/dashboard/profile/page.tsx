import { Container } from "@/components/layout/container";
import { ProfileForm } from "@/components/onboarding/profile-form";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { getDb } from "@/lib/db";
import { requireOnboardedSession } from "@/lib/session";

export const metadata = { title: "프로필 수정" };

export default async function EditProfilePage() {
  const { user } = await requireOnboardedSession("/dashboard/profile");
  const profile = await getDb().getProfile(user.id);

  return (
    <Container className="py-14 sm:py-16">
      <div className="mx-auto max-w-xl">
        <p className="label-caps">프로필</p>
        <h1 className="mt-3 font-display text-4xl text-ivory">프로필 수정</h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          라운지 매니저가 자리를 안내할 때 참고하는 정보입니다. 저장하면 다음 매칭부터
          반영됩니다.
        </p>

        <Card hairline className="mt-8">
          <CardBody>
            <ProfileForm profile={profile} submitLabel="변경사항 저장" />
          </CardBody>
        </Card>

        <div className="mt-6">
          <ButtonLink href="/dashboard" variant="ghost" size="sm">
            대시보드로 돌아가기
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}
