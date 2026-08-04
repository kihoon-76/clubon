import { AdminPage, DataTable, Td } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { getDb } from "@/lib/db";
import { getParticipants, listFeedback, listSessions } from "@/lib/runtime/store";

export const metadata = { title: "세션" };

export default async function AdminSessionsPage() {
  const sessions = listSessions();
  const feedback = listFeedback(500);
  const db = getDb();
  const tables = await db.listTables(500);
  const tableName = new Map(tables.map((t) => [t.id, t.name]));

  return (
    <AdminPage
      title="세션"
      description="합석 세션의 상태와 참가 인원입니다. 화상·음성 원본은 저장하지 않으며, 상태 메타데이터만 남습니다."
    >
      <DataTable
        headers={["시작", "라운지", "상태", "참가자", "평균 평가", "종료"]}
        empty="아직 열린 세션이 없습니다."
      >
        {sessions.map((s) => {
          const participants = getParticipants(s.id);
          const scores = feedback
            .filter((f) => f.sessionId === s.id)
            .map((f) => f.rating);
          const avg =
            scores.length > 0
              ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
              : "—";

          return (
            <tr key={s.id}>
              <Td className="whitespace-nowrap text-muted">
                {new Date(s.startedAt).toLocaleString("ko-KR")}
              </Td>
              <Td className="text-ivory">
                {tableName.get(s.tableAId) ?? s.tableAId.slice(0, 8)}
                <span className="text-faint"> ↔ </span>
                {tableName.get(s.tableBId) ?? s.tableBId.slice(0, 8)}
              </Td>
              <Td>
                <Badge
                  tone={
                    s.state === "live"
                      ? "success"
                      : s.state === "ended"
                        ? "neutral"
                        : "warn"
                  }
                >
                  {s.state}
                </Badge>
              </Td>
              <Td className="text-muted">
                {participants.filter((p) => !p.leftAt).length}/
                {participants.length}명
              </Td>
              <Td className="text-ivory">{avg}</Td>
              <Td className="whitespace-nowrap text-muted">
                {s.endedAt ? new Date(s.endedAt).toLocaleString("ko-KR") : "—"}
              </Td>
            </tr>
          );
        })}
      </DataTable>
    </AdminPage>
  );
}
