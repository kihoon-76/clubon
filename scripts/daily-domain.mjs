/**
 * Daily 도메인 설정 점검·적용.
 *
 *   node scripts/daily-domain.mjs           # 현재 설정과 차이만 출력 (기본: 미적용)
 *   node scripts/daily-domain.mjs --apply   # 차이나는 항목만 실제로 반영
 *
 * 도메인 설정은 계정 전체에 걸리는 기본값입니다. 방·토큰에서 덮어쓸 수 있는
 * 항목도 있지만, 여기서 맞춰두면 새 방을 만들 때마다 지정하지 않아도 됩니다.
 *
 * 참고: https://docs.daily.co/reference/rest-api/domain
 */

import { readFileSync } from "node:fs";

const API = "https://api.daily.co/v1/";

/** Club On에 필요한 도메인 기본값. 여기 없는 항목은 건드리지 않습니다. */
const DESIRED = {
  // 서비스 이용자가 한국에 있으므로 서울 리전을 씁니다.
  geo: "ap-northeast-2",

  // 대기실 없이 바로 입장합니다. 입장 자격은 앱이 미팅 토큰으로 이미 통제합니다.
  enable_prejoin_ui: false,

  // 참가자 명단·채팅·리액션은 앱 UI가 담당합니다. Daily 쪽 UI를 함께 띄우면
  // 마스크 상태의 신원 노출 규칙이 두 곳으로 갈라집니다.
  enable_people_ui: false,
  enable_advanced_chat: false,
  enable_emoji_reactions: false,
  enable_hand_raising: false,
  enable_breakout_rooms: false,
  enable_pip_ui: false,
  enable_network_ui: false,

  // 배경 흐리기는 얼굴 공개 뒤 생활공간 노출을 줄여 주므로 남겨 둡니다.
  enable_video_processing_ui: true,
  enable_noise_cancellation_ui: true,

  // 같은 회원이 두 자리를 차지하지 못하게 합니다(토큰의 user_id 기준).
  enforce_unique_user_ids: true,

  // 대화 내용을 Daily 쪽에 남기지 않습니다.
  enable_transcription_storage: false,
};

/** .env.local에서 키를 읽어 옵니다(플레인 node라 Next의 로딩을 못 씁니다). */
function apiKey() {
  if (process.env.DAILY_API_KEY) return process.env.DAILY_API_KEY;
  try {
    const line = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
      .split("\n")
      .find((l) => l.startsWith("DAILY_API_KEY="));
    const value = line?.slice("DAILY_API_KEY=".length).trim().replace(/^["']|["']$/g, "");
    if (value) return value;
  } catch {
    // .env.local이 없을 수 있습니다.
  }
  console.error("DAILY_API_KEY가 없습니다. .env.local에 넣거나 환경 변수로 주세요.");
  console.error("발급: https://dashboard.daily.co → Developers → API key");
  process.exit(1);
}

async function call(method, body) {
  const res = await fetch(API, {
    method,
    headers: {
      authorization: `Bearer ${apiKey()}`,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    console.error(`요청 실패 ${res.status}:`, JSON.stringify(data));
    process.exit(1);
  }
  return data;
}

const apply = process.argv.includes("--apply");

const current = await call("GET");
console.log(`도메인: ${current.domain_name}\n`);

const diff = Object.entries(DESIRED).filter(
  ([key, want]) => JSON.stringify(current.config?.[key]) !== JSON.stringify(want),
);

if (diff.length === 0) {
  console.log("✅ 모든 항목이 이미 원하는 값입니다.");
  process.exit(0);
}

console.log(`변경 필요 ${diff.length}건:\n`);
for (const [key, want] of diff) {
  const now = current.config?.[key];
  console.log(`  ${key.padEnd(34)} ${JSON.stringify(now) ?? "(미설정)"} → ${JSON.stringify(want)}`);
}

if (!apply) {
  console.log("\n적용하려면: node scripts/daily-domain.mjs --apply");
  process.exit(0);
}

const updated = await call("POST", { properties: Object.fromEntries(diff) });
console.log("\n✅ 적용했습니다. 반영된 설정:");
console.log(JSON.stringify(updated.config, null, 2));
