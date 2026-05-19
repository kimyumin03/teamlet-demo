/**
 * 로그인 전 레이아웃 (docs/06 Phase 1, docs/05 §0).
 * 절제된 미니멀 — 중앙 카드 + 워드마크. Flex 카피 금지.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <span className="text-2xl font-semibold tracking-tight text-foreground">
            Teamlet
          </span>
          <p className="mt-1 text-sm text-foreground-muted">
            팀을 위한 HR 플랫폼
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background-primary p-6">
          {children}
        </div>
      </div>
    </main>
  );
}
