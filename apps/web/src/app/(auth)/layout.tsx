import { auth, signOut } from "@/auth";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12">
      {/* 로그인 상태일 때만 우상단 로그아웃 버튼 표시 */}
      {isLoggedIn && (
        <div className="absolute right-6 top-4">
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-foreground-subtle hover:bg-background-secondary hover:text-foreground transition-colors"
            >
              <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5">
                <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h8a.75.75 0 0 1 0 1.5h-8A.75.75 0 0 1 2 4.75ZM2 8a.75.75 0 0 1 .75-.75h8a.75.75 0 0 1 0 1.5h-8A.75.75 0 0 1 2 8Zm6.78 3.97a.75.75 0 0 1 0 1.06l-1.5 1.5a.75.75 0 1 1-1.06-1.06l.97-.97H2.75a.75.75 0 0 1 0-1.5h4.44l-.97-.97a.75.75 0 1 1 1.06-1.06l1.5 1.5Z" clipRule="evenodd" />
              </svg>
              로그아웃
            </button>
          </form>
        </div>
      )}

      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <span className="text-2xl font-semibold tracking-tight text-foreground">Teamlet</span>
          <p className="mt-1 text-sm text-foreground-muted">팀을 위한 HR 플랫폼</p>
        </div>
        <div className="rounded-xl border border-border bg-background-primary p-6">
          {children}
        </div>
      </div>
    </main>
  );
}
