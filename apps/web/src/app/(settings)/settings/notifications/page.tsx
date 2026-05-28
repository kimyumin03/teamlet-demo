import { redirect } from "next/navigation";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

const NOTIF_ROWS = [
  { label: "결재 요청 도착", desc: "결재할 문서가 도착했을 때", inapp: true, email: true, slack: true, push: true },
  { label: "결재 결과 (승인/반려)", desc: "내가 요청한 문서의 결재 결과", inapp: true, email: true, slack: false, push: true },
  { label: "휴가 요청 알림", desc: "팀원의 휴가 신청이 들어왔을 때", inapp: true, email: true, slack: true, push: false },
  { label: "공지사항", desc: "회사 공지 / 필독 게시물", inapp: true, email: false, slack: true, push: false },
  { label: "@ 멘션", desc: "댓글·문서에서 내가 멘션되었을 때", inapp: true, email: false, slack: true, push: true },
  { label: "생일 · 입사일 알림", desc: "동료의 생일 · 입사 기념일", inapp: false, email: false, slack: true, push: false },
  { label: "로그인 알림", desc: "새 기기에서 로그인했을 때", inapp: false, email: true, slack: false, push: true },
];

function Cbx({ checked }: { checked: boolean }) {
  return (
    <span className={`inline-grid place-items-center w-5 h-5 rounded-[5px] border-[1.5px] cursor-pointer select-none text-[11px] font-bold transition-colors ${
      checked
        ? "bg-[var(--primary)] border-[var(--primary)] text-[color:var(--primary-on)]"
        : "bg-[var(--bg-primary)] border-[var(--border-strong)] text-transparent"
    }`}>
      ✓
    </span>
  );
}

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <>
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.02em] leading-[1.2] mb-1.5 text-[var(--fg)]">알림</h1>
          <div className="text-[13px] text-[var(--fg-muted)]">알림 종류별로 받을 채널을 선택하세요</div>
        </div>
        <button className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[color:var(--primary-on)] text-[13px] font-semibold hover:bg-[var(--primary-hover)] transition-colors">
          저장
        </button>
      </div>

      {/* 알림 채널 테이블 */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[14px] px-6 py-5 mb-4 overflow-x-auto">
        <h3 className="text-[15px] font-bold mb-1.5">알림 채널</h3>
        <p className="text-[12.5px] text-[var(--fg-muted)] mb-5">각 알림 종류마다 어디로 받을지 선택하세요.</p>

        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left py-2.5 pr-6 text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-[0.04em]">알림 종류</th>
              {["앱 내", "이메일", "Slack", "모바일 푸시"].map((ch) => (
                <th key={ch} className="text-center py-2.5 px-4 text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-[0.04em] whitespace-nowrap">{ch}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {NOTIF_ROWS.map((row, i) => (
              <tr key={i} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-secondary)] transition-colors">
                <td className="py-3.5 pr-6">
                  <div className="font-semibold text-[var(--fg)]">{row.label}</div>
                  <div className="text-[11.5px] text-[var(--fg-muted)] mt-0.5">{row.desc}</div>
                </td>
                {[row.inapp, row.email, row.slack, row.push].map((val, ci) => (
                  <td key={ci} className="text-center py-3.5 px-4">
                    <Cbx checked={val} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 방해 금지 시간 */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[14px] px-6 py-5 mb-4">
        <h3 className="text-[15px] font-bold mb-1.5">방해 금지 시간</h3>
        <p className="text-[12.5px] text-[var(--fg-muted)] mb-4">설정 시간 외에는 알림을 보류합니다 (긴급 결재 제외)</p>
        <div className="grid grid-cols-[200px_1fr] gap-6 items-center py-3 border-b border-[var(--border)]">
          <div className="text-[13px] font-semibold">
            근무 시간 외 알림
            <span className="block text-[11.5px] text-[var(--fg-muted)] font-normal mt-1">야간·주말 알림 차단</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="time" defaultValue="19:00"
              className="px-3 py-2 border border-[var(--border-strong)] rounded-lg bg-[var(--bg-primary)] text-[13px] focus:outline-none focus:border-[var(--primary)]"
            />
            <span className="text-[var(--fg-muted)]">~</span>
            <input
              type="time" defaultValue="09:00"
              className="px-3 py-2 border border-[var(--border-strong)] rounded-lg bg-[var(--bg-primary)] text-[13px] focus:outline-none focus:border-[var(--primary)]"
            />
            <button className="px-3 py-2 rounded-lg border border-[var(--border)] text-[12px] hover:bg-[var(--bg-secondary)] transition-colors">
              주말 포함
            </button>
          </div>
        </div>
      </div>

      {/* Slack 연동 */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[14px] px-6 py-5">
        <h3 className="text-[15px] font-bold mb-1.5">Slack 연동</h3>
        <p className="text-[12.5px] text-[var(--fg-muted)] mb-4">Slack 알림을 받으려면 워크스페이스를 연결하세요</p>
        <div className="flex items-center gap-3 py-3 border border-dashed border-[var(--border)] rounded-lg px-4">
          <div className="w-8 h-8 rounded bg-[#4A154B] grid place-items-center text-white font-bold text-[14px]">S</div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-[var(--fg)]">Slack 워크스페이스 연결</div>
            <div className="text-[11.5px] text-[var(--fg-muted)] mt-0.5">아직 연결된 워크스페이스가 없어요</div>
          </div>
          <button className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[12.5px] font-medium hover:bg-[var(--bg-secondary)] transition-colors opacity-50 cursor-not-allowed" disabled>
            연결하기 (준비 중)
          </button>
        </div>
      </div>
    </>
  );
}
