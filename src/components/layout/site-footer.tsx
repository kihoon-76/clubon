import Link from "next/link";
import { Container } from "@/components/layout/container";
import { LanguagePicker } from "@/components/layout/language-picker";
import { Wordmark } from "@/components/brand/wordmark";
import { getT } from "@/lib/i18n/server";

const GROUPS: { titleKey: string; links: { href: string; key: string }[] }[] = [
  {
    titleKey: "footer.groupClub",
    links: [
      { href: "/#how", key: "footer.howItWorks" },
      { href: "/membership", key: "nav.pricing" },
      { href: "/lobby", key: "entry.eyebrow" },
    ],
  },
  {
    titleKey: "footer.groupSafety",
    links: [
      { href: "/safety", key: "footer.safetyCenter" },
      { href: "/safety#recording", key: "footer.recordingPolicy" },
    ],
  },
  {
    titleKey: "footer.groupLegal",
    links: [
      { href: "/terms", key: "footer.terms" },
      { href: "/privacy", key: "footer.privacy" },
    ],
  },
];

export async function SiteFooter() {
  const t = await getT();

  return (
    <footer className="mt-24 border-t border-line/70 bg-surface/60">
      <Container className="py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:pr-8">
            <Wordmark />
            <p className="mt-4 text-sm leading-relaxed break-keep text-muted">
              {t("footer.blurb")}
            </p>
            {/* 헤더의 언어 선택은 좁은 화면에서 숨기므로, 어느 화면에서든
                닿을 수 있도록 푸터에도 둡니다. */}
            <div className="mt-6">
              <LanguagePicker />
            </div>
          </div>

          {GROUPS.map((group) => (
            <nav key={group.titleKey} aria-label={t(group.titleKey)}>
              <h2 className="label-caps">{t(group.titleKey)}</h2>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted transition-colors hover:text-ivory"
                    >
                      {t(link.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 space-y-3 border-t border-line/70 pt-8 text-xs leading-relaxed break-keep text-faint">
          <p>{t("footer.adultsOnly")}</p>
          <p>{t("footer.noRecording")}</p>
          <p>© {new Date().getFullYear()} ClubOn</p>
        </div>
      </Container>
    </footer>
  );
}
