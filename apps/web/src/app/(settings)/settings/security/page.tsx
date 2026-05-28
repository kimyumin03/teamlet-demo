import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getSecurityPolicy } from "@teamlet/modules/security";
import { SecurityPolicyForm } from "@/components/security/security-policy-form";

export const dynamic = "force-dynamic";

export default async function SecuritySettingsPage() {
  const session = await auth();
  if (!session?.user?.employeeId) redirect("/login");

  const result = await getSecurityPolicy(session.user.employeeId);
  const policy = result.ok ? result.data : null;

  return (
    <>
      <div className="page-h">
        <div>
          <h1 className="h-title">보안</h1>
          <div className="h-sub">2단계 인증 및 IP 접근 제한 정책을 관리합니다</div>
        </div>
      </div>
      {policy && <SecurityPolicyForm initialPolicy={policy} />}
    </>
  );
}
