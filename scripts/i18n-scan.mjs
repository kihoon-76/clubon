#!/usr/bin/env node
/**
 * 영어로 요청했을 때 화면에 한국어가 남는지 훑습니다.
 *
 * 사전 키 대조(`i18n-check`)는 **사전 안**만 봅니다. 컴포넌트에 문장이 그대로
 * 박혀 있으면 사전은 100%인데 화면에는 한국어가 뜨는데, 그건 실제로 그려 보지
 * 않으면 드러나지 않습니다. 그래서 이 검사는 서버를 띄운 상태에서 돕니다.
 *
 *   npm run dev
 *   node scripts/i18n-scan.mjs [기준 URL]
 *
 * 스크립트 태그(RSC 페이로드)는 걷어냅니다 — 화면에 그려진 것과 같은 문자열이
 * 이스케이프된 채 한 번 더 들어 있어, 그대로 두면 같은 누락이 두 번 잡힙니다.
 */

const BASE = process.argv[2] ?? "http://localhost:3000";

/** 로그인 없이 볼 수 있는 화면 — 게이트 뒤 화면은 여기서 다루지 않습니다. */
const ROUTES = ["/", "/membership", "/signup", "/login", "/safety"];

/**
 * 일부러 한국어로 두는 화면.
 *
 * 약관과 개인정보 처리방침은 회원이 법적으로 동의하는 문서라 기계 번역으로
 * 대체하지 않습니다. 한국어가 아닌 언어에서는 "한국어로만 제공된다"는 안내가
 * 먼저 뜨는지만 확인합니다.
 */
const KOREAN_ONLY = ["/terms", "/privacy"];

/** 위 화면에 반드시 떠야 하는 안내(영어 사전의 `safety.legalKoreanOnly`). */
const NOTICE = "available in Korean only";

const HANGUL = /[가-힣]/;

/**
 * 언어 선택기의 "한국어"는 누락이 아닙니다.
 *
 * 언어 이름은 **그 언어로** 적는 것이 규칙이라(`LOCALES`), 영어 화면에서도
 * 한국어로 남아 있어야 자기 언어를 찾는 사람이 알아봅니다.
 */
const ALLOWED = new Set(["한국어"]);

/** 태그를 걷어내고 화면에 보이는 글자만 남깁니다. */
function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;|&#\d+;/g, " ");
}

/** 한국어가 든 조각만 추립니다. 앞뒤를 조금 붙여 어디인지 알아보게 합니다. */
function hangulSnippets(text) {
  return [
    ...new Set(
      text
        .split(/\s{2,}|\n/)
        .map((s) => s.trim())
        .filter((s) => s && HANGUL.test(s) && !ALLOWED.has(s))
        .map((s) => (s.length > 90 ? `${s.slice(0, 90)}…` : s)),
    ),
  ];
}

let failed = false;

async function fetchEnglish(route) {
  const res = await fetch(`${BASE}${route}`, {
    headers: { "Accept-Language": "en-US,en;q=0.9" },
    redirect: "follow",
  });
  return res.text();
}

for (const route of KOREAN_ONLY) {
  try {
    const text = visibleText(await fetchEnglish(route));
    if (text.includes(NOTICE)) {
      console.log(`${route}  ok (한국어 원문 + 안내)`);
    } else {
      console.log(`${route}  한국어 원문인데 안내가 없습니다`);
      failed = true;
    }
  } catch (error) {
    console.log(`${route}  요청 실패 — ${error.message}`);
    failed = true;
  }
}

for (const route of ROUTES) {
  let html;
  try {
    html = await fetchEnglish(route);
  } catch (error) {
    console.log(`${route}  요청 실패 — ${error.message}`);
    failed = true;
    continue;
  }

  const found = hangulSnippets(visibleText(html));
  if (found.length === 0) {
    console.log(`${route}  ok`);
    continue;
  }

  failed = true;
  console.log(`${route}  한국어 ${found.length}곳`);
  for (const s of found) console.log(`    ${s}`);
}

process.exit(failed ? 1 : 0);
