import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/platform-admin";

/**
 * 플랫폼 운영 콘솔 레이아웃. `requirePlatformAdmin` 가드 —
 * 비관리자는 진입 시 redirect. 회사 앱 `(app)` 레이아웃과 분리.
 */
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requirePlatformAdmin();

  return (
    <div className="min-h-screen bg-background-secondary">
      <header className="border-b border-border bg-background-primary">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="text-sm font-semibold text-foreground"
            >
              Teamlet 운영 콘솔
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link
                href="/admin/applications"
                className="text-foreground-muted hover:text-foreground"
              >
                회사 신청
              </Link>
              <Link
                href="/admin/companies"
                className="text-foreground-muted hover:text-foreground"
              >
                회사 목록
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground-muted">{admin.name}</span>
            <Link
              href="/home"
              className="text-sm text-foreground-subtle hover:text-foreground"
            >
              앱으로 →
            </Link>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
