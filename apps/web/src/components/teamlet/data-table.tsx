import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function DataTable({ children }: { children: ReactNode }) {
  return (
    <table className="w-full border-separate border-spacing-0 border border-[var(--border)] rounded-[14px] bg-[var(--bg-primary)] overflow-hidden text-[13px]">
      {children}
    </table>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr>{children}</tr>
    </thead>
  );
}

export function TH({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "text-left bg-[var(--bg-secondary)] border-b border-[var(--border)] px-3.5 py-2.5 text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-[0.04em] font-display",
        className
      )}
    >
      {children}
    </th>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TR({
  children, active, onClick,
}: { children: ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "cursor-pointer",
        active ? "bg-[var(--primary-soft)]" : "hover:bg-[var(--bg-secondary)]"
      )}
    >
      {children}
    </tr>
  );
}

export function TD({ children, className, num }: { children: ReactNode; className?: string; num?: boolean }) {
  return (
    <td
      className={cn(
        "border-b border-[var(--border)] px-3.5 py-3.5 align-middle",
        num && "text-right mono num",
        className
      )}
    >
      {children}
    </td>
  );
}

/* Tag — used for status/role */
export function Tag({
  variant = "default",
  children,
  className,
}: {
  variant?: "default" | "primary" | "outline" | "lv" | "wfh" | "late" | "ok" | "warn" | "purple" | "info";
  children: ReactNode;
  className?: string;
}) {
  const styles: Record<string, string> = {
    default: "bg-[var(--bg-tertiary)] text-[var(--fg-muted)]",
    primary: "bg-[var(--primary)] text-[color:var(--primary-on)]",
    outline: "bg-transparent border border-[var(--border-strong)] text-[var(--fg)]",
    lv: "bg-[var(--destructive-50)] text-[var(--destructive)]",
    wfh: "bg-[var(--info-50)] text-[var(--info)]",
    late: "bg-[var(--warn-50)] text-[var(--warn)]",
    ok: "bg-[var(--success-50)] text-[var(--success)]",
    warn: "bg-[var(--warn-50)] text-[var(--warn)]",
    purple: "bg-[var(--accent-50)] text-[var(--accent)]",
    info: "bg-[var(--info-50)] text-[var(--info)]",
  };
  return (
    <span
      className={cn(
        "inline-block text-[10.5px] font-semibold tracking-[0.02em] px-2 py-0.5 rounded-full",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

/* Filter chip */
export function FilterChip({
  label, value, onClick, dashed,
}: {
  label?: string;
  value: ReactNode;
  onClick?: () => void;
  dashed?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] bg-[var(--bg-primary)] text-[var(--fg)] hover:border-[var(--border-strong)] transition border",
        dashed ? "border-dashed border-[var(--border)] text-[var(--fg-muted)]" : "border-[var(--border)]"
      )}
    >
      {label && <span className="text-[var(--fg-muted)]">{label}</span>}
      <span className="font-semibold text-[var(--fg)]">{value}</span>
      {!dashed && <span className="text-[var(--fg-subtle)] ml-0.5">⌄</span>}
    </button>
  );
}

/* Filters row */
export function FilterBar({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 flex-wrap mb-3.5">
      {children}
      {right && <div className="ml-auto flex gap-2 items-center">{right}</div>}
    </div>
  );
}
