"use client";

import { useEffect, useRef, useState } from "react";
import type { DailyCall } from "@daily-co/daily-js";
import { Loader2, Ticket, Users, VideoOff } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";
import { LOUNGE_MINUTES } from "@/lib/payments/catalog";

import { cn } from "@/lib/utils";

type Status =
  | "connecting"
  | "live"
  /** 내 기기는 이 라운지의 카메라가 아니라 통화에 들어가지 않습니다. */
  | "audience"
  | "unconfigured"
  | "error"
  /** 남은 매치 횟수가 없어 서버가 입장을 막았습니다. */
  | "no_matches"
  /** 30분이 지나 서버가 새 토큰 발급을 거부했습니다. */
  | "expired";

/** globals.css의 클럽 팔레트. Prebuilt는 CSS 변수를 못 읽어 값으로 넘깁니다. */
const DAILY_THEME = {
  accent: "#d8be86", // champagne
  accentText: "#0b0b0c", // ink
  background: "#121214", // surface
  backgroundAccent: "#191a1d", // surface-raised
  baseText: "#f4f1ea", // ivory
  border: "#2b2d33", // line
  mainAreaBg: "#0b0b0c", // ink
  mainAreaBgAccent: "#191a1d", // surface-raised
  mainAreaText: "#f4f1ea", // ivory
  supportiveText: "#9a968d", // muted
};

/**
 * Daily Prebuilt 화상 무대.
 *
 * 두 라운지의 화면과 소리가 이 프레임 하나로 오갑니다. 화상이 아예 없는
 * 상태(미설정·실패·관객)에서는 프레임을 펼치지 않되, 레이아웃에서 빼면
 * 음성 재생까지 끊길 수 있어 1px 투명 상자로 남겨 둡니다.
 */
