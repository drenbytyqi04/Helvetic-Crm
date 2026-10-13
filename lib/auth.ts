import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Rolet e mundshme. Duhet të përputhen me `supabase/roles.sql`. */
export type Role = "user" | "manager" | "admin" | "expert";

export type CurrentUser = {
  id: string;
  email: string;
  role: Role;
  /** Admini: gjithçka, plus përdoruesit dhe aktiviteti. */
  isAdmin: boolean;
  /**
   * Menaxheri ose admini. Dy gjëra bashkë, sepse te ne përputhen:
   * i shohin TË GJITHA terminet, dhe i ndryshojnë e i fshijnë të gjitha.
   * Të tjerët e kanë secili vetëm punën e vet.
   */
  isManager: boolean;
  /**
   * Eksperti: sheh VETËM terminet që ia jep admini, dhe mbi to lexon e
   * shkruan shënime. Kufiri i vërtetë rri te baza (`supabase/eksperti.sql`);
   * kjo shenjë shërben vetëm që faqja të mos i tregojë butona që s'i hapen.
   */
  isExpert: boolean;
  /**
   * Cakton termine të reja: admini, menaxheri dhe përdoruesi i thjeshtë.
   *
   * Jashtë mbetet vetëm eksperti: ai lexon terminet që ia jep admini dhe
   * shkruan feedback mbi to, por nuk cakton asnjë.
   */
  canCreate: boolean;
};

/**
 * Kthen përdoruesin e kyçur, ose `null`.
 *
 * `getClaims()` e verifikon vërtetësinë e sesionit — nuk i beson thjesht
 * cookie-t, të cilën mund ta trillojë kushdo.
 * `cache()` bën që edhe nëse thirret disa herë brenda së njëjtës faqe,
 * puna të bëhet vetëm një herë.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims?.sub) return null;

  const id = String(claims.sub);
  const email = String(claims.email ?? "");

  // Roli lexohet nga tabela `profiles`. Nëse ajo tabelë nuk ekziston ende
  // (SQL-i i `supabase/admin.sql` s'është ekzekutuar), kjo kthen thjesht
  // gabim dhe ne e trajtojmë si përdorues të zakonshëm — aplikacioni
  // vazhdon të punojë normalisht.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, active")
    .eq("id", id)
    .maybeSingle<{ role: string; active: boolean }>();

  // Hyrja e hequr vlen MENJËHERË.
  //
  // Çelësi që mban shfletuesi (JWT) është i nënshkruar dhe vlen deri sa t'i
  // mbarojë koha — rreth një orë. Deri para pak, brenda asaj ore një llogari
  // e hequr vazhdonte të punonte: hapte faqe, caktonte termine. Prandaj
  // shenja `active` pyetet këtu, te çdo kërkesë, jo vetëm te lista e
  // llogarive.
  //
  // Kur profili s'lexohet fare (tabela s'ekziston ende), nuk bllokohet
  // askush: aty s'ka as rol, as `active` — dhe sistemi punon si më parë.
  if (profile && profile.active === false) return null;

  const role: Role =
    profile?.role === "admin"
      ? "admin"
      : profile?.role === "manager"
        ? "manager"
        : profile?.role === "expert"
          ? "expert"
          : "user";

  return {
    id,
    email,
    role,
    isAdmin: role === "admin",
    isManager: role === "admin" || role === "manager",
    isExpert: role === "expert",
    canCreate: role !== "expert",
  };
});

/**
 * A ka ende një sesion te shfletuesi — pavarësisht se llogaria mund të jetë
 * hequr. Shërben vetëm për të dalluar dy rastet më poshtë.
 */
const kaSesion = cache(async (): Promise<boolean> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return Boolean(data?.claims?.sub);
});

/**
 * Si më sipër, por dërgon te faqja e hyrjes nëse s'ka njeri të kyçur.
 *
 * Dy rastet ndahen me qëllim. Kur s'ka fare sesion, mjafton faqja e hyrjes.
 * Por kur sesioni është i vlefshëm dhe llogaria është hequr, ridrejtimi te
 * `/login` do të bëhej unazë: proxy-ja e sheh çelësin ende të mirë, e quan
 * të kyçur, dhe e kthen te «/». Prandaj ai dërgohet të dalë vërtet.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect((await kaSesion()) ? "/auth/dil" : "/login");
  return user;
}

/** Për faqet vetëm-për-admin: kush s'është admin, s'e sheh se ekzistojnë. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!user.isAdmin) redirect("/");
  return user;
}

/** Për veprimet që i lejohen vetëm menaxherit dhe adminit. */
export async function requireManager(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!user.isManager) redirect("/");
  return user;
}

/** Për caktimin e termineve: kushdo veç ekspertit. */
export async function requireCreator(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!user.canCreate) redirect("/");
  return user;
}
