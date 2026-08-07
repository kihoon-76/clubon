"use client";

import { useEffect, useRef, useState } from "react";
import type { DailyCall } from "@daily-co/daily-js";
import { Loader2, VideoOff } from "lucide-react";

import { cn } from "@/lib/utils";

type Status = "connecting" | "live" | "unconfigured" | "error";

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
 * 얼굴 공개 전에는 프레임을 화면에서 감추고 음성만 흘립니다 — 이때 보이는
 * 얼굴 없는 화면은 기존 마스크 타일이 담당합니다. 방장 합의로 공개되면
 * 프레임을 펼치고 카메라를 켭니다.
 *
 * 감출 때 `display:none`을 쓰지 않는 이유는, 프레임이 레이아웃에서 빠지면
 * 음성 재생까지 끊길 수 있기 때문입니다. 1px 투명 상자로 남겨 둡니다.
 */
export function DailyStage({
  sessionId,
  revealed,
  micOn,
  camOn,
}: {
  sessionId: string;
  revealed: boolean;
  micOn: boolean;
  camOn: boolean;
}) {
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
      if (!res.ok) throw new Error(`join info ${res.status}`);

      const info = (await res.json()) as
        | { configured: false }
        | { configured: true; roomUrl: string; token: string };

      if (cancelled) return;
      if (!info.configured) {
        setStatus("unconfigured");
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
  // 카메라는 방이 공개된 뒤에만 켜집니다.
  useEffect(() => {
    if (status !== "live") return;
    callRef.current?.setLocalAudio(micOn);
  }, [micOn, status]);

  useEffect(() => {
    if (status !== "live") return;
    callRef.current?.setLocalVideo(revealed && camOn);
  }, [revealed, camOn, status]);

  // 화상이 아예 없는 상태(미설정·실패)에서 큰 빈 상자를 띄우면 마스크 타일만
  // 밀려나므로, 이때는 한 줄 안내로 줄입니다.
  const stageless = status === "unconfigured" || status === "error";

  return (
    <>
      <div
        className={cn(
          "relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-ink",
          revealed && !stageless
            ? "aspect-video w-full"
            : // 공개 전에는 자리를 차지하지 않되, 음성이 끊기지 않도록
              // 프레임 자체는 레이아웃에 살려 둡니다.
              "pointer-events-none size-px border-0 opacity-0",
        )}
      >
        <div ref={mountRef} className="size-full" />

        {revealed && status === "connecting" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-xs text-faint">
            <Loader2 aria-hidden className="size-5 animate-spin text-champagne" />
            화상 연결 중…
          </div>
        ) : null}
      </div>

      {stageless ? (
        <p className="flex items-center gap-2 rounded-[var(--radius-control)] border border-line bg-surface px-4 py-3 text-xs text-muted">
          <VideoOff aria-hidden className="size-4 shrink-0 text-faint" />
          {status === "unconfigured"
            ? "화상 서버가 설정되지 않아 음성·영상 없이 채팅으로만 진행합니다."
            : "화상 연결에 실패했습니다. 채팅과 마스크 대화는 그대로 이어집니다."}
        </p>
      ) : null}
    </>
  );
}
