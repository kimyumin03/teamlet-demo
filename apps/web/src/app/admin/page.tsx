import Link from "next/link";
import { getPlatformStats } from "@teamlet/modules/tenancy";
import { requirePlatformAdmin } from "@/lib/platform-admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requirePlatformAdmin();
  const stats = await getPlatformStats();

  const cards: {
    label: string;
    value: number;
    href?: string;
    highlight?: boolean;
  }[] = [
    {
      label: "대기 중 신청",
      value: stats.pendingApplications,
      href: "/admin/applications",
      highlight: stats.pendingApplications > 0,
    },
    { label: "전체 회사", value: stats.totalCompanies, href: "/admin/companies" },
    { label: "활성 회사", value: stats.activeCompanies, href: "/admin/companies" },
    { label: "전체 사용자", value: stats.totalUsers },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-foreground">운영 대시보드</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        Teamlet 플랫폼 전체 현황이에요.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => {
          const inner = (
            <div
              className={`rounded-lg border bg-background-primary p-5 ${
                c.highlight ? "border-amber-300" : "border-border"
              }`}
            >
              <p className="text-sm text-foreground-muted">{c.label}</p>
              <p
                className={`mt-2 text-3xl font-semibold ${
                  c.highlight ? "text-amber-700" : "text-foreground"
                }`}
              >
                {c.value}
              </p>
            </div>
          );
          return c.href ? (
            <Link key={c.label} href={c.href} className="block">
              {inner}
            </Link>
          ) : (
            <div key={c.label}>{inner}</div>
          );
        })}
      </div>

      {stats.pendingApplications > 0 && (
        <p className="mt-6 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
          검토 대기 중인 회사 신청이 {stats.pendingApplications}건 있어요.{" "}
          <Link href="/admin/applications" className="underline">
            지금 검토하기
          </Link>
        </p>
      )}
    </div>
  );
}
