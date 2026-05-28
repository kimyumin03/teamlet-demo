import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listPendingMemberships } from "@teamlet/modules/tenancy";
import { JoinRequestsClient } from "./_components/join-requests-client";

export default async function JoinRequestsPage() {
  const session = await auth();
  if (!session?.user?.employeeId) redirect("/home");

  const result = await listPendingMemberships(session.user.employeeId);

  if (!result.ok) {
    return (
      <div>
        <h1 className="text-[20px] font-bold tracking-tight text-foreground mb-6">가입 신청 관리</h1>
        <p className="text-[13px] text-destructive">{result.error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">가입 신청 관리</h1>
        <p className="mt-0.5 text-[13px] text-foreground-muted">회사코드로 가입을 신청한 구성원을 승인하거나 반려해요</p>
      </div>
      <div className="rounded-[14px] border border-border bg-background-primary px-[26px] py-[22px]">
        <h3 className="mb-1.5 text-[15px] font-bold text-foreground">대기 중인 신청</h3>
        <p className="mb-5 text-[12.5px] text-foreground-muted">승인하면 구성원으로 등록돼요. 반려하면 재신청할 수 없어요.</p>
        <JoinRequestsClient items={result.data} />
      </div>
    </div>
  );
}
