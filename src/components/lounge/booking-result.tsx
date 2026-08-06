import { Check, Clock, ShieldAlert, Users, Video } from "lucide-react";

import { respondToProposal } from "@/app/(club)/lounges/actions";
import { Badge, MockBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import type { Booking, Profile, Table } from "@/lib/db/types";
import type { Waiter } from "@/lib/waiters";

const GENDER_LABEL: Record<Profile["gender"], string> = {
  female: "여성",
  male: "남성",
  other: "기타",
};

/**
 * 매치 제안 카드. 양측이 모두 수락해야 마스크 대화방이 열립니다.
 * 팁·우선권은 상대의 수락을 강제하지 않습니다.
 */
export function BookingResult({
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
  const pending = booking.state === "PENDING";
  const waitingForOther = myResponse === "accepted" && pending;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={pending ? "gold" : booking.state === "ACCEPTED" ? "success" : "neutral"}>
          {booking.state === "PENDING"
            ? "매치 제안"
            : booking.state === "ACCEPTED"
              ? "합석 확정"
              : booking.state === "DECLINED"
                ? "성사되지 않음"
                : "만료됨"}
        </Badge>
        {waiter ? (
          <span className="text-sm text-muted">
            {waiter.name} 매니저가 가장 잘 맞는 라운지를 찾았어요
          </span>
        ) : null}
      </div>

      <Card hairline className="overflow-hidden">
        <CardBody className="space-y-6">
          <div>
            <p className="label-caps">상대 라운지</p>
            <h2 className="mt-2 font-display text-3xl text-ivory">
              {counterpartTable.name}
            </h2>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <Users aria-hidden className="size-4 text-champagne" />
                {counterpartProfiles.length}명 참여
              </span>
              <span>합석 시 총 {totalParticipants}명</span>
              <span>적합도 {booking.score}점</span>
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
                  {GENDER_LABEL[p.gender]}
                </span>
              </li>
            ))}
          </ul>

          <div>
            <p className="label-caps">공통점</p>
            <ul className="mt-3 space-y-2">
              {booking.reasons.map((r) => (
                <li
                  key={r}
                  className="flex items-center gap-2.5 text-[0.9375rem] text-muted"
                >
                  <Check aria-hidden className="size-4 shrink-0 text-champagne" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-start gap-3 rounded-[var(--radius-control)] border border-line bg-surface-overlay/50 p-4">
            <Video aria-hidden className="mt-0.5 size-4 shrink-0 text-champagne" />
            <p className="text-sm leading-relaxed text-muted">
              입장하면 동물 마스크를 쓴 상태로 대화가 시작됩니다. 얼굴은 상대와
              내가 <strong className="text-ivory">모두 동의</strong>했을 때만,
              그 상대에게만 공개됩니다.
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-[var(--radius-control)] border border-danger/30 bg-danger-dim/30 p-4">
            <ShieldAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-danger" />
            <p className="text-sm leading-relaxed text-ivory">
              다른 참가자의 영상·음성·개인정보를 캡처, 녹화, 촬영하거나 공유하는
              행위는 금지됩니다. 위반 시 영구 이용정지 및 관련 법률에 따른 법적
              책임이 따를 수 있습니다.
            </p>
          </div>
        </CardBody>
      </Card>

      {pending ? (
        <div className="space-y-4">
          {waitingForOther ? (
            <p className="flex items-center gap-2 rounded-[var(--radius-control)] border border-line bg-surface px-4 py-3 text-sm text-muted">
              <Clock aria-hidden className="size-4 text-champagne" />
              내 라운지는 수락했습니다. 상대 라운지의 응답을 기다리는 중입니다.
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              <form action={respondToProposal.bind(null, booking.id, "accepted")}>
                <Button type="submit" size="lg" className="gold-glow">
                  수락하고 합석하기
                </Button>
              </form>
              <form action={respondToProposal.bind(null, booking.id, "declined")}>
                <Button type="submit" size="lg" variant="secondary">
                  이번엔 넘기기
                </Button>
              </form>
            </div>
          )}

          {counterpartIsDemo ? (
            <p className="flex flex-wrap items-center gap-2 text-xs text-faint">
              <MockBadge />
              상대 라운지는 데모 참가자로 구성되어 있어, 수락하면 라운지 매니저가 상대
              측 응답을 대신 처리합니다.
            </p>
          ) : (
            <p className="text-xs text-faint">
              상대 라운지 응답: {responseLabel(counterpartResponse)}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function responseLabel(r: Booking["requesterResponse"]): string {
  if (r === "accepted") return "수락";
  if (r === "declined") return "거절";
  return "대기 중";
}
