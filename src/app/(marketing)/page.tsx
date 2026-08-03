import {
  Clock,
  Eye,
  Handshake,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardTitle } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Promises />
      <HowItWorks />
      <Waiter />
      <MaskAndReveal />
      <Safety />
      <Hours />
      <ClosingCta />
    </>
  );
}

/* ------------------------------------------------------------------ Hero */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <Container className="pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="max-w-3xl">
          <Badge tone="gold">만 19세 이상 · 회원제 · 술 없는 클럽</Badge>

          <h1 className="mt-7 font-display text-[2.375rem] leading-[1.1] text-ivory sm:text-6xl sm:leading-[1.08] lg:text-[4.25rem]">
            어디에 있든,
            <br />
            <span className="text-champagne">프라이빗 소셜 클럽.</span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
            프로필을 넘기는 대신 대화로 만납니다. 친구와 함께 한 테이블에
            앉고, 마스크를 쓴 채 이야기하고, 서로 동의할 때만 얼굴을
            공개합니다.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <ButtonLink href="/signup" size="lg">
              입장 신청하기
            </ButtonLink>
            <ButtonLink href="#how" variant="secondary" size="lg">
              이용 방식 보기
            </ButtonLink>
          </div>

          <p className="mt-6 text-sm text-faint">
            1:1 매칭은 제공하지 않습니다. 모든 대화는 최소 4명 이상의 그룹으로
            시작됩니다.
          </p>
        </div>
      </Container>
    </section>
  );
}

/* -------------------------------------------------------------- Promises */

const PROMISES = [
  {
    title: "술이 없습니다",
    body: "음주 없이도 대화는 충분히 즐겁습니다. 다음 날을 망치지 않는 저녁을 제안합니다.",
  },
  {
    title: "이동이 없습니다",
    body: "예약도, 웨이팅도, 귀가 걱정도 없습니다. 있는 자리에서 그대로 입장하세요.",
  },
  {
    title: "어색한 첫 장소가 없습니다",
    body: "처음부터 그룹으로 만나기 때문에, 마주 앉은 두 사람의 부담이 없습니다.",
  },
];

function Promises() {
  return (
    <section className="border-y border-line/70 bg-surface/50">
      <Container className="grid gap-10 py-16 sm:grid-cols-3 sm:py-20">
        {PROMISES.map((item) => (
          <div key={item.title}>
            <h2 className="font-display text-2xl text-champagne">
              {item.title}
            </h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
              {item.body}
            </p>
          </div>
        ))}
      </Container>
    </section>
  );
}

