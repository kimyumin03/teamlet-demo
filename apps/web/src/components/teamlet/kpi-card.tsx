import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function KpiStrip({ children, cols = 4 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  const colCls = cols === 2 ? "grid-cols-2" : cols === 3 ? "grid-cols-3" : "grid-cols-4";
  return <div className={cn("grid gap-3 mb-5", colCls)}>{children}</div>;
}

export function KpiCard({
  label,
  value,
  unit,
  delta,
  variant = "default",
  href,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  delta?: ReactNode;
  variant?: "default" | "cta";
  href?: string;
}) {
  const cta = variant === "cta";
  const cls = cn(
    "flex flex-col gap-1 px-[18px] py-4 rounded-[14px] border transition cursor-pointer",
    cta
      ? "text-[color:var(--primary-on)] border-[var(--primary)]"
      : "bg-[var(--bg-primary)] border-[var(--border)] hover:border-[var(--border-strong)] hover:-translate-y-px hover:shadow-md"
  );
  const style = cta
    ? { background: "linear-gradient(140deg, var(--primary), var(--primary-hover))" }
    : undefined;

  const inner = (
    <>
      <span className={cn("text-[12px] font-medium", cta ? "text-white/75" : "text-[var(--fg-muted)]")}>
        {label}
      </span>
      <span className={cn("text-[22px] font-bold tracking-[-0.015em] leading-[1.2]", cta ? "text-[color:var(--primary-on)]" : "text-[var(--fg)]")}>
        <span className="num">{value}</span>
        {unit && <small className={cn("text-[13px] font-medium ml-1", cta ? "text-white/80" : "text-[var(--fg-muted)]")}>{unit}</small>}
      </span>
      {delta && (
        <span className={cn("text-[11.5px] mt-1", cta ? "text-white/85" : "text-[var(--fg-muted)]")}>
          {delta}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <a href={href} className={cls} style={style}>
        {inner}
      </a>
    );
  }
  return (
    <div className={cls} style={style}>
      {inner}
    </div>
  );
}
