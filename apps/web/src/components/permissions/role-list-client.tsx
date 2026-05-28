"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@teamlet/ui";
import type { RoleListItem } from "@teamlet/modules/permission";
import {
  createRoleAction,
  deleteRoleAction,
} from "@/lib/actions/permission";

const SYSTEM_BADGE_LABEL: Partial<Record<RoleListItem["type"], string>> = {
  SYSTEM_SUPER_ADMIN: "최고 관리자",
  DYNAMIC_ORG_HEAD: "조직장 (동적)",
  DEFAULT: "기본",
};

export function RoleListClient({
  initialRoles,
}: {
  initialRoles: RoleListItem[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingRoleId, setPendingRoleId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(roleId: string) {
    setError(null);
    setPendingRoleId(roleId);
    startTransition(async () => {
      const res = await deleteRoleAction(roleId);
      setPendingRoleId(null);
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button onClick={() => setCreating(true)}>+ 새 역할</Button>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-[14px] border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13px] text-destructive"
        >
          {error}
        </p>
      )}

      {initialRoles.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <p className="text-[14px] font-medium text-foreground">아직 만들어진 역할이 없어요</p>
          <p className="text-[12.5px] text-foreground-muted">구성원에게 부여할 권한 그룹을 만들어 보세요.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {initialRoles.map((role) => {
            const isSystem =
              role.isSystem ||
              role.type === "SYSTEM_SUPER_ADMIN" ||
              role.type === "DYNAMIC_ORG_HEAD";
            return (
              <li
                key={role.id}
                className="flex items-center gap-4 rounded-[14px] border border-border bg-background-primary px-5 py-4"
              >
                <Link
                  href={`/settings/permissions/${role.id}`}
                  className="flex flex-1 flex-col gap-1 min-w-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-semibold text-foreground hover:text-primary transition-colors">
                      {role.name}
                    </span>
                    {isSystem && (
                      <span className="rounded-[5px] border border-border bg-background-secondary px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground-muted">
                        {SYSTEM_BADGE_LABEL[role.type] ?? "시스템"}
                      </span>
                    )}
                  </div>
                  {role.description && (
                    <p className="text-[12px] text-foreground-muted truncate">{role.description}</p>
                  )}
                </Link>

                <div className="flex shrink-0 items-center gap-1 font-mono text-[12px] text-foreground-muted">
                  <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
                  </svg>
                  <span>{role.memberCount}</span>
                </div>

                <button
                  aria-label={`${role.name} 삭제`}
                  disabled={
                    isSystem ||
                    role.memberCount > 0 ||
                    (isPending && pendingRoleId === role.id)
                  }
                  onClick={() => handleDelete(role.id)}
                  title={
                    isSystem
                      ? "시스템 역할은 삭제할 수 없어요"
                      : role.memberCount > 0
                        ? "배정된 구성원이 있어 삭제할 수 없어요"
                        : undefined
                  }
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-foreground-muted transition-colors hover:bg-background-secondary hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg viewBox="0 0 16 16" fill="currentColor" className="size-4">
                    <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <CreateRoleDialog
        open={creating}
        onOpenChange={setCreating}
        onCreated={() => {
          setCreating(false);
          router.refresh();
        }}
        onError={setError}
      />
    </div>
  );
}

function CreateRoleDialog({
  open,
  onOpenChange,
  onCreated,
  onError,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  onError: (msg: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();
  const [fieldError, setFieldError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldError(null);
    startTransition(async () => {
      const res = await createRoleAction({
        name,
        description: description || undefined,
      });
      if (!res.ok) {
        setFieldError(res.error.message);
        onError(res.error.message);
        return;
      }
      setName("");
      setDescription("");
      onCreated();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!isPending) onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 역할</DialogTitle>
          <DialogDescription>
            역할 이름과 간단한 설명을 입력하세요. 권한은 만든 뒤에 편집할 수
            있어요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="role-name" className="text-[13px] text-foreground-muted">
              역할명
            </label>
            <Input
              id="role-name"
              name="name"
              required
              minLength={2}
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="role-description" className="text-[13px] text-foreground-muted">
              설명 (선택)
            </label>
            <Input
              id="role-description"
              name="description"
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {fieldError && (
            <p
              role="alert"
              className="rounded-[14px] border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive"
            >
              {fieldError}
            </p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={isPending}>
                취소
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending || name.trim().length < 2}>
              {isPending ? "만드는 중…" : "만들기"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
