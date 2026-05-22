import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listLeavePolicies } from "@teamlet/modules/leave";
import { listLeaveTypes } from "@teamlet/modules/leave";
import { LeavePoliciesClient } from "@/components/leave-policy/leave-policies-client";
import { AutoGrantButton } from "@/components/leave-policy/auto-grant-button";

export const dynamic = "force-dynamic";

export default async function LeavePoliciesPage() {
  const session = await auth();
  if (!session?.user?.employeeId) redirect("/login");

  const [policiesResult, typesResult] = await Promise.all([
    listLeavePolicies(session.user.employeeId),
    listLeaveTypes(session.user.employeeId),
  ]);

  const policies = policiesResult.ok ? policiesResult.data : [];
  const leaveTypes = typesResult.ok ? typesResult.data : [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">휴가 정책</h1>
        <p className="mt-0.5 text-sm text-foreground-muted">연차 부여 정책을 만들고 구성원에게 배정해요</p>
      </div>
      <div className="mb-6 flex items-start justify-between gap-3 rounded-md border border-border bg-background-secondary px-4 py-3">
        <p className="text-sm text-foreground-muted">
          정책이 배정된 구성원에게{" "}
          <strong className="text-foreground">연차 자동부여</strong>를 실행할 수 있어요.
          입사 첫 해는 월할 비례 적용 · 같은 해 재실행 시 중복 부여 없음.
          <br />
          <span className="text-xs text-foreground-subtle">
            소멸·이월 자동화는 아직 준비 중이에요.
          </span>
        </p>
        <AutoGrantButton />
      </div>
      <LeavePoliciesClient initialPolicies={policies} leaveTypes={leaveTypes} />
    </div>
  );
}
