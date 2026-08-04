import { updateReportStatus } from "@/app/admin/actions";
import { AdminPage, DataTable, Td } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDb } from "@/lib/db";
import { listReports } from "@/lib/runtime/store";
import type { Report } from "@/lib/runtime/types";

export const metadata = { title: "신고 검토" };

const STATUS_TONE: Record<Report["status"], "warn" | "gold" | "success" | "neutral"> = {
  open: "warn",
  reviewing: "gold",
  resolved: "success",
  dismissed: "neutral",
};

const STATUS_LABEL: Record<Report["status"], string> = {
  open: "접수",
  reviewing: "검토 중",
  resolved: "조치 완료",
  dismissed: "기각",
};

export default async function AdminReportsPage() {
  const reports = listReports();
  const db = getDb();
  const users = await db.listUsers(500);
  const nameOf = new Map<string, string>();
  for (const u of users) nameOf.set(u.id, u.email);

  return (
    <AdminPage
      title="신고 검토"
      description="접수된 신고를 검토하고 처리 상태를 기록합니다. 신고에 연결된 대화는 검토 종료까지 보존됩니다."
    >
      <DataTable
        headers={["접수 시각", "신고자", "대상", "사유", "상태", "처리"]}
        empty="접수된 신고가 없습니다."
      >
        {reports.map((r) => (
          <tr key={r.id}>
            <Td className="whitespace-nowrap text-muted">
              {new Date(r.createdAt).toLocaleString("ko-KR")}
            </Td>
            <Td className="text-muted">{nameOf.get(r.reporterId) ?? r.reporterId.slice(0, 8)}</Td>
            <Td className="text-ivory">
              {nameOf.get(r.reportedUserId) ?? r.reportedUserId.slice(0, 8)}
            </Td>
            <Td>
              <span className="text-ivory">{r.category}</span>
              {r.description ? (
                <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted">
                  {r.description}
                </p>
              ) : null}
            </Td>
            <Td>
              <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
            </Td>
            <Td>
              <div className="flex flex-wrap gap-2">
                {(["reviewing", "resolved", "dismissed"] as const)
                  .filter((s) => s !== r.status)
                  .map((s) => (
                    <form key={s} action={updateReportStatus.bind(null, r.id, s)}>
                      <Button type="submit" variant="secondary" size="sm">
                        {STATUS_LABEL[s]}
                      </Button>
                    </form>
                  ))}
              </div>
            </Td>
          </tr>
        ))}
      </DataTable>
    </AdminPage>
  );
}
