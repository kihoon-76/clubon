import { Flag, ShieldCheck, SlidersHorizontal, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return {
    title: t("safety.metaTitle"),
    description: t("safety.metaDescription"),
  };
}

/** 아이콘만 이 파일에 남습니다 — 문구는 `safety.p<n>Title|Body`. */
const PRINCIPLE_ICONS: LucideIcon[] = [
  ShieldCheck,
  SlidersHorizontal,
  Flag,
  Video,
];

export default async function SafetyCenterPage() {
  const t = await getT();

  return (
    <Container className="py-20 sm:py-24">
      <div className="max-w-2xl">
        <p className="label-caps">{t("safety.eyebrow")}</p>
        <h1 className="mt-4 font-display text-4xl leading-tight break-keep text-ivory sm:text-5xl">
          {t("safety.title")}
        </h1>
        <p className="mt-6 text-[1.0625rem] leading-relaxed break-keep text-muted">
          {t("safety.intro")}
        </p>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2">
        {PRINCIPLE_ICONS.map((Icon, i) => (
          <Card key={i} hairline className="h-full">
            <CardBody>
              <span
                aria-hidden
                className="flex size-10 items-center justify-center rounded-full border border-champagne-dim/60 text-champagne"
              >
                <Icon className="size-[1.125rem]" />
              </span>
              <CardTitle className="mt-5">
                {t(`safety.p${i + 1}Title`)}
              </CardTitle>
              <p className="mt-3 text-[0.9375rem] leading-relaxed break-keep text-muted">
                {t(`safety.p${i + 1}Body`)}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>

      <section id="recording" className="mt-20 scroll-mt-20 max-w-3xl">
        <h2 className="font-display text-3xl break-keep text-ivory">
          {t("safety.recordingTitle")}
        </h2>
        <p className="mt-6 text-[0.9375rem] leading-relaxed break-keep text-muted">
          {t("safety.recordingBody")}
        </p>
        <p className="mt-4 text-[0.9375rem] leading-relaxed break-keep text-faint">
          {t("safety.recordingLimits")}
        </p>
      </section>

      <section className="mt-16 max-w-3xl">
        <h2 className="font-display text-3xl break-keep text-ivory">
          {t("safety.reportTitle")}
        </h2>
        <ol className="mt-6 space-y-3 text-[0.9375rem] leading-relaxed break-keep text-muted">
          {[1, 2, 3, 4].map((n) => (
            <li key={n}>
              {n}. {t(`safety.report${n}`)}
            </li>
          ))}
        </ol>
        <p className="mt-6 text-sm leading-relaxed break-keep text-faint">
          {t("safety.reportUrgent")}
        </p>
      </section>
    </Container>
  );
}
