import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listDepartments } from "@teamlet/modules/department";
import { listPositions } from "@teamlet/modules/position";
import { OrgSettingsClient } from "./_components/org-client";

export const dynamic = "force-dynamic";

export default async function OrgSettingsPage() {
  const session = await auth();
  if (!session?.user?.employeeId) redirect("/login");

  const [deptResult, posResult] = await Promise.all([
    listDepartments(session.user.employeeId),
    listPositions(session.user.employeeId),
  ]);

  const departments = deptResult.ok ? deptResult.data : [];
  const positions = posResult.ok ? posResult.data : [];

  return (
    <div>
      <div className="page-h" style={{ marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.01em", margin: 0 }}>조직 · 직책</h1>
          <p style={{ fontSize: "13px", color: "var(--fg-muted)", marginTop: "4px" }}>
            부서 구조와 직책을 관리해요. 삭제는 배정된 구성원이 없을 때만 가능해요.
          </p>
        </div>
      </div>
      <OrgSettingsClient departments={departments} positions={positions} />
    </div>
  );
}
