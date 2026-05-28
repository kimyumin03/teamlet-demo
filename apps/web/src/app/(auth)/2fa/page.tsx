import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthLogo } from "@/components/auth/auth-logo";
import { TwoFaForm } from "./_components/two-fa-form";

export default async function TwoFaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.mfaPending) redirect("/home");

  return (
    <div className="flex flex-col gap-6">
      <AuthLogo />

      <div>
        <h2 className="text-[22px] font-bold leading-tight tracking-tight">2단계 인증</h2>
        <p className="mt-1.5 text-[13.5px] text-foreground-muted">
          인증 앱(Authy, Google Authenticator)에서 표시되는{" "}
          <strong className="font-semibold text-foreground">6자리 코드</strong>를 입력해주세요.
        </p>
      </div>

      <TwoFaForm />
    </div>
  );
}
