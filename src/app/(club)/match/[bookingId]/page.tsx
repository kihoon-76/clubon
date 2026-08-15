import { redirect } from "next/navigation";

import { BookingResult } from "@/components/lounge/booking-result";
import { Container } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button";
import { getDb } from "@/lib/db";
import { isSeededDemoLounge } from "@/lib/db/memory";
import { getT } from "@/lib/i18n/server";
import { requireOnboardedSession } from "@/lib/session";
import { getWaiter } from "@/lib/waiters";

export async function generateMetadata() {
  return { title: (await getT())("match.metaTitle") };
}

export default async function MatchProposalPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const { user } = await requireOnboardedSession(`/match/${bookingId}`);
  const db = getDb();

  const myTable = await db.getActiveTableForUser(user.id);
  if (!myTable) redirect("/lobby");

  const booking = await db.getBooking(bookingId);
  if (!booking) redirect("/lobby");

  // 제안 당사자만 볼 수 있습니다.
  const side =
    booking.requesterTableId === myTable.id
      ? "requester"
      : booking.matchedTableId === myTable.id
        ? "matched"
        : null;
  if (!side) redirect("/lobby");

  // 이미 합석이 열렸으면 대화방으로.
  if (booking.state === "ACCEPTED" && booking.sessionId) {
    redirect(`/room/${booking.sessionId}`);
  }

  const counterpartId =
    side === "requester" ? booking.matchedTableId : booking.requesterTableId;
  const counterpartTable = await db.getTable(counterpartId);
  if (!counterpartTable) redirect("/lobby");

  const counterpartProfiles = await db.getProfilesForTable(counterpartId);
  const myProfiles = await db.getProfilesForTable(myTable.id);
  const waiter = booking.waiterId ? getWaiter(booking.waiterId) : undefined;
  const t = await getT();

  const myResponse =
    side === "requester" ? booking.requesterResponse : booking.matchedResponse;
  const counterpartResponse =
    side === "requester" ? booking.matchedResponse : booking.requesterResponse;

  return (
    <Container className="py-14 sm:py-16">
      <p className="label-caps">{t("match.eyebrow")}</p>
      <h1 className="mt-3 font-display text-4xl leading-tight break-keep text-ivory sm:text-5xl">
        {t("match.title")}
      </h1>
      <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed break-keep text-muted">
        {t("match.intro")}
      </p>

      <div className="mt-10 max-w-2xl">
        <BookingResult
          booking={booking}
          counterpartTable={counterpartTable}
          counterpartProfiles={counterpartProfiles}
          waiter={waiter}
          myResponse={myResponse}
          counterpartResponse={counterpartResponse}
          counterpartIsDemo={isSeededDemoLounge(counterpartId) || counterpartTable.isTest}
          totalParticipants={myProfiles.length + counterpartProfiles.length}
        />

        {booking.state !== "PENDING" ? (
          <div className="mt-8">
            <ButtonLink href={`/lounges/${myTable.id}`} variant="secondary">
              {t("match.backToLounge")}
            </ButtonLink>
          </div>
        ) : null}
      </div>
    </Container>
  );
}
