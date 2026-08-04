"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

/** 폼 제출 중 자동으로 비활성화되고 스피너를 표시하는 제출 버튼. */
export function SubmitButton({
  children,
  pendingLabel,
  className,
  variant,
  size = "lg",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      variant={variant}
      size={size}
      className={className}
    >
      {pending ? (
        <>
          <Loader2 aria-hidden className="size-4 animate-spin" />
          {pendingLabel ?? "처리 중…"}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
