import { Crown, Users } from "lucide-react";

import type { Profile, Table, TableMember } from "@/lib/db/types";
import { getT } from "@/lib/i18n/server";
import { energyLabel } from "@/lib/match-options";

/** 한 기기에서 함께 참여하는 라운지의 대표 회원 정보. */
export async function LoungeRoster({
  table,
  members,
  profiles,
}: {
  table: Table;
  members: TableMember[];
  profiles: Profile[];
}) {
  const t = await getT();
  const hostId = table.hostUserId;

  return (
    <section className="rounded-[var(--radius-card)] border border-line bg-surface-raised p-6">
      <h2 className="flex items-center gap-2 font-display text-xl text-ivory">
        <Users aria-hidden className="size-4 text-champagne" />
        {t("lounge.members", { count: profiles.length, max: table.maxSize })}
      </h2>

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
    </section>
  );
}
