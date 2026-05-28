import Link from "next/link";
import { getPlatformStats } from "@teamlet/modules/tenancy";
import { requirePlatformAdmin } from "@/lib/platform-admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requirePlatformAdmin();
  const stats = await getPlatformStats();

  const cards = [
    {
      label: "대기 중 신청",
      value: stats.pendingApplications,
      href: "/admin/applications",
      accent: stats.pendingApplications > 0,
      desc: "승인 검토 필요",
    },
    {
      label: "전체 회사",
      value: stats.totalCompanies,
      href: "/admin/companies",
      accent: false,
      desc: `활성 ${stats.activeCompanies}개`,
    },
    {
      label: "전체 사용자",
      value: stats.totalUsers,
      href: "/admin/users",
      accent: false,
      desc: "플랫폼 가입 계정",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-foreground">운영 대시보드</h1>
        <p className="mt-1 text-sm text-foreground-muted">Teamlet 플랫폼 전체 현황</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="group block">
            <div
              className={`rounded-lg border p-5 transition-shadow hover:shadow-sm ${
                c.accent
                  ? "border-amber-200 bg-amber-50"
                  : "border-border bg-background-primary"
              }`}
            >
              <p className={`text-xs font-medium ${c.accent ? "text-amber-600" : "text-foreground-muted"}`}>
                {c.label}
              </p>
              <p className={`mt-2 text-3xl font-semibold tabular-nums ${c.accent ? "text-amber-700" : "text-foreground"}`}>
                {c.value.toLocaleString()}
              </p>
              <p className={`mt-1 text-xs ${c.accent ? "text-amber-500" : "text-foreground-subtle"}`}>
                {c.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* 대기 신청 배너 */}
      {stats.pendingApplications > 0 && (
        <div className="mt-6 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
              <svg viewBox="0 0 20 20" fill="currentColor" className="size-4 text-amber-600">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-amber-800">
                회사 등록 신청 {stats.pendingApplications}건이 검토를 기다리고 있어요.
              </p>
              <p className="text-xs text-amber-600">승인하면 회사와 최고 관리자 계정이 생성됩니다.</p>
            </div>
          </div>
          <Link
            href="/admin/applications"
            className="shrink-0 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 transition-colors"
          >
            지금 검토하기
          </Link>
        </div>
      )}

      {/* 빠른 링크 */}
      <div className="mt-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground-subtle">빠른 이동</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            { label: "회사 신청 검토", href: "/admin/applications", desc: "신규 회사 등록 승인·반려" },
            { label: "회사 목록", href: "/admin/companies", desc: "활성 회사 현황 조회" },
            { label: "사용자 관리", href: "/admin/users", desc: "플랫폼 전체 사용자 조회" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between rounded-lg border border-border bg-background-primary px-4 py-3 transition-colors hover:bg-background-secondary"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-foreground-subtle">{item.desc}</p>
              </div>
              <svg viewBox="0 0 16 16" fill="currentColor" className="size-4 text-foreground-subtle">
                <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
