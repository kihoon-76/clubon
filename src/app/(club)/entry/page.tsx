import { redirect } from "next/navigation";
import { Clock, MapPin, Sparkles, Ticket } from "lucide-react";

import { Container } from "@/components/layout/container";
import { EntryForm } from "@/components/entry/entry-form";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { resetEntry, startMatching } from "@/app/(club)/entry/actions";
import { getDb } from "@/lib/db";
import { describeClubStatus } from "@/lib/club/status";
import {
  ENTRY_PASS,
  EXTRA_MATCH,
  LOUNGE_MINUTES,
  formatUsd,
  productName,
} from "@/lib/payments/catalog";
import { purchasableCodes } from "@/lib/payments/creem";
import { regionLabel } from "@/lib/regions";
import { getT } from "@/lib/i18n/server";
import type { Translate } from "@/lib/i18n/types";
import { requireOnboardedSession } from "@/lib/session";
import { now } from "@/lib/time";
import { getWaiter, waiterEpithet, waiterName } from "@/lib/waiters";

export async function generateMetadata() {
  return { title: (await getT())("entry.metaTitle") };
}

/** 쿼리스트링으로 오는 오류 코드 — 사전에 있는 것만 화면에 띄웁니다. */
const ERROR_CODES = new Set([
  "region",
  "invalid",
  "unavailable",
  "unknown",
  "not_configured",
  "creem_error",
]);

/**
 * 입장 신청 화면.
 *
 * 두 가지 모습을 오갑니다.
 *
 *   신청 전   지역·매니저·원하는 상대를 고르는 폼
 *   신청 후   고른 내용 요약 + (횟수가 있으면) 매칭 시작 · (없으면) 입장료 결제
 *
 * 결제하러 나갔다 돌아와도 신청 내용이 그대로인 것은, 그 내용이 **내 라운지**에
 * 저장되어 있기 때문입니다.
 */
export default async function EntryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { user } = await requireOnboardedSession("/entry");
  const t = await getT();

  const db = getDb();
  const club = await db.getPrimaryClub();
  const hours = await db.getOperatingHours(club.id);
  if (!describeClubStatus(club, hours, now(), t).isOpen) redirect("/closed");

  const [table, wallet] = await Promise.all([
    db.getActiveTableForUser(user.id),
    db.getWallet(user.id),
  ]);

  const error =
    typeof sp.error === "string" && ERROR_CODES.has(sp.error)
      ? t(`entry.errors.${sp.error}`)
      : null;
  const paying = sp.purchase === "processing";
  const searched = sp.searched === "1";

  return (
    <Container className="py-12 sm:py-16">
      <p className="label-caps">{t("entry.eyebrow")}</p>
      <h1 className="mt-4 font-display text-3xl leading-tight text-ivory sm:text-4xl">
        {t("entry.title")}
      </h1>
      <p className="mt-4 max-w-2xl text-[0.9375rem] leading-relaxed break-keep text-muted">
        {t("entry.intro", {
          price: formatUsd(ENTRY_PASS.priceCents),
          matches: ENTRY_PASS.matches,
          minutes: LOUNGE_MINUTES,
        })}
      </p>

      {error ? (
        <p className="mt-6 rounded-[var(--radius-control)] border border-danger/40 bg-danger-dim/40 px-4 py-3 text-sm break-keep text-ivory">
          {error}
        </p>
      ) : null}

      {paying ? (
        <p
          role="status"
          className="mt-6 rounded-[var(--radius-control)] border border-line bg-surface-raised px-4 py-3 text-sm break-keep text-muted"
        >
          {t("entry.checking")}
        </p>
      ) : null}

      <WalletLine t={t} remaining={wallet.remainingMatches} />

      {table ? (
        <EntrySummary
          t={t}
          regionCode={table.regionCode}
          waiterId={table.waiterId}
          remaining={wallet.remainingMatches}
          searched={searched}
        />
      ) : (
        <div className="mt-10">
          <EntryForm
            defaultWaiterId={
              typeof sp.waiter === "string" && getWaiter(sp.waiter)
                ? sp.waiter
                : null
            }
          />
        </div>
      )}
    </Container>
  );
}

