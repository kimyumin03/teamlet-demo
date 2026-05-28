"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, Input } from "@teamlet/ui";
import type { FormTemplateItem, FieldDef, FieldType } from "@teamlet/modules/workflow";
import {
  createFormTemplateAction,
  updateFormTemplateAction,
  deleteFormTemplateAction,
} from "@/lib/actions/form-template";

const KIND_LABEL = {
  GENERAL: "일반",
  LEAVE_REQUEST: "휴가 신청",
  INFO_CHANGE: "정보 변경",
  ANNOUNCEMENT: "공지",
} as const;

const FIELD_TYPE_LABEL: Record<FieldType, string> = {
  text: "텍스트",
  textarea: "장문",
  number: "숫자",
  date: "날짜",
  select: "선택",
  checkbox: "체크박스",
};

type Kind = "GENERAL" | "LEAVE_REQUEST" | "INFO_CHANGE" | "ANNOUNCEMENT";

type FormState = {
  name: string;
  kind: Kind;
  description: string;
  fields: FieldDef[];
};

function newField(): FieldDef {
  return {
    id: Math.random().toString(36).slice(2),
    label: "",
    type: "text",
    required: false,
    placeholder: "",
    options: [],
  };
}

function defaultForm(): FormState {
  return { name: "", kind: "GENERAL", description: "", fields: [] };
}

function templateToForm(t: FormTemplateItem): FormState {
  return { name: t.name, kind: t.kind as Kind, description: t.description, fields: t.fields };
}

