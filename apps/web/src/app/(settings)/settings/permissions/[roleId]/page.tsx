import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  getPermissionCatalog,
  getRolePermissions,
  listRoles,
} from "@teamlet/modules/permission";
import { listDepartments } from "@teamlet/modules/department";
import { auth } from "@/auth";
import { RolePermissionEditor } from "@/components/permissions/role-permission-editor";

/**
 * 역할 권한 매트릭스 편집 (docs/02 §11-1).
 * 카테고리별 권한 on/off + 범위(전체/지정부서/본인) 지정.
 */
export const dynamic = "force-dynamic";

function ErrorBox({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-[14px] border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13px] text-destructive"
    >
      {message}
    </p>
  );
}

export default async function RolePermissionPage({
  params,
}: {
  params: Promise<{ roleId: string }>;
}) {
  const { roleId } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");
  const employeeId = session.user.employeeId;

  const [rolesResult, permsResult, deptResult, catalog] = await Promise.all([
    listRoles(employeeId),
    getRolePermissions(employeeId, roleId),
    listDepartments(employeeId),
    getPermissionCatalog(),
  ]);

  if (!rolesResult.ok) return <ErrorBox message={rolesResult.error.message} />;

  const role = rolesResult.data.find((r) => r.id === roleId);
  if (!role) notFound();

  if (!permsResult.ok) return <ErrorBox message={permsResult.error.message} />;

  const departments = deptResult.ok
    ? deptResult.data.map((d) => ({ id: d.id, name: d.name }))
    : [];

  const readOnly =
    role.isSystem ||
    role.type === "SYSTEM_SUPER_ADMIN" ||
    role.type === "DYNAMIC_ORG_HEAD";

  return (
    <div>
      <Link
        href="/settings/permissions"
        className="inline-flex items-center gap-1 text-[12px] text-foreground-subtle hover:text-foreground transition-colors"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5">
          <path fillRule="evenodd" d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 1.06L4.81 7h7.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z" clipRule="evenodd" />
        </svg>
        권한 설정
      </Link>

      <div className="mb-6 mt-4">
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">{role.name}</h1>
        <p className="mt-0.5 text-[13px] text-foreground-muted">
          {role.description ?? "이 역할이 가질 권한을 설정해요."}
        </p>
      </div>

      <RolePermissionEditor
        roleId={roleId}
        catalog={catalog}
        currentPermissions={permsResult.data}
        departments={departments}
        readOnly={readOnly}
      />
    </div>
  );
}
