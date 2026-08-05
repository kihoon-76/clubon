import type { Metadata } from "next";
import { Eye, Flag, ShieldCheck, Video } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Card, CardBody, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "안전 센터",
  description:
    "ClubOn의 안전 원칙, 얼굴 공개 정책, 촬영·녹화 금지 정책과 신고 절차 안내.",
};

const PRINCIPLES = [
  {
    icon: ShieldCheck,
    title: "그룹으로만 만납니다",
    body: "대화는 라운지 단위로 합석합니다. 합석 룸은 최소 2명으로 시작하며, 인원이 기준 아래로 떨어지면 세션이 일시 정지되고 참가자는 대기 라운지로 돌아갑니다.",
  },
  {
    icon: Eye,
    title: "얼굴은 기본적으로 가려집니다",
    body: "모든 세션은 동물 마스크가 적용된 상태로 시작합니다. 얼굴 추적이 일시적으로 실패하면 영상이 블러 처리되거나 아바타로 대체되며, 원본 얼굴이 노출되지 않습니다.",
  },
  {
    icon: Flag,
    title: "언제든 나가고, 신고할 수 있습니다",
    body: "룸 안에서 신고와 차단은 항상 한 번의 조작으로 가능합니다. 차단하면 이후 매칭에서도 해당 회원과 다시 만나지 않습니다.",
  },
  {
    icon: Video,
    title: "촬영과 녹화는 금지됩니다",
    body: "가입 시, 룸 입장 전, 얼굴 공개 전 세 차례 확인을 받습니다. 화면에는 사용자 식별자와 시각이 포함된 워터마크가 표시됩니다.",
  },
];

export default function SafetyCenterPage() {
  return (
    <Container className="py-20 sm:py-24">
      <div className="max-w-2xl">
        <p className="label-caps">안전 센터</p>
        <h1 className="mt-4 font-display text-4xl leading-tight text-ivory sm:text-5xl">
          편안한 대화는 안전에서 시작합니다
        </h1>
        <p className="mt-6 text-[1.0625rem] leading-relaxed text-muted">
          ClubOn이 회원을 보호하기 위해 지키는 원칙과, 문제가 생겼을 때 이용할
          수 있는 절차를 정리했습니다.
        </p>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2">
        {PRINCIPLES.map((item) => (
          <Card key={item.title} hairline className="h-full">
            <CardBody>
              <span
                aria-hidden
                className="flex size-10 items-center justify-center rounded-full border border-champagne-dim/60 text-champagne"
              >
                <item.icon className="size-[1.125rem]" />
              </span>
              <CardTitle className="mt-5">{item.title}</CardTitle>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
                {item.body}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>

      <section id="reveal" className="mt-20 scroll-mt-20 max-w-3xl">
        <h2 className="font-display text-3xl text-ivory">얼굴 공개 정책</h2>
        <ul className="mt-6 space-y-3 text-[0.9375rem] leading-relaxed text-muted">
          <li>
            · 얼굴 공개는 합석한 두 라운지의 방장이 모두 수락해야 이루어집니다.
            참가자 개인이 다른 참가자에게 직접 공개를 요청할 수는 없습니다.
          </li>
          <li>
            · 양쪽 방장의 수락이 확정되면 그 방에 있는 모든 참가자의 마스크가
            한꺼번에 벗겨집니다.
          </li>
          <li>
            · 어느 쪽 방장이든 마스크를 다시 씌우면 참가자 전원이 즉시 마스크
            상태로 돌아갑니다. 공개를 결정한 방장이 방을 나가도 마찬가지입니다.
          </li>
          <li>
            · 공개된 뒤에도 내가 차단한 참가자는 나에게 계속 마스크로 보이며,
            모더레이션 조치로 영상이 제한된 참가자도 공개되지 않습니다.
          </li>
          <li>· 세션이 종료되면 얼굴 공개도 함께 종료됩니다.</li>
          <li>
            · 거절해도 상대에게 거절 사유가 표시되지 않습니다.
          </li>
        </ul>
      </section>

      <section id="recording" className="mt-16 scroll-mt-20 max-w-3xl">
        <h2 className="font-display text-3xl text-ivory">
          촬영·녹화 금지 정책
        </h2>
        <p className="mt-6 text-[0.9375rem] leading-relaxed text-muted">
          다른 참가자의 영상, 음성, 개인정보를 캡처·녹화·촬영하거나 공유하는
          행위는 금지됩니다. 위반 시 영구 이용정지 및 관련 법률에 따른 법적
          책임이 따를 수 있습니다.
        </p>
        <p className="mt-4 text-[0.9375rem] leading-relaxed text-faint">
          플랫폼은 모든 스크린샷이나 외부 기기를 이용한 촬영을 기술적으로 완전히
          차단할 수 없습니다. 그래서 마스크 기본 착용, 방장 합의 기반 공개, 동적
          워터마크, 반복 확인 절차, 신고와 제재를 함께 운영합니다.
        </p>
      </section>

      <section className="mt-16 max-w-3xl">
        <h2 className="font-display text-3xl text-ivory">신고 절차</h2>
        <ol className="mt-6 space-y-3 text-[0.9375rem] leading-relaxed text-muted">
          <li>1. 룸 안에서 해당 참가자의 신고 버튼을 선택합니다.</li>
          <li>2. 사유를 고르고 필요하면 상황을 설명합니다.</li>
          <li>
            3. 신고와 동시에 해당 참가자를 차단할 수 있으며, 차단하면 그 참가자는
            나에게 다시 마스크 상태로만 보입니다.
          </li>
          <li>
            4. 관리자가 신고를 검토하고 경고, 제한, 정지 등 조치를 결정합니다.
          </li>
        </ol>
        <p className="mt-6 text-sm leading-relaxed text-faint">
          긴급한 위험이 있다고 판단되는 경우 즉시 세션에서 나간 뒤 신고해
          주세요. 자동 모더레이션은 모든 위반을 완벽하게 탐지한다고 보장하지
          않습니다.
        </p>
      </section>
    </Container>
  );
}
