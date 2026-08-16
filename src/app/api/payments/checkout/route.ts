import { NextResponse } from "next/server";

import { requestOrigin } from "@/lib/auth/google";
import { getCreditProduct, getPurchasable } from "@/lib/payments/catalog";
import { createCheckout, isCreemConfigured } from "@/lib/payments/creem";
import { getCurrentUser, isAuthenticated } from "@/lib/session";

/** Starts checkout for currently offered membership products only. */
export async function POST(request: Request) {
  const origin = requestOrigin(request);
  const form = await request.formData();
  const code = String(form.get("code") ?? "");
  const next = safeNext(form.get("next"));
  const credit = getCreditProduct(code);

  if (!credit) {
    const known = Boolean(getPurchasable(code));
    return NextResponse.redirect(
      new URL(`${next}?error=${known ? "unavailable" : "unknown"}`, origin),
      303,
    );
  }

  if (!(await isAuthenticated())) {
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent("/membership")}`, origin),
      303,
    );
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", origin), 303);

  if (!isCreemConfigured()) {
    return NextResponse.redirect(
      new URL(`${next}?error=not_configured`, origin),
      303,
    );
  }

  const result = await createCheckout({
    code: credit.code,
    userId: user.id,
    userEmail: user.email,
    successUrl: `${origin}${next}?purchase=processing`,
  });

  if (!result.ok) {
    const reason =
      result.reason === "unknown_product" ? "unavailable" : result.reason;
    return NextResponse.redirect(new URL(`${next}?error=${reason}`, origin), 303);
  }

  return NextResponse.redirect(result.checkoutUrl, 303);
}

function safeNext(raw: FormDataEntryValue | null): string {
  const value = String(raw ?? "").trim();
  if (!value.startsWith("/") || value.startsWith("//")) return "/entry";
  return value.split(/[?#]/)[0];
}
