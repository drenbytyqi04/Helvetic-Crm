"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentUser,
  requireCreator,
  requireManager,
  requireUser,
} from "@/lib/auth";
import { getDict } from "@/lib/i18n-server";
import type { Dict } from "@/lib/i18n";
import {
  APPOINTMENT_CATEGORIES,
  FUSHAT_E_DETYRUESHME,
  categoryOfStatus,
  eDetyrueshme,
  fromBeogradInput,
  type FormState,
  type VleraTeVjetra,
} from "@/lib/types";

/**
 * "use server" lart në skedë do të thotë: këto funksione ekzekutohen VETËM
 * në server. Formularët në shfletues i thërrasin ato.
 *
 * Kujdes: këto funksione mund të thirren edhe drejtpërdrejt, jo vetëm nga
 * faqja jonë. Prandaj secili prej tyre e kontrollon vetë se kush është i
 * kyçur — nuk mjafton që faqja të jetë e mbrojtur.
 */

/** Heq hapësirat e tepërta dhe kthen null nëse fusha ka mbetur bosh. */
function textOrNull(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

/**
 * Ç'ka u shkrua te formulari, si tekst i thjeshtë.
 *
 * Kthehet bashkë me gabimin, që formulari të mos zbrazet. Shih koment te
 * `FormState.values`.
 */
function eDerguara(formData: FormData): Record<string, string> {
  const o: Record<string, string> = {};
  for (const [celes, vlera] of formData.entries()) {
    if (typeof vlera === "string") o[celes] = vlera;
  }
  return o;
}

/** Kontroll shumë i thjeshtë i formatit të emailit: diçka@diçka.diçka */
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}


/**
 * I thotë Next.js-it se të dhënat e termineve kanë ndryshuar.
 *
 * `"layout"` te rrënja pastron çdo faqe nën kornizën kryesore: listën dhe
 * të tria adresat e terminit (një për çdo rol). Freskimi vetëm i faqeve të
 * veçanta nuk mjaftonte — pas fshirjes, shfletuesi e nxirrte listën nga
 * memoria e vet dhe termini i fshirë dukej sikur ishte ende aty.
 */
function freskoTerminet(): void {
  revalidatePath("/", "layout");
}

