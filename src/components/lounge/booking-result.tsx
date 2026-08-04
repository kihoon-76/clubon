import { Check, Users, Video } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import type { Booking, Profile, Table } from "@/lib/db/types";
import type { Waiter } from "@/lib/waiters";

const GENDER_LABEL: Record<Profile["gender"], string> = {
  female: "여성",
  male: "남성",
  other: "기타",
};

export function BookingResult({
  booking,
  matchedTable,
  matchedProfiles,
  waiter,
  tableId,
}: {
  booking: Booking;
  matchedTable: Table;
  matchedProfiles: Profile[];
  waiter: Waiter | undefined;
  tableId: string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Badge tone="success">부킹 완료</Badge>
        {waiter ? (
          <span className="text-sm text-muted">
            {waiter.name} 웨이터가 가장 잘 맞는 라운지를 찾았어요
          </span>
        ) : null}
      </div>

      <Card hairline className="overflow-hidden">
        <CardBody className="space-y-6">
          <div>
            <p className="label-caps">상대 라운지</p>
            <h2 className="mt-2 font-display text-3xl text-ivory">
              {matchedTable.name}
            </h2>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
              <Users aria-hidden className="size-4 text-champagne" />
              {matchedProfiles.length}명 참여
            </p>
          </div>

          <ul className="flex flex-wrap gap-2.5">
            {matchedProfiles.map((p) => (
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
              양쪽 라운지가 모두 준비되면 마스크를 쓴 상호 영상으로 연결됩니다.
              실시간 영상 연결은 다음 단계에서 제공됩니다.
            </p>
          </div>
        </CardBody>
      </Card>

      <ButtonLink href={`/lounges/${tableId}?edit=1`} variant="secondary">
        다른 조건으로 다시 찾기
      </ButtonLink>
    </div>
  );
}
