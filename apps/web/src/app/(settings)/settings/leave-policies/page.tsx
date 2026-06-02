import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listLeavePolicies, listLeaveTypes, getCompanyLeaveSettings } from "@teamlet/modules/leave";
import { listEmployees } from "@teamlet/modules/employee";
import { listDepartments } from "@teamlet/modules/department";
import { prisma } from "@teamlet/db";
import { LeavePoliciesClient } from "@/components/leave-policy/leave-policies-client";
import { AutoGrantButton } from "@/components/leave-policy/auto-grant-button";
import { CompanyLeaveSettingsSection } from "@/components/leave-policy/company-leave-settings-section";

export const dynamic = "force-dynamic";

export default async function LeavePoliciesPage() {
  const session = await auth();
  if (!session?.user?.employeeId) redirect("/login");

  const employeeId = session.user.employeeId;

  // annual 타입 없으면 직접 upsert (모듈 캐시 무관하게 확실히 생성)
  const empRow = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { companyId: true },
  });
  if (empRow) {
    await prisma.leaveType.upsert({
      where: { companyId_key: { companyId: empRow.companyId, key: "annual" } },
      create: {
        companyId: empRow.companyId,
        key: "annual",
        name: "연차",
        description: "연차유급휴가 (정책 기반 자동 부여)",
        isSystem: true,
        isRequired: true,
        grantMethod: "PERIODIC",
        grantUnit: "DAY",
        paymentType: "PAID",
        genderRestriction: "ALL",
        evidenceRequirement: "NONE",
      },
      update: {},
    });
  }

  const [policiesResult, typesResult, employeesResult, settingsResult, departmentsResult] = await Promise.all([
    listLeavePolicies(employeeId),
    listLeaveTypes(employeeId),
    listEmployees(employeeId),
    getCompanyLeaveSettings(employeeId),
    listDepartments(employeeId),
  ]);

  const policies = policiesResult.ok ? policiesResult.data : [];
  // 연차 정책용 — key가 "annual"인 타입만
  const annualType = typesResult.ok ? typesResult.data.find((t) => t.key === "annual") : undefined;
  const employees = employeesResult.ok
    ? employeesResult.data
        .filter((e) => e.isActive)
        .map((e) => ({ id: e.id, name: e.name, departmentId: e.departmentId, departmentName: e.departmentName }))
    : [];
  const departments = departmentsResult.ok
    ? departmentsResult.data.map((d) => ({ id: d.id, name: d.name, parentId: d.parentId }))
    : [];
  const leaveSettings = settingsResult.ok ? settingsResult.data : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2">
        <h1 className="h-title">연차 설정</h1>
        <p className="h-sub">연차 부여 정책을 만들고 구성원에게 배정해요</p>
      </div>

      {/* 연차 자동부여 */}
      <div className="rounded-[14px] border border-border bg-background-primary px-[26px] py-[22px]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="mb-1.5 text-[15px] font-bold text-foreground">연차 자동부여</h3>
            <p className="text-[12.5px] text-foreground-muted">
              정책이 배정된 구성원에게 <strong className="text-foreground">연차 자동부여</strong>를 실행해요.
              입사 첫 해는 월할 비례 적용 · 같은 해 재실행 시 중복 부여 없음.
            </p>
          </div>
          <AutoGrantButton />
        </div>
      </div>

      {/* 연차 정책 목록 */}
      <div className="rounded-[14px] border border-border bg-background-primary px-[26px] py-[22px]">
        <h3 className="mb-1.5 text-[15px] font-bold text-foreground">연차 정책</h3>
        <p className="mb-5 text-[12.5px] text-foreground-muted">연차 부여·소멸·사용 단위·승인선을 정의하고 구성원에게 배정해요.</p>
        <LeavePoliciesClient initialPolicies={policies} annualTypeId={annualType?.id ?? ""} employees={employees} departments={departments} />
      </div>

      {/* 연차 설정 (퇴직자 조정 + 촉진 설정) */}
      {leaveSettings && (
        <div className="rounded-[14px] border border-border bg-background-primary px-[26px] py-[22px]">
          <h3 className="mb-1.5 text-[15px] font-bold text-foreground">연차 설정</h3>
          <p className="mb-4 text-[12.5px] text-foreground-muted">퇴직자 기준 및 연차 촉진을 설정해요.</p>
          <CompanyLeaveSettingsSection initial={leaveSettings} employees={employees} departments={departments} />
        </div>
      )}
    </div>
  );
}
