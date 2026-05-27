import Link from "next/link";
import { Megaphone, ThumbsUp, Pin } from "lucide-react";
import type { AnnouncementItem } from "@teamlet/modules/announcement";
import { CreateAnnouncementButton } from "@/components/announcement/create-announcement-button";
import { AnnouncementActions } from "@/components/announcement/announcement-actions";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

const SUB_TABS = [
  { id: "notice", label: "공지사항" },
  { id: "recognition", label: "인정" },
] as const;

function EmptyState({ icon: Icon, title, desc }: { icon: typeof Megaphone; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background-secondary">
        <Icon className="h-5 w-5 text-foreground-subtle" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-xs text-foreground-muted">{desc}</p>
      </div>
    </div>
  );
}

function AnnouncementList({ items, currentEmployeeId }: { items: AnnouncementItem[]; currentEmployeeId?: string }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Megaphone}
        title="등록된 공지사항이 없어요"
        desc="회사 공지사항을 작성하면 전 구성원에게 전달됩니다."
      />
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-3 py-4">
          {item.isPinned && (
            <Pin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground-subtle" />
          )}
          {!item.isPinned && <span className="w-3.5 shrink-0" />}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-foreground-muted whitespace-pre-wrap">
              {item.content}
            </p>
            <p className="mt-1.5 text-xs text-foreground-subtle">
              {item.authorName} · {formatDate(item.createdAt)}
            </p>
          </div>
          {currentEmployeeId === item.authorId && (
            <AnnouncementActions
              id={item.id}
              title={item.title}
              content={item.content}
              isPinned={item.isPinned}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

export function NewsTab({
  subTab = "notice",
  announcements,
  currentEmployeeId,
}: {
  subTab?: string;
  announcements: AnnouncementItem[];
  currentEmployeeId?: string;
}) {
  return (
    <div>
      {/* 서브탭 */}
      <div className="flex gap-1 border-b border-border mb-6">
        {SUB_TABS.map((t) => (
          <Link
            key={t.id}
            href={`/home?tab=news&view=${t.id}`}
            className={`px-4 py-2 text-sm transition-colors border-b-2 -mb-px ${
              subTab === t.id
                ? "border-foreground text-foreground font-medium"
                : "border-transparent text-foreground-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {subTab === "notice" && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs text-foreground-subtle">
              {announcements.length > 0 ? `총 ${announcements.length}건` : ""}
            </p>
            <CreateAnnouncementButton />
          </div>
          <AnnouncementList items={announcements} currentEmployeeId={currentEmployeeId} />
        </div>
      )}

      {subTab === "recognition" && (
        <EmptyState
          icon={ThumbsUp}
          title="아직 인정이 없어요"
          desc="동료의 멋진 점을 인정해 주세요. 조직 문화가 좋아져요."
        />
      )}
    </div>
  );
}
