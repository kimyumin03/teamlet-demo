import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
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
      className="rounded-md bg-destructive-50 px-4 py-3 text-sm text-destructive-700"
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
        className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        권한 설정
      </Link>

      <div className="mb-6 mt-4">
        <h1 className="text-xl font-semibold text-foreground">{role.name}</h1>
        <p className="mt-0.5 text-sm text-foreground-muted">
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
