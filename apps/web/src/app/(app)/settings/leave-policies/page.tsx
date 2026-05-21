import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listLeavePolicies } from "@teamlet/modules/leave";
import { listLeaveTypes } from "@teamlet/modules/leave";
import { LeavePoliciesClient } from "@/components/leave-policy/leave-policies-client";

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
      <p className="mb-6 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
        ⚠ 정책은 저장·배정되지만 <strong>자동 부여·소멸·이월은 아직 준비 중</strong>이에요.
        현재 휴가 잔여는 관리자가 <strong>수동 부여</strong>(휴가 관리 → 수동 부여)한
        만큼만 반영돼요.
      </p>
      <LeavePoliciesClient initialPolicies={policies} leaveTypes={leaveTypes} />
    </div>
  );
}
