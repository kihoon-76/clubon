"use client";

import { useEffect, useRef, useState } from "react";
import { CameraOff, Loader2 } from "lucide-react";

/**
 * 내 카메라 미리보기.
 *
 * 브라우저 카메라를 그대로 화면에 띄우기만 하며, 프레임은 서버로 전송하거나
 * 저장하지 않습니다. 다른 참가자에게는 마스크 아바타만 보입니다(실시간 영상
 * 전송은 Phase 2 범위).
 */
export function LocalCamera({ enabled }: { enabled: boolean }) {
  if (!enabled) {
    return (
      <Placeholder>
        <CameraOff aria-hidden className="size-5 text-muted" />
        카메라 꺼짐
      </Placeholder>
    );
  }
  // 켜질 때마다 새로 마운트해 스트림 수명을 컴포넌트 수명과 일치시킵니다.
  return <CameraStream />;
}

function CameraStream() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"loading" | "on" | "denied">("loading");

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
        setStatus("on");
      })
      .catch(() => {
        if (!cancelled) setStatus("denied");
      });

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (status === "denied") {
    return (
      <Placeholder>
        <CameraOff aria-hidden className="size-5 text-muted" />
        <span className="px-3 leading-relaxed">
          카메라 권한이 없어 아바타로 참여합니다.
        </span>
      </Placeholder>
    );
  }

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        aria-label="내 카메라 미리보기"
        className="size-full scale-x-[-1] object-cover"
        hidden={status !== "on"}
      />
      {status === "loading" ? (
        <Placeholder>
          <Loader2 aria-hidden className="size-5 animate-spin text-champagne" />
          카메라 여는 중…
        </Placeholder>
      ) : null}
    </>
  );
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-2 text-center text-xs text-faint">
      {children}
    </div>
  );
}
