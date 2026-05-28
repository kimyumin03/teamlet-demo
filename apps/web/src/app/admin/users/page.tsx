import { listAllUsers } from "@teamlet/modules/tenancy";
import { requirePlatformAdmin } from "@/lib/platform-admin";

export const dynamic = "force-dynamic";

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default async function AdminUsersPage() {
  await requirePlatformAdmin();
  const users = await listAllUsers();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">사용자 관리</h1>
        <p className="mt-1 text-sm text-foreground-muted">플랫폼 전체 사용자 {users.length}명</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-background-primary">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-background-secondary text-left">
            <tr>
              <th className="px-4 py-3 text-xs font-medium text-foreground-muted">이름</th>
              <th className="px-4 py-3 text-xs font-medium text-foreground-muted">이메일</th>
              <th className="px-4 py-3 text-xs font-medium text-foreground-muted">이메일 인증</th>
              <th className="px-4 py-3 text-xs font-medium text-foreground-muted">소속 회사</th>
              <th className="px-4 py-3 text-xs font-medium text-foreground-muted">가입일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-background-secondary transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{u.name}</td>
                <td className="px-4 py-3 text-foreground-muted">{u.email}</td>
                <td className="px-4 py-3">
                  {u.emailVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      인증됨
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background-secondary px-2 py-0.5 text-xs font-medium text-foreground-muted">
                      <span className="h-1.5 w-1.5 rounded-full bg-foreground-subtle" />
                      미인증
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-foreground-muted">
                  {u.companyCount > 0 ? `${u.companyCount}개` : <span className="text-foreground-subtle">없음</span>}
                </td>
                <td className="px-4 py-3 text-foreground-subtle">{formatDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
