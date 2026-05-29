"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { DepartmentNode } from "@teamlet/modules/department";
import type { PositionItem } from "@teamlet/modules/position";
import { createDepartmentAction, deleteDepartmentAction, updateDepartmentAction } from "@/lib/actions/department";
import { createPositionAction, updatePositionAction, deletePositionAction } from "@/lib/actions/position";

function InlineEditRow({
  name,
  badge,
  count,
  onRename,
  onDelete,
  canDelete,
}: {
  name: string;
  badge?: string;
  count: number;
  onRename: (newName: string) => Promise<string | null>;
  onDelete: () => Promise<string | null>;
  canDelete: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    if (draft.trim() === name || !draft.trim()) { setEditing(false); return; }
    startTransition(async () => {
      const e = await onRename(draft.trim());
      if (e) { setErr(e); } else { setEditing(false); setErr(null); }
    });
  }

  function del() {
    if (!confirm(`"${name}"을(를) 삭제할까요?`)) return;
    startTransition(async () => {
      const e = await onDelete();
      if (e) setErr(e);
    });
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
      border: "1px solid var(--border)", borderRadius: 10,
      background: "var(--bg-primary)", marginBottom: 6,
    }}>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { setEditing(false); setDraft(name); } }}
          style={{ flex: 1, fontSize: 13, padding: "4px 8px", border: "1px solid var(--primary)", borderRadius: 6, outline: "none", background: "var(--bg-primary)", color: "var(--fg)", fontFamily: "inherit" }}
          disabled={pending}
        />
      ) : (
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{name}</span>
      )}
      {badge && <span style={{ fontSize: 10.5, padding: "2px 7px", borderRadius: 999, background: "var(--primary-soft)", color: "var(--primary)", fontWeight: 600 }}>{badge}</span>}
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-subtle)" }}>{count}명</span>
      {err && <span style={{ fontSize: 11, color: "var(--destructive)" }}>{err}</span>}
      {editing ? (
        <>
          <button onClick={save} disabled={pending} style={btnStyle("primary")}>저장</button>
          <button onClick={() => { setEditing(false); setDraft(name); setErr(null); }} style={btnStyle("ghost")}>취소</button>
        </>
      ) : (
        <>
          <button onClick={() => { setEditing(true); setErr(null); }} style={btnStyle("ghost")}>이름 변경</button>
          <button onClick={del} disabled={!canDelete || pending} title={!canDelete ? "배정된 구성원이 있어요" : undefined} style={btnStyle("danger", !canDelete)}>삭제</button>
        </>
      )}
    </div>
  );
}

function btnStyle(variant: "primary" | "ghost" | "danger", disabled = false) {
  const base: React.CSSProperties = {
    padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1,
    border: "1px solid transparent", fontFamily: "inherit",
  };
  if (variant === "primary") return { ...base, background: "var(--primary)", color: "var(--primary-on)" };
  if (variant === "danger") return { ...base, border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--destructive)" };
  return { ...base, border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--fg-muted)" };
}

function AddRow({ placeholder, onAdd }: { placeholder: string; onAdd: (name: string) => Promise<string | null> }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function submit() {
    if (!name.trim()) return;
    startTransition(async () => {
      const e = await onAdd(name.trim());
      if (e) { setErr(e); } else { setName(""); setOpen(false); setErr(null); }
    });
  }

  return open ? (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
      <input
        autoFocus value={name} onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") { setOpen(false); setErr(null); } }}
        placeholder={placeholder}
        style={{ flex: 1, fontSize: 13, padding: "8px 12px", border: "1px solid var(--primary)", borderRadius: 8, outline: "none", background: "var(--bg-primary)", color: "var(--fg)", fontFamily: "inherit" }}
        disabled={pending}
      />
      {err && <span style={{ fontSize: 11, color: "var(--destructive)" }}>{err}</span>}
      <button onClick={submit} disabled={pending || !name.trim()} style={btnStyle("primary")}>추가</button>
      <button onClick={() => { setOpen(false); setErr(null); }} style={btnStyle("ghost")}>취소</button>
    </div>
  ) : (
    <button onClick={() => setOpen(true)} style={{ marginTop: 8, fontSize: 12.5, color: "var(--primary)", background: "none", border: "1px dashed var(--border)", borderRadius: 8, padding: "7px 14px", cursor: "pointer", width: "100%", fontFamily: "inherit", fontWeight: 600 }}>
      + 추가
    </button>
  );
}

export function OrgSettingsClient({
  departments,
  positions,
}: {
  departments: DepartmentNode[];
  positions: PositionItem[];
}) {
  const router = useRouter();
  const refresh = () => router.refresh();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      {/* 부서 */}
      <div className="set-card">
        <h3>부서</h3>
        <p className="desc">조직 계층(본부·팀·파트)을 관리해요. 하위 부서나 구성원이 있으면 삭제할 수 없어요.</p>
        {departments.filter(d => d.isActive).map((d) => (
          <InlineEditRow
            key={d.id}
            name={d.name}
            count={d.memberCount}
            canDelete={d.memberCount === 0}
            onRename={async (name) => {
              const r = await updateDepartmentAction(d.id, { name });
              if (r.ok) { refresh(); return null; }
              return r.error?.message ?? "오류가 발생했어요";
            }}
            onDelete={async () => {
              const r = await deleteDepartmentAction(d.id);
              if (r.ok) { refresh(); return null; }
              return r.error?.message ?? "오류가 발생했어요";
            }}
          />
        ))}
        {departments.filter(d => d.isActive).length === 0 && (
          <p style={{ fontSize: 12.5, color: "var(--fg-muted)", padding: "12px 0" }}>등록된 부서가 없어요.</p>
        )}
        <AddRow
          placeholder="부서명 입력 (예: 개발팀, 디자인본부)"
          onAdd={async (name) => {
            const r = await createDepartmentAction({ name });
            if (r.ok) { refresh(); return null; }
            return r.error?.message ?? "오류가 발생했어요";
          }}
        />
      </div>

      {/* 직책 */}
      <div className="set-card">
        <h3>직책</h3>
        <p className="desc">직급/직위 체계를 관리해요. 조직장 직책은 부서장 권한이 자동 부여돼요.</p>
        {positions.filter(p => p.isActive).map((p) => (
          <InlineEditRow
            key={p.id}
            name={p.name}
            badge={p.isOrgHead ? "조직장" : undefined}
            count={p.memberCount}
            canDelete={p.memberCount === 0}
            onRename={async (name) => {
              const r = await updatePositionAction(p.id, { name });
              if (r.ok) { refresh(); return null; }
              return r.error?.message ?? "오류가 발생했어요";
            }}
            onDelete={async () => {
              const r = await deletePositionAction(p.id);
              if (r.ok) { refresh(); return null; }
              return r.error?.message ?? "오류가 발생했어요";
            }}
          />
        ))}
        {positions.filter(p => p.isActive).length === 0 && (
          <p style={{ fontSize: 12.5, color: "var(--fg-muted)", padding: "12px 0" }}>등록된 직책이 없어요.</p>
        )}
        <AddRow
          placeholder="직책명 입력 (예: 팀장, 사원, 대리)"
          onAdd={async (name) => {
            const r = await createPositionAction({ name });
            if (r.ok) { refresh(); return null; }
            return r.error?.message ?? "오류가 발생했어요";
          }}
        />
      </div>
    </div>
  );
}
