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
      <div>
        <p
          role="alert"
          className="rounded-[14px] border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13px] text-destructive"
        >
          {result.error.message}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">권한 설정</h1>
        <p className="mt-0.5 text-[13px] text-foreground-muted">
          역할(권한 그룹)을 만들고 구성원에게 부여해요. 역할을 클릭하면 권한을 편집할 수 있어요.
        </p>
      </div>
      <div className="rounded-[14px] border border-border bg-background-primary px-[26px] py-[22px]">
        <h3 className="mb-1.5 text-[15px] font-bold text-foreground">역할 목록</h3>
        <p className="mb-5 text-[12.5px] text-foreground-muted">역할을 클릭하면 권한 매트릭스를 편집할 수 있어요. 구성원별 역할 배정은 구성원 상세 → 권한 탭에서 해요.</p>
        <RoleListClient initialRoles={result.data} />
      </div>
    </div>
  );
}
