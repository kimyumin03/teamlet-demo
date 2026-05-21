"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { searchEmployeesAction, type EmployeeSearchResult } from "@/lib/actions/search";

const NAV_ITEMS = [
  {
    group: "페이지",
    items: [
      { label: "구성원 목록", href: "/members", keyword: "members 구성원" },
      { label: "휴가 관리", href: "/leave", keyword: "leave 휴가" },
      { label: "워크플로우", href: "/workflow", keyword: "workflow 결재" },
      { label: "채용", href: "/recruit", keyword: "recruit 채용" },
      { label: "문서 보관소", href: "/documents", keyword: "documents 문서" },
      { label: "감사 로그", href: "/audit-log", keyword: "audit 감사" },
    ],
  },
  {
    group: "설정",
    items: [
      { label: "회사 정보", href: "/settings/company", keyword: "company 회사" },
      { label: "공휴일 관리", href: "/settings/holidays", keyword: "holidays 공휴일" },
      { label: "휴가 정책", href: "/settings/leave-policies", keyword: "leave policy 휴가정책" },
      { label: "권한 설정", href: "/settings/permissions", keyword: "permissions 권한" },
      { label: "보안 설정", href: "/settings/security", keyword: "security 보안" },
      { label: "양식 관리", href: "/settings/form-templates", keyword: "form template 양식" },
    ],
  },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [employees, setEmployees] = useState<EmployeeSearchResult[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // close on Escape
  useEffect(() => {
    if (!open) { setQuery(""); setEmployees([]); }
  }, [open]);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    if (value.trim().length >= 1) {
      startTransition(async () => {
        const results = await searchEmployeesAction(value);
        setEmployees(results);
      });
    } else {
      setEmployees([]);
    }
  }, []);

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh]"
      onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* palette */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-border bg-background-primary shadow-2xl">
        <Command
          shouldFilter={employees.length === 0}
          onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
        >
          <div className="flex items-center gap-2 border-b border-border px-4">
            <svg className="size-4 shrink-0 text-foreground-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <Command.Input
              value={query}
              onValueChange={handleQueryChange}
              placeholder="검색하거나 이동할 페이지를 입력하세요…"
              className="h-12 flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground-subtle outline-none"
              autoFocus
            />
            {isPending && (
              <span className="shrink-0 text-xs text-foreground-subtle">검색 중…</span>
            )}
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-foreground-muted">
              결과가 없어요
            </Command.Empty>

            {employees.length > 0 && (
              <Command.Group
                heading="구성원"
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-foreground-subtle"
              >
                {employees.map((emp) => (
                  <Command.Item
                    key={emp.id}
                    value={`employee-${emp.id}-${emp.name}`}
                    onSelect={() => navigate(`/members/${emp.id}`)}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-foreground aria-selected:bg-background-secondary"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-background-secondary text-xs font-medium">
                      {emp.name[0]}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium">{emp.name}</p>
                      {(emp.departmentName || emp.positionName) && (
                        <p className="truncate text-xs text-foreground-muted">
                          {[emp.departmentName, emp.positionName].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {NAV_ITEMS.map(({ group, items }) => (
              <Command.Group
                key={group}
                heading={group}
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-foreground-subtle"
              >
                {items.map((item) => (
                  <Command.Item
                    key={item.href}
                    value={`${item.label} ${item.keyword}`}
                    onSelect={() => navigate(item.href)}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-foreground aria-selected:bg-background-secondary"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-background-secondary text-xs text-foreground-muted">
                      {item.href.replace(/^\/settings\//, "⚙ ").replace(/^\//, "").slice(0, 2).toUpperCase()}
                    </span>
                    {item.label}
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>

          <div className="border-t border-border px-4 py-2.5">
            <p className="text-xs text-foreground-subtle">
              <kbd className="rounded bg-background-secondary px-1 font-mono">↑↓</kbd> 이동
              {" · "}
              <kbd className="rounded bg-background-secondary px-1 font-mono">↵</kbd> 선택
              {" · "}
              <kbd className="rounded bg-background-secondary px-1 font-mono">Esc</kbd> 닫기
            </p>
          </div>
        </Command>
      </div>
    </div>
  );
}
