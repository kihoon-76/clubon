import { ArrowRight, Plus, Sparkles, TicketCheck, Users } from "lucide-react";
import { redirect } from "next/navigation";

import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { getDb } from "@/lib/db";
import { describeClubStatus } from "@/lib/club/status";
import { getSession } from "@/lib/session";
import { now } from "@/lib/time";

export const metadata = { title: "클럽 로비" };

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

export default async function LobbyPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const db = getDb();
  const club = await db.getPrimaryClub();
  const hours = await db.getOperatingHours(club.id);
  const status = describeClubStatus(club, hours, now());

  // 운영시간 게이트 — 닫혀 있으면 마감 페이지로.
  if (!status.isOpen) redirect("/closed");

  const activeTable = await db.getActiveTableForUser(session.user.id);
  const members = activeTable
    ? await db.getActiveTableMembers(activeTable.id)
    : [];

  return (
    <Container className="py-16 sm:py-20">
      <p className="label-caps">클럽 로비</p>
      <h1 className="mt-4 font-display text-4xl leading-tight text-ivory sm:text-5xl">
        환영합니다,
        <span className="text-champagne"> {session.profile?.nickname ?? "회원"}</span>
        님
      </h1>
      <p className="mt-4 flex items-center gap-2 text-[0.9375rem] text-muted">
        <span aria-hidden className="size-1.5 rounded-full bg-success" />
        지금 영업 중입니다 · {status.closesAtText}까지
      </p>

      {activeTable ? (
        <Card hairline className="mt-10 overflow-hidden">
          <CardBody className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="label-caps">진행 중인 라운지</span>
                <Badge tone="gold">
                  {TABLE_STATE_LABEL[activeTable.state] ?? activeTable.state}
                </Badge>
              </div>
              <h2 className="mt-3 font-display text-2xl text-ivory">
                {activeTable.name}
              </h2>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                <Users aria-hidden className="size-4 text-champagne" />
                {members.length}명 참여 · 초대코드{" "}
                <span className="font-mono tracking-widest text-ivory">
                  {activeTable.inviteCode}
                </span>
              </p>
            </div>
            <ButtonLink href={`/lounges/${activeTable.id}`} className="shrink-0">
              라운지로 돌아가기
            </ButtonLink>
          </CardBody>
        </Card>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <ActionCard
            href="/waiters"
            icon={Plus}
            title="라운지 만들기"
            body="먼저 AI 웨이터를 고르면, 웨이터가 내 라운지로 안내하고 원하는 스타일의 상대를 찾아드립니다."
            cta="웨이터 고르고 시작하기"
          />
          <ActionCard
            href="/lounges/join"
            icon={TicketCheck}
            title="초대코드로 참여"
            body="친구에게 받은 초대코드로 이미 만들어진 라운지에 합류하세요."
            cta="코드 입력하기"
            variant="secondary"
          />
        </div>
      )}

      {/* AI 웨이터 진입 */}
      <ButtonLink
        href="/waiters"
        variant="secondary"
        className="mt-5 h-auto w-full justify-between gap-4 px-6 py-5"
      >
        <span className="flex items-center gap-3">
          <Sparkles aria-hidden className="size-5 text-champagne" />
          <span className="flex flex-col items-start">
            <span className="text-ivory">AI 웨이터 만나보기</span>
            <span className="text-xs text-muted">
              열 명의 집사 중 오늘의 호스트를 골라보세요
            </span>
          </span>
        </span>
        <ArrowRight aria-hidden className="size-4 text-champagne" />
      </ButtonLink>

      <p className="mt-10 max-w-2xl text-sm leading-relaxed text-faint">
        모든 대화는 최소 4명 이상의 그룹으로 시작합니다. 1:1 매칭은 제공하지
        않으며, 합석은 양쪽 라운지가 모두 수락해야 열립니다.
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
