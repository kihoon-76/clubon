import { savePublicLounge } from "../actions";
import { Container } from "@/components/layout/container";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/field";
import { getDb } from "@/lib/db";
import { requireOnboardedSession } from "@/lib/session";

export default async function NewLoungePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const { user, profile } = await requireOnboardedSession("/entry/new");
  const existing = await getDb().getActiveTableForUser(user.id);
  const defaultGender = existing?.loungeGender ?? (profile?.gender === "female" ? "female" : "male");
  return (
    <Container className="py-12 sm:py-16">
      <p className="label-caps">OPEN A LOUNGE</p>
      <h1 className="mt-3 font-display text-4xl text-ivory">내 라운지 정보</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">이 정보가 대기 목록의 방 카드에 그대로 표시됩니다.</p>
      {sp.required === "1" ? <p className="mt-6 rounded-[var(--radius-control)] border border-warn/40 bg-warn-dim/40 px-4 py-3 text-sm text-ivory">다른 방에 합석을 요청하려면 내 라운지를 먼저 만들어 주세요.</p> : null}
      {sp.error === "invalid" ? <p className="mt-6 text-sm text-danger">모든 항목을 확인해 주세요. 소개는 5자 이상이어야 합니다.</p> : null}
      <Card hairline className="mt-8 max-w-2xl"><CardBody>
        <form action={savePublicLounge} className="space-y-5">
          <Field label="방 이름"><Input name="name" required minLength={2} maxLength={40} defaultValue={existing?.name ?? `${profile?.nickname ?? "회원"}의 라운지`} /></Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="라운지 성별"><Select name="loungeGender" required defaultValue={defaultGender}><option value="male">남성 라운지</option><option value="female">여성 라운지</option></Select></Field>
            <Field label="방 정원"><Select name="maxSize" required defaultValue={String(existing?.maxSize ?? 4)}>{[2,3,4,5,6].map((n) => <option key={n} value={n}>{n}명</option>)}</Select></Field>
          </div>
          <Field label="지역 (글로 입력)"><Input name="regionText" required minLength={2} maxLength={40} placeholder="예: 서울 성수, 부산 해운대, New York" defaultValue={existing?.regionText ?? profile?.region ?? ""} /></Field>
          <Field label="방 소개"><Textarea name="description" required minLength={5} maxLength={300} rows={5} placeholder="어떤 분위기의 사람들과 무슨 이야기를 하고 싶은지 적어 주세요." defaultValue={existing?.description ?? ""} /></Field>
          <div className="flex flex-wrap gap-3"><Button type="submit">{existing ? "라운지 정보 수정" : "라운지 개설"}</Button><ButtonLink href="/entry" variant="secondary">취소</ButtonLink></div>
        </form>
      </CardBody></Card>
    </Container>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm text-muted">{label}</span>{children}</label>;
}
