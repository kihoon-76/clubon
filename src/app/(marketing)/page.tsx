import {
  ArrowRight,
  ChevronDown,
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
      <BentoUsp />
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
      {/* 시네마틱 앰비언트 배경 + 비네트 */}
      <div aria-hidden className="hero-atmosphere absolute inset-0" />
      <div aria-hidden className="vignette absolute inset-0" />

      <Container className="relative flex min-h-[86dvh] flex-col justify-center pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="reveal max-w-3xl">
          <Badge tone="gold">만 19세 이상 · 회원제 · 술 없는 클럽</Badge>

          <h1 className="mt-7 font-display text-[2.5rem] leading-[1.08] text-ivory sm:text-6xl sm:leading-[1.06] lg:text-[4.5rem]">
            어디에 있든,
            <br />
            <span className="italic text-champagne">프라이빗 소셜 클럽.</span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
            프로필을 넘기는 대신 대화로 만납니다. 친구와 함께 한 테이블에
            앉고, 마스크를 쓴 채 이야기하고, 양쪽 라운지의 방장이 모두 수락할 때만
            얼굴을 공개합니다.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
            <ButtonLink href="/lobby" size="lg" className="gold-glow">
              입장 신청하기
            </ButtonLink>
            <ButtonLink
              href="#how"
              variant="ghost"
              size="lg"
              className="group px-1 text-ivory/70 hover:text-champagne"
            >
              이용 방식 살펴보기
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </ButtonLink>
          </div>

          <p className="mt-6 text-sm text-faint">
            1:1 매칭은 제공하지 않습니다. 모든 대화는 최소 2명 이상의 그룹으로
            시작됩니다.
          </p>
        </div>

        <a
          href="#how"
          aria-label="아래로 스크롤"
          className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center text-champagne/50 transition-colors hover:text-champagne sm:flex"
        >
          <span className="label-caps mb-2 text-champagne/50">Discover</span>
          <ChevronDown
            className="size-5"
            style={{ animation: "soft-bounce 2s var(--ease-club) infinite" }}
          />
        </a>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------- Bento USP */

function BentoUsp() {
  return (
    <section className="relative overflow-hidden scroll-mt-20">
      <div aria-hidden className="club-ambience absolute inset-0 opacity-70" />
      <Container className="relative py-16 text-center break-keep sm:py-28">
        {/* 1. 가격 대비 — 한 줄로 읽혀야 해서 본문보다 넓게 잡습니다 */}
        <p className="label-caps">ClubOn이 다른 이유</p>

        <h2 className="mx-auto mt-6 max-w-[30rem] font-display text-[1.75rem] leading-[1.35] text-ivory sm:mt-8 sm:max-w-4xl sm:text-[2.25rem] sm:leading-[1.3] lg:max-w-5xl lg:text-[2.75rem]">
          나이트클럽 부킹룸 한 번에{" "}
          <span className="text-muted line-through decoration-danger/60 decoration-[1.5px] sm:whitespace-nowrap">
            30만 원부터 150만&nbsp;원
          </span>
          .
          <br />
          <span className="italic text-champagne">
            클럽온 라운지룸은 단 3만&nbsp;원.
          </span>
        </h2>

        <span
          aria-hidden
          className="mx-auto mt-9 block h-px w-16 bg-gradient-to-r from-transparent via-champagne-dim to-transparent sm:mt-12"
        />

        <div className="mx-auto max-w-[30rem] sm:max-w-2xl">
          {/* 2. 부담 없는 입장 */}
          <p className="mt-9 text-[1.0625rem] leading-[1.85] text-muted sm:mt-12 sm:text-lg">
            비싼 술값도, 택시비도, 긴 대기 줄도 필요&nbsp;없습니다.
            <br />
            친구와 함께 라운지에 입장해 동물 마스크를 쓰고 편하게 대화하세요.
          </p>

          {/* 3. 두 가지 약속 — 모바일에서는 강조구를 항상 둘째 줄로 내립니다 */}
          <div className="mt-9 space-y-4 border-y border-line py-8 sm:mt-12 sm:py-10">
            <p className="text-[1.0625rem] leading-[1.7] text-ivory sm:text-xl">
              대화가 통했다면 양쪽 방장의 동의로 동시에{" "}
              <span className="block text-champagne sm:inline">얼굴 공개!</span>
            </p>
            <p className="text-[1.0625rem] leading-[1.7] text-ivory sm:text-xl">
              마음에 들지 않으면 부담 없이{" "}
              <span className="block text-champagne sm:inline">
                다음 라운지로 이동!
              </span>
            </p>
          </div>

          {/* 4. 마무리 */}
          <p className="mt-9 text-[1.0625rem] leading-[1.85] text-muted sm:mt-12 sm:text-lg">
            집에서 즐기는 프라이빗 나이트라이프,
            <br />
            부킹의 설렘은 그대로, 비용은{" "}
            <span className="text-champagne">10분의&nbsp;1</span>로.
          </p>

          <p className="mt-10 font-display text-[1.625rem] leading-[1.4] text-ivory sm:mt-14 sm:text-[2.25rem] sm:leading-[1.3]">
            오늘 밤, 클럽에 가지 말고{" "}
            <span className="italic text-champagne">클럽을 켜세요.</span>
          </p>

          <p className="label-caps mt-7 sm:mt-8">CLUB ON — 온라인 부킹 라운지</p>
        </div>
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
    body: "1~4명으로 테이블을 만들거나, 초대 코드로 친구의 테이블에 합류합니다. 혼자여도 바로 상대 라운지를 찾을 수 있습니다.",
  },
  {
    icon: Sparkles,
    title: "AI 라운지 매니저가 매칭",
    body: "관심사, 언어, 대화 에너지를 바탕으로 어울리는 다른 라운지를 찾아 소개합니다.",
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
    title: "두 방장이 수락할 때만 공개",
    body: "양쪽 라운지의 방장이 모두 수락하면, 그 순간 방 전체의 마스크가 함께 벗겨집니다.",
  },
];

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 border-y border-line/70 bg-surface/50">
      <Container className="py-20 sm:py-28">
        <SectionHeading
          eyebrow="이용 방식"
          title="한 테이블에서 시작해, 다른 테이블과 만납니다"
          description="ClubOn은 무작위 화상 채팅이 아닙니다. 정해진 시간에 열리고, 그룹으로 입장하며, 매칭은 양측 합의로만 성사됩니다."
        />

        <ol className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <Card hairline className="h-full transition-colors hover:border-champagne-dim">
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
  "말씀하신 조건과 가장 잘 맞는 라운지를 찾았습니다. 소개해 드릴까요?",
  "양쪽 라운지 모두 수락하셨습니다. 10초 뒤 합석 룸이 열립니다.",
];

