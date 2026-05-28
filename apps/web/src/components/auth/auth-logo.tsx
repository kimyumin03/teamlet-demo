export function AuthLogo({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-primary text-[15px] font-bold text-white">
        T
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-base font-bold tracking-tight">Teamlet</span>
        {subtitle && (
          <span className="text-[11px] text-foreground-muted">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
