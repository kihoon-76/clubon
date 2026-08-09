import { CalendarClock, Moon } from "lucide-react";
import { redirect } from "next/navigation";

import { Container } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { getDb } from "@/lib/db";
import { describeClubStatus } from "@/lib/club/status";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/session";
import { now } from "@/lib/time";

export async function generateMetadata() {
  return { title: (await getT())("closed.eyebrow") };
}

export default async function ClosedPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const db = getDb();
  const club = await db.getPrimaryClub();
  const hours = await db.getOperatingHours(club.id);
  const t = await getT();
  const status = describeClubStatus(club, hours, now(), t);

  // 이미 영업 중이면 로비로.
  if (status.isOpen) redirect("/lobby");

  return (
    <Container className="flex min-h-[70dvh] flex-col justify-center py-16 sm:py-20">
      <div className="max-w-xl">
        <span
          aria-hidden
          className="flex size-12 items-center justify-center rounded-full border border-champagne-dim/60 text-champagne"
        >
          <Moon className="size-5" />
        </span>
        <p className="mt-6 label-caps">{t("closed.eyebrow")}</p>
        <h1 className="mt-4 font-display text-4xl leading-tight break-keep text-ivory sm:text-5xl">
          {t("closed.titleLine1")}
          <br />
          <span className="text-champagne">{t("closed.titleLine2")}</span>
        </h1>

        <Card hairline className="mt-8 overflow-hidden">
          <CardBody className="flex items-center gap-4">
            <span
              aria-hidden
              className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-champagne"
            >
              <CalendarClock className="size-5" />
            </span>
            <div>
              <p className="text-sm text-muted">{t("closed.nextOpen")}</p>
              <p className="mt-0.5 font-display text-xl text-ivory">
                {status.opensAtText ?? t("closed.nextOpenUnknown")}
              </p>
            </div>
          </CardBody>
        </Card>

        <p className="mt-8 text-[0.9375rem] leading-relaxed break-keep text-muted">
          {t("closed.body")}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/dashboard" variant="secondary">
            {t("closed.toDashboard")}
          </ButtonLink>
          <ButtonLink href="/" variant="ghost">
            {t("closed.toHome")}
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}
