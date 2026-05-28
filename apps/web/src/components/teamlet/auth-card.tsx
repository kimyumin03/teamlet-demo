import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function AuthCard({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className={cn(
      "w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl p-8 shadow-md",
      wide ? "max-w-[480px]" : "max-w-[400px]"
    )}>
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-9 h-9 rounded-[9px] bg-[var(--primary)] text-[color:var(--primary-on)] grid place-items-center font-display font-bold text-[15px] tracking-tight shadow-sm">
          T
        </div>
        <div className="text-[16px] font-bold tracking-[-0.01em]">
          Teamlet <small className="text-[11px] text-[var(--fg-muted)] ml-1.5 font-normal">HR for small teams</small>
        </div>
      </div>
      {children}
    </div>
  );
}

export function AuthTitle({ title, sub }: { title: string; sub?: ReactNode }) {
  return (
    <>
      <h2 className="text-[22px] font-bold tracking-[-0.015em] leading-[1.2] mb-1.5 mt-0">{title}</h2>
      {sub && <p className="text-[13.5px] text-[var(--fg-muted)] mb-6 mt-0">{sub}</p>}
    </>
  );
}

export function Divider({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2.5 my-4.5 text-[11px] text-[var(--fg-subtle)] uppercase tracking-[0.08em] font-display">
      <span className="flex-1 h-px bg-[var(--border)]" />
      {children}
      <span className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );
}
