import type { Metadata } from "next";
import { Check } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Badge, MockBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "멤버십",
  description: "ClubOn 멤버십 등급 안내 (준비 중).",
};

const TIERS = [
  {
    name: "게스트",
    price: "무료",
    note: "클럽을 둘러보는 단계",
    featured: false,
    features: [
      "프로필 작성 및 친구 초대",
      "운영 시간 내 대기 라운지 입장",
      "주 1회 테이블 매칭",
      "기본 AI 웨이터 안내",
    ],
  },
  {
    name: "멤버",
    price: "준비 중",
    note: "가장 일반적인 이용 방식",
    featured: true,
    features: [
      "게스트의 모든 기능",
      "무제한 테이블 생성 및 매칭 요청",
      "상세 호환성 요약 제공",
      "재매칭 우선 처리",
      "세션 기록 및 피드백 보관",
    ],
  },
  {
    name: "호스트",
    price: "준비 중",
    note: "정기 모임을 여는 분",
    featured: false,
    features: [
      "멤버의 모든 기능",
      "최대 인원 테이블 운영",
      "지정 초대 코드 관리",
      "우선 호스트 모드 크레딧 제공",
    ],
  },
];

export default function MembershipPage() {
  return (
    <Container className="py-20 sm:py-28">
      <div className="max-w-2xl">
        <p className="label-caps">멤버십</p>
        <h1 className="mt-4 font-display text-4xl leading-tight text-ivory sm:text-5xl">
          조용하고 안전한 자리를 위한 회원제
        </h1>
        <p className="mt-6 text-[1.0625rem] leading-relaxed text-muted">
          아래 요금 정책은 아직 확정되지 않은 안내용 초안입니다. 현재는 결제
          기능이 연결되어 있지 않으며, 모든 회원이 동일한 기능을 이용합니다.
        </p>
        <div className="mt-6">
          <MockBadge />
        </div>
      </div>

      <div className="mt-14 grid gap-5 lg:grid-cols-3">
        {TIERS.map((tier) => (
          <Card
            key={tier.name}
            hairline={tier.featured}
            className={
              tier.featured ? "border-champagne-dim/70 h-full" : "h-full"
            }
          >
            <CardBody className="flex h-full flex-col">
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{tier.name}</CardTitle>
                {tier.featured ? <Badge tone="gold">추천</Badge> : null}
              </div>
              <p className="mt-2 text-sm text-faint">{tier.note}</p>
              <p className="mt-6 font-display text-3xl text-champagne">
                {tier.price}
              </p>

              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex gap-3 text-[0.9375rem] leading-relaxed text-muted"
                  >
                    <Check
                      aria-hidden
                      className="mt-1 size-4 shrink-0 text-champagne"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <ButtonLink
                href="/lobby"
                variant={tier.featured ? "primary" : "secondary"}
                className="mt-8 w-full"
              >
                입장 신청하기
              </ButtonLink>
            </CardBody>
          </Card>
        ))}
      </div>

      <p className="mt-10 max-w-3xl text-sm leading-relaxed text-faint">
        AI 웨이터 팁 기능은 탐색 빈도와 안내 상세도만 높입니다. 팁은 다른
        테이블의 수락을 강제하거나 매칭을 보장하지 않습니다.
      </p>
    </Container>
  );
}
