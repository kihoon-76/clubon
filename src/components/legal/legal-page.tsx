import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";

export type LegalSection = {
  heading: string;
  paragraphs: string[];
};

export function LegalPage({
  eyebrow,
  title,
  updatedAt,
  draftNotice,
  sections,
}: {
  eyebrow: string;
  title: string;
  updatedAt: string;
  draftNotice?: string;
  sections: LegalSection[];
}) {
  return (
    <Container className="max-w-3xl py-20 sm:py-24">
      <p className="label-caps">{eyebrow}</p>
      <h1 className="mt-4 font-display text-4xl leading-tight text-ivory sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 text-sm text-faint">최종 수정일 {updatedAt}</p>

      {draftNotice ? (
        <div className="mt-8 rounded-[var(--radius-card)] border border-warn/40 bg-warn-dim/60 p-5">
          <Badge tone="warn">초안</Badge>
          <p className="mt-3 text-sm leading-relaxed text-ivory/90">
            {draftNotice}
          </p>
        </div>
      ) : null}

      <div className="mt-12 space-y-10">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-2xl text-ivory">
              {section.heading}
            </h2>
            <div className="mt-4 space-y-3">
              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-[0.9375rem] leading-relaxed text-muted"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Container>
  );
}
