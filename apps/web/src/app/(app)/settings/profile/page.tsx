import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserProfile } from "@teamlet/modules/auth";
import { getMfaStatus } from "@teamlet/modules/security";
import { ProfileForm } from "@/components/settings/profile-form";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { MfaSetupSection } from "@/components/settings/mfa-setup-section";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [result, mfaStatus] = await Promise.all([
    getUserProfile(session.user.id),
    getMfaStatus(session.user.id),
  ]);
  if (!result.ok) redirect("/home");

  const profile = result.data;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-foreground">개인 설정</h1>
        <p className="mt-0.5 text-sm text-foreground-muted">이름, 연락처, 비밀번호를 관리해요</p>
      </div>

      <div className="flex flex-col gap-8">
        <section className="rounded-xl border border-border bg-background-primary p-6">
          <h2 className="mb-4 text-sm font-medium text-foreground">프로필 정보</h2>
          <div className="mb-4 flex flex-col gap-0.5">
            <span className="text-xs text-foreground-subtle">이메일</span>
            <span className="text-sm text-foreground-muted">{profile.email}</span>
          </div>
          <ProfileForm name={profile.name} phone={profile.phone} />
        </section>

        <section className="rounded-xl border border-border bg-background-primary p-6">
          <h2 className="mb-4 text-sm font-medium text-foreground">비밀번호 변경</h2>
          <ChangePasswordForm hasPassword={profile.hasPassword} />
        </section>

        <MfaSetupSection initial={mfaStatus} />
      </div>
    </div>
  );
}
