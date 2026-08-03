import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = process.env.OUT ?? "/tmp/claude-1000/-workspaces-clubon/914ad044-36db-4a2a-b7bb-e26b1e587e59/scratchpad/shots";
mkdirSync(OUT, { recursive: true });

// 인자: "path[:name]" 목록
const targets = process.argv.slice(2).map((a) => {
  const [p, name] = a.split("::");
  return { path: p, name: name ?? (p === "/" ? "home" : p.replace(/\//g, "_").replace(/^_/, "")) };
});

const VIEWPORTS = [
  { id: "desktop", width: 1440, height: 1000 },
  { id: "mobile", width: 390, height: 844 },
];

const browser = await chromium.launch();
let failures = 0;

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    locale: "ko-KR",
  });
  const page = await ctx.newPage();

  for (const t of targets) {
    const logs = [];
    const onConsole = (m) => {
      if (m.type() === "error" || m.type() === "warning") logs.push(`[${m.type()}] ${m.text()}`);
    };
    const onPageError = (e) => logs.push(`[pageerror] ${e.message}`);
    const onFailed = (r) => logs.push(`[requestfailed] ${r.url()} ${r.failure()?.errorText ?? ""}`);
    page.on("console", onConsole);
    page.on("pageerror", onPageError);
    page.on("requestfailed", onFailed);

    const res = await page.goto(BASE + t.path, { waitUntil: "networkidle", timeout: 45000 }).catch((e) => {
      logs.push(`[navigation] ${e.message}`);
      return null;
    });

    const status = res?.status() ?? "ERR";
    // 가로 스크롤 발생 여부 (모바일 레이아웃 깨짐 탐지)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

    await page.screenshot({
      path: `${OUT}/${t.name}-${vp.id}.png`,
      fullPage: vp.id === "desktop",
    });

    const bad = status !== 200 || overflow > 1 || logs.length > 0;
    if (bad) failures++;
    console.log(
      `${bad ? "FAIL" : "ok  "} ${vp.id.padEnd(7)} ${String(status).padEnd(4)} overflow=${overflow}px  ${t.path}`,
    );
    for (const l of logs.slice(0, 8)) console.log(`        ${l}`);

    page.off("console", onConsole);
    page.off("pageerror", onPageError);
    page.off("requestfailed", onFailed);
  }
  await ctx.close();
}

await browser.close();
console.log(failures === 0 ? "\nALL CLEAN" : `\n${failures} issue(s)`);
