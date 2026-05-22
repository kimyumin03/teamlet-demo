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
        <h1 className="text-xl font-semibold text-zinc-900">사용자 관리</h1>
        <p className="mt-1 text-sm text-zinc-500">플랫폼 전체 사용자 {users.length}명</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-left">
            <tr>
              <th className="px-4 py-3 text-xs font-medium text-zinc-500">이름</th>
              <th className="px-4 py-3 text-xs font-medium text-zinc-500">이메일</th>
              <th className="px-4 py-3 text-xs font-medium text-zinc-500">이메일 인증</th>
              <th className="px-4 py-3 text-xs font-medium text-zinc-500">소속 회사</th>
              <th className="px-4 py-3 text-xs font-medium text-zinc-500">가입일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-4 py-3 font-medium text-zinc-900">{u.name}</td>
                <td className="px-4 py-3 text-zinc-600">{u.email}</td>
                <td className="px-4 py-3">
                  {u.emailVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      인증됨
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                      미인증
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {u.companyCount > 0 ? `${u.companyCount}개` : <span className="text-zinc-400">없음</span>}
                </td>
                <td className="px-4 py-3 text-zinc-400">{formatDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
