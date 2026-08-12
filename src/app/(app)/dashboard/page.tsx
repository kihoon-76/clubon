import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  MessageSquare,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Container } from "@/components/layout/container";
import { WalletPanel } from "@/components/payments/wallet-panel";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { CONSENT_ITEMS, consentTitle } from "@/lib/consent/items";
import { getDb } from "@/lib/db";
import { describeClubStatus } from "@/lib/club/status";
import {
  getBlockedIds,
  getFeedback,
  listSessionsForUser,
} from "@/lib/runtime/store";
import { getLocale, getT } from "@/lib/i18n/server";
import { requireOnboardedSession } from "@/lib/session";
import { now } from "@/lib/time";
import { ageBandLabel, energyLabel, interestLabel } from "@/lib/match-options";

export async function generateMetadata() {
  return { title: (await getT())("dashboard.eyebrow") };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { user, profile } = await requireOnboardedSession("/dashboard");
  const [t, locale] = await Promise.all([getT(), getLocale()]);

  const db = getDb();
  const club = await db.getPrimaryClub();
  const hours = await db.getOperatingHours(club.id);
  const status = describeClubStatus(club, hours, now(), t);

  const activeTable = await db.getActiveTableForUser(user.id);
  const consents = await db.getConsents(user.id);
  const grantedTypes = new Set(
    consents.filter((c) => c.granted).map((c) => c.consentType),
  );
  const optionalItems = CONSENT_ITEMS.filter((i) => !i.required);
  const sessions = listSessionsForUser(user.id);
  const blockedCount = getBlockedIds(user.id).length;

  const [wallet, payments, usages] = await Promise.all([
    db.getWallet(user.id),
    db.listPaymentsForUser(user.id, 20),
    db.listUsagesForUser(user.id, 20),
  ]);

  return (
    <Container className="py-14 sm:py-16">
      <p className="label-caps">{t("dashboard.eyebrow")}</p>
      <h1 className="mt-3 font-display text-4xl leading-tight text-ivory sm:text-5xl">
        {t("dashboard.greeting", {
          nickname: profile?.nickname ?? t("dashboard.member"),
        })}
      </h1>

      {sp.feedback === "1" ? (
        <p
          role="status"
          className="mt-6 flex items-center gap-2 rounded-[var(--radius-control)] border border-success/40 bg-success-dim/50 px-4 py-3 text-sm text-ivory"
        >
          <CheckCircle2 aria-hidden className="size-4 text-success" />
          {t("dashboard.feedbackThanks")}
        </p>
      ) : null}

      {sp.purchase === "processing" ? (
        <p
          role="status"
          className="mt-6 flex items-start gap-2 rounded-[var(--radius-control)] border border-champagne-dim/50 bg-champagne/5 px-4 py-3 text-sm leading-relaxed break-keep text-ivory"
        >
          <Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-champagne" />
          {t("dashboard.purchaseProcessing")}
        </p>
      ) : null}

      {sp.purchase === "cancelled" ? (
        <p
          role="status"
          className="mt-6 flex items-center gap-2 rounded-[var(--radius-control)] border border-line bg-surface px-4 py-3 text-sm text-muted"
        >
          {t("dashboard.purchaseCancelled")}
        </p>
      ) : null}

      <div className="mt-10">
        <WalletPanel wallet={wallet} payments={payments} usages={usages} />
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        {/* 클럽 상태 · 입장 */}
        <Card hairline>
          <CardBody className="space-y-4">
            <div className="flex items-center gap-2">
              <CardTitle>{t("dashboard.club")}</CardTitle>
              <Badge tone={status.isOpen ? "success" : "neutral"}>
                {status.isOpen ? t("dashboard.open") : t("dashboard.closed")}
              </Badge>
            </div>
            <p className="text-sm leading-relaxed text-muted">{status.short}</p>
            {activeTable ? (
              <div className="rounded-[var(--radius-control)] border border-line bg-surface p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-ivory">{activeTable.name}</span>
                  <Badge tone="gold">
                    {t(`tableState.${activeTable.state}`)}
                  </Badge>
                </div>
                <div className="mt-4">
                  <ButtonLink href={`/lounges/${activeTable.id}`} size="sm">
                    {t("dashboard.toLounge")}
                    <ArrowRight aria-hidden className="size-4" />
                  </ButtonLink>
                </div>
              </div>
            ) : (
              <ButtonLink href="/lobby" size="sm">
                {t("dashboard.toLobby")}
                <ArrowRight aria-hidden className="size-4" />
              </ButtonLink>
            )}
          </CardBody>
        </Card>

        {/* 프로필 */}
        <Card hairline>
          <CardBody className="space-y-4">
            <CardTitle>{t("dashboard.profile")}</CardTitle>
            {profile ? (
              <dl className="space-y-2 text-sm">
                <Row label={t("profile.nickname")} value={profile.nickname} />
                <Row
                  label={t("profile.ageBand")}
                  value={ageBandLabel(t, profile.ageBand)}
                />
                <Row
                  label={t("dashboard.vibe")}
                  value={energyLabel(t, profile.groupVibe)}
                />
                <Row
                  label={t("common.interests")}
                  value={
                    profile.interests
                      .map((i) => interestLabel(t, i))
                      .join(" · ") || "—"
                  }
                />
                <Row label={t("entry.region")} value={profile.region ?? "—"} />
                <Row
                  label={t("dashboard.reputation")}
                  value={t("dashboard.points", {
                    count: profile.reputationScore,
                  })}
                />
              </dl>
            ) : null}
            <ButtonLink href="/dashboard/profile" variant="secondary" size="sm">
              {t("dashboard.editProfile")}
            </ButtonLink>
          </CardBody>
        </Card>

        {/* 대화 기록 */}
        <Card hairline>
          <CardBody className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare aria-hidden className="size-4 text-champagne" />
              <CardTitle>{t("dashboard.history")}</CardTitle>
            </div>
            {sessions.length === 0 ? (
              <p className="text-sm text-muted">{t("dashboard.historyEmpty")}</p>
            ) : (
              <ul className="space-y-3">
                {sessions.slice(0, 5).map((s) => {
                  const feedback = getFeedback(s.id, user.id);
                  return (
                    <li
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] border border-line bg-surface px-4 py-3"
                    >
                      <span className="flex items-center gap-2 text-sm text-ivory">
                        <Clock aria-hidden className="size-3.5 text-faint" />
                        {new Date(s.startedAt).toLocaleString(locale, {
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="flex items-center gap-2">
                        <Badge tone={s.state === "ended" ? "neutral" : "success"}>
                          {s.state === "ended"
                            ? t("dashboard.sessionEnded")
                            : t("dashboard.sessionLive")}
                        </Badge>
                        {feedback ? (
                          <span className="text-xs text-muted">
                            {t("dashboard.myRating", {
                              rating: feedback.rating,
                            })}
                          </span>
                        ) : (
                          <Link
                            href={`/room/${s.id}/feedback`}
                            className="text-xs text-champagne hover:text-champagne-soft"
                          >
                            {t("dashboard.leaveFeedback")}
                          </Link>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* 안전 · 동의 */}
        <Card hairline>
          <CardBody className="space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck aria-hidden className="size-4 text-champagne" />
              <CardTitle>{t("dashboard.safety")}</CardTitle>
            </div>
            <dl className="space-y-2 text-sm">
              <Row
                label={t("dashboard.accountStatus")}
                value={
                  user.status === "active"
                    ? t("dashboard.statusActive")
                    : user.status === "suspended"
                      ? t("dashboard.statusSuspended")
                      : t("dashboard.statusRestricted")
                }
              />
              <Row
                label={t("dashboard.requiredConsent")}
                value={t("dashboard.completed")}
              />
              <Row
                label={t("dashboard.blockedMembers")}
                value={t("dashboard.people", { count: blockedCount })}
              />
            </dl>

            <div>
              <p className="label-caps">{t("dashboard.optionalConsent")}</p>
              <ul className="mt-2 space-y-1.5">
                {optionalItems.map((item) => (
                  <li
                    key={item.type}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="break-keep text-muted">
                      {consentTitle(t, item.type)}
                    </span>
                    <Badge tone={grantedTypes.has(item.type) ? "success" : "neutral"}>
                      {grantedTypes.has(item.type)
                        ? t("dashboard.granted")
                        : t("dashboard.notGranted")}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/onboarding/consent" variant="secondary" size="sm">
                {t("dashboard.changeConsent")}
              </ButtonLink>
              <ButtonLink href="/safety" variant="ghost" size="sm">
                <Users aria-hidden className="size-4" />
                {t("dashboard.safetyCenter")}
              </ButtonLink>
            </div>
          </CardBody>
        </Card>
      </div>
    </Container>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="text-right text-ivory">{value}</dd>
    </div>
  );
}
