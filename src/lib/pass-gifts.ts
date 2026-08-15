import "server-only";

import { createHash, randomBytes } from "node:crypto";
import postgres from "postgres";

type GiftResult = { ok: true; matches: number } | { ok: false; reason: "invalid" | "recipient" | "used" | "expired" };
type GiftRow = { id: string; recipientEmail: string; status: string; createdAt: string; redeemedAt: string | null };

const memory = new Map<string, { sender: string; recipient: string; status: string; expiresAt: number }>();
let sqlClient: ReturnType<typeof postgres> | null = null;

function sql() {
  if (sqlClient) return sqlClient;
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) return null;
  sqlClient = postgres(url, { ssl: url.includes("localhost") ? false : "require", prepare: false, max: 2 });
  return sqlClient;
}

function hash(code: string) {
  return createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}

export async function issueGiftCode(senderId: string, recipientId: string): Promise<string> {
  const code = `CLUBON-${randomBytes(4).toString("hex").toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
  const codeHash = hash(code);
  const db = sql();
  if (!db) {
    memory.set(codeHash, { sender: senderId, recipient: recipientId, status: "issued", expiresAt: Date.now() + 30 * 86400_000 });
    return code;
  }
  await db`insert into public.pass_gift_codes (code_hash, sender_user_id, recipient_user_id) values (${codeHash}, ${senderId}, ${recipientId})`;
  return code;
}

export async function redeemGiftCode(userId: string, code: string): Promise<GiftResult> {
  const codeHash = hash(code);
  const db = sql();
  if (!db) {
    const gift = memory.get(codeHash);
    if (!gift) return { ok: false, reason: "invalid" };
    if (gift.recipient !== userId) return { ok: false, reason: "recipient" };
    if (gift.status !== "issued") return { ok: false, reason: "used" };
    if (gift.expiresAt < Date.now()) return { ok: false, reason: "expired" };
    gift.status = "redeemed";
    return { ok: true, matches: 1 };
  }
  return db.begin(async (tx) => {
    const rows = await tx`select * from public.pass_gift_codes where code_hash = ${codeHash} for update`;
    if (!rows.length) return { ok: false as const, reason: "invalid" as const };
    const gift = rows[0];
    if (gift.recipient_user_id !== userId) return { ok: false as const, reason: "recipient" as const };
    if (gift.status !== "issued") return { ok: false as const, reason: "used" as const };
    if (new Date(gift.expires_at).getTime() < Date.now()) return { ok: false as const, reason: "expired" as const };
    await tx`insert into public.pass_wallets (user_id, remaining_matches, total_purchased_matches, updated_at)
      values (${userId}, 1, 1, now()) on conflict (user_id) do update set
      remaining_matches = public.pass_wallets.remaining_matches + 1,
      total_purchased_matches = public.pass_wallets.total_purchased_matches + 1, updated_at = now()`;
    await tx`update public.pass_gift_codes set status = 'redeemed', redeemed_at = now() where id = ${gift.id}`;
    return { ok: true as const, matches: 1 };
  });
}

export async function listGiftCodes(senderId: string): Promise<GiftRow[]> {
  const db = sql();
  if (!db) return [];
  const rows = await db`select g.id, u.email, g.status, g.created_at, g.redeemed_at
    from public.pass_gift_codes g join public.users u on u.id = g.recipient_user_id
    where g.sender_user_id = ${senderId} order by g.created_at desc limit 20`;
  return rows.map((r) => ({ id: r.id, recipientEmail: r.email, status: r.status, createdAt: new Date(r.created_at).toISOString(), redeemedAt: r.redeemed_at ? new Date(r.redeemed_at).toISOString() : null }));
}
