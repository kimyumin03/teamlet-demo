"use client";

import type { ReactNode } from "react";
import { useState, createContext, useContext } from "react";
import { cn } from "@/lib/cn";

const TabCtx = createContext<{ active: string; setActive: (v: string) => void }>({
  active: "",
  setActive: () => {},
});

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
}: {
  defaultValue: string;
  value?: string;
  onValueChange?: (v: string) => void;
  children: ReactNode;
}) {
  const [internal, setInternal] = useState(defaultValue);
  const active = value ?? internal;
  const setActive = (v: string) => {
    if (value === undefined) setInternal(v);
    onValueChange?.(v);
  };
  return <TabCtx.Provider value={{ active, setActive }}>{children}</TabCtx.Provider>;
}

export function TabsList({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex gap-0.5 p-1 bg-[var(--bg-secondary)] rounded-[10px] mb-5">
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, count }: { value: string; children: ReactNode; count?: ReactNode }) {
  const { active, setActive } = useContext(TabCtx);
  const isActive = active === value;
  return (
    <button
      onClick={() => setActive(value)}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-[7px] text-[13px] font-medium transition",
        isActive
          ? "bg-[var(--bg-primary)] text-[var(--fg)] font-semibold shadow-sm"
          : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
      )}
    >
      {children}
      {count != null && (
        <span
          className={cn(
            "mono text-[10.5px] font-bold px-1.5 py-px rounded-full",
            isActive
              ? "bg-[var(--primary)] text-[color:var(--primary-on)]"
              : "bg-[var(--bg-tertiary)] text-[var(--fg-muted)]"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export function TabsContent({ value, children }: { value: string; children: ReactNode }) {
  const { active } = useContext(TabCtx);
  if (active !== value) return null;
  return <div>{children}</div>;
}