/* ----------------------------------------------------------- How it works */

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: UserRoundCheck,
    title: "성인 인증 후 입장",
    body: "생년월일 확인과 개별 동의 절차를 거쳐 회원으로 등록합니다.",
  },
  {
    icon: Users,
    title: "테이블 구성",
    body: "2~4명으로 테이블을 만들거나, 초대 코드로 친구의 테이블에 합류합니다. 혼자라면 대기 라운지에서 함께할 사람을 기다립니다.",
  },
  {
    icon: Sparkles,
    title: "AI 웨이터가 매칭",
    body: "관심사, 언어, 대화 에너지를 바탕으로 어울리는 다른 테이블을 찾아 소개합니다.",
  },
  {
    icon: Handshake,
    title: "양쪽 테이블이 수락",
    body: "두 테이블이 모두 동의해야 합석 룸이 열립니다. 어느 쪽도 강요받지 않습니다.",
  },
  {
    icon: MessageSquare,
    title: "마스크를 쓴 채 대화",
    body: "동물 마스크를 쓰고 시작합니다. 외모가 아니라 대화로 먼저 만납니다.",
  },
  {
    icon: Eye,
    title: "서로 동의할 때만 공개",
    body: "두 사람이 모두 수락한 경우에 한해, 그 두 사람 사이에서만 얼굴이 공개됩니다.",
  },
];

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20">
      <Container className="py-20 sm:py-28">
        <SectionHeading
          eyebrow="이용 방식"
          title="한 테이블에서 시작해, 다른 테이블과 만납니다"
          description="ClubOn은 무작위 화상 채팅이 아닙니다. 정해진 시간에 열리고, 그룹으로 입장하며, 매칭은 양측 합의로만 성사됩니다."
        />

        <ol className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <Card hairline className="h-full">
                <CardBody>
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="flex size-10 items-center justify-center rounded-full border border-champagne-dim/60 text-champagne"
                    >
                      <step.icon className="size-[1.125rem]" />
                    </span>
                    <span className="label-caps">
                      Step {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <CardTitle className="mt-5">{step.title}</CardTitle>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
                    {step.body}
                  </p>
                </CardBody>
              </Card>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

/* ---------------------------------------------------------------- Waiter */

const WAITER_LINES = [
  "안녕하세요. 오늘 저녁은 편안한 대화, 활기찬 분위기, 여행 이야기 중 어느 쪽이 좋으실까요?",
  "비슷한 결의 테이블을 찾았습니다. 소개해 드릴까요?",
  "양쪽 테이블 모두 수락하셨습니다. 10초 뒤 합석 룸이 열립니다.",
];

function Waiter() {
  return (
    <section className="border-y border-line/70 bg-surface/50">
      <Container className="grid items-center gap-14 py-20 sm:py-28 lg:grid-cols-2">
        <div>
          <SectionHeading
            eyebrow="AI 웨이터"
            title="테이블을 안내하는 호스트"
            description="AI 웨이터는 테이블의 취향을 확인하고, 어울리는 테이블을 소개하고, 대화가 끊기면 이야깃거리를 건넵니다. 외모를 평가하거나 순위를 매기지 않으며, 수락을 재촉하지 않습니다."
          />
          <ul className="mt-8 space-y-3 text-[0.9375rem] text-muted">
            {[
              "외모 평가·순위 매기기를 하지 않습니다",
              "다른 회원의 비공개 프로필 정보를 알려주지 않습니다",
              "매칭 성사나 연애 결과를 보장하지 않습니다",
            ].map((line) => (
              <li key={line} className="flex gap-3">
                <ShieldCheck
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 text-champagne"
                />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <Card hairline>
          <CardBody className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="label-caps">Waiter</span>
              <Badge tone="silver">대화 예시</Badge>
            </div>
            {WAITER_LINES.map((line) => (
              <p
                key={line}
                className="rounded-[var(--radius-control)] border border-line bg-surface-overlay/70 px-4 py-3.5 text-[0.9375rem] leading-relaxed text-ivory"
              >
                {line}
              </p>
            ))}
          </CardBody>
        </Card>
      </Container>
    </section>
  );
}

/* -------------------------------------------------------- Mask and reveal */

function MaskAndReveal() {
  return (
    <section id="reveal" className="scroll-mt-20">
      <Container className="py-20 sm:py-28">
        <SectionHeading
          eyebrow="마스크와 얼굴 공개"
          title="공개는 언제나 양측 합의로만"
          description="모든 대화는 동물 마스크를 쓴 상태에서 시작합니다. 마스크 해제는 두 사람이 각각 동의한 경우에만, 그 두 사람 사이에서만 이루어집니다."
        />

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {[
            {
              title: "두 사람이 모두 동의해야 합니다",
              body: "한 사람이 요청하면 상대에게 비공개로 확인 요청이 전달됩니다. 거절해도 상대에게 이유가 표시되지 않습니다.",
            },
            {
              title: "그 두 사람 사이에서만 공개됩니다",
              body: "같은 룸의 다른 참가자에게는 계속 마스크가 유지됩니다.",
            },
            {
              title: "언제든 다시 마스크를 쓸 수 있습니다",
              body: "어느 한쪽이 복구하면 양방향 모두 즉시 마스크 상태로 돌아갑니다. 차단·신고·퇴장 시에도 즉시 종료됩니다.",
            },
          ].map((item) => (
            <Card key={item.title} className="h-full">
              <CardBody>
                <CardTitle>{item.title}</CardTitle>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
                  {item.body}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------------------------------------------------------------- Safety */

function Safety() {
  return (
    <section
      id="safety"
      className="scroll-mt-20 border-y border-line/70 bg-surface/50"
    >
      <Container className="py-20 sm:py-28">
        <SectionHeading
          eyebrow="안전과 신뢰"
          title="편안하려면 먼저 안전해야 합니다"
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "성인 전용",
              body: "생년월일 확인과 본인확인 절차를 거친 회원만 입장할 수 있습니다.",
            },
            {
              title: "그룹 단위 대화",
              body: "1:1 화상 매칭은 제공하지 않습니다. 합석 룸은 최소 4명으로 시작합니다.",
            },
            {
              title: "실시간 모더레이션",
              body: "메시지는 전달 전에 검사되며, 위반은 단계적으로 조치되고 관리자가 검토합니다.",
            },
            {
              title: "촬영·녹화 금지",
              body: "동의 절차와 워터마크로 억제하고, 위반 신고 시 이용정지 등 조치가 이루어집니다.",
            },
          ].map((item) => (
            <Card key={item.title} className="h-full">
              <CardBody>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {item.body}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>

        <p className="mt-8 max-w-3xl text-sm leading-relaxed text-faint">
          모더레이션은 자동 검사와 사람의 검토를 함께 사용하지만 모든 위반을
          완벽하게 걸러낸다고 보장하지 않습니다. 또한 플랫폼은 모든 스크린샷과
          외부 촬영을 기술적으로 차단할 수 없습니다. 그래서 마스크 기본 착용,
          상호 동의 공개, 워터마크, 신고 절차를 함께 운영합니다.
        </p>
      </Container>
    </section>
  );
}

/* ----------------------------------------------------------------- Hours */

function Hours() {
  return (
    <section>
      <Container className="py-20 sm:py-24">
        <Card hairline className="overflow-hidden">
          <CardBody className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span
                aria-hidden
                className="flex size-11 shrink-0 items-center justify-center rounded-full border border-champagne-dim/60 text-champagne"
              >
                <Clock className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-2xl text-ivory">
                  매일 저녁 6시부터 새벽 4시까지
                </h2>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
                  클럽이 닫힌 시간에도 가입, 프로필 수정, 친구 초대, 테이블
                  예약은 가능합니다.
                </p>
              </div>
            </div>
            <ButtonLink href="/signup" variant="secondary" className="shrink-0">
              먼저 가입해 두기
            </ButtonLink>
          </CardBody>
        </Card>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------ Closing CTA */

function ClosingCta() {
  return (
    <section>
      <Container className="pb-8 text-center sm:pb-16">
        <h2 className="mx-auto max-w-2xl font-display text-4xl leading-tight text-ivory sm:text-5xl">
          대화로 먼저 만나는 저녁,
          <br />
          <span className="text-champagne">오늘 열립니다.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
          더 진짜에 가까운 만남을, 더 낮은 부담으로.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/signup" size="lg">
            입장 신청하기
          </ButtonLink>
          <ButtonLink href="/membership" variant="secondary" size="lg">
            멤버십 살펴보기
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------- Primitives */

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="label-caps">{eyebrow}</p>
      <h2 className="mt-4 font-display text-3xl leading-tight text-ivory sm:text-[2.5rem]">
        {title}
      </h2>
      {description ? (
        <p className="mt-5 text-[1.0625rem] leading-relaxed text-muted">
          {description}
        </p>
      ) : null}
    </div>
  );
}