function Waiter() {
  return (
    <section>
      <Container className="grid items-center gap-14 py-20 sm:py-28 lg:grid-cols-2">
        <div>
          <SectionHeading
            eyebrow="AI 라운지 매니저"
            title="잘 맞는 라운지를 찾아 연결합니다"
            description="AI 라운지 매니저는 라운지의 취향과 원하는 상대의 조건을 확인하고, 그 조건에 가장 잘 맞는 라운지를 찾아 왜 어울리는지와 함께 소개합니다. 외모를 평가하거나 순위를 매기지 않으며, 수락을 재촉하지 않습니다."
          />
          <ul className="mt-8 space-y-3 text-[0.9375rem] break-keep text-muted">
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
              <span className="label-caps">Lounge Manager</span>
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
    <section id="reveal" className="scroll-mt-20 border-y border-line/70 bg-surface/50">
      <Container className="py-20 sm:py-28">
        <SectionHeading
          eyebrow="마스크와 얼굴 공개"
          title="공개는 두 방장의 합의로만"
          description="모든 대화는 동물 마스크를 쓴 상태에서 시작합니다. 마스크 해제는 합석한 두 라운지의 방장이 모두 수락한 경우에만, 방 전체에 한꺼번에 적용됩니다."
        />

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {[
            {
              title: "두 방장이 모두 수락해야 합니다",
              body: "한쪽 방장이 제안하면 상대 라운지의 방장에게 확인 요청이 전달됩니다. 거절해도 이유가 표시되지 않습니다.",
            },
            {
              title: "방 전체가 함께 공개됩니다",
              body: "합의가 확정되면 양쪽 라운지의 모든 참가자가 동시에 마스크를 벗습니다. 다만 내가 차단한 상대는 계속 마스크로 보입니다.",
            },
            {
              title: "언제든 다시 마스크를 쓸 수 있습니다",
              body: "어느 방장이든 되돌리면 참가자 전원이 즉시 마스크 상태로 돌아갑니다. 방장이 나가거나 세션이 끝날 때도 마찬가지입니다.",
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
    <section id="safety" className="scroll-mt-20">
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
              body: "대화는 라운지 단위로 합석합니다. 합석 룸은 최소 2명으로 시작합니다.",
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
          방장 합의 공개, 워터마크, 신고 절차를 함께 운영합니다.
        </p>
      </Container>
    </section>
  );
}

/* ----------------------------------------------------------------- Hours */

function Hours() {
  return (
    <section className="border-t border-line/70 bg-surface/50">
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
            <ButtonLink href="/lobby" variant="secondary" className="shrink-0">
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
    <section className="relative overflow-hidden">
      <div aria-hidden className="hero-atmosphere absolute inset-0 opacity-70" />
      <Container className="relative py-24 text-center sm:py-32">
        <h2 className="mx-auto max-w-2xl font-display text-4xl leading-tight text-ivory sm:text-5xl">
          대화로 먼저 만나는 저녁,
          <br />
          <span className="italic text-champagne">오늘 열립니다.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
          더 진짜에 가까운 만남을, 더 낮은 부담으로.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/lobby" size="lg" className="gold-glow">
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
    <div className="max-w-2xl break-keep">
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