/* ------------------------------------------------------------ 잔여 안내 */

function WalletLine({ t, remaining }: { t: Translate; remaining: number }) {
  return (
    <p className="mt-6 flex items-center gap-2 text-sm text-muted">
      <Ticket aria-hidden className="size-4 text-champagne" />
      {t("entry.remaining")}{" "}
      <strong className="font-mono tabular-nums text-ivory">
        {t("entry.times", { count: remaining })}
      </strong>
    </p>
  );
}

/* ------------------------------------------------------- 신청 후 요약 */

function EntrySummary({
  t,
  regionCode,
  waiterId,
  remaining,
  searched,
}: {
  t: Translate;
  regionCode: string | null;
  waiterId: string | null;
  remaining: number;
  searched: boolean;
}) {
  const region = regionCode ? regionLabel(regionCode, t) : null;
  const waiter = waiterId ? getWaiter(waiterId) : null;
  const canMatch = remaining > 0;

  // 결제는 링크(GET)가 아니라 form POST입니다. 프리페치나 크롤러가 결제
  // 세션을 만들지 못하게 하려는 것으로, 방 안의 연장 상품과 같은 규칙입니다.
  const sellable = purchasableCodes();
  const product = remaining > 0 ? EXTRA_MATCH : ENTRY_PASS;
  const canBuy = sellable.has(product.code);

  return (
    <>
      <Card hairline className="mt-8">
        <CardBody className="space-y-5">
          <div className="flex items-center gap-2">
            <span className="label-caps">{t("entry.summaryTitle")}</span>
            <Badge tone="gold">{t("entry.accepted")}</Badge>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            <Row icon={MapPin} label={t("entry.region")}>
              {region ?? t("entry.regionUnset")}
            </Row>
            <Row icon={Sparkles} label={t("entry.manager")}>
              {waiter
                ? `${waiterName(t, waiter)} · ${waiterEpithet(t, waiter)}`
                : t("entry.managerUnset")}
            </Row>
          </dl>

          {searched ? (
            <p
              role="status"
              className="rounded-[var(--radius-control)] border border-warn/40 bg-warn-dim/40 px-4 py-3 text-sm break-keep text-ivory"
            >
              {t("entry.noMatch")}
            </p>
          ) : null}

          {canMatch ? (
            <form action={startMatching}>
              <Button type="submit" className="w-full gold-glow">
                {t("entry.findMatch")}
              </Button>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="flex items-start gap-2 rounded-[var(--radius-control)] border border-champagne-dim/50 bg-champagne/5 px-4 py-3 text-sm leading-relaxed break-keep text-ivory">
                <Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-champagne" />
                {t("entry.needPayment", { matches: ENTRY_PASS.matches })}
              </p>
              {canBuy ? (
                <form action="/api/payments/checkout" method="post">
                  <input type="hidden" name="code" value={product.code} />
                  <input type="hidden" name="next" value="/entry" />
                  <Button type="submit" className="w-full gold-glow">
                    {t("entry.pay", {
                      name: productName(t, product.code),
                      price: formatUsd(product.priceCents),
                    })}
                  </Button>
                </form>
              ) : (
                <p className="rounded-[var(--radius-control)] border border-line bg-surface px-4 py-3 text-sm text-muted">
                  {t("entry.notConfigured")}
                </p>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <form action={resetEntry}>
          <Button type="submit" variant="secondary" size="sm">
            {t("entry.reset")}
          </Button>
        </form>
        <ButtonLink href="/lobby" variant="secondary" size="sm">
          {t("entry.toLobby")}
        </ButtonLink>
      </div>

      <p className="mt-6 max-w-2xl text-xs leading-relaxed break-keep text-faint">
        {t("entry.deductNote")}
      </p>
    </>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof MapPin;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs text-faint">
        <Icon aria-hidden className="size-3.5 text-champagne" />
        {label}
      </dt>
      <dd className="mt-1 text-[0.9375rem] break-keep text-ivory">{children}</dd>
    </div>
  );
}
