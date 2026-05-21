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
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">보안 설정</h1>
        <p className="mt-0.5 text-sm text-foreground-muted">2단계 인증 및 IP 접근 제한 정책을 관리해요</p>
      </div>
      {policy && <SecurityPolicyForm initialPolicy={policy} />}
    </div>
  );
}
