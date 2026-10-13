"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getDict } from "@/lib/i18n-server";
import type { FormState } from "@/lib/types";

/**
 * Kush e sheh cilin termin.
 *
 * Aksesin e japin dhe e heqin menaxheri dhe administratori. Deri para pak e
 * bënte vetëm admini, dhe kjo e kthente atë në pengesë te puna e përditshme:
 * menaxheri e cakton terminin dhe e njeh rastin, por duhej të priste dikë
 * tjetër vetëm për t'ia dhënë një eksperti.
 *
 * Kontrolli bëhet në tri shtresa, dhe secila mjafton më vete:
 *
 *   1. Faqja nuk e vizaton fare panelin për të tjerët.
 *   2. Këto funksione e kontrollojnë rolin vetë — mund të thirren edhe pa
 *      kaluar nga faqja jonë.
 *   3. Rregullat e bazës (`supabase/ekspertet-menaxheri.sql`) e kërkojnë
 *      `is_manager()`.
 *
 * E treta është ajo që mban vërtet. Dy të parat janë që përdoruesi të marrë
 * një mesazh të kuptueshëm në vend të një gabimi teknik.
 */

/** Freskon listën dhe të tria adresat e terminit. */
function fresko(): void {
  revalidatePath("/", "layout");
}

export async function grantExpert(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const t = await getDict();

  if (!user.isManager) return { error: t.errExpertsManagerOnly };

  const appointmentId = String(formData.get("appointmentId") ?? "");
  const expertId = String(formData.get("expertId") ?? "");
  if (!appointmentId) return { error: t.errNoAppointment };
  if (!expertId) return { error: t.errExpertMissing };

  const supabase = await createClient();

  // Vetëm një llogari me rolin `expert`, dhe që hyn ende, mund të marrë
  // akses. Pa kontrollin e rolit, do të mund t'i jepej "akses" një menaxheri
  // — gjë që s'do të ndryshonte gjë, por do të linte rreshta që nuk thonë
  // asgjë. Pa kontrollin e hyrjes, termini do të mbetej i dhënë dikujt që
  // s'hyn dot: pa u parë nga askush, dhe pa asnjë shenjë se ashtu ndodhi.
  //
  // Menyja nuk i tregon më ata pa hyrje, por kjo nuk mjafton: kërkesa mund
  // të vijë edhe pa kaluar nga faqja jonë.
  const { data: profili } = await supabase
    .from("profiles")
    .select("id, email, role, active")
    .eq("id", expertId)
    .maybeSingle<{
      id: string;
      email: string | null;
      role: string;
      active: boolean | null;
    }>();

  if (!profili) return { error: t.errExpertMissing };
  if (profili.role !== "expert") return { error: t.errExpertNotExpert };
  if (profili.active === false) return { error: t.errExpertNoAccess };

  const { error } = await supabase
    .from("appointment_experts")
    .insert({
      appointment_id: appointmentId,
      expert_id: expertId,
      granted_by: user.id,
    });

  if (error) {
    // Çelësi kryesor (termin + ekspert) e ndalon dyfishimin. Kjo nuk është
    // gabim i vërtetë: personi thjesht e kishte tashmë aksesin.
    if (error.code === "23505") return { error: t.errExpertAlready };
    return { error: `${t.errExpertFailed}: ${error.message}` };
  }

  fresko();
  return { ok: true, message: t.expertsGranted(profili.email ?? "") };
}

/**
 * I njëjti akses, por për shumë termine njëherësh.
 *
 * Kur admini cakton punën e një dite, zgjedh 12 termine te lista dhe ia jep
 * ekspertit me një klikim, në vend që të hapë 12 faqe.
 *
 * Ato që eksperti i ka tashmë NUK janë gabim: thjesht nuk shtohen dy herë,
 * dhe mesazhi e thotë sa u shtuan vërtet. Ndryshe një zgjedhje e gjerë do të
 * dështonte tërësisht sapo njëri prej tyre të ishte dhënë më parë.
 */
export async function grantExpertBulk(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const t = await getDict();

  if (!user.isManager) return { error: t.errExpertsManagerOnly };

  const expertId = String(formData.get("expertId") ?? "");
  if (!expertId) return { error: t.errExpertMissing };

  // Kutizat e shënuara vijnë të gjitha me të njëjtin emër.
  const idet = formData
    .getAll("appointmentIds")
    .map((v) => String(v))
    .filter(Boolean);
  if (idet.length === 0) return { error: t.errBulkNoneSelected };

  const supabase = await createClient();

  const { data: profili } = await supabase
    .from("profiles")
    .select("id, email, role, active")
    .eq("id", expertId)
    .maybeSingle<{
      id: string;
      email: string | null;
      role: string;
      active: boolean | null;
    }>();

  if (!profili) return { error: t.errExpertMissing };
  if (profili.role !== "expert") return { error: t.errExpertNotExpert };
  if (profili.active === false) return { error: t.errExpertNoAccess };

  // Cilat i ka tashmë. Pa këtë, çelësi kryesor do ta rrëzonte tërë shtimin.
  const { data: ekzistueset } = await supabase
    .from("appointment_experts")
    .select("appointment_id")
    .eq("expert_id", expertId)
    .in("appointment_id", idet)
    .returns<{ appointment_id: string }[]>();

  const kishte = new Set((ekzistueset ?? []).map((r) => r.appointment_id));
  const teReja = idet.filter((id) => !kishte.has(id));

  if (teReja.length === 0) {
    return { ok: true, message: t.bulkAllAlready(idet.length) };
  }

  const { error } = await supabase.from("appointment_experts").insert(
    teReja.map((id) => ({
      appointment_id: id,
      expert_id: expertId,
      granted_by: user.id,
    }))
  );

  if (error) return { error: `${t.errExpertFailed}: ${error.message}` };

  fresko();
  return {
    ok: true,
    message: t.bulkGranted(teReja.length, profili.email ?? "", kishte.size),
  };
}

export async function revokeExpert(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const t = await getDict();

  if (!user.isManager) return { error: t.errExpertsManagerOnly };

  const appointmentId = String(formData.get("appointmentId") ?? "");
  const expertId = String(formData.get("expertId") ?? "");
  const email = String(formData.get("email") ?? "");
  if (!appointmentId || !expertId) return { error: t.errExpertMissing };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointment_experts")
    .delete()
    .eq("appointment_id", appointmentId)
    .eq("expert_id", expertId)
    .select("expert_id");

  if (error) return { error: `${t.errExpertFailed}: ${error.message}` };
  // Pa `select` + kontroll, një fshirje që rregullat e bazës nuk e lejojnë
  // do të dukej sikur u krye.
  if (!data || data.length === 0) return { error: t.errExpertsManagerOnly };

  fresko();
  return { ok: true, message: t.expertsRevoked(email) };
}
