"use client";

import { useActionState, useEffect, useRef } from "react";
import { AlertTriangle, Send, ShieldAlert, Sparkles } from "lucide-react";

import {
  sendMessage,
  type ChatFormState,
} from "@/app/(club)/room/[sessionId]/actions";
import { Input } from "@/components/ui/field";
import type { RoomMessageView } from "@/lib/runtime/view";
import { cn } from "@/lib/utils";

export function ChatPanel({
  sessionId,
  messages,
  disabled,
  onSent,
}: {
  sessionId: string;
  messages: RoomMessageView[];
  disabled: boolean;
  /** 전송 직후 상태를 즉시 새로 고치기 위한 콜백 */
  onSent: () => void;
}) {
  const [state, formAction] = useActionState<ChatFormState, FormData>(
    sendMessage,
    { submissions: 0 },
  );
  const formRef = useRef<HTMLFormElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const lastSubmissions = useRef(0);

  // 전송이 성공하면 입력을 비우고 최신 상태를 당겨옵니다.
  useEffect(() => {
    if (state.submissions === lastSubmissions.current) return;
    lastSubmissions.current = state.submissions;
    formRef.current?.reset();
    onSent();
  }, [state.submissions, onSent]);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages.length]);

  return (
    <div className="flex h-full min-h-0 flex-col rounded-[var(--radius-card)] border border-line bg-surface-raised">
      <div className="border-b border-line/70 px-5 py-4">
        <h2 className="font-display text-lg text-ivory">대화</h2>
        <p className="mt-1 text-[0.6875rem] leading-relaxed text-faint">
          메시지는 자동 검사를 거칩니다. 자동 탐지는 모든 위반을 완벽하게
          잡아내지 못할 수 있습니다.
        </p>
      </div>

      <ol
        ref={listRef}
        className="flex-1 space-y-3 overflow-y-auto px-5 py-4"
        aria-live="polite"
        aria-label="대화 내용"
      >
        {messages.map((m) => (
          <li key={m.id}>
            {m.kind === "system" ? (
              <p className="flex items-start gap-2 rounded-[var(--radius-control)] bg-surface/70 px-3 py-2 text-xs leading-relaxed text-muted">
                <ShieldAlert aria-hidden className="mt-0.5 size-3.5 shrink-0 text-faint" />
                {m.body}
              </p>
            ) : m.kind === "waiter" ? (
              <p className="flex items-start gap-2 rounded-[var(--radius-control)] border border-champagne-dim/40 bg-champagne/5 px-3 py-2 text-xs leading-relaxed text-champagne-soft">
                <Sparkles aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  <span className="font-medium">{m.senderName}</span> · {m.body}
                </span>
              </p>
            ) : (
              <div className={cn("flex flex-col gap-1", m.mine && "items-end")}>
                <span className="text-[0.6875rem] text-faint">{m.senderName}</span>
                <p
                  className={cn(
                    "max-w-[85%] rounded-[var(--radius-control)] px-3.5 py-2 text-sm leading-relaxed",
                    m.mine
                      ? "bg-champagne/15 text-ivory"
                      : "bg-surface-overlay text-ivory",
                    m.moderationStatus === "blocked" && "opacity-60 line-through",
                  )}
                >
                  {m.body}
                </p>
                {m.mine && m.moderationStatus !== "allowed" ? (
                  <span className="flex items-center gap-1.5 text-[0.6875rem] text-danger">
                    <AlertTriangle aria-hidden className="size-3" />
                    {m.moderationStatus === "blocked"
                      ? "전송되지 않음"
                      : "검토 대상"}
                    {m.moderationReason ? ` · ${m.moderationReason}` : null}
                  </span>
                ) : null}
              </div>
            )}
          </li>
        ))}
      </ol>

      {state.error ? (
        <p role="alert" className="mx-5 mb-2 text-xs text-danger">
          {state.error}
        </p>
      ) : null}
      {state.warning ? (
        <p role="status" className="mx-5 mb-2 text-xs text-warn">
          {state.warning}
        </p>
      ) : null}

      <form
        ref={formRef}
        action={formAction}
        className="flex items-center gap-2 border-t border-line/70 p-4"
      >
        <input type="hidden" name="sessionId" value={sessionId} />
        <Input
          name="body"
          autoComplete="off"
          maxLength={1000}
          disabled={disabled}
          placeholder={disabled ? "지금은 메시지를 보낼 수 없습니다" : "메시지 입력"}
          aria-label="메시지 입력"
        />
        <button
          type="submit"
          disabled={disabled}
          aria-label="메시지 보내기"
          className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-champagne bg-champagne text-ink transition-colors hover:bg-champagne-soft disabled:opacity-45"
        >
          <Send aria-hidden className="size-4" />
        </button>
      </form>
    </div>
  );
}
