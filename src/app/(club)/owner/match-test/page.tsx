import { redirect } from "next/navigation";
import { isOwner } from "@/lib/owner";
import { requireOnboardedSession } from "@/lib/session";

export default async function OwnerMatchTestPage() {
  const { user } = await requireOnboardedSession("/owner/match-test");
  if (!isOwner(user)) redirect("/lobby?staff=required");
  redirect("/entry?gender=female");
}
