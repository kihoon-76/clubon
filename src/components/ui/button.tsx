import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-medium " +
  "transition-[background-color,border-color,color,opacity] duration-150 ease-[var(--ease-club)] " +
  "disabled:pointer-events-none disabled:opacity-45 select-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary:
    "bg-champagne text-ink hover:bg-champagne-soft border border-champagne",
  secondary:
    "bg-surface-raised text-ivory border border-line hover:border-champagne-dim hover:bg-surface-overlay",
  ghost:
    "bg-transparent text-muted border border-transparent hover:text-ivory hover:bg-surface-raised",
  danger:
    "bg-danger-dim text-danger border border-danger/40 hover:bg-danger hover:text-ivory",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-13 px-7 text-base",
};

type SharedProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children?: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: SharedProps & ComponentPropsWithoutRef<"button">) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  href,
  ...props
}: SharedProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, "href"> & { href: string }) {
  return (
    <Link
      href={href}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
