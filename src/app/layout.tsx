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

export const metadata: Metadata = {
  title: {
    default: "ClubOn — 어디에 있든, 프라이빗 소셜 클럽",
    template: "%s · ClubOn",
  },
  description:
    "프로필을 넘기는 대신 대화로 만나는 성인 전용 온라인 소셜 클럽. 그룹으로 입장하고, 마스크를 쓴 채 이야기하고, 양쪽 라운지의 방장이 모두 수락할 때만 얼굴을 공개합니다.",
  applicationName: "ClubOn",
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  colorScheme: "dark",
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
