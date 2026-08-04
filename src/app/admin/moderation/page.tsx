import { AdminPage, DataTable, Td } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { getDb } from "@/lib/db";
import { listModerationEvents } from "@/lib/runtime/store";
import type { ModerationEvent } from "@/lib/runtime/types";

export const metadata = { title: "모더레이션 로그" };

const SEVERITY_TONE: Record<
  ModerationEvent["severity"],
  "neutral" | "warn" | "danger"
> = {
  low: "neutral",
  medium: "warn",
  high: "danger",
  critical: "danger",
};

const SOURCE_LABEL: Record<ModerationEvent["source"], string> = {
  rule: "규칙",
  ai: "AI",
  report: "신고",
  admin: "관리자",
};

export default async function AdminModerationPage() {
  const events = listModerationEvents();
  const users = await getDb().listUsers(500);
  const emailOf = new Map(users.map((u) => [u.id, u.email]));

  return (
    <AdminPage
      title="모더레이션 로그"
      description="자동 조치는 모두 이 로그에 남습니다. 자동 탐지는 완전하지 않으므로, 조치는 언제든 검토·번복할 수 있습니다."
    >
      <DataTable
        headers={["시각", "대상", "맥락", "분류", "심각도", "조치", "출처"]}
        empty="기록된 모더레이션 이벤트가 없습니다."
      >
        {events.map((e) => (
          <tr key={e.id}>
            <Td className="whitespace-nowrap text-muted">
              {new Date(e.createdAt).toLocaleString("ko-KR")}
            </Td>
            <Td className="text-ivory">
              {emailOf.get(e.subjectUserId) ?? e.subjectUserId.slice(0, 8)}
            </Td>
            <Td className="text-muted">{e.context}</Td>
            <Td>
              <span className="text-ivory">{e.category ?? "—"}</span>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted">
                {e.detail}
              </p>
            </Td>
            <Td>
              <Badge tone={SEVERITY_TONE[e.severity]}>{e.severity}</Badge>
            </Td>
            <Td className="text-ivory">{e.actionTaken}</Td>
            <Td className="text-muted">{SOURCE_LABEL[e.source]}</Td>
          </tr>
        ))}
      </DataTable>
    </AdminPage>
  );
}