export async function addNote(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const t = await getDict();

  const appointmentId = String(formData.get("appointmentId") ?? "");
  const body = textOrNull(formData.get("body"));

  if (!appointmentId) {
    return { error: t.errNoAppointment };
  }
  if (!body) {
    return { error: t.errEmptyNote };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("notes")
    .insert({ appointment_id: appointmentId, body, user_id: user.id });

  if (error) {
    return { error: `${t.errNoteNotSaved}: ${error.message}` };
  }

  freskoTerminet();
  return { ok: true };
}

/**
 * Ndryshon tekstin e një shënimi.
 *
 * E bën autori i shënimit, ose administratori për çdo shënim.
 */
export async function updateNote(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const t = await getDict();

  const noteId = String(formData.get("noteId") ?? "");
  const body = textOrNull(formData.get("body"));

  if (!noteId) {
    return { error: t.errNoteMissing };
  }
  if (!body) {
    return { error: t.errEmptyNote };
  }

  const supabase = await createClient();

  // Kontrolli i lejeve edhe këtu, jo vetëm te rregullat e bazës.
  const { data: note } = await supabase
    .from("notes")
    .select("id, user_id, appointment_id")
    .eq("id", noteId)
    .maybeSingle<{ id: string; user_id: string; appointment_id: string }>();

  if (!note) {
    return { error: t.errNoteNotFound };
  }
  if (!user.isAdmin && note.user_id !== user.id) {
    return { error: t.errNoteNotYours };
  }

  const { data, error } = await supabase
    .from("notes")
    .update({ body, updated_at: new Date().toISOString() })
    .eq("id", noteId)
    .select("id");

  if (error) {
    return { error: `${t.errNoteNotSaved}: ${error.message}` };
  }
  if (!data || data.length === 0) {
    return { error: t.errNoteRejected };
  }

  freskoTerminet();
  return { ok: true, message: t.noteUpdated };
}

/**
 * Shënon se përdoruesi është aktiv tani.
 *
 * Thirret çdo 2 minuta nga shfletuesi, sa kohë faqja është e hapur. Vetë
 * llogaritjen e bën baza e të dhënave (funksioni `record_activity`), që
 * askush të mos i shkruajë dot numrat e vet.
 */
export async function recordActivity(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createClient();
  await supabase.rpc("record_activity");
}

// =====================================================================
// TERMINET
// =====================================================================

/** Lexon fushat e përbashkëta të formularit të terminit. */
function readAppointmentFields(formData: FormData) {
  // Data dhe ora vijnë veç nga formulari, dhe bashkohen këtu. Ora shkruhet
  // gjithmonë 0–23: fusha `datetime-local` u hoq sepse te një kompjuter
  // shqip ajo shkruante «10:00 PM» në vend të «22:00», dhe atë pamje faqja
  // nuk e urdhëron dot.
  const data = String(formData.get("scheduledDate") ?? "").trim();
  const ora = String(formData.get("scheduledTime") ?? "").trim();
  const scheduled = fromBeogradInput(
    data && /^([01]\d|2[0-3]):[0-5]\d$/.test(ora) ? `${data}T${ora}` : ""
  );
  const persons = Number(formData.get("personsCount") ?? 1);
  const contracts = Number(formData.get("contractsClosed") ?? 0);
  const status = String(formData.get("status") ?? "open");
  const category = String(formData.get("category") ?? "talking");

  return {
    scheduled,
    persons,
    contracts,
    status,
    category,
    values: {
      // Personalia e personit që takohet
      name: textOrNull(formData.get("name")),
      customer_number: textOrNull(formData.get("customerNumber")),
      gender: textOrNull(formData.get("gender")),
      nationality: textOrNull(formData.get("nationality")),
      birth_date: textOrNull(formData.get("birthDate")),
      street: textOrNull(formData.get("street")),
      postal_code: textOrNull(formData.get("postalCode")),
      city: textOrNull(formData.get("city")),
      canton: textOrNull(formData.get("canton")),
      phone: textOrNull(formData.get("phone")),
      mobile: textOrNull(formData.get("mobile")),
      email: textOrNull(formData.get("email")),
      // Të dhëna teknike
      call_center: textOrNull(formData.get("callCenter")),
      current_insurance: textOrNull(formData.get("currentInsurance")),
      call_date: textOrNull(formData.get("callDate")),
      language: textOrNull(formData.get("language")),
      family_details: textOrNull(formData.get("familyDetails")),
      current_treatment: textOrNull(formData.get("currentTreatment")),
      treatment_type: textOrNull(formData.get("treatmentType")),
      medications: textOrNull(formData.get("medications")),
      multi_year_contract: formData.get("multiYearContract") === "on",
      treatment: formData.get("treatment") === "on",
    },
  };
}

/** Vlerat e lexuara nga formulari. */
type Vlerat = ReturnType<typeof readAppointmentFields>["values"];

/**
 * Fusha e parë e detyrueshme që ka mbetur bosh, ose `null`.
 *
 * Te termini i ri kërkohen të gjashta. Te një termin ekzistues kërkohet
 * vetëm ajo që e ka pasur tashmë: terminet e vjetra u regjistruan para se ky
 * rregull të ekzistonte, dhe kush do vetëm të ndërrojë rezultatin e njërit
 * prej tyre nuk duhet bllokuar te një kanton që s'e di. Por ajo që është
 * plotësuar një herë nuk zbrazet dot.
 */
function fushaQeMungon(
  values: Vlerat,
  iVjetri: VleraTeVjetra | null,
  t: Dict
): string | null {
  for (const { fusha, gabimi } of FUSHAT_E_DETYRUESHME) {
    if (values[fusha]) continue;
    if (!eDetyrueshme(fusha, iVjetri)) continue;
    return t[gabimi];
  }
  return null;
}

/** Kontrollet e përbashkëta. Kthen tekstin e gabimit, ose `null`. */
function validateAppointment(
  scheduled: string | null,
  persons: number,
  contracts: number,
  status: string,
  category: string,
  values: Vlerat,
  iVjetri: VleraTeVjetra | null,
  t: Dict
): string | null {
  const mungon = fushaQeMungon(values, iVjetri, t);
  if (mungon) return mungon;
  if (values.email && !looksLikeEmail(values.email)) return t.errBadEmail;
  if (!scheduled) return t.errDateRequired;
  if (!Number.isInteger(persons) || persons < 1) return t.errPersonsMin;
  if (!Number.isInteger(contracts) || contracts < 0) return t.errContractsBad;
  if (contracts > persons) return t.errContractsTooMany(contracts, persons);

  if (!APPOINTMENT_CATEGORIES.some((c) => c.value === category)) {
    return t.errUnknownCategory;
  }
  // Arsyeja i përket një kategorie të vetme. Nëse s'njihet, ose i përket një
  // tjetre, kërkesa nuk vjen nga formulari ynë — dhe nuk pranohet.
  const eArsyes = categoryOfStatus(status);
  if (!eArsyes) return t.errUnknownStatus;
  if (eArsyes !== category) return t.errReasonNotInCategory;

  // Rregulli që e vendos vetë kuptimi i fjalës: i suksesshëm do të thotë se
  // doli kontratë. Pa këtë, «e suksesshme» do të bëhej thjesht një ngjyrë.
  if (category === "success" && contracts < 1) {
    return t.errSuccessNeedsContract;
  }
  return null;
}

/**
 * Cakton një termin të ri.
 *
 * E cakton admini, menaxheri dhe përdoruesi i thjeshtë. Jo eksperti: ai
 * lexon terminet që ia jep admini dhe shkruan feedback, nuk cakton.
 *
 * `user_id` merret nga sesioni, kurrë nga formulari. Kështu askush nuk
 * shkruan dot një termin sikur ta kishte caktuar dikush tjetër — dhe
 * rregullat e bazës (`supabase/useri.sql`) e kërkojnë pikërisht këtë.
 */
export async function createAppointment(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireCreator();
  const t = await getDict();
  const { scheduled, persons, contracts, status, category, values } =
    readAppointmentFields(formData);

  // Termin i ri: `null` do të thotë «kërkohen të gjitha fushat».
  const gabim = validateAppointment(
    scheduled,
    persons,
    contracts,
    status,
    category,
    values,
    null,
    t
  );
  if (gabim) return { error: gabim, values: eDerguara(formData) };

  const supabase = await createClient();
  const { error } = await supabase.from("appointments").insert({
    ...values,
    user_id: user.id,
    scheduled_at: scheduled,
    persons_count: persons,
    contracts_closed: contracts,
    status,
    category,
  });

  if (error) {
    return {
      error: `${t.errAppointmentNotSaved}: ${error.message}`,
      values: eDerguara(formData),
    };
  }

  freskoTerminet();
  return { ok: true, message: t.appointmentCreated };
}

/**
 * Ndryshon një termin: të dhënat teknike, rezultatin dhe detajet.
 *
 * VETËM menaxheri dhe admini. Përdoruesi i thjeshtë e cakton terminin dhe
 * shkruan feedback mbi të, por nuk e prek më pas — as atë që ka caktuar vetë.
 *
 * Kjo do të thotë se terminin e mbyll menaxheri: rezultati përfundimtar —
 * u mbajt, doli kontratë, u anulua — nuk shkruhet dot nga ai që e caktoi.
 * Kështu u kërkua. Kufiri i vërtetë rri te baza
 * (`supabase/ndryshimi-menaxherit.sql`); kjo është shtresa e dytë.
 */
export async function updateAppointment(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const t = await getDict();
  const id = String(formData.get("appointmentId") ?? "");
  const { scheduled, persons, contracts, status, category, values } =
    readAppointmentFields(formData);

  if (!id) return { error: t.errAppointmentMissing };

  const supabase = await createClient();

  // Termini lexohet PARA kontrolleve: duhet edhe për lejet, edhe për të
  // ditur cilat fusha i ka pasur tashmë. Terminet e vjetra u regjistruan pa
  // adresë e kanton, dhe rregulli i ri nuk kthehet mbrapa mbi to.
  const { data: termini } = await supabase
    .from("appointments")
    .select("id, user_id, name, phone, street, postal_code, city, canton")
    .eq("id", id)
    .maybeSingle<{ id: string; user_id: string } & VleraTeVjetra>();

  if (!termini) return { error: t.errAppointmentNotFound };
  if (!user.isManager) return { error: t.errEditManagerOnly };

  const gabim = validateAppointment(
    scheduled,
    persons,
    contracts,
    status,
    category,
    values,
    termini,
    t
  );
  if (gabim) return { error: gabim, values: eDerguara(formData) };

  const { data, error } = await supabase
    .from("appointments")
    .update({
      ...values,
      scheduled_at: scheduled,
      persons_count: persons,
      contracts_closed: contracts,
      status,
      category,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id");

  if (error) {
    return {
      error: `${t.errAppointmentNotSaved}: ${error.message}`,
      values: eDerguara(formData),
    };
  }
  if (!data || data.length === 0) {
    return { error: t.errChangesRejected, values: eDerguara(formData) };
  }

  freskoTerminet();
  return { ok: true, message: t.appointmentUpdated };
}

/**
 * Eksperti shënon rezultatin e një termini që i është dhënë.
 *
 * NJË VEPRIM I VEÇANTË, jo një degë brenda `updateAppointment`, dhe kjo nuk
 * është hollësi: ai i fundit i lexon e i shkruan të gjitha fushat e
 * formularit. Sikur ekspertin ta lëshonim aty, mjaftonte një fushë e vetme e
 * harruar te kontrolli dhe ai do të shkruante emrin, telefonin ose datën e
 * terminit. Këtu s'ka çfarë të harrohet: lexohen VETËM pesë fushat e
 * rezultatit, dhe vetëm ato shkruhen.
 *
 * Tri shtresa, si te aksesi i ekspertit — dhe e fundit është ajo që mban:
 *   1. Faqja ia vizaton formularin vetëm ekspertit dhe menaxherit.
 *   2. Ky funksion e kontrollon vetë rolin dhe aksesin.
 *   3. Baza e ka rregullin dhe trigger-in (`supabase/rezultati-ekspertit.sql`):
 *      rregulli vendos CILIN termin, trigger-i CILAT kolona.
 */
export async function updateAppointmentResult(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const t = await getDict();
  const id = String(formData.get("appointmentId") ?? "");
  if (!id) return { error: t.errAppointmentMissing };

  const supabase = await createClient();

  // `persons_count` duhet për kontrollin «kontratat nuk kalojnë personat».
  // Lexohet nga baza, jo nga formulari: formulari i ekspertit as nuk e ka
  // atë fushë, dhe po ta kishte, do të ishte e ndryshueshme prej tij.
  const { data: termini } = await supabase
    .from("appointments")
    .select("id, persons_count")
    .eq("id", id)
    .maybeSingle<{ id: string; persons_count: number }>();

  if (!termini) return { error: t.errAppointmentNotFound };

  if (!user.isManager && !user.isExpert) return { error: t.errResultNotYours };

  // Eksperti vetëm te terminet që i janë dhënë. Rregulli i bazës e ndalon
  // gjithsesi, por atëherë përgjigjja do të ishte «0 rreshta ndryshuan» —
  // e vërtetë, por e pakuptueshme për atë që e lexon.
  if (user.isExpert) {
    const { count } = await supabase
      .from("appointment_experts")
      .select("expert_id", { count: "exact", head: true })
      .eq("appointment_id", id)
      .eq("expert_id", user.id);
    if (!count) return { error: t.errResultNotYours };
  }

  const contracts = Number(formData.get("contractsClosed") ?? 0);
  const status = String(formData.get("status") ?? "open");
  const category = String(formData.get("category") ?? "talking");
  const multiYear = formData.get("multiYearContract") != null;
  const treatment = formData.get("treatment") != null;

  // Të njëjtat rregulla si te formulari i plotë. Një rezultat i shënuar nga
  // eksperti nuk mund të jetë më i lirë se një i shënuar nga menaxheri —
  // ndryshe numrat e dashboard-it do të kishin dy kuptime.
  if (!Number.isInteger(contracts) || contracts < 0) return { error: t.errContractsBad };
  if (contracts > termini.persons_count) {
    return { error: t.errContractsTooMany(contracts, termini.persons_count) };
  }
  if (!APPOINTMENT_CATEGORIES.some((c) => c.value === category)) {
    return { error: t.errUnknownCategory };
  }
  const eArsyes = categoryOfStatus(status);
  if (!eArsyes) return { error: t.errUnknownStatus };
  if (eArsyes !== category) return { error: t.errReasonNotInCategory };
  if (category === "success" && contracts < 1) {
    return { error: t.errSuccessNeedsContract };
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({
      status,
      category,
      contracts_closed: contracts,
      multi_year_contract: multiYear,
      treatment,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id");

  if (error) {
    return { error: `${t.errAppointmentNotSaved}: ${error.message}` };
  }
  // Pa `select` + kontroll, një ndryshim që rregullat e bazës nuk e lejojnë
  // do të dukej sikur u krye.
  if (!data || data.length === 0) return { error: t.errChangesRejected };

  freskoTerminet();
  return { ok: true, message: t.appointmentUpdated };
}

/**
 * Fshin një termin. E bën menaxheri ose admini.
 *
 * KUJDES: shënimet e atij termini fshihen bashkë me të — kështu e kërkon
 * lidhja `on delete cascade` te baza. Prandaj butoni te faqja e thotë
 * hapur se sa shënime humbin, dhe kërkon një konfirmim të dytë.
 *
 * Nuk kthehet mbrapsht.
 */
export async function deleteAppointment(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireManager();
  const t = await getDict();

  const id = String(formData.get("appointmentId") ?? "");
  if (!id) return { error: t.errDeleteMissing };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    return { error: `${t.errDeleteFailed}: ${error.message}` };
  }
  // Pa `select` + kontroll, një fshirje që rregullat e bazës nuk e lejojnë
  // do të dukej sikur u krye.
  if (!data || data.length === 0) {
    return { error: t.errDeleteRejected };
  }

  freskoTerminet();
  redirect("/");
}
