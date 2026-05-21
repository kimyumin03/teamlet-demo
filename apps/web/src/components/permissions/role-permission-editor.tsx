"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@teamlet/ui";
import type {
  CatalogCategory,
  RolePermissionItem,
} from "@teamlet/modules/permission";
import type { SetRolePermissionsInput } from "@teamlet/shared";
import { setRolePermissionsAction } from "@/lib/actions/permission";

type ScopeChoice = "ALL" | "DEPARTMENT" | "SELF";
type PermState = {
  checked: boolean;
  scopeType: ScopeChoice;
  departmentIds: string[];
};

const SCOPE_LABEL: Record<ScopeChoice, string> = {
  ALL: "전체",
  DEPARTMENT: "지정 부서",
  SELF: "본인",
};

const SENSITIVITY_BADGE: Record<string, { label: string; cls: string }> = {
  SENSITIVE: { label: "민감", cls: "bg-amber-50 text-amber-700" },
  CRITICAL: { label: "중요", cls: "bg-destructive-50 text-destructive-700" },
};

/**
 * 역할 권한 매트릭스 편집 (docs/02 §11-1).
 * 권한 on/off + hasScope 권한의 범위(전체/지정부서/본인) 지정.
 * 시스템 역할은 readOnly.
 */
export function RolePermissionEditor({
  roleId,
  catalog,
  currentPermissions,
  departments,
  readOnly,
}: {
  roleId: string;
  catalog: CatalogCategory[];
  currentPermissions: RolePermissionItem[];
  departments: { id: string; name: string }[];
  readOnly: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const initial = useMemo(() => {
    const byKey = new Map(currentPermissions.map((p) => [p.permissionKey, p]));
    const map = new Map<string, PermState>();
    for (const cat of catalog) {
      for (const dom of cat.domains) {
        for (const perm of dom.permissions) {
          const cur = byKey.get(perm.key);
          const raw = cur?.scopeType;
          const scopeType: ScopeChoice =
            raw === "DEPARTMENT" || raw === "SELF" ? raw : "ALL";
          map.set(perm.key, {
            checked: Boolean(cur),
            scopeType,
            departmentIds: cur?.departmentIds ?? [],
          });
        }
      }
    }
    return map;
  }, [catalog, currentPermissions]);

  const [state, setState] = useState<Map<string, PermState>>(initial);

  function update(key: string, patch: Partial<PermState>) {
    setSaved(false);
    setState((prev) => {
      const next = new Map(prev);
      const cur =
        next.get(key) ?? { checked: false, scopeType: "ALL" as ScopeChoice, departmentIds: [] };
      next.set(key, { ...cur, ...patch });
      return next;
    });
  }

  function toggleDept(key: string, deptId: string) {
    const cur = state.get(key);
    if (!cur) return;
    const has = cur.departmentIds.includes(deptId);
    update(key, {
      departmentIds: has
        ? cur.departmentIds.filter((d) => d !== deptId)
        : [...cur.departmentIds, deptId],
    });
  }

  function handleSave() {
    setError(null);
    const items: SetRolePermissionsInput["items"] = [];
    for (const cat of catalog) {
      for (const dom of cat.domains) {
        for (const perm of dom.permissions) {
          const st = state.get(perm.key);
          if (!st?.checked) continue;
          if (perm.hasScope) {
            items.push({
              permissionKey: perm.key,
              scopeType: st.scopeType,
              departmentIds:
                st.scopeType === "DEPARTMENT" ? st.departmentIds : [],
              includeSubDepartments: false,
            });
          } else {
            items.push({ permissionKey: perm.key });
          }
        }
      }
    }

    const badDept = items.find(
      (i) => i.scopeType === "DEPARTMENT" && (i.departmentIds?.length ?? 0) === 0,
    );
    if (badDept) {
      setError(
        `'지정 부서' 범위로 설정한 권한은 부서를 1개 이상 선택해야 해요 (${badDept.permissionKey}).`,
      );
      return;
    }

    startTransition(async () => {
      const res = await setRolePermissionsAction(roleId, { items });
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  const checkedCount = [...state.values()].filter((s) => s.checked).length;

  return (
    <div className="flex flex-col gap-5">
      {readOnly && (
        <p className="rounded-md bg-background-secondary px-4 py-3 text-sm text-foreground-muted">
          시스템 역할의 권한은 수정할 수 없어요. 구성 내용만 확인할 수 있어요.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-md bg-destructive-50 px-4 py-3 text-sm text-destructive-700"
        >
          {error}
        </p>
      )}

      {catalog.map((cat) => (
        <section
          key={cat.slug}
          className="rounded-lg border border-border bg-background-primary"
        >
          <h2 className="border-b border-border px-5 py-3 text-sm font-semibold text-foreground">
            {cat.label}
          </h2>
          <ul className="divide-y divide-border">
            {cat.domains.flatMap((dom) =>
              dom.permissions.map((perm) => {
                const st =
                  state.get(perm.key) ??
                  ({ checked: false, scopeType: "ALL", departmentIds: [] } as PermState);
                const badge = SENSITIVITY_BADGE[perm.sensitivity];
                return (
                  <li key={perm.key} className="flex flex-col gap-2 px-5 py-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id={`p-${perm.key}`}
                        checked={st.checked}
                        disabled={readOnly}
                        onChange={(e) =>
                          update(perm.key, { checked: e.target.checked })
                        }
                        className="mt-0.5 size-4"
                      />
                      <label
                        htmlFor={`p-${perm.key}`}
                        className="flex flex-1 flex-col gap-0.5"
                      >
                        <span className="flex items-center gap-1.5 text-sm text-foreground">
                          {perm.name}
                          {badge && (
                            <span
                              className={`rounded px-1.5 py-0.5 text-[11px] ${badge.cls}`}
                            >
                              {badge.label}
                            </span>
                          )}
                        </span>
                        <span className="font-mono text-xs text-foreground-subtle">
                          {perm.key}
                        </span>
                        {perm.warningText && (
                          <span className="text-xs text-amber-700">
                            ⚠ {perm.warningText}
                          </span>
                        )}
                      </label>

                      {perm.hasScope && st.checked && (
                        <select
                          aria-label={`${perm.name} 범위`}
                          value={st.scopeType}
                          disabled={readOnly}
                          onChange={(e) =>
                            update(perm.key, {
                              scopeType: e.target.value as ScopeChoice,
                            })
                          }
                          className="h-8 rounded-md border border-border bg-background-primary px-2 text-xs text-foreground"
                        >
                          {(["ALL", "DEPARTMENT", "SELF"] as ScopeChoice[]).map(
                            (s) => (
                              <option key={s} value={s}>
                                {SCOPE_LABEL[s]}
                              </option>
                            ),
                          )}
                        </select>
                      )}
                    </div>

                    {perm.hasScope &&
                      st.checked &&
                      st.scopeType === "DEPARTMENT" && (
                        <div className="ml-7 flex flex-wrap gap-2">
                          {departments.length === 0 ? (
                            <span className="text-xs text-foreground-subtle">
                              등록된 부서가 없어요.
                            </span>
                          ) : (
                            departments.map((d) => (
                              <label
                                key={d.id}
                                className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-foreground"
                              >
                                <input
                                  type="checkbox"
                                  checked={st.departmentIds.includes(d.id)}
                                  disabled={readOnly}
                                  onChange={() => toggleDept(perm.key, d.id)}
                                  className="size-3.5"
                                />
                                {d.name}
                              </label>
                            ))
                          )}
                        </div>
                      )}
                  </li>
                );
              }),
            )}
          </ul>
        </section>
      ))}

      {!readOnly && (
        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-border bg-background-primary py-3">
          <span className="text-sm text-foreground-muted">
            {checkedCount}개 권한 선택됨
          </span>
          {saved && (
            <span className="text-sm text-green-700">저장됐어요</span>
          )}
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "저장 중…" : "권한 저장"}
          </Button>
        </div>
      )}
    </div>
  );
}
