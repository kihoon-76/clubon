import { Check, Clock, ShieldAlert, Users, Video } from "lucide-react";

import { respondToProposal } from "@/app/(club)/lounges/actions";
import { Badge, MockBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import type { Booking, Profile, Table } from "@/lib/db/types";
import { getT } from "@/lib/i18n/server";
import type { Translate } from "@/lib/i18n/types";
import { describeReason } from "@/lib/match/score";
import { genderLabel } from "@/lib/match-options";
import { waiterName, type Waiter } from "@/lib/waiters";

/** 프로필의 성별에는 매칭 조건에 없는 "기타"가 있습니다. */
function profileGenderLabel(t: Translate, gender: Profile["gender"]): string {
  return gender === "other"
    ? t("match.genderOther")
    : genderLabel(t, gender);
}

/**
 * 매치 제안 카드. 양측이 모두 수락해야 대화방이 열립니다.
 * 팁·우선권은 상대의 수락을 강제하지 않습니다.
 */
export async function BookingResult({
  booking,
  counterpartTable,
  counterpartProfiles,
  waiter,
  myResponse,
  counterpartResponse,
  counterpartIsDemo,
  totalParticipants,
}: {
  booking: Booking;
  counterpartTable: Table;
  counterpartProfiles: Profile[];
  waiter: Waiter | undefined;
  myResponse: Booking["requesterResponse"];
  counterpartResponse: Booking["requesterResponse"];
  counterpartIsDemo: boolean;
  totalParticipants: number;
}) {
  const t = await getT();
  const pending = booking.state === "PENDING";
  const waitingForOther = myResponse === "accepted" && pending;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={pending ? "gold" : booking.state === "ACCEPTED" ? "success" : "neutral"}>
          {booking.state === "PENDING"
            ? t("match.statePending")
            : booking.state === "ACCEPTED"
              ? t("match.stateAccepted")
              : booking.state === "DECLINED"
                ? t("match.stateDeclined")
                : t("match.stateExpired")}
        </Badge>
        {waiter ? (
          <span className="text-sm break-keep text-muted">
            {t("match.foundByWaiter", { name: waiterName(t, waiter) })}
          </span>
        ) : null}
      </div>

      <Card hairline className="overflow-hidden">
        <CardBody className="space-y-6">
          <div>
            <p className="label-caps">{t("match.counterpart")}</p>
            <h2 className="mt-2 font-display text-3xl text-ivory">
              {counterpartTable.name}
            </h2>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <Users aria-hidden className="size-4 text-champagne" />
                {t("match.counterpartCount", {
                  count: counterpartProfiles.length,
                })}
              </span>
              <span>
                {t("match.totalAfterJoin", { count: totalParticipants })}
              </span>
              <span>{t("match.fit", { score: booking.score })}</span>
            </p>
          </div>

          <ul className="flex flex-wrap gap-2.5">
            {counterpartProfiles.map((p) => (
              <li
                key={p.userId}
                className="flex items-center gap-2 rounded-full border border-line bg-surface-overlay/60 px-3.5 py-1.5 text-sm text-ivory"
              >
                {p.nickname}
                <span className="text-[0.6875rem] text-champagne">
                  {profileGenderLabel(t, p.gender)}
                </span>
              </li>
            ))}
          </ul>

          <div>
            <p className="label-caps">{t("match.commonGround")}</p>
            <ul className="mt-3 space-y-2">
              {booking.reasons.map((r, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2.5 text-[0.9375rem] break-keep text-muted"
                >
                  <Check aria-hidden className="size-4 shrink-0 text-champagne" />
                  <span>{describeReason(t, r)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-start gap-3 rounded-[var(--radius-control)] border border-line bg-surface-overlay/50 p-4">
            <Video aria-hidden className="mt-0.5 size-4 shrink-0 text-champagne" />
            <p className="text-sm leading-relaxed break-keep text-muted">
              {t("match.videoNotice")}
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-[var(--radius-control)] border border-danger/30 bg-danger-dim/30 p-4">
            <ShieldAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-danger" />
            <p className="text-sm leading-relaxed break-keep text-ivory">
              {t("match.recordingNotice")}
            </p>
          </div>
        </CardBody>
      </Card>

      {pending ? (
        <div className="space-y-4">
          {waitingForOther ? (
            <p className="flex items-center gap-2 rounded-[var(--radius-control)] border border-line bg-surface px-4 py-3 text-sm break-keep text-muted">
              <Clock aria-hidden className="size-4 shrink-0 text-champagne" />
              {t("match.waitingForOther")}
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              <form action={respondToProposal.bind(null, booking.id, "accepted")}>
                <Button type="submit" size="lg" className="gold-glow">
                  {t("match.accept")}
                </Button>
              </form>
              <form action={respondToProposal.bind(null, booking.id, "declined")}>
                <Button type="submit" size="lg" variant="secondary">
                  {t("match.decline")}
                </Button>
              </form>
            </div>
          )}

          {counterpartIsDemo ? (
            <p className="flex flex-wrap items-center gap-2 text-xs break-keep text-faint">
              <MockBadge />
              {t("match.demoNotice")}
            </p>
          ) : (
            <p className="text-xs text-faint">
              {t("match.counterpartResponse", {
                response: t(responseKey(counterpartResponse)),
              })}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function responseKey(r: Booking["requesterResponse"]): string {
  if (r === "accepted") return "match.responseAccepted";
  if (r === "declined") return "match.responseDeclined";
  return "match.responsePending";
}
