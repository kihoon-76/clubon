"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { LOCALE_COOKIE, isLocale } from "@/lib/i18n/locales";

/**
 * 언어를 바꿉니다.
 *
 * 쿠키에만 담고 계정에는 저장하지 않습니다. 언어는 "이 기기에서 읽고 싶은
 * 말"이라, 같은 계정이라도 기기마다 다를 수 있기 때문입니다.
 *
 * 1년을 두는 것은 한 번 고른 언어가 다음 방문에도 남아 있어야 하기 때문이고,
 * 바꾼 뒤 전체 경로를 무효화하는 것은 서버에서 렌더된 문구가 그대로 남아
 * 있으면 언어가 바뀌지 않은 것처럼 보이기 때문입니다.
 */
export async function setLocale(formData: FormData): Promise<void> {
  const value = String(formData.get("locale") ?? "");
  if (!isLocale(value)) return;

  (await cookies()).set(LOCALE_COOKIE, value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
}
