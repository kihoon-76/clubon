import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { getLocale, getT } from "@/lib/i18n/server";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";

export type LegalSection = {
  heading: string;
  paragraphs: string[];
};

/**
 * 약관·개인정보 처리방침.
 *
 * 본문은 **한국어 원문 그대로**입니다. 회원이 법적으로 동의하는 문장이라
 * 기계 번역으로 대체할 수 없고, 번역본은 법률 검토를 거친 뒤에야 올릴 수
 * 있습니다. 그때까지 한국어를 못 읽는 회원에게는 상황을 먼저 알립니다 —
 * 읽을 수 없는 문서를 아무 설명 없이 내미는 것보다 낫습니다.
 */
export async function LegalPage({
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
  const [t, locale] = await Promise.all([getT(), getLocale()]);

  return (
    <Container className="max-w-3xl py-20 sm:py-24">
      <p className="label-caps">{eyebrow}</p>
      <h1 className="mt-4 font-display text-4xl leading-tight text-ivory sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 text-sm text-faint">
        {t("legal.updatedAt", { date: updatedAt })}
      </p>

      {locale === DEFAULT_LOCALE ? null : (
        <p className="mt-6 rounded-[var(--radius-control)] border border-line bg-surface px-4 py-3 text-sm leading-relaxed break-keep text-muted">
          {t("safety.legalKoreanOnly")}
        </p>
      )}

      {draftNotice ? (
        <div className="mt-8 rounded-[var(--radius-card)] border border-warn/40 bg-warn-dim/60 p-5">
          <Badge tone="warn">{t("legal.draft")}</Badge>
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
