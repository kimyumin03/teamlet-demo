import { listAllCompanies } from "@teamlet/modules/tenancy";
import { requirePlatformAdmin } from "@/lib/platform-admin";

export const dynamic = "force-dynamic";

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default async function AdminCompaniesPage() {
  await requirePlatformAdmin();
  const companies = await listAllCompanies();

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-foreground">회사 목록</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        플랫폼에 등록된 전체 회사 {companies.length}개
      </p>

      {companies.length === 0 ? (
        <p className="mt-8 rounded-lg border border-border bg-background-primary px-4 py-8 text-center text-sm text-foreground-muted">
          아직 등록된 회사가 없어요.
        </p>
      ) : (
        <div className="mt-8 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-background-secondary text-left text-xs text-foreground-muted">
              <tr>
                <th className="px-4 py-2.5 font-medium">회사명</th>
                <th className="px-4 py-2.5 font-medium">사업자번호</th>
                <th className="px-4 py-2.5 font-medium">회사코드</th>
                <th className="px-4 py-2.5 font-medium">직원</th>
                <th className="px-4 py-2.5 font-medium">상태</th>
                <th className="px-4 py-2.5 font-medium">등록일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background-primary">
              {companies.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {c.name}
                  </td>
                  <td className="px-4 py-3 text-foreground-muted">
                    {c.businessNumber}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground-muted">
                    {c.companyCode}
                  </td>
                  <td className="px-4 py-3 text-foreground-muted">
                    {c.employeeCount}명
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs ${
                        c.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-background-secondary text-foreground-subtle"
                      }`}
                    >
                      {c.isActive ? "활성" : "비활성"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground-subtle">
                    {formatDate(c.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
