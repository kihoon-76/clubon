import type { NextConfig } from "next";

/**
 * 리버스 프록시(코드스페이스 포워딩, 미리보기 도메인 등) 뒤에서 접속할 때
 * Server Actions는 origin과 host가 일치해야 실행됩니다. 프록시 도메인으로
 * 접속하면 두 값이 달라 액션이 거부되므로, 신뢰할 도메인을 명시합니다.
 *
 * `PREVIEW_ORIGINS`에 쉼표로 구분해 추가 도메인을 넣을 수 있습니다.
 */
function proxyOrigins(): string[] {
  const origins = new Set<string>();

  // GitHub Codespaces 포워딩 도메인 (예: xxx-3000.app.github.dev)
  const codespace = process.env.CODESPACE_NAME;
  const domain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;
  if (codespace && domain) {
    origins.add(`${codespace}-3000.${domain}`);
    origins.add(`*.${domain}`);
  }

  for (const raw of (process.env.PREVIEW_ORIGINS ?? "").split(",")) {
    const value = raw.trim();
    if (value) origins.add(value);
  }

  // 개발 중에는 프록시가 origin을 localhost로 남기는 경우가 있어 함께 허용합니다.
  // 프로덕션에서는 CSRF 보호를 약화시키므로 추가하지 않습니다.
  if (process.env.NODE_ENV !== "production") {
    origins.add("localhost:3000");
    origins.add("127.0.0.1:3000");
  }

  return [...origins];
}

const nextConfig: NextConfig = {
  // 개발 오버레이 인디케이터는 시각 검증(스크린샷)을 가리므로 비활성화합니다.
  devIndicators: false,

  // 개발 서버의 dev 전용 에셋·엔드포인트에 대한 교차 출처 요청 허용.
  allowedDevOrigins: proxyOrigins(),

  experimental: {
    serverActions: {
      // 프록시를 거친 Server Action 요청의 origin 허용 목록.
      allowedOrigins: proxyOrigins(),
    },
  },
};

export default nextConfig;
