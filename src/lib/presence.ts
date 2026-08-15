import "server-only";

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const secret = process.env.PRESENCE_API_SECRET;

  if (!url || !key || !secret) return null;
  return { url, key, secret };
}

async function callPresenceRpc<T>(name: string, body: object): Promise<T | null> {
  const settings = config();
  if (!settings) return null;

  const response = await fetch(`${settings.url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: settings.key,
      Authorization: `Bearer ${settings.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...body, p_secret: settings.secret }),
    cache: "no-store",
  });

  if (!response.ok) {
    console.error(`[presence] ${name} failed with ${response.status}`);
    return null;
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function touchPresence(userId: string): Promise<boolean> {
  const result = await callPresenceRpc<boolean>("touch_user_presence", {
    p_user_id: userId,
  });
  return result === true;
}

export async function countOnlineUsers(): Promise<number> {
  const count = await callPresenceRpc<number>("count_online_users", {});
  return typeof count === "number" ? count : 0;
}

export async function countTodayUsers(): Promise<number> {
  const count = await callPresenceRpc<number>("count_today_users", {});
  return typeof count === "number" ? count : 0;
}
