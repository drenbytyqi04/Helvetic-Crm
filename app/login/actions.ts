"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/types";
import { getDict } from "@/lib/i18n-server";
import type { Dict } from "@/lib/i18n";

/** Përkthen gabimet e Supabase-it në gjuhën e zgjedhur. */
function translateError(message: string, t: Dict): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return t.loginBadCredentials;
  if (m.includes("email not confirmed")) return t.loginNotConfirmed;
  return message;
}

/**
 * Hyrja në llogari.
 *
 * Nuk ka regjistrim: llogaritë i hap administratori nga faqja
 * «Përdoruesit». Shih `app/admin/actions.ts`.
 */
export async function authenticate(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const t = await getDict();

  if (!email || !password) {
    return { error: t.loginFillBoth };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: translateError(error.message, t) };

  revalidatePath("/", "layout");
  redirect("/");
}

/** Dalje nga llogaria. */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
