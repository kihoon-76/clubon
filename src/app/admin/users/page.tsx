import { setUserStatus } from "@/app/admin/actions";
import { AdminPage, DataTable, Td } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDb } from "@/lib/db";
import type { AccountStatus } from "@/lib/db/types";
import { requireStaffSession } from "@/lib/session";

export const metadata = { title: "회원 관리" };

const STATUS_LABEL: Record<AccountStatus, string> = {
  active: "정상",
  suspended: "정지",
  banned: "영구 제한",
};

const STATUS_TONE: Record<AccountStatus, "success" | "warn" | "danger"> = {
  active: "success",
  suspended: "warn",
  banned: "danger",
};

export default async function AdminUsersPage() {
  const { user: staff } = await requireStaffSession();
  const db = getDb();
  const users = await db.listUsers(200);

  const profiles = await Promise.all(users.map((u) => db.getProfile(u.id)));
  const nicknameOf = new Map(
    users.map((u, i) => [u.id, profiles[i]?.nickname ?? "—"]),
  );

  return (
    <AdminPage
      title="회원 관리"
      description="계정 상태를 변경합니다. 영구 제한은 관리자만 지정할 수 있으며, 본인 계정은 변경할 수 없습니다."
    >
      <DataTable
        headers={["가입", "이메일", "닉네임", "역할", "상태", "조치"]}
        empty="회원이 없습니다."
      >
        {users.map((u) => {
          const options = (["active", "suspended", "banned"] as const).filter(
            (s) => s !== u.status && (s !== "banned" || staff.role === "admin"),
          );
          const isSelf = u.id === staff.id;

          return (
            <tr key={u.id}>
              <Td className="whitespace-nowrap text-muted">
                {new Date(u.createdAt).toLocaleDateString("ko-KR")}
              </Td>
              <Td className="text-ivory">{u.email}</Td>
              <Td className="text-muted">{nicknameOf.get(u.id)}</Td>
              <Td className="text-muted">{u.role}</Td>
              <Td>
                <Badge tone={STATUS_TONE[u.status]}>{STATUS_LABEL[u.status]}</Badge>
              </Td>
              <Td>
                {isSelf ? (
                  <span className="text-xs text-faint">본인 계정</span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {options.map((s) => (
                      <form key={s} action={setUserStatus.bind(null, u.id, s)}>
                        <Button
                          type="submit"
                          size="sm"
                          variant={s === "banned" ? "danger" : "secondary"}
                        >
                          {STATUS_LABEL[s]}으로
                        </Button>
                      </form>
                    ))}
                  </div>
                )}
              </Td>
            </tr>
          );
        })}
      </DataTable>
    </AdminPage>
  );
}
