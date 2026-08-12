"use client";

import { useState } from "react";
import { Bot, Camera, CheckCircle2 } from "lucide-react";

import { DailyStage } from "@/components/room/daily-stage";

export function VideoTestClient({ secret }: { secret: string }) {
  const [live, setLive] = useState(false);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-10 text-ivory">
      <div className="mb-6">
        <p className="text-xs tracking-[0.22em] text-champagne">CLUBON VIDEO TEST</p>
        <h1 className="mt-2 text-3xl">가상 라운지 매치 완료</h1>
        <p className="mt-3 text-sm text-muted">
          로그인과 이용권 차감 없이 실제 Daily 화상 연결과 내 카메라를 점검합니다.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
        <section>
          <DailyStage
            sessionId="video-test"
            joinEndpoint={`/api/video-test?secret=${encodeURIComponent(secret)}`}
            micOn
            camOn
            onLiveChange={setLive}
          />
          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            {live ? <CheckCircle2 className="size-4 text-success" /> : <Camera className="size-4 text-champagne" />}
            {live ? "Daily 연결 완료 — 내 영상이 보이면 정상입니다." : "카메라·마이크 권한을 허용해 주세요."}
          </p>
        </section>

        <aside className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
          <div className="flex aspect-video items-center justify-center rounded-xl bg-surface-raised">
            <Bot className="size-12 text-champagne" aria-hidden />
          </div>
          <p className="mt-4 font-medium">가상 상대 라운지</p>
          <p className="mt-1 text-xs text-muted">매치 수락 완료 · 테스트 참가자</p>
          <span className="mt-4 inline-flex rounded-full border border-success/40 px-3 py-1 text-xs text-success">
            연결 대기 중
          </span>
        </aside>
      </div>
    </main>
  );
}
