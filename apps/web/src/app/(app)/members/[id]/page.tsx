import { notFound, redirect } from "next/navigation";
import { listDepartments } from "@teamlet/modules/department";
import { getEmployee } from "@teamlet/modules/employee";
import { listAppointments } from "@teamlet/modules/appointment";
import { listPositions } from "@teamlet/modules/position";
import { listEmployeeLeaveHistory } from "@teamlet/modules/leave";
import { listEmployeeDocuments } from "@teamlet/modules/workflow";
import { listRoles } from "@teamlet/modules/permission";
import { listCareerHistories, listEducationHistories, listFamilyMembers } from "@teamlet/modules/employee";
import { auth } from "@/auth";
import { ProfileShell } from "./_components/profile-shell";

export const dynamic = "force-dynamic";

type TabKey = "info" | "appointment" | "roles";
const VALID_TABS: TabKey[] = ["info", "appointment", "roles"];

export default async function MemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: tabParam } = await searchParams;
  const initialTab: TabKey = (VALID_TABS.includes(tabParam as TabKey) ? tabParam : "info") as TabKey;

  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");

  const [
    empResult, deptResult, posResult, leaveResult, workflowResult,
    rolesResult, apptResult, careerResult, educationResult, familyResult,
  ] = await Promise.all([
    getEmployee(session.user.employeeId, id),
    listDepartments(session.user.employeeId),
    listPositions(session.user.employeeId),
    listEmployeeLeaveHistory(session.user.employeeId, id),
    listEmployeeDocuments(session.user.employeeId, id),
    listRoles(session.user.employeeId),
    listAppointments(session.user.employeeId, id),
    listCareerHistories(session.user.employeeId, id),
    listEducationHistories(session.user.employeeId, id),
    listFamilyMembers(session.user.employeeId, id),
  ]);

  if (!empResult.ok) {
    if (empResult.error.code === "NOT_FOUND") notFound();
    return (
      <div className="p-8">
        <p className="rounded-[14px] border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13px] text-destructive">
          {empResult.error.message}
        </p>
      </div>
    );
  }

  return (
    <ProfileShell
      emp={empResult.data}
      departments={deptResult.ok ? deptResult.data : []}
      positions={posResult.ok ? posResult.data : []}
      leaveHistory={leaveResult.ok ? leaveResult.data : []}
      workflowDocs={workflowResult.ok ? workflowResult.data : []}
      assignableRoles={rolesResult.ok ? rolesResult.data : []}
      appointments={apptResult.ok ? apptResult.data : []}
      careerItems={careerResult.ok ? careerResult.data : []}
      educationItems={educationResult.ok ? educationResult.data : []}
      familyItems={familyResult.ok ? familyResult.data : []}
      initialTab={initialTab}
    />
  );
}
