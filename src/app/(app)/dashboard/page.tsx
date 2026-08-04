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
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { CONSENT_ITEMS } from "@/lib/consent/items";
import { getDb } from "@/lib/db";
import { describeClubStatus } from "@/lib/club/status";
import {
  getBlockedIds,
  getFeedback,
  listSessionsForUser,
} from "@/lib/runtime/store";
import { requireOnboardedSession } from "@/lib/session";
import { now } from "@/lib/time";
import { ENERGY_LABEL } from "@/lib/match-options";

export const metadata = { title: "내 대시보드" };

const TABLE_STATE_LABEL: Record<string, string> = {
  FORMING: "구성 중",
  READY: "매칭 준비 완료",
  WAITING: "매칭 대기 중",
  MATCH_PROPOSED: "매치 제안됨",
  MATCH_ACCEPTED: "합석 준비 중",
  LIVE: "대화 중",
  PAUSED: "일시 정지",
  CLOSED: "종료됨",
  MODERATION_LOCKED: "잠금",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { user, profile } = await requireOnboardedSession("/dashboard");

  const db = getDb();
  const club = await db.getPrimaryClub();
  const hours = await db.getOperatingHours(club.id);
  const status = describeClubStatus(club, hours, now());

  const activeTable = await db.getActiveTableForUser(user.id);
  const consents = await db.getConsents(user.id);
  const grantedTypes = new Set(
    consents.filter((c) => c.granted).map((c) => c.consentType),
  );
  const optionalItems = CONSENT_ITEMS.filter((i) => !i.required);
  const sessions = listSessionsForUser(user.id);
  const blockedCount = getBlockedIds(user.id).length;

  return (
    <Container className="py-14 sm:py-16">
      <p className="label-caps">내 대시보드</p>
      <h1 className="mt-3 font-display text-4xl leading-tight text-ivory sm:text-5xl">
        {profile?.nickname ?? "회원"}님
      </h1>

      {sp.feedback === "1" ? (
        <p
          role="status"
          className="mt-6 flex items-center gap-2 rounded-[var(--radius-control)] border border-success/40 bg-success-dim/50 px-4 py-3 text-sm text-ivory"
        >
          <CheckCircle2 aria-hidden className="size-4 text-success" />
          피드백을 보내주셔서 감사합니다.
        </p>
      ) : null}

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        {/* 클럽 상태 · 입장 */}
        <Card hairline>
          <CardBody className="space-y-4">
            <div className="flex items-center gap-2">
              <CardTitle>클럽</CardTitle>
              <Badge tone={status.isOpen ? "success" : "neutral"}>
                {status.isOpen ? "영업 중" : "영업 종료"}
              </Badge>
            </div>
            <p className="text-sm leading-relaxed text-muted">{status.short}</p>
            {activeTable ? (
              <div className="rounded-[var(--radius-control)] border border-line bg-surface p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-ivory">{activeTable.name}</span>
                  <Badge tone="gold">
                    {TABLE_STATE_LABEL[activeTable.state] ?? activeTable.state}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted">
                  초대코드{" "}
                  <span className="font-mono tracking-widest text-ivory">
                    {activeTable.inviteCode}
                  </span>
                </p>
                <div className="mt-4">
                  <ButtonLink href={`/lounges/${activeTable.id}`} size="sm">
                    라운지로 이동
                    <ArrowRight aria-hidden className="size-4" />
                  </ButtonLink>
                </div>
              </div>
            ) : (
              <ButtonLink href="/lobby" size="sm">
                클럽 로비로 입장
                <ArrowRight aria-hidden className="size-4" />
              </ButtonLink>
            )}
          </CardBody>
        </Card>

        {/* 프로필 */}
        <Card hairline>
          <CardBody className="space-y-4">
            <CardTitle>프로필</CardTitle>
            {profile ? (
              <dl className="space-y-2 text-sm">
                <Row label="닉네임" value={profile.nickname} />
                <Row label="연령대" value={profile.ageBand} />
                <Row label="대화 성향" value={ENERGY_LABEL[profile.groupVibe]} />
                <Row
                  label="관심사"
                  value={profile.interests.join(" · ") || "—"}
                />
                <Row label="지역" value={profile.region ?? "—"} />
                <Row
                  label="평판 점수"
                  value={`${profile.reputationScore}점`}
                />
              </dl>
            ) : null}
            <ButtonLink href="/dashboard/profile" variant="secondary" size="sm">
              프로필 수정
            </ButtonLink>
          </CardBody>
        </Card>

        {/* 대화 기록 */}
        <Card hairline>
          <CardBody className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare aria-hidden className="size-4 text-champagne" />
              <CardTitle>대화 기록</CardTitle>
            </div>
            {sessions.length === 0 ? (
              <p className="text-sm text-muted">아직 참여한 대화가 없습니다.</p>
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
                        {new Date(s.startedAt).toLocaleString("ko-KR", {
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="flex items-center gap-2">
                        <Badge tone={s.state === "ended" ? "neutral" : "success"}>
                          {s.state === "ended" ? "종료" : "진행 중"}
                        </Badge>
                        {feedback ? (
                          <span className="text-xs text-muted">
                            내 평가 {feedback.rating}점
                          </span>
                        ) : (
                          <Link
                            href={`/room/${s.id}/feedback`}
                            className="text-xs text-champagne hover:text-champagne-soft"
                          >
                            피드백 남기기
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
              <CardTitle>안전 · 동의</CardTitle>
            </div>
            <dl className="space-y-2 text-sm">
              <Row
                label="계정 상태"
                value={
                  user.status === "active"
                    ? "정상"
                    : user.status === "suspended"
                      ? "정지"
                      : "이용 제한"
                }
              />
              <Row label="필수 동의" value="완료" />
              <Row
                label="차단한 회원"
                value={`${blockedCount}명`}
              />
            </dl>

            <div>
              <p className="label-caps">선택 동의</p>
              <ul className="mt-2 space-y-1.5">
                {optionalItems.map((item) => (
                  <li
                    key={item.type}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="text-muted">{item.title}</span>
                    <Badge tone={grantedTypes.has(item.type) ? "success" : "neutral"}>
                      {grantedTypes.has(item.type) ? "동의함" : "동의 안 함"}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/onboarding/consent" variant="secondary" size="sm">
                동의 항목 변경
              </ButtonLink>
              <ButtonLink href="/safety" variant="ghost" size="sm">
                <Users aria-hidden className="size-4" />
                안전 센터
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
