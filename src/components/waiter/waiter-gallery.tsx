"use client";

import { Check, Quote, Sparkles } from "lucide-react";
import { useState } from "react";

import { WaiterAvatar } from "@/components/waiter/waiter-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { startWithWaiter } from "@/app/(club)/lounges/actions";
import { useT } from "@/lib/i18n/client";
import type { Translate } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";
import {
  WAITERS,
  waiterEpithet,
  waiterName,
  waiterOutfit,
  waiterPersonality,
  waiterSpecialty,
  waiterStrengths,
  waiterTagline,
  type Waiter,
} from "@/lib/waiters";

export function WaiterGallery() {
  const t = useT();
  const [selectedId, setSelectedId] = useState<string>(WAITERS[0].id);
  const selected = WAITERS.find((w) => w.id === selectedId) ?? WAITERS[0];

  return (
    <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
      {/* 갤러리 */}
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {WAITERS.map((waiter) => {
          const active = waiter.id === selectedId;
          return (
            <li key={waiter.id}>
              <button
                type="button"
                onClick={() => setSelectedId(waiter.id)}
                aria-pressed={active}
                className={cn(
                  "group w-full rounded-[var(--radius-card)] border bg-surface-raised p-5 text-left transition-all",
                  "focus-visible:outline-none",
                  active
                    ? "border-champagne-dim gold-glow"
                    : "border-line hover:border-champagne-dim/70",
                )}
              >
                <div className="flex items-center gap-4">
                  <WaiterAvatar waiter={waiter} t={t} className="w-14 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="shrink-0 whitespace-nowrap font-display text-lg text-ivory">
                        {waiterName(t, waiter)}
                      </span>
                      <span className="min-w-0 truncate text-[0.6875rem] uppercase tracking-[0.12em] text-champagne/80">
                        {waiterEpithet(t, waiter)}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-faint">
                      {waiterOutfit(t, waiter)}
                    </p>
                  </div>
                </div>
                <p className="mt-4 line-clamp-2 text-[0.8125rem] leading-relaxed break-keep text-muted">
                  {waiterTagline(t, waiter)}
                </p>
              </button>
            </li>
          );
        })}
      </ul>

      {/* 선택된 라운지 매니저 상세 */}
      <div className="lg:sticky lg:top-24">
        <WaiterDetail waiter={selected} t={t} />
      </div>
    </div>
  );
}

function WaiterDetail({ waiter, t }: { waiter: Waiter; t: Translate }) {
  const name = waiterName(t, waiter);

  return (
    <article className="hairline-top overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface-raised shadow-[0_1px_2px_rgba(0,0,0,0.4),0_12px_40px_rgba(0,0,0,0.35)]">
      <div className="flex flex-col items-center px-6 pt-8 text-center">
        <WaiterAvatar waiter={waiter} t={t} className="w-28" />
        <div className="mt-5 flex items-center gap-2">
          <h3 className="font-display text-2xl text-ivory">{name}</h3>
          <Badge tone="gold">{waiterEpithet(t, waiter)}</Badge>
        </div>
        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-faint">
          {waiterOutfit(t, waiter)}
        </p>
      </div>

      <div className="space-y-6 p-6">
        <div className="flex gap-3 rounded-[var(--radius-control)] border border-line bg-surface-overlay/60 p-4">
          <Quote aria-hidden className="size-4 shrink-0 text-champagne" />
          <p className="text-[0.9375rem] leading-relaxed break-keep text-ivory">
            {waiterPersonality(t, waiter)}
          </p>
        </div>

        <div>
          <p className="label-caps">{t("waiterGallery.strengths")}</p>
          <ul className="mt-3 space-y-2">
            {waiterStrengths(t, waiter).map((s) => (
              <li key={s} className="flex items-center gap-2.5 text-[0.9375rem] break-keep text-muted">
                <Check aria-hidden className="size-4 shrink-0 text-champagne" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="label-caps">{t("waiterGallery.specialty")}</p>
          <p className="mt-3 flex gap-2.5 text-[0.9375rem] leading-relaxed break-keep text-muted">
            <Sparkles aria-hidden className="mt-0.5 size-4 shrink-0 text-champagne" />
            <span>{waiterSpecialty(t, waiter)}</span>
          </p>
        </div>

        <form action={startWithWaiter}>
          <input type="hidden" name="waiterId" value={waiter.id} />
          <Button type="submit" className="w-full">
            {t("waiterGallery.startWith", { name })}
          </Button>
        </form>
        <p className="text-center text-[0.6875rem] leading-relaxed break-keep text-faint">
          {t("entry.aiDisclaimer")}
        </p>
      </div>
    </article>
  );
}
