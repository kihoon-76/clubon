"use client";

import { useEffect, useState } from "react";
import { Radio, Users, Video } from "lucide-react";

import { Container } from "@/components/layout/container";
import { useT } from "@/lib/i18n/client";

interface LivePresenceData {
  onlineUsers: number;
  waitingLounges: number;
  liveRooms: number;
  updatedAt: string;
}

const EMPTY: LivePresenceData = {
  onlineUsers: 0,
  waitingLounges: 0,
  liveRooms: 0,
  updatedAt: "",
};

export function LivePresence() {
  const t = useT();
  const [data, setData] = useState(EMPTY);

  useEffect(() => {
    let active = true;

    async function refresh() {
      try {
        const response = await fetch("/api/live-presence", { cache: "no-store" });
        if (!response.ok) return;
        const next = (await response.json()) as LivePresenceData;
        if (active) setData(next);
      } catch {
        // 다음 갱신 주기에 다시 시도합니다.
      }
    }

    void refresh();
    const timer = window.setInterval(refresh, 15_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const stats = [
    { icon: Users, label: t("landing.liveUsers"), value: data.onlineUsers },
    { icon: Radio, label: t("landing.waitingLounges"), value: data.waitingLounges },
    { icon: Video, label: t("landing.liveRooms"), value: data.liveRooms },
  ];

  return (
    <section aria-labelledby="live-presence-title" className="border-y border-line/70 bg-surface/50">
      <Container className="py-8 sm:py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span aria-hidden className="size-2 rounded-full bg-success shadow-[0_0_12px_var(--color-success)]" />
              <p id="live-presence-title" className="label-caps">
                {t("landing.liveNow")}
              </p>
            </div>
            <p className="mt-2 text-sm text-muted">{t("landing.liveNote")}</p>
          </div>

          <dl className="grid grid-cols-3 gap-3 sm:min-w-[28rem]">
            {stats.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-[var(--radius-control)] border border-line bg-surface-raised px-3 py-3 text-center">
                <dt className="flex items-center justify-center gap-1.5 text-[0.6875rem] text-faint">
                  <Icon aria-hidden className="size-3.5 text-champagne" />
                  {label}
                </dt>
                <dd className="mt-1 font-mono text-xl tabular-nums text-ivory">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}