export function DailyStage({
  sessionId,
  micOn,
  camOn,
  onLiveChange,
}: {
  sessionId: string;
  micOn: boolean;
  camOn: boolean;
  /**
   * 무대가 실제로 통화에 붙었는지 알립니다. 무대가 살아 있으면 내 카메라는
   * 이 프레임이 잡고 있으므로, 화면 다른 곳에서 같은 장치를 또 열면 안 됩니다.
   */
  onLiveChange?: (live: boolean) => void;
}) {
  const t = useT();
  const mountRef = useRef<HTMLDivElement>(null);
  const callRef = useRef<DailyCall | null>(null);
  const [status, setStatus] = useState<Status>("connecting");

  useEffect(() => {
    let cancelled = false;
    let frame: DailyCall | null = null;

    async function join() {
      const res = await fetch(`/api/rooms/${sessionId}/video`, {
        cache: "no-store",
      });

      // 402 = 매치 횟수·시간 문제. 오류가 아니라 안내해야 할 상태입니다.
      if (res.status === 402) {
        const blocked = (await res.json()) as { blocked?: string };
        if (cancelled) return;
        setStatus(blocked.blocked === "expired" ? "expired" : "no_matches");
        return;
      }
      if (!res.ok) throw new Error(`join info ${res.status}`);

      const info = (await res.json()) as
        | { configured: false }
        | { configured: true; role: "audience" }
        | {
            configured: true;
            role: "camera";
            roomUrl: string;
            token: string;
            expiresAt: string;
          };

      if (cancelled) return;
      if (!info.configured) {
        setStatus("unconfigured");
        return;
      }
      // 이 라운지의 카메라가 아니면 통화에 붙지 않습니다. 화면과 소리는 방
      // 앞의 기기 한 대가 맡고, 여기서는 채팅과 타이머만 씁니다.
      if (info.role === "audience") {
        setStatus("audience");
        return;
      }

      // daily-js는 브라우저 전용이라 서버 번들에 들어가지 않도록 지연 로드합니다.
      const DailyIframe = (await import("@daily-co/daily-js")).default;
      if (cancelled || !mountRef.current) return;

      // 개발 모드의 이중 마운트 등으로 남아 있는 인스턴스를 먼저 정리합니다.
      // 중복 생성은 daily-js가 예외로 막습니다.
      DailyIframe.getCallInstance()?.destroy();

      frame = DailyIframe.createFrame(mountRef.current, {
        showLeaveButton: false,
        showFullscreenButton: true,
        showUserNameChangeUI: false,
        // Prebuilt는 기본이 밝은 테마라 클럽 화면과 어긋납니다. globals.css의
        // 팔레트를 그대로 옮겨 한 화면처럼 보이게 맞춥니다. 라이트·다크에 같은
        // 값을 넣어, 보는 사람의 시스템 설정과 무관하게 어두운 화면을 씁니다.
        theme: {
          light: { colors: DAILY_THEME },
          dark: { colors: DAILY_THEME },
        },
        iframeStyle: {
          width: "100%",
          height: "100%",
          border: "0",
          borderRadius: "var(--radius-card)",
        },
      });

      await frame.join({ url: info.roomUrl, token: info.token });
      if (cancelled) {
        frame.destroy();
        frame = null;
        return;
      }

      callRef.current = frame;
      setStatus("live");
    }

    join().catch((error) => {
      if (cancelled) return;
      console.error("[video] Daily 입장 실패", error);
      setStatus("error");
    });

    return () => {
      cancelled = true;
      callRef.current = null;
      frame?.destroy();
    };
  }, [sessionId]);

  // 마이크·카메라는 앱의 상태를 원본으로 삼아 통화 쪽에 반영합니다.
  useEffect(() => {
    if (status !== "live") return;
    callRef.current?.setLocalAudio(micOn);
  }, [micOn, status]);

  useEffect(() => {
    if (status !== "live") return;
    callRef.current?.setLocalVideo(camOn);
  }, [camOn, status]);

  useEffect(() => {
    onLiveChange?.(status === "live");
  }, [status, onLiveChange]);

  // 화상이 아예 없는 상태(미설정·실패)에서 큰 빈 상자를 띄우면 아래 타일만
  // 밀려나므로, 이때는 한 줄 안내로 줄입니다.
  const stageless =
    status === "unconfigured" ||
    status === "error" ||
    status === "audience" ||
    status === "no_matches" ||
    status === "expired";

  return (
    <>
      <div
        className={cn(
          "relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-ink",
          stageless
            ? // 무대가 없을 때도 음성이 끊기지 않도록 프레임 자체는 레이아웃에
              // 살려 둡니다.
              "pointer-events-none size-px border-0 opacity-0"
            : "aspect-video w-full",
        )}
      >
        <div ref={mountRef} className="size-full" />

        {status === "connecting" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-xs text-faint">
            <Loader2 aria-hidden className="size-5 animate-spin text-champagne" />
            {t("room.videoConnecting")}
          </div>
        ) : null}
      </div>

      {status === "no_matches" ? (
        <div className="rounded-[var(--radius-card)] border border-champagne-dim/50 bg-champagne/5 p-4">
          <p className="flex items-center gap-2 text-sm break-keep text-ivory">
            <Ticket aria-hidden className="size-4 shrink-0 text-champagne" />
            {t("room.videoNoMatches")}
          </p>
          <p className="mt-2 text-xs leading-relaxed break-keep text-muted">
            {t("room.videoNoMatchesBody")}
          </p>
          <div className="mt-4">
            <ButtonLink href="/entry" size="sm">
              {t("room.videoTopUp")}
            </ButtonLink>
          </div>
        </div>
      ) : null}

      {status === "audience" ? (
        <p className="flex items-start gap-2 rounded-[var(--radius-control)] border border-line bg-surface px-4 py-3 text-xs leading-relaxed break-keep text-muted">
          <Users aria-hidden className="mt-0.5 size-4 shrink-0 text-champagne" />
          {t("room.audienceNote")}
        </p>
      ) : null}

      {status === "expired" ? (
        <p className="flex items-center gap-2 rounded-[var(--radius-control)] border border-warn/50 bg-warn-dim/40 px-4 py-3 text-xs break-keep text-ivory">
          <VideoOff aria-hidden className="size-4 shrink-0 text-warn" />
          {t("room.videoExpired", { minutes: LOUNGE_MINUTES })}
        </p>
      ) : null}

      {status === "unconfigured" || status === "error" ? (
        <p className="flex items-center gap-2 rounded-[var(--radius-control)] border border-line bg-surface px-4 py-3 text-xs break-keep text-muted">
          <VideoOff aria-hidden className="size-4 shrink-0 text-faint" />
          {status === "unconfigured"
            ? t("room.videoUnconfigured")
            : t("room.videoError")}
        </p>
      ) : null}
    </>
  );
}
