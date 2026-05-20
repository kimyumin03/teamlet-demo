"use client";

import { useState, useTransition } from "react";
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
  EmptyState,
  Input,
} from "@teamlet/ui";
import { Shield, Trash2, UsersRound } from "lucide-react";
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
          className="rounded-md bg-destructive-50 px-4 py-3 text-sm text-destructive-700"
        >
          {error}
        </p>
      )}

      {initialRoles.length === 0 ? (
        <EmptyState
          icon={<Shield />}
          title="아직 만들어진 역할이 없어요"
          description="구성원에게 부여할 권한 그룹을 만들어 보세요."
        />
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
                className="flex items-center gap-4 rounded-lg border border-border bg-background-primary px-4 py-3"
              >
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {role.name}
                    </span>
                    {isSystem && (
                      <span className="rounded-md bg-background-secondary px-2 py-0.5 text-xs text-foreground-muted">
                        {SYSTEM_BADGE_LABEL[role.type] ?? "시스템"}
                      </span>
                    )}
                  </div>
                  {role.description && (
                    <p className="text-sm text-foreground-muted">
                      {role.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 text-sm text-foreground-muted">
                  <UsersRound className="size-4" />
                  <span>{role.memberCount}</span>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
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
                >
                  <Trash2 className="size-4 text-foreground-muted" />
                </Button>
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
            <label htmlFor="role-name" className="text-sm text-foreground-muted">
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
            <label
              htmlFor="role-description"
              className="text-sm text-foreground-muted"
            >
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
              className="rounded-md bg-destructive-50 px-3 py-2 text-sm text-destructive-700"
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
