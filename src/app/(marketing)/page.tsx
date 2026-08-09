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
import { getT } from "@/lib/i18n/server";
import type { Translate } from "@/lib/i18n/types";

export default async function LandingPage() {
  const t = await getT();

  return (
    <>
      <Hero t={t} />
      <BentoUsp t={t} />
      <HowItWorks t={t} />
      <Waiter t={t} />
      <MaskAndReveal t={t} />
      <Safety t={t} />
      <Hours t={t} />
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

      <Container className="relative flex min-h-[86dvh] flex-col justify-center pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="reveal max-w-3xl">
          <Badge tone="gold">{t("landing.badge")}</Badge>

          <h1 className="mt-7 font-display text-[2.5rem] leading-[1.08] break-keep text-ivory sm:text-6xl sm:leading-[1.06] lg:text-[4.5rem]">
            {t("landing.heroLine1")}
            <br />
            <span className="italic text-champagne">
              {t("landing.heroLine2")}
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-relaxed break-keep text-muted sm:text-xl">
            {t("landing.heroBody")}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
            <ButtonLink href="/lobby" size="lg" className="gold-glow">
              {t("landing.heroCta")}
            </ButtonLink>
            <ButtonLink
              href="#how"
              variant="ghost"
              size="lg"
              className="group px-1 text-ivory/70 hover:text-champagne"
            >
              {t("landing.heroSecondary")}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </ButtonLink>
          </div>

          <p className="mt-6 text-sm break-keep text-faint">
            {t("landing.heroNote")}
          </p>
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

function BentoUsp({ t }: { t: Translate }) {
  return (
    <section className="relative overflow-hidden scroll-mt-20">
      <div aria-hidden className="club-ambience absolute inset-0 opacity-70" />
      <Container className="relative py-16 text-center break-keep sm:py-28">
        {/* 1. 가격 대비 — 한 줄로 읽혀야 해서 본문보다 넓게 잡습니다 */}
        <p className="label-caps">{t("landing.uspEyebrow")}</p>

        <h2 className="mx-auto mt-6 max-w-[30rem] font-display text-[1.75rem] leading-[1.35] text-ivory sm:mt-8 sm:max-w-4xl sm:text-[2.25rem] sm:leading-[1.3] lg:max-w-5xl lg:text-[2.75rem]">
          {t("landing.uspCompare")}{" "}
          <span className="text-muted line-through decoration-danger/60 decoration-[1.5px] sm:whitespace-nowrap">
            {t("landing.uspComparePrice")}
          </span>
          <br />
          <span className="italic text-champagne">{t("landing.uspOurs")}</span>
        </h2>

        <span
          aria-hidden
          className="mx-auto mt-9 block h-px w-16 bg-gradient-to-r from-transparent via-champagne-dim to-transparent sm:mt-12"
        />

        <div className="mx-auto max-w-[30rem] sm:max-w-2xl">
          {/* 2. 부담 없는 입장 */}
          <p className="mt-9 text-[1.0625rem] leading-[1.85] break-keep text-muted sm:mt-12 sm:text-lg">
            {t("landing.uspEasy1")}
            <br />
            {t("landing.uspEasy2")}
          </p>

          {/* 3. 두 가지 약속 — 모바일에서는 강조구를 항상 둘째 줄로 내립니다 */}
          <div className="mt-9 space-y-4 border-y border-line py-8 sm:mt-12 sm:py-10">
            <p className="text-[1.0625rem] leading-[1.7] break-keep text-ivory sm:text-xl">
              {t("landing.uspPromise1")}{" "}
              <span className="block text-champagne sm:inline">
                {t("landing.uspPromise1Accent")}
              </span>
            </p>
            <p className="text-[1.0625rem] leading-[1.7] break-keep text-ivory sm:text-xl">
              {t("landing.uspPromise2")}{" "}
              <span className="block text-champagne sm:inline">
                {t("landing.uspPromise2Accent")}
              </span>
            </p>
          </div>

          {/* 4. 마무리 */}
          <p className="mt-9 text-[1.0625rem] leading-[1.85] break-keep text-muted sm:mt-12 sm:text-lg">
            {t("landing.uspClose1")}
            <br />
            {t("landing.uspClose2")}{" "}
            <span className="text-champagne">{t("landing.uspCloseAccent")}</span>
            {t("landing.uspCloseTail")}
          </p>

          <p className="mt-10 font-display text-[1.625rem] leading-[1.4] break-keep text-ivory sm:mt-14 sm:text-[2.25rem] sm:leading-[1.3]">
            {t("landing.uspTagline")}{" "}
            <span className="italic text-champagne">
              {t("landing.uspTaglineAccent")}
            </span>
          </p>

          <p className="label-caps mt-7 sm:mt-8">{t("landing.uspSignature")}</p>
        </div>
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
  Eye,
];

function HowItWorks({ t }: { t: Translate }) {
  return (
    <section id="how" className="scroll-mt-20 border-y border-line/70 bg-surface/50">
      <Container className="py-20 sm:py-28">
        <SectionHeading
          eyebrow={t("landing.howEyebrow")}
          title={t("landing.howTitle")}
          description={t("landing.howBody")}
        />

        <ol className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
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
      <Container className="grid items-center gap-14 py-20 sm:py-28 lg:grid-cols-2">
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

/* -------------------------------------------------------- Mask and reveal */

function MaskAndReveal({ t }: { t: Translate }) {
  return (
    <section id="reveal" className="scroll-mt-20 border-y border-line/70 bg-surface/50">
      <Container className="py-20 sm:py-28">
        <SectionHeading
          eyebrow={t("landing.revealEyebrow")}
          title={t("landing.revealTitle")}
          description={t("landing.revealBody")}
        />

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="h-full">
              <CardBody>
                <CardTitle>{t(`landing.reveal${n}Title`)}</CardTitle>
                <p className="mt-3 text-[0.9375rem] leading-relaxed break-keep text-muted">
                  {t(`landing.reveal${n}Body`)}
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

function Safety({ t }: { t: Translate }) {
  return (
    <section id="safety" className="scroll-mt-20">
      <Container className="py-20 sm:py-28">
        <SectionHeading
          eyebrow={t("landing.safetyEyebrow")}
          title={t("landing.safetyTitle")}
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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

/* ----------------------------------------------------------------- Hours */

function Hours({ t }: { t: Translate }) {
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
                <h2 className="font-display text-2xl break-keep text-ivory">
                  {t("landing.hoursTitle")}
                </h2>
                <p className="mt-2 text-[0.9375rem] leading-relaxed break-keep text-muted">
                  {t("landing.hoursBody")}
                </p>
              </div>
            </div>
            <ButtonLink href="/lobby" variant="secondary" className="shrink-0">
              {t("landing.hoursCta")}
            </ButtonLink>
          </CardBody>
        </Card>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------ Closing CTA */

function ClosingCta({ t }: { t: Translate }) {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="hero-atmosphere absolute inset-0 opacity-70" />
      <Container className="relative py-24 text-center sm:py-32">
        <h2 className="mx-auto max-w-2xl font-display text-4xl leading-tight break-keep text-ivory sm:text-5xl">
          {t("landing.closingLine1")}
          <br />
          <span className="italic text-champagne">
            {t("landing.closingLine2")}
          </span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-[0.9375rem] leading-relaxed break-keep text-muted">
          {t("landing.closingBody")}
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/lobby" size="lg" className="gold-glow">
            {t("landing.heroCta")}
          </ButtonLink>
          <ButtonLink href="/membership" variant="secondary" size="lg">
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
