import { redirect } from "next/navigation";
import { listRoles } from "@teamlet/modules/permission";
import { auth } from "@/auth";
import { RoleListClient } from "@/components/permissions/role-list-client";

/**
 * 권한 설정 (docs/02 §11-1). 역할 리스트 + 생성/삭제.
 * 역할을 클릭하면 권한 매트릭스 편집 페이지(`[roleId]`)로 이동.
 */
export const dynamic = "force-dynamic";

export default async function PermissionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");

  const result = await listRoles(session.user.employeeId);

  if (!result.ok) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-foreground">권한 설정</h1>
        <p
          role="alert"
          className="mt-6 rounded-md bg-destructive-50 px-4 py-3 text-sm text-destructive-700"
        >
          {result.error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">권한 설정</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          역할(권한 그룹)을 만들고 구성원에게 부여해요. 역할을 클릭하면 권한을
          편집할 수 있어요. 구성원별 역할 배정은 구성원 상세 → 권한 탭에서 해요.
        </p>
      </header>
      <RoleListClient initialRoles={result.data} />
    </div>
  );
}
