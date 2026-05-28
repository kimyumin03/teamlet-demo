import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { getCertificate } from "@teamlet/modules/document";

export const dynamic = "force-dynamic";

const TYPE_LABEL = { EMPLOYMENT: "재직증명서", CAREER: "경력증명서" } as const;

export default async function CertificatePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.employeeId) redirect("/login");

  const result = await getCertificate(session.user.employeeId, id);
  if (!result.ok) notFound();
  const cert = result.data;

  const snap = cert.snapshotData;
  const hiredAt = snap.hiredAt ? new Date(snap.hiredAt as string).toLocaleDateString("ko-KR") : "-";
  const issuedAt = cert.createdAt.toLocaleDateString("ko-KR");

  return (
    <div className="min-h-screen bg-background-secondary px-4 py-10 print:bg-white print:p-0">
      <div className="mx-auto max-w-2xl rounded-[14px] border border-border bg-background-primary p-10 print:border-none print:shadow-none">
        {/* 인쇄 버튼 */}
        <div className="mb-8 flex justify-end print:hidden">
          <button
            onClick={() => window.print()}
            className="rounded-[8px] border border-border px-4 py-1.5 text-[13px] text-foreground hover:bg-background-secondary transition-colors"
          >
            인쇄하기
          </button>
        </div>

        {/* 증명서 본문 */}
        <div className="space-y-8 text-foreground">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-wide">{TYPE_LABEL[cert.type]}</h1>
          </div>

          <table className="w-full border-collapse text-[13px]">
            <tbody>
              <tr className="border border-border">
                <th className="w-1/3 bg-background-secondary px-4 py-3 text-left font-medium">성명</th>
                <td className="px-4 py-3">{String(snap.name ?? "-")}</td>
              </tr>
              <tr className="border border-border">
                <th className="bg-background-secondary px-4 py-3 text-left font-medium">소속 부서</th>
                <td className="px-4 py-3">{String(snap.departmentName ?? "-")}</td>
              </tr>
              <tr className="border border-border">
                <th className="bg-background-secondary px-4 py-3 text-left font-medium">직책</th>
                <td className="px-4 py-3">{String(snap.positionName ?? "-")}</td>
              </tr>
              <tr className="border border-border">
                <th className="bg-background-secondary px-4 py-3 text-left font-medium">입사일</th>
                <td className="px-4 py-3">{hiredAt}</td>
              </tr>
              <tr className="border border-border">
                <th className="bg-background-secondary px-4 py-3 text-left font-medium">재직 상태</th>
                <td className="px-4 py-3">{snap.isActive ? "재직중" : "퇴직"}</td>
              </tr>
              <tr className="border border-border">
                <th className="bg-background-secondary px-4 py-3 text-left font-medium">발급 목적</th>
                <td className="px-4 py-3">{cert.purpose}</td>
              </tr>
            </tbody>
          </table>

          <p className="text-center text-[13px] text-foreground-muted">위 사실을 증명합니다.</p>

          <div className="text-center">
            <p className="text-[13px] text-foreground-muted">{issuedAt}</p>
          </div>

          <div className="mt-6 border-t border-border pt-6 text-center">
            <p className="text-[13px] font-medium text-foreground">Teamlet</p>
          </div>
        </div>

        {/* 발급 정보 */}
        <div className="mt-8 rounded-[14px] bg-background-secondary px-4 py-3 font-mono text-[11px] text-foreground-subtle print:hidden">
          발급번호: {cert.issueNumber} · 발급자: {cert.issuerName} · {issuedAt}
        </div>
      </div>
    </div>
  );
}
