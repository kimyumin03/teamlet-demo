import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignupForm } from "@/components/forms/signup-form";
import { AuthLogo } from "@/components/auth/auth-logo";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;
  if (session?.user) redirect(callbackUrl ?? "/home");

  return (
    <div className="flex flex-col gap-6">
      <AuthLogo />

      <div>
        <h2 className="text-[22px] font-bold leading-tight tracking-tight">계정 만들기</h2>
        <p className="mt-1.5 text-[13.5px] text-foreground-muted">
          5초면 시작할 수 있어요. 회사는 다음 단계에서 선택합니다.
        </p>
      </div>

      <SignupForm callbackUrl={callbackUrl} />
    </div>
  );
}
