import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthCard, AuthTitle } from "@/components/teamlet/auth-card";
import { TwoFaForm } from "./_components/two-fa-form";

export default async function TwoFaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.mfaPending) redirect("/home");

  return (
    <AuthCard>
      <AuthTitle
        title="2단계 인증"
        sub={<>인증 앱에서 표시되는 <strong className="font-semibold text-[var(--fg)]">6자리 코드</strong>를 입력해주세요.</>}
      />
      <TwoFaForm />
    </AuthCard>
  );
}
