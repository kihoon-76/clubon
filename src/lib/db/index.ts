import "server-only";

import type { DataAdapter } from "./adapter";
import { DevMemoryAdapter } from "./memory";

export type { DataAdapter } from "./adapter";
export * from "./types";

/**
 * 환경에 맞는 데이터 어댑터를 반환합니다.
 * - Supabase 환경변수가 있으면 SupabaseAdapter (추후 구현).
 * - 없으면 로컬 개발용 DevMemoryAdapter.
 */
const globalDb = globalThis as unknown as { __clubonDb?: DataAdapter };

export function getDb(): DataAdapter {
  if (globalDb.__clubonDb) return globalDb.__clubonDb;

  const hasSupabase =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (hasSupabase) {
    // SupabaseAdapter는 데이터 계층 연동 단계에서 추가됩니다.
    throw new Error(
      "SupabaseAdapter가 아직 구현되지 않았습니다. Supabase 환경변수를 비우면 인메모리 어댑터로 동작합니다.",
    );
  }

  globalDb.__clubonDb = new DevMemoryAdapter();
  return globalDb.__clubonDb;
}
