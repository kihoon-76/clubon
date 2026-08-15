import type { User } from "@/lib/db/types";

export const OWNER_EMAIL = "regiment8@gmail.com";

export function isOwner(user: Pick<User, "email"> | null | undefined): boolean {
  return user?.email.trim().toLowerCase() === OWNER_EMAIL;
}
