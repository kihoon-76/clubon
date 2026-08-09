import { Crown, UserPlus, Users } from "lucide-react";

import { addDemoCompanion } from "@/app/(club)/lounges/actions";
import { Badge, MockBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Profile, Table, TableMember } from "@/lib/db/types";
import { getT } from "@/lib/i18n/server";
import { energyLabel } from "@/lib/match-options";

/** 라운지 멤버 목록 + 초대 안내 + (데모) 동반자 추가. */
export async function LoungeRoster({
  table,
  members,
  profiles,
  minSize,
  canAddDemoCompanion,
}: {
  table: Table;
  members: TableMember[];
  profiles: Profile[];
  minSize: number;
  canAddDemoCompanion: boolean;
}) {
  const t = await getT();
  const hostId = table.hostUserId;
  const short = profiles.length < minSize;

  return (
    <section className="rounded-[var(--radius-card)] border border-line bg-surface-raised p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-xl text-ivory">
          <Users aria-hidden className="size-4 text-champagne" />
          {t("lounge.members", {
            count: profiles.length,
            max: table.maxSize,
          })}
        </h2>
        <span className="text-xs text-muted">
          {t("lounge.inviteCode")}{" "}
          <span className="font-mono tracking-[0.25em] text-ivory">
            {table.inviteCode}
          </span>
        </span>
      </div>

      <ul className="mt-5 flex flex-wrap gap-2.5">
        {profiles.map((p) => (
          <li
            key={p.userId}
            className="flex items-center gap-2 rounded-full border border-line bg-surface-overlay/60 px-3.5 py-1.5 text-sm text-ivory"
          >
            {p.userId === hostId ? (
              <Crown aria-hidden className="size-3.5 text-champagne" />
            ) : null}
            {p.nickname}
            <span className="text-[0.6875rem] text-muted">
              {energyLabel(t, p.groupVibe)}
            </span>
          </li>
        ))}
        {members.length === 0 ? (
          <li className="text-sm text-faint">{t("lounge.noMembers")}</li>
        ) : null}
      </ul>

      {short ? (
        <div className="mt-5 rounded-[var(--radius-control)] border border-warn/40 bg-warn-dim/40 p-4">
          <p className="text-sm leading-relaxed break-keep text-ivory">
            {t("lounge.shortRule")}{" "}
            {t("lounge.shortCount", { count: minSize - profiles.length })}
          </p>

          {canAddDemoCompanion ? (
            <form
              action={addDemoCompanion.bind(null, table.id)}
              className="mt-4 flex flex-wrap items-center gap-3"
            >
              <Button type="submit" variant="secondary" size="sm">
                <UserPlus aria-hidden className="size-4" />
                {t("lounge.addDemoCompanion")}
              </Button>
              <MockBadge />
              <span className="text-xs break-keep text-faint">
                {t("lounge.demoCompanionHint")}
              </span>
            </form>
          ) : null}
        </div>
      ) : (
        <p className="mt-5">
          <Badge tone="success">{t("lounge.readyToMatch")}</Badge>
        </p>
      )}
    </section>
  );
}
