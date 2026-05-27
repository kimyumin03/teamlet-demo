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
        <h1 className="text-xl font-semibold text-foreground mb-6">가입 신청 관리</h1>
        <p className="text-sm text-destructive-600">{result.error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">가입 신청 관리</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          회사코드로 가입을 신청한 구성원을 승인하거나 반려합니다.
        </p>
      </div>
      <JoinRequestsClient items={result.data} />
    </div>
  );
}
