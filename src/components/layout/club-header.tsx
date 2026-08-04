import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Wordmark } from "@/components/brand/wordmark";

/**
 * 클럽 내부(운영시간 게이트 뒤) 공용 헤더. 클럽 영업 상태와 회원 정보를
 * 표시합니다. 표시용 값만 props로 받는 순수 프레젠테이션 컴포넌트입니다.
 */
export function ClubHeader({
  nickname,
  isOpen,
  statusText,
}: {
  nickname: string;
  isOpen: boolean;
  statusText: string;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/lobby" aria-label="클럽 로비로 이동" className="shrink-0">
          <Wordmark />
        </Link>

        <div className="flex items-center gap-3 sm:gap-5">
          <span
            className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-[0.6875rem] tracking-wide text-muted"
            title={statusText}
          >
            <span
              aria-hidden
              className={
                isOpen
                  ? "size-1.5 rounded-full bg-success"
                  : "size-1.5 rounded-full bg-faint"
              }
            />
            <span className={isOpen ? "text-success" : "text-muted"}>
              {isOpen ? "영업 중" : "영업 종료"}
            </span>
            <span className="hidden text-faint sm:inline">· {statusText}</span>
          </span>

          <div className="flex flex-col items-end leading-tight">
            <span className="text-[0.6875rem] uppercase tracking-[0.14em] text-champagne/70">
              인증 회원
            </span>
            <span className="text-sm text-ivory">{nickname}</span>
          </div>
        </div>
      </Container>
    </header>
  );
}
