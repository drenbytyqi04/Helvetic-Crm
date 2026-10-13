"use server";

import { cookies } from "next/headers";
import { LANG_COOKIE, eshteLang, type Lang } from "@/lib/i18n";

/** Ruan gjuhën e zgjedhur për një vit. */
export async function setLang(lang: Lang): Promise<void> {
  if (!eshteLang(lang)) return;
  (await cookies()).set(LANG_COOKIE, lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
