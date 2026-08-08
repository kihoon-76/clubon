import type { MetadataRoute } from "next";

/**
 * 웹 앱 매니페스트. 홈 화면에 설치했을 때의 이름·아이콘·표시 방식을 정합니다.
 *
 * 설치 조건은 유효한 매니페스트와 HTTPS 두 가지이며, 조건을 만족하면 브라우저가
 * 알아서 설치를 안내합니다. `beforeinstallprompt`로 직접 버튼을 만드는 방식은
 * iOS Safari에서 동작하지 않아 쓰지 않았습니다(iOS 안내는 별도 컴포넌트).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "ClubOn — 어디에 있든, 프라이빗 소셜 클럽",
    short_name: "ClubOn",
    description:
      "프로필을 넘기는 대신 대화로 만나는 성인 전용 온라인 소셜 클럽. 마스크를 쓴 채 이야기하고, 양쪽 라운지의 방장이 모두 수락할 때만 얼굴을 공개합니다.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // 스플래시와 상단바가 앱 화면과 이어지도록 클럽 배경색을 씁니다.
    background_color: "#0b0b0c",
    theme_color: "#0b0b0c",
    lang: "ko",
    dir: "ltr",
    categories: ["social", "lifestyle"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // 기기가 원형·둥근사각으로 잘라내는 자리. 여백을 넉넉히 둔 별도 이미지입니다.
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
