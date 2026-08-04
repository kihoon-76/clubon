import { Container } from "@/components/layout/container";

/** 관리자 화면 공용 페이지 헤더. */
export function AdminPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Container className="py-10">
      <h1 className="font-display text-3xl text-ivory">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        {description}
      </p>
      <div className="mt-8">{children}</div>
    </Container>
  );
}

/** 가로 스크롤이 표 안에서만 일어나도록 감싸는 테이블 셸. */
export function DataTable({
  headers,
  empty,
  children,
}: {
  headers: string[];
  empty?: string;
  children: React.ReactNode;
}) {
  const hasRows = Array.isArray(children) ? children.length > 0 : !!children;

  if (!hasRows) {
    return (
      <p className="rounded-[var(--radius-card)] border border-line bg-surface-raised px-6 py-10 text-center text-sm text-muted">
        {empty ?? "표시할 항목이 없습니다."}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface-raised">
      <table className="w-full min-w-[44rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line">
            {headers.map((h) => (
              <th
                key={h}
                scope="col"
                className="px-4 py-3 text-left text-[0.6875rem] uppercase tracking-[0.14em] text-champagne/80"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`border-b border-line/60 px-4 py-3 align-top ${className ?? ""}`}>
      {children}
    </td>
  );
}

export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface-raised p-5">
      <p className="text-[0.6875rem] uppercase tracking-[0.14em] text-champagne/80">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl text-ivory">{value}</p>
      {hint ? <p className="mt-1 text-xs text-faint">{hint}</p> : null}
    </div>
  );
}
