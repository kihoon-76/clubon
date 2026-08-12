import { ArrowRight, Plus, Sparkles, Users } from "lucide-react";
import { redirect } from "next/navigation";

import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { getDb } from "@/lib/db";
import { describeClubStatus } from "@/lib/club/status";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/session";
import { now } from "@/lib/time";

export async function generateMetadata() {
  return { title: (await getT())("lobby.eyebrow") };
}

export default async function LobbyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login");

  const db = getDb();
  const club = await db.getPrimaryClub();
  const hours = await db.getOperatingHours(club.id);
  const t = await getT();
  const status = describeClubStatus(club, hours, now(), t);

  // 운영시간 게이트 — 닫혀 있으면 마감 페이지로.
  if (!status.isOpen) redirect("/closed");

  const activeTable = await db.getActiveTableForUser(session.user.id);
  const members = activeTable
    ? await db.getActiveTableMembers(activeTable.id)
    : [];

  return (
    <Container className="py-16 sm:py-20">
      <p className="label-caps">{t("lobby.eyebrow")}</p>
      <h1 className="mt-4 font-display text-4xl leading-tight text-ivory sm:text-5xl">
        {t("lobby.welcome")}
        <span className="text-champagne">
          {" "}
          {session.profile?.nickname ?? t("dashboard.member")}
        </span>
        {t("lobby.welcomeSuffix")}
      </h1>
      <p className="mt-4 flex items-center gap-2 text-[0.9375rem] text-muted">
        <span aria-hidden className="size-1.5 rounded-full bg-success" />
        {status.closesAtText
          ? t("lobby.openUntil", { time: status.closesAtText })
          : t("lobby.openNow")}
      </p>

      {sp.staff === "required" ? (
        <p
          role="status"
          className="mt-6 rounded-[var(--radius-control)] border border-warn/40 bg-warn-dim/40 px-4 py-3 text-sm leading-relaxed break-keep text-ivory"
        >
          {t("lobby.staffOnly")}
        </p>
      ) : null}

      {activeTable ? (
        <Card hairline className="mt-10 overflow-hidden">
          <CardBody className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="label-caps">{t("lobby.activeLounge")}</span>
                <Badge tone="gold">
                  {t(`tableState.${activeTable.state}`)}
                </Badge>
              </div>
              <h2 className="mt-3 font-display text-2xl text-ivory">
                {activeTable.name}
              </h2>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                <Users aria-hidden className="size-4 text-champagne" />
                {t("lobby.memberCount", { count: members.length })}
              </p>
            </div>
            <ButtonLink href={`/lounges/${activeTable.id}`} className="shrink-0">
              {t("lobby.backToLounge")}
            </ButtonLink>
          </CardBody>
        </Card>
      ) : (
        <div className="mt-10">
          <ActionCard
            href="/entry"
            icon={Plus}
            title={t("lobby.entryTitle")}
            body={t("lobby.entryBody")}
            cta={t("lobby.entryCta")}
          />
        </div>
      )}

      {/* AI 라운지 매니저 진입 */}
      <ButtonLink
        href="/waiters"
        variant="secondary"
        className="mt-5 h-auto w-full justify-between gap-4 px-6 py-5"
      >
        <span className="flex items-center gap-3">
          <Sparkles aria-hidden className="size-5 text-champagne" />
          <span className="flex flex-col items-start">
            <span className="text-ivory">{t("lobby.waitersTitle")}</span>
            <span className="text-xs break-keep text-muted">
              {t("lobby.waitersBody")}
            </span>
          </span>
        </span>
        <ArrowRight aria-hidden className="size-4 text-champagne" />
      </ButtonLink>

      <p className="mt-10 max-w-2xl text-sm leading-relaxed break-keep text-faint">
        {t("lobby.groupNote")}
      </p>
    </Container>
  );
}

function ActionCard({
  href,
  icon: Icon,
  title,
  body,
  cta,
  variant = "primary",
}: {
  href: string;
  icon: typeof Plus;
  title: string;
  body: string;
  cta: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <Card hairline className="flex h-full flex-col transition-colors hover:border-champagne-dim">
      <CardBody className="flex h-full flex-col">
        <span
          aria-hidden
          className="flex size-11 items-center justify-center rounded-full border border-champagne-dim/60 text-champagne"
        >
          <Icon className="size-5" />
        </span>
        <h2 className="mt-5 font-display text-2xl text-ivory">{title}</h2>
        <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-muted">
          {body}
        </p>
        <div className="mt-6">
          <ButtonLink href={href} variant={variant}>
            {cta}
          </ButtonLink>
        </div>
      </CardBody>
    </Card>
  );
}
