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
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">보안 설정</h1>
        <p className="mt-0.5 text-[13px] text-foreground-muted">2단계 인증 및 IP 접근 제한 정책을 관리해요</p>
      </div>
      {policy && <SecurityPolicyForm initialPolicy={policy} />}
    </div>
  );
}
