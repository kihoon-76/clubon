"use client";

import { useActionState } from "react";
import { issueGiftAction, redeemGiftAction, type PassActionState } from "@/app/(club)/passes/actions";
import { Button } from "@/components/ui/button";

export function RedeemGiftForm() {
  const [state, action, pending] = useActionState(redeemGiftAction, INITIAL_PASS_STATE);
  return <form action={action} className="space-y-3">
    <label className="block text-sm text-muted">선물받은 이용권 코드
      <input name="code" required autoComplete="off" placeholder="CLUBON-…" className="mt-2 h-11 w-full rounded-[var(--radius-control)] border border-line bg-surface px-4 text-ivory outline-none focus:border-champagne" />
    </label>
    <Button type="submit" variant="secondary" disabled={pending}>{pending ? "확인 중…" : "코드 등록"}</Button>
    {state.message ? <p role="status" className={`text-sm ${state.ok ? "text-success" : "text-danger"}`}>{state.message}</p> : null}
  </form>;
}

const INITIAL_PASS_STATE: PassActionState = { ok: false, message: "" };

export function IssueGiftForm() {
  const [state, action, pending] = useActionState(issueGiftAction, INITIAL_PASS_STATE);
  return <form action={action} className="space-y-3">
    <label className="block text-sm text-muted">받을 회원 이메일
      <input name="email" type="email" required placeholder="member@example.com" className="mt-2 h-11 w-full rounded-[var(--radius-control)] border border-line bg-surface px-4 text-ivory outline-none focus:border-champagne" />
    </label>
    <Button type="submit" disabled={pending}>{pending ? "발급 중…" : "1회 이용권 코드 만들기"}</Button>
    {state.message ? <p role="status" className={`text-sm ${state.ok ? "text-success" : "text-danger"}`}>{state.message}</p> : null}
    {state.code ? <output className="block select-all rounded-[var(--radius-control)] border border-champagne-dim bg-champagne/10 p-4 font-mono text-lg text-champagne">{state.code}</output> : null}
  </form>;
}
