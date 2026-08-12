import {
  ArrowRight,
  ChevronDown,
  Clock,
  Handshake,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Container } from "@/components/layout/container";
import { LivePresence } from "@/components/landing/live-presence";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { getT } from "@/lib/i18n/server";
import type { Translate } from "@/lib/i18n/types";

export default async function LandingPage() {
  const t = await getT();

  return (
    <>
      <Hero t={t} />
      <LivePresence />
      <BentoUsp t={t} />
      <HowItWorks t={t} />
      <Pricing t={t} />
      <Waiter t={t} />
      <Safety t={t} />
      <ClosingCta t={t} />
    </>
  );
}

/* ------------------------------------------------------------------ Hero */

function Hero({ t }: { t: Translate }) {
  return (
    <section className="relative overflow-hidden">
      {/* 시네마틱 앰비언트 배경 + 비네트 */}
      <div aria-hidden className="hero-atmosphere absolute inset-0" />
      <div aria-hidden className="vignette absolute inset-0" />

      <Container className="relative flex min-h-[calc(100svh-4rem)] flex-col justify-center py-14 sm:min-h-[86dvh] sm:py-24">
        <div className="reveal max-w-3xl">
          <Badge tone="gold">{t("landing.badge")}</Badge>

          <h1 className="mt-6 font-display text-[2.25rem] leading-[1.1] break-keep text-ivory sm:mt-7 sm:text-6xl sm:leading-[1.06] lg:text-[4.5rem]">
            {t("landing.heroLine1")}
            <br />
            <span className="italic text-champagne">
              {t("landing.heroLine2")}
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed break-keep text-muted sm:mt-7 sm:text-xl">
            {t("landing.heroBody")}
          </p>

          <div className="mt-8 grid gap-3 sm:mt-10 sm:flex sm:flex-wrap sm:items-center sm:gap-x-7 sm:gap-y-4">
            <ButtonLink href="/lobby" size="lg" className="w-full gold-glow sm:w-auto">
              {t("landing.heroCta")}
            </ButtonLink>
            <ButtonLink
              href="#how"
              variant="ghost"
              size="lg"
              className="group w-full text-ivory/70 hover:text-champagne sm:w-auto sm:px-1"
            >
              {t("landing.heroSecondary")}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </ButtonLink>
          </div>

        </div>

        <a
          href="#how"
          aria-label={t("landing.scrollDown")}
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

/**
 * 'ClubOn이 다른 이유'.
 *
 * 값이 아니라 **설렘**을 먼저 말하는 자리입니다. 금액은 이 화면에서 꺼내지
 * 않고, 서비스를 다 본 뒤의 `Pricing` 섹션이 맡습니다.
 */
function BentoUsp({ t }: { t: Translate }) {
  return (
    <section className="relative overflow-hidden scroll-mt-20">
      <div aria-hidden className="club-ambience absolute inset-0 opacity-70" />
      <Container className="relative py-16 text-center break-keep sm:py-28">
        <p className="label-caps">{t("landing.uspEyebrow")}</p>

        {/* 이 화면에서 가장 큰 문장. 강조는 마지막 구절 하나에만 둡니다. */}
        <h2 className="mx-auto mt-7 max-w-[22rem] font-display text-[2rem] leading-[1.25] text-ivory sm:mt-9 sm:max-w-3xl sm:text-[3rem] sm:leading-[1.18] lg:max-w-4xl lg:text-[3.5rem]">
          {t("landing.uspHeadline")}{" "}
          <span className="block italic text-champagne sm:inline">
            {t("landing.uspHeadlineAccent")}
          </span>
        </h2>

        <span
          aria-hidden
          className="mx-auto mt-10 block h-px w-16 bg-gradient-to-r from-transparent via-champagne-dim to-transparent sm:mt-12"
        />

        {/* 보조 문구 — 두 문장을 각각 한 줄로 두어 좁은 화면에서도 끊기가
            자연스럽습니다. */}
        <p className="mx-auto mt-10 max-w-[24rem] text-[1.0625rem] leading-[1.8] break-keep text-muted sm:mt-12 sm:max-w-2xl sm:text-xl sm:leading-[1.75]">
          {t("landing.uspSub1")}
          <br className="hidden sm:block" />{" "}
          {t("landing.uspSub2")}
        </p>

        <div className="mt-11 flex justify-center sm:mt-14">
          <ButtonLink href="#how" size="lg" className="gold-glow">
            {t("landing.uspCta")}
            <ArrowRight className="size-4" />
          </ButtonLink>
        </div>

        <p className="label-caps mt-10 sm:mt-12">{t("landing.uspSignature")}</p>
      </Container>
    </section>
  );
}

/* --------------------------------------------------------------- Pricing */

/**
 * 라운지 이용 안내.
 *
 * 금액은 이용 방식을 다 읽은 뒤에 나옵니다. 크게 외치지 않고 한 줄로만
 * 적는 것이 이 섹션의 요지입니다.
 */
function Pricing({ t }: { t: Translate }) {
  return (
    <section id="pricing" className="scroll-mt-20">
      <Container className="py-16 sm:py-24">
        <Card hairline className="mx-auto max-w-2xl">
          <CardBody className="text-center break-keep">
            <p className="label-caps">{t("landing.priceEyebrow")}</p>
            <p className="mt-5 font-display text-2xl leading-snug text-ivory sm:text-[1.75rem]">
              {t("landing.priceTitle")}
            </p>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {t("landing.priceBody")}
            </p>
          </CardBody>
        </Card>
      </Container>
    </section>
  );
}

/* ----------------------------------------------------------- How it works */

/** 아이콘만 이 파일에 남습니다 — 문구는 `landing.step<n>Title|Body`. */
const STEP_ICONS: LucideIcon[] = [
  UserRoundCheck,
  Users,
  Sparkles,
  Handshake,
  MessageSquare,
  Clock,
];

function HowItWorks({ t }: { t: Translate }) {
  return (
    <section id="how" className="scroll-mt-20 border-y border-line/70 bg-surface/50">
      <Container className="py-16 sm:py-28">
        <SectionHeading
          eyebrow={t("landing.howEyebrow")}
          title={t("landing.howTitle")}
          description={t("landing.howBody")}
        />

        <ol className="mt-10 grid gap-4 sm:mt-14 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {STEP_ICONS.map((Icon, index) => (
            <li key={index}>
              <Card hairline className="h-full transition-colors hover:border-champagne-dim">
                <CardBody>
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="flex size-10 items-center justify-center rounded-full border border-champagne-dim/60 text-champagne"
                    >
                      <Icon className="size-[1.125rem]" />
                    </span>
                    <span className="label-caps">
                      Step {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <CardTitle className="mt-5">
                    {t(`landing.step${index + 1}Title`)}
                  </CardTitle>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed break-keep text-muted">
                    {t(`landing.step${index + 1}Body`)}
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

function Waiter({ t }: { t: Translate }) {
  const lines = [1, 2, 3].map((n) => t(`landing.waiterLine${n}`));

  return (
    <section>
      <Container className="grid items-center gap-10 py-16 sm:gap-14 sm:py-28 lg:grid-cols-2">
        <div>
          <SectionHeading
            eyebrow={t("landing.waiterEyebrow")}
            title={t("landing.waiterTitle")}
            description={t("landing.waiterBody")}
          />
          <ul className="mt-8 space-y-3 text-[0.9375rem] break-keep text-muted">
            {[1, 2, 3].map((n) => (
              <li key={n} className="flex gap-3">
                <ShieldCheck
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 text-champagne"
                />
                <span>{t(`landing.waiterPromise${n}`)}</span>
              </li>
            ))}
          </ul>
        </div>

        <Card hairline>
          <CardBody className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="label-caps">Lounge Manager</span>
              <Badge tone="silver">{t("landing.waiterSample")}</Badge>
            </div>
            {lines.map((line) => (
              <p
                key={line}
                className="rounded-[var(--radius-control)] border border-line bg-surface-overlay/70 px-4 py-3.5 text-[0.9375rem] leading-relaxed break-keep text-ivory"
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

/* ---------------------------------------------------------------- Safety */

function Safety({ t }: { t: Translate }) {
  return (
    <section id="safety" className="scroll-mt-20">
      <Container className="py-16 sm:py-28">
        <SectionHeading
          eyebrow={t("landing.safetyEyebrow")}
          title={t("landing.safetyTitle")}
        />

        <div className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <Card key={n} className="h-full">
              <CardBody>
                <CardTitle className="text-lg">
                  {t(`landing.safety${n}Title`)}
                </CardTitle>
                <p className="mt-3 text-sm leading-relaxed break-keep text-muted">
                  {t(`landing.safety${n}Body`)}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>

        <p className="mt-8 max-w-3xl text-sm leading-relaxed break-keep text-faint">
          {t("landing.safetyNote")}
        </p>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------ Closing CTA */

function ClosingCta({ t }: { t: Translate }) {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="hero-atmosphere absolute inset-0 opacity-70" />
      <Container className="relative py-20 text-center sm:py-32">
        <h2 className="mx-auto max-w-2xl font-display text-3xl leading-tight break-keep text-ivory sm:text-5xl">
          {t("landing.closingLine1")}
          <br />
          <span className="italic text-champagne">
            {t("landing.closingLine2")}
          </span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-[0.9375rem] leading-relaxed break-keep text-muted">
          {t("landing.closingBody")}
        </p>
        <div className="mt-9 grid gap-3 sm:flex sm:flex-wrap sm:justify-center">
          <ButtonLink href="/lobby" size="lg" className="w-full gold-glow sm:w-auto">
            {t("landing.heroCta")}
          </ButtonLink>
          <ButtonLink href="/membership" variant="secondary" size="lg" className="w-full sm:w-auto">
            {t("landing.closingSecondary")}
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
      <h2 className="mt-4 font-display text-[1.75rem] leading-tight text-ivory sm:text-[2.5rem]">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-muted sm:mt-5 sm:text-[1.0625rem]">
          {description}
        </p>
      ) : null}
    </div>
  );
}
