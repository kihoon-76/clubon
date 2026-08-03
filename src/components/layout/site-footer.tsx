import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Wordmark } from "@/components/brand/wordmark";

const GROUPS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "클럽",
    links: [
      { href: "/#how", label: "이용 방식" },
      { href: "/membership", label: "멤버십" },
      { href: "/signup", label: "입장 신청" },
    ],
  },
  {
    title: "안전과 신뢰",
    links: [
      { href: "/safety", label: "안전 센터" },
      { href: "/safety#reveal", label: "얼굴 공개 정책" },
      { href: "/safety#recording", label: "촬영·녹화 금지 정책" },
    ],
  },
  {
    title: "약관",
    links: [
      { href: "/terms", label: "이용약관" },
      { href: "/privacy", label: "개인정보처리방침" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line/70 bg-surface/60">
      <Container className="py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:pr-8">
            <Wordmark />
            <p className="mt-4 text-sm leading-relaxed text-muted">
              성인 전용 온라인 소셜 클럽. 술 없이, 이동 없이, 대화로 만나는
              그룹 기반 만남.
            </p>
          </div>

          {GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="label-caps">{group.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted transition-colors hover:text-ivory"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 space-y-3 border-t border-line/70 pt-8 text-xs leading-relaxed text-faint">
          <p>
            만 19세 이상 성인만 이용할 수 있습니다. 본 서비스는 데이팅 매칭이나
            성인 오락 서비스가 아니며, 그룹 대화를 위한 소셜 클럽입니다.
          </p>
          <p>
            다른 참가자의 영상, 음성, 개인정보를 캡처·녹화·촬영하거나 공유하는
            행위는 금지됩니다. 위반 시 영구 이용정지 및 관련 법률에 따른 법적
            책임이 따를 수 있습니다.
          </p>
          <p>© {new Date().getFullYear()} ClubOn</p>
        </div>
      </Container>
    </footer>
  );
}
