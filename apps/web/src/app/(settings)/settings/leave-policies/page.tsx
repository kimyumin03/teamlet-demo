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
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">휴가 정책</h1>
        <p className="mt-0.5 text-[13px] text-foreground-muted">연차 부여 정책을 만들고 구성원에게 배정해요</p>
      </div>

      {/* 연차 자동부여 카드 */}
      <div className="mb-4 rounded-[14px] border border-border bg-background-primary px-[26px] py-[22px]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="mb-1.5 text-[15px] font-bold text-foreground">연차 자동부여</h3>
            <p className="text-[12.5px] text-foreground-muted">
              정책이 배정된 구성원에게 <strong className="text-foreground">연차 자동부여</strong>를 실행해요.
              입사 첫 해는 월할 비례 적용 · 같은 해 재실행 시 중복 부여 없음.
            </p>
            <p className="mt-1 text-[11.5px] text-foreground-subtle">소멸·이월 자동화는 아직 준비 중이에요.</p>
          </div>
          <AutoGrantButton />
        </div>
      </div>

      {/* 정책 목록 카드 */}
      <div className="rounded-[14px] border border-border bg-background-primary px-[26px] py-[22px]">
        <h3 className="mb-1.5 text-[15px] font-bold text-foreground">정책 목록</h3>
        <p className="mb-5 text-[12.5px] text-foreground-muted">연차 부여 규칙을 정의하고 구성원에게 배정해요.</p>
        <LeavePoliciesClient initialPolicies={policies} leaveTypes={leaveTypes} />
      </div>
    </div>
  );
}
