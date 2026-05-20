import Link from "next/link";
import type { DepartmentNode } from "@teamlet/modules/department";
import { cn } from "@teamlet/ui";

/**
 * 구성원 디렉토리 사이드바 — SSR, 트리 DFS 정렬 + depth 들여쓰기.
 * URL ?department=<id|__none__> 으로 필터링. Link 만 사용해 클라이언트 컴포넌트 불필요.
 */

const UNASSIGNED = "__none__";

type SortedNode = DepartmentNode & { depth: number };

function buildSortedTree(nodes: DepartmentNode[]): SortedNode[] {
  const childrenOf = new Map<string | null, DepartmentNode[]>();
  for (const n of nodes) {
    const list = childrenOf.get(n.parentId);
    if (list) list.push(n);
    else childrenOf.set(n.parentId, [n]);
  }
  for (const list of childrenOf.values()) {
    list.sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
    );
  }

  const out: SortedNode[] = [];
  function dfs(parentId: string | null, depth: number) {
    const children = childrenOf.get(parentId) ?? [];
    for (const c of children) {
      out.push({ ...c, depth });
      dfs(c.id, depth + 1);
    }
  }
  dfs(null, 0);
  return out;
}

function ItemLink({
  href,
  active,
  label,
  count,
  depth = 0,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
  depth?: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors",
        active
          ? "bg-background-secondary text-foreground"
          : "text-foreground-muted hover:bg-background-secondary hover:text-foreground",
      )}
      style={depth > 0 ? { paddingLeft: `${0.5 + depth * 0.75}rem` } : undefined}
    >
      <span className="truncate">{label}</span>
      <span className="ml-2 text-xs text-foreground-subtle">{count}</span>
    </Link>
  );
}

export function DepartmentSidebar({
  departments,
  selected,
  totalCount,
  unassignedCount,
}: {
  departments: DepartmentNode[];
  /** `null` = 전체, `__none__` = 미배정, 그 외 = 부서 id */
  selected: string | null;
  totalCount: number;
  unassignedCount: number;
}) {
  const tree = buildSortedTree(departments);

  return (
    <nav aria-label="부서" className="flex flex-col gap-0.5">
      <ItemLink
        href="/members"
        active={selected === null}
        label="전체"
        count={totalCount}
      />
      <ItemLink
        href={`/members?department=${UNASSIGNED}`}
        active={selected === UNASSIGNED}
        label="미배정"
        count={unassignedCount}
      />
      {tree.length > 0 && (
        <div className="my-2 border-t border-border" />
      )}
      {tree.map((d) => (
        <ItemLink
          key={d.id}
          href={`/members?department=${d.id}`}
          active={selected === d.id}
          label={d.name}
          count={d.memberCount}
          depth={d.depth}
        />
      ))}
    </nav>
  );
}
