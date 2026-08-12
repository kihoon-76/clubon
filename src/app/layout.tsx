import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

import { PresenceHeartbeat } from "@/components/presence/presence-heartbeat";
import { LocaleProvider } from "@/lib/i18n/client";
import { getLocale, getT } from "@/lib/i18n/server";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-kr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

/**
 * 공유 링크(카카오톡·슬랙·X 등)에 쓰이는 절대 URL의 기준점.
 *
 * 카카오톡을 비롯한 크롤러는 og:image를 절대 URL로만 받습니다. 배포 환경에
 * 따라 도메인이 달라지므로 환경 변수에서 순서대로 찾고, 없으면 로컬로 둡니다.
 */
function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  // 프로덕션 별칭(미리보기 배포에서도 대표 도메인을 가리킵니다)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/**
 * 공유 카드와 검색 결과도 읽는 사람의 언어로 나갑니다.
 *
 * 링크를 붙여 넣는 사람과 그 링크를 보는 사람이 늘 같은 언어를 쓰지는
 * 않지만, 적어도 붙여 넣은 사람이 읽은 문장이 그대로 실립니다.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  const title = t("site.title");
  const description = t("site.description");

  return {
    metadataBase: new URL(siteUrl()),
    title: { default: title, template: "%s · ClubOn" },
    description,
    applicationName: "ClubOn",
    openGraph: {
      type: "website",
      siteName: "ClubOn",
      title,
      description,
      url: "/",
      locale: t("site.ogLocale"),
      images: [
        {
          // 1200×630 — 카카오톡 큰 썸네일과 대부분의 SNS가 쓰는 표준 비율.
          url: "/og.png",
          width: 1200,
          height: 630,
          alt: t("site.ogAlt"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"],
    },
    ...STATIC_METADATA,
  };
}

const STATIC_METADATA = {
  // iOS는 매니페스트의 display를 읽지 않아, 홈 화면에서 전체 화면으로 열리려면
  // 이 메타가 필요합니다.
  appleWebApp: {
    capable: true,
    title: "ClubOn",
    // black-translucent은 상태바가 콘텐츠 위를 덮어 헤더가 가려집니다.
    // 어두운 앱이라 black으로 두면 자리를 확보하면서 이질감도 없습니다.
    statusBarStyle: "black",
  },
  formatDetection: { telephone: false },
} satisfies Metadata;

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  colorScheme: "dark",
  // 모바일 웹앱 기준. 확대는 접근성을 위해 막지 않습니다.
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // `lang`은 스크린리더의 발음과 브라우저 번역 제안을 좌우하므로, 고른 언어를
  // 여기에 그대로 실어야 합니다.
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${cormorant.variable} ${notoSansKr.variable} h-full`}
    >
      <body className="min-h-full antialiased">
        <LocaleProvider locale={locale}>
          <PresenceHeartbeat />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