// ── Field editor ──────────────────────────────────────────────
function FieldEditor({
  field,
  index,
  total,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  field: FieldDef;
  index: number;
  total: number;
  onChange: (f: FieldDef) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const [optionInput, setOptionInput] = useState("");

  function addOption() {
    const trimmed = optionInput.trim();
    if (!trimmed || (field.options ?? []).includes(trimmed)) return;
    onChange({ ...field, options: [...(field.options ?? []), trimmed] });
    setOptionInput("");
  }

  function removeOption(opt: string) {
    onChange({ ...field, options: (field.options ?? []).filter((o) => o !== opt) });
  }

  return (
    <div className="rounded-[14px] border border-border bg-background-secondary p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-foreground-muted">필드 {index + 1}</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="rounded px-1.5 py-0.5 text-xs text-foreground-muted hover:bg-background-primary disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="rounded px-1.5 py-0.5 text-xs text-foreground-muted hover:bg-background-primary disabled:opacity-30"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded px-1.5 py-0.5 text-[12px] text-destructive hover:bg-destructive/5"
          >
            삭제
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-foreground-muted">필드명</label>
          <Input
            required
            maxLength={100}
            placeholder="예: 사유"
            value={field.label}
            onChange={(e) => onChange({ ...field, label: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-foreground-muted">유형</label>
          <select
            value={field.type}
            onChange={(e) => onChange({ ...field, type: e.target.value as FieldType, options: [] })}
            className="h-10 rounded-md border border-border bg-background-primary px-3 text-sm text-foreground focus-visible:outline-none"
          >
            {(Object.keys(FIELD_TYPE_LABEL) as FieldType[]).map((t) => (
              <option key={t} value={t}>{FIELD_TYPE_LABEL[t]}</option>
            ))}
          </select>
        </div>
      </div>

      {field.type !== "checkbox" && field.type !== "select" && (
        <div className="mt-2 flex flex-col gap-1">
          <label className="text-xs text-foreground-muted">안내 문구 (placeholder)</label>
          <Input
            maxLength={200}
            value={field.placeholder ?? ""}
            onChange={(e) => onChange({ ...field, placeholder: e.target.value })}
          />
        </div>
      )}

      {field.type === "select" && (
        <div className="mt-2 flex flex-col gap-1.5">
          <label className="text-xs text-foreground-muted">선택 옵션</label>
          <div className="flex gap-2">
            <Input
              placeholder="옵션 추가"
              value={optionInput}
              onChange={(e) => setOptionInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOption(); } }}
            />
            <Button type="button" variant="secondary" onClick={addOption}>추가</Button>
          </div>
          {(field.options ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {(field.options ?? []).map((opt) => (
                <span key={opt} className="flex items-center gap-1 rounded-full bg-background-primary border border-border px-2 py-0.5 text-xs text-foreground">
                  {opt}
                  <button type="button" onClick={() => removeOption(opt)} className="text-foreground-muted hover:text-destructive">×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <label className="mt-2 flex items-center gap-2 text-xs text-foreground">
        <input
          type="checkbox"
          checked={field.required}
          onChange={(e) => onChange({ ...field, required: e.target.checked })}
          className="h-3.5 w-3.5 rounded border-border"
        />
        필수 입력
      </label>
    </div>
  );
}

// ── Template form ─────────────────────────────────────────────
function TemplateForm({ form, setForm }: { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>> }) {
  function updateField(index: number, updated: FieldDef) {
    setForm((f) => { const fields = [...f.fields]; fields[index] = updated; return { ...f, fields }; });
  }
  function moveField(from: number, to: number) {
    setForm((f) => {
      const fields = [...f.fields];
      const [item] = fields.splice(from, 1);
      fields.splice(to, 0, item!);
      return { ...f, fields };
    });
  }
  function removeField(index: number) {
    setForm((f) => ({ ...f, fields: f.fields.filter((_, i) => i !== index) }));
  }
  function addField() {
    setForm((f) => ({ ...f, fields: [...f.fields, newField()] }));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-foreground-muted">양식명</label>
          <Input
            required
            maxLength={100}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="예: 연차 신청서"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-foreground-muted">유형</label>
          <select
            value={form.kind}
            onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as Kind }))}
            className="h-10 rounded-md border border-border bg-background-primary px-3 text-sm text-foreground focus-visible:outline-none"
          >
            {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
              <option key={k} value={k}>{KIND_LABEL[k]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-foreground-muted">설명 (선택)</label>
        <Input
          maxLength={500}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">필드 ({form.fields.length}/30)</p>
          <Button type="button" variant="secondary" onClick={addField} disabled={form.fields.length >= 30}>
            + 필드 추가
          </Button>
        </div>
        {form.fields.length === 0 ? (
          <p className="rounded-md border border-dashed border-border py-6 text-center text-sm text-foreground-muted">
            필드가 없어요. 추가 버튼을 눌러 시작하세요.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {form.fields.map((field, i) => (
              <FieldEditor
                key={field.id}
                field={field}
                index={i}
                total={form.fields.length}
                onChange={(updated) => updateField(i, updated)}
                onMoveUp={() => moveField(i, i - 1)}
                onMoveDown={() => moveField(i, i + 1)}
                onRemove={() => removeField(i)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main client ───────────────────────────────────────────────
export function FormTemplatesClient({ initialTemplates }: { initialTemplates: FormTemplateItem[] }) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initialTemplates);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FormTemplateItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FormTemplateItem | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() { setForm(defaultForm()); setError(null); setCreateOpen(true); }
  function openEdit(t: FormTemplateItem) { setForm(templateToForm(t)); setError(null); setEditTarget(t); }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createFormTemplateAction(form);
      if (!res.ok) { setError(res.error.message); return; }
      setCreateOpen(false);
      router.refresh();
    });
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setError(null);
    startTransition(async () => {
      const res = await updateFormTemplateAction(editTarget.id, form);
      if (!res.ok) { setError(res.error.message); return; }
      setEditTarget(null);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await deleteFormTemplateAction(deleteTarget.id);
      if (!res.ok) { setError(res.error.message); return; }
      setTemplates((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>양식 추가</Button>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-[14px] border border-border bg-background-primary p-10 text-center text-sm text-foreground-muted">
          등록된 양식이 없어요. 양식을 추가해 결재 프로세스를 시작하세요.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {templates.map((t) => (
            <div key={t.id} className="rounded-[14px] border border-border bg-background-primary p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{t.name}</span>
                    <span className="rounded-full bg-background-secondary px-2 py-0.5 text-xs text-foreground-muted">
                      {KIND_LABEL[t.kind as Kind]}
                    </span>
                    {!t.isActive && (
                      <span className="rounded-full bg-background-secondary px-2 py-0.5 text-xs text-foreground-subtle">비활성</span>
                    )}
                  </div>
                  {t.description && <p className="mt-0.5 text-sm text-foreground-muted">{t.description}</p>}
                  <p className="mt-1.5 text-xs text-foreground-subtle">
                    필드 {t.fields.length}개 · 사용된 문서 {t.documentCount}건
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => openEdit(t)}>수정</Button>
                  <Button variant="destructive" onClick={() => { setError(null); setDeleteTarget(t); }}>삭제</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 추가 */}
      <Dialog open={createOpen} onOpenChange={(o) => { if (!isPending) setCreateOpen(o); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>양식 추가</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <TemplateForm form={form} setForm={setForm} />
            {error && <p role="alert" className="rounded-[14px] border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive">{error}</p>}
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary" disabled={isPending}>취소</Button></DialogClose>
              <Button type="submit" disabled={isPending || !form.name.trim()}>{isPending ? "저장 중…" : "저장"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 수정 */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!isPending && !o) setEditTarget(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>양식 수정</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="flex flex-col gap-4">
            <TemplateForm form={form} setForm={setForm} />
            {error && <p role="alert" className="rounded-[14px] border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive">{error}</p>}
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary" disabled={isPending}>취소</Button></DialogClose>
              <Button type="submit" disabled={isPending || !form.name.trim()}>{isPending ? "저장 중…" : "저장"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!isPending && !o) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>양식 삭제</DialogTitle></DialogHeader>
          <p className="text-sm text-foreground-muted">
            <strong className="text-foreground">{deleteTarget?.name}</strong> 양식을 삭제할까요?
            {deleteTarget && deleteTarget.documentCount > 0 && (
              <span className="mt-1 block text-destructive">사용된 문서가 있어 삭제할 수 없어요.</span>
            )}
          </p>
          {error && <p role="alert" className="rounded-[14px] border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="secondary" disabled={isPending}>취소</Button></DialogClose>
            <Button variant="destructive" disabled={isPending || (deleteTarget?.documentCount ?? 0) > 0} onClick={handleDelete}>
              {isPending ? "삭제 중…" : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
