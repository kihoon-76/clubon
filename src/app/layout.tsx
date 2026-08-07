import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

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

const TITLE = "ClubOn — 어디에 있든, 프라이빗 소셜 클럽";
const DESCRIPTION =
  "프로필을 넘기는 대신 대화로 만나는 성인 전용 온라인 소셜 클럽. 그룹으로 입장하고, 마스크를 쓴 채 이야기하고, 양쪽 라운지의 방장이 모두 수락할 때만 얼굴을 공개합니다.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: TITLE, template: "%s · ClubOn" },
  description: DESCRIPTION,
  applicationName: "ClubOn",
  openGraph: {
    type: "website",
    siteName: "ClubOn",
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    locale: "ko_KR",
    images: [
      {
        // 1200×630 — 카카오톡 큰 썸네일과 대부분의 SNS가 쓰는 표준 비율.
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "ClubOn — 오늘 밤, 클럽을 켜세요",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  colorScheme: "dark",
  // 모바일 웹앱 기준. 확대는 접근성을 위해 막지 않습니다.
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      className={`${cormorant.variable} ${notoSansKr.variable} h-full`}
    >
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
