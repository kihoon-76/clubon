import { cn } from "@/lib/utils";

/**
 * 영상이 오지 않을 때 자리를 지키는 회원 아바타.
 *
 * 카메라가 꺼져 있거나 모더레이션으로 영상이 제한된 참가자도 자리에는 있으므로,
 * 타일을 비워 두는 대신 닉네임 첫 글자를 보여 줍니다.
 */
export function MemberAvatar({
  nickname,
  className,
  /** 블러 처리 등으로 흐리게 표시 */
  dimmed = false,
}: {
  nickname: string;
  className?: string;
  dimmed?: boolean;
}) {
  const initial = nickname.trim().slice(0, 1) || "?";
  return (
    <div
      aria-hidden
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-gradient-to-b from-champagne/35 to-champagne-dim/20",
        dimmed && "opacity-40 blur-[3px]",
        className,
      )}
    >
      <span className="font-display text-4xl text-champagne-soft">{initial}</span>
    </div>
  );
}
