"use client";

import { useState } from "react";
import { Clock3, Gift, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";
import { productName } from "@/lib/payments/catalog";
import type { RoomExtensionView } from "@/lib/runtime/view";

/**
 * 영상방 시간 연장 구매.
 *
 * "이 방의 시간"은 그 안의 모두가 함께 쓰는 자원입니다.
 * 그래서 연장은 **방 전체의 시간**을 늘리고, 돈은 누른 사람에게서만 빠집니다.
 * 방을 연 회원에게는 연장이, 나머지 참가자에게는 같은 일을 대신 해 주는
 * 선물이 보입니다(목록은 서버가 정합니다 — `RoomView.extensions`).
 *
 * 결제 시작은 GET 링크가 아니라 form POST입니다. 프리페치나 크롤러가 결제
 * 세션을 만들지 못하게 하려는 것으로, 입장료 카드와 같은 규칙입니다.
 *
 * 시간이 실제로 늘어나는 것은 결제 직후가 아니라 **웹훅이 확인한 뒤**입니다.
 * 룸 폴링이 새 만료 시각을 받아오면 타이머가 스스로 늘어납니다.
 */
export function ExtendControl({
  sessionId,
  options,
}: {
  sessionId: string;
  options: RoomExtensionView[];
}) {
  const t = useT();
  // 결제 페이지로 넘어가는 동안 모든 버튼을 잠가 중복 결제를 막습니다.
  const [submitting, setSubmitting] = useState<string | null>(null);

  if (options.length === 0) return null;
  const gift = options.every((o) => o.gift);

  return (
    <div className="mt-4">
      <p className="text-xs leading-relaxed break-keep text-muted">
        {t(gift ? "room.extendGiftHint" : "room.extendHint")}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const name = productName(t, option.code);
          return (
          <form
            key={option.code}
            action="/api/payments/checkout"
            method="post"
            onSubmit={() => setSubmitting(option.code)}
          >
            <input type="hidden" name="code" value={option.code} />
            <input type="hidden" name="sessionId" value={sessionId} />
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              disabled={submitting !== null}
              aria-label={t("pricing.buyAria", {
                name,
                price: option.price,
              })}
            >
              {submitting === option.code ? (
                <Loader2 aria-hidden className="size-4 animate-spin" />
              ) : option.gift ? (
                <Gift aria-hidden className="size-4 text-champagne" />
              ) : (
                <Clock3 aria-hidden className="size-4 text-champagne" />
              )}
              {name}
              <span className="text-faint">{option.price}</span>
            </Button>
          </form>
          );
        })}
      </div>
    </div>
  );
}
