#!/usr/bin/env node
/**
 * 사전 키 대조 — 기준(한국어)에 있는데 다른 언어에 없는 키를 찾습니다.
 *
 * 빠진 키는 타입 오류가 되지 않습니다(사전은 부분 채움을 허용합니다). 그래서
 * 눈으로는 멀쩡한데 영어 화면에 한국어 문장이 튀어나오는 일이 생깁니다. 이
 * 스크립트가 그 구멍을 세어 줍니다.
 *
 * 치환 자리(`{이름}`)도 함께 봅니다. 번역하다 `{price}`를 흘리면 화면에
 * 금액이 사라지는데, 이건 사람 눈으로 잡기 어렵습니다.
 *
 *   node scripts/i18n-check.mjs          모든 언어 요약
 *   node scripts/i18n-check.mjs en       한 언어의 빠진 키 전부 나열
 */

import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const DICT_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "lib",
  "i18n",
  "dictionaries",
);

/** 기준 사전. 다른 언어는 이 키 집합을 따라갑니다. */
const BASE = "ko";

/**
 * TS 파일에서 사전 객체 하나만 떼어 냅니다.
 *
 * 사전은 리터럴만 들어 있는 객체라 중괄호 짝만 맞춰 잘라 내면 그대로 JS로
 * 평가할 수 있습니다. 파서를 붙이지 않는 이유는, 이 검사 하나 때문에 빌드
 * 의존성을 늘리고 싶지 않아서입니다.
 */
function extractLiteral(source) {
  const start = source.indexOf("= {");
  if (start === -1) return null;

  let depth = 0;
  let inString = null;
  for (let i = start + 2; i < source.length; i++) {
    const ch = source[i];
    if (inString) {
      if (ch === "\\") i++;
      else if (ch === inString) inString = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") inString = ch;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return source.slice(start + 2, i + 1);
    }
  }
  return null;
}

async function loadDictionary(locale) {
  const source = await readFile(path.join(DICT_DIR, `${locale}.ts`), "utf8");
  const literal = extractLiteral(source);
  if (!literal) throw new Error(`${locale}.ts에서 사전 객체를 찾지 못했습니다.`);
  return new Function(`return (${literal})`)();
}

/** 중첩 객체를 `a.b.c` 꼴의 평평한 맵으로 폅니다. */
function flatten(node, prefix = "", out = new Map()) {
  for (const [key, value] of Object.entries(node)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object") flatten(value, full, out);
    else out.set(full, String(value));
  }
  return out;
}

const placeholders = (text) =>
  new Set([...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]));

const only = process.argv[2];

const base = flatten(await loadDictionary(BASE));
const locales = (await readdir(DICT_DIR))
  .filter((f) => f.endsWith(".ts") && f !== "index.ts" && f !== `${BASE}.ts`)
  .map((f) => f.replace(/\.ts$/, ""));

let failed = false;

for (const locale of locales) {
  if (only && locale !== only) continue;

  const dict = flatten(await loadDictionary(locale));
  const missing = [...base.keys()].filter((k) => !dict.has(k));
  const extra = [...dict.keys()].filter((k) => !base.has(k));
  const slots = [...dict.entries()].flatMap(([key, text]) => {
    if (!base.has(key)) return [];
    const want = placeholders(base.get(key));
    const got = placeholders(text);
    const lost = [...want].filter((p) => !got.has(p));
    return lost.length ? [`${key} → {${lost.join("}, {")}}`] : [];
  });

  const done = base.size - missing.length;
  const pct = Math.round((done / base.size) * 100);
  console.log(`${locale}  ${done}/${base.size} (${pct}%)`);

  if (extra.length) {
    failed = true;
    console.log(`  기준에 없는 키 ${extra.length}개:`);
    for (const k of extra) console.log(`    ${k}`);
  }
  if (slots.length) {
    failed = true;
    console.log(`  치환 자리가 빠진 문구 ${slots.length}개:`);
    for (const s of slots) console.log(`    ${s}`);
  }
  if (only && missing.length) {
    console.log(`  빠진 키 ${missing.length}개:`);
    for (const k of missing) console.log(`    ${k}`);
  }
}

// 빠진 키는 정상입니다(사전을 차차 채우는 중). 오타와 치환 누락만 실패로 봅니다.
process.exit(failed ? 1 : 0);
