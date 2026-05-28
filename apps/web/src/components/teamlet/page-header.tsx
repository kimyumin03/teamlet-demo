import type { ReactNode } from "react";

export function PageHeader({
  title,
  sub,
  actions,
}: {
  title: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5">
      <div>
        <h1 className="text-[26px] font-bold tracking-[-0.02em] leading-[1.2] mb-1.5 text-[var(--fg)]">
          {title}
        </h1>
        {sub && <div className="text-[13px] text-[var(--fg-muted)]">{sub}</div>}
      </div>
      {actions && <div className="flex gap-2 items-center">{actions}</div>}
    </div>
  );
}
