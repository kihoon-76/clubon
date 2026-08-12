import "server-only";

import type { DataAdapter } from "./adapter";
import { DevMemoryAdapter } from "./memory";
import { PostgresAdapter } from "./postgres";

export type { DataAdapter } from "./adapter";
export * from "./types";

/**
 * 환경에 맞는 데이터 어댑터를 반환합니다.
 * - DATABASE_URL(Postgres/Supabase 접속 문자열)이 있으면 PostgresAdapter.
 * - 없으면 로컬 개발용 DevMemoryAdapter(프로세스 재시작 시 초기화).
 */
const globalDb = globalThis as unknown as { __clubonDb?: DataAdapter };

export function getDb(): DataAdapter {
  if (globalDb.__clubonDb) return globalDb.__clubonDb;

  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
    globalDb.__clubonDb = new PostgresAdapter();
    return globalDb.__clubonDb;
  }

  globalDb.__clubonDb = new DevMemoryAdapter();
  return globalDb.__clubonDb;
}
