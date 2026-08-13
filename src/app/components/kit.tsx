import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("glass-card rounded-2xl p-5 shadow-xl", className)}>{children}</div>;
}

type Variant = "primary" | "ghost" | "success" | "destructive" | "outline";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground border-[2.5px] border-ink shadow-pop",
  success: "bg-success text-success-foreground border-[2.5px] border-ink shadow-pop",
  destructive: "bg-bubble text-primary-foreground border-[2.5px] border-ink shadow-pop",
  outline: "bg-sunny text-ink border-[2.5px] border-ink shadow-pop",
  ghost: "text-muted-foreground hover-text-foreground bg-secondary-hover",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={cn(
        "font-display inline-flex h-12 min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-base font-semibold transition-all hover:-translate-y-0.5 hover:rotate-[-1deg] active:translate-y-0.5 active:shadow-none disabled:pointer-events-none disabled:opacity-40",
        variants[variant],
        className,
      )}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "border-ink placeholder-muted focus-pop h-12 w-full rounded-2xl border-[2.5px] bg-white px-4 text-base font-semibold text-foreground outline-none transition-all",
        className,
      )}
    />
  );
}

export function Avatar({
  name,
  color,
  size = 44,
  dim,
}: {
  name: string;
  color: string;
  size?: number;
  dim?: boolean;
}) {
  return (
    <div
      className={cn(
        "border-ink grid place-items-center rounded-full border-[2.5px] font-display font-bold text-white transition-opacity",
        dim && "opacity-40",
      )}
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.4 }}
    >
      {name}
    </div>
  );
}

export function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cn("safe-pad mx-auto min-h-dvh w-full max-w-5xl", className)}>{children}</main>;
}
