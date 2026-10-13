import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AppointmentForm from "./appointment-form";
import ResultForm from "./result-form";
import NoteForm from "./note-form";
import NoteRow from "./note-row";
import { Tabs, TabPanel } from "./tabs";
import DeleteButton from "./delete-button";
import Experts, { type ExpertAccess } from "./experts";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n-server";
import {
  APPOINTMENT_COLUMNS,
  appointmentCategoryLabel,
  categoryStyle,
  appointmentStatusLabel,
  appointmentPath,
  formatDate,
  formatDateOnly,
  formatBeograd,
  genderLabel,
  toBeogradInput,
  type Appointment,
  type Note,
  type RolePrefix,
} from "@/lib/types";

/** Një fushë e vetme në bllloqet vetëm-lexim. */
function Fusha({ etiketa, vlera }: { etiketa: string; vlera: string | null }) {
  return (
    <div>
      <dt className="text-slate-500">{etiketa}</dt>
      <dd className="mt-1 break-words text-slate-900">{vlera || "—"}</dd>
    </div>
  );
}

/**
 * Faqja e një termini. E njëjta faqe shërbehet nën tri adresa — `/admin/`,
 * `/menager/` dhe `/user/` — sepse secili rol e ka prefiksin e vet.
 *
 * `prefiks` thotë vetëm se nga cila adresë erdhi kërkesa. Lejet nuk varen
 * kurrë prej saj: ato dalin nga roli i vërtetë te `profiles`. Nëse prefiksi
 * s'i përgjigjet rolit, përdoruesi dërgohet te adresa e vet.
 */
export default async function AppointmentPage({
  nr,
  prefiks,
}: {
  nr: string;
  prefiks: RolePrefix;
}) {
  const { t, lang, locale } = await getI18n();
  const user = await requireUser();
  const supabase = await createClient();

  // Adresa mban numrin e shkurtër (`/admin/terminet/1001`). Lidhjet e vjetra
  // e kanë `id`-në e gjatë brenda, prandaj i njohim të dyja format.
  const eshteNumer = /^\d+$/.test(nr);

  // Termini merret pa asnjë filtër roli: kufirin e vë baza. Kush s'ka të
  // drejtë ta shohë, merr bosh — dhe faqja del 404, sikur të mos ekzistonte.
  const kerkesa = supabase.from("appointments").select(APPOINTMENT_COLUMNS);
  const terminiResult = await (
    eshteNumer ? kerkesa.eq("nr", Number(nr)) : kerkesa.eq("id", nr)
  ).maybeSingle<Appointment>();

  if (terminiResult.error) throw new Error(terminiResult.error.message);

  const termini = terminiResult.data;
  if (!termini) notFound();

  // Adresa e drejtë për këtë përdorues dhe këtë termin: prefiksi i rolit të
  // vet dhe numri i shkurtër. Nëse ajo që u shkrua është tjetër — prefiks i
  // gabuar, ose `id`-ja e gjatë e një lidhjeje të vjetër — e dërgojmë atje.
  const adresaEDrejte = appointmentPath(termini, user.role);
  if (`/${prefiks}/terminet/${nr}` !== adresaEDrejte) redirect(adresaEDrejte);

  const [notesResult, profilesResult, ekspertetResult] = await Promise.all([
    supabase
      .from("notes")
      .select("id, appointment_id, user_id, body, created_at, updated_at")
      .eq("appointment_id", termini.id)
      .order("created_at", { ascending: false })
      .returns<Note[]>(),
    // `active` lexohet bashkë me të tjerat: emailet e TË GJITHËVE duhen për
    // të treguar kush e shkroi çfarë — edhe të atyre që s'hyjnë më — kurse
    // për zgjedhjen e ekspertit duhen vetëm ata që hyjnë ende.
    supabase
      .from("profiles")
      .select("id, email, role, active")
      .returns<
        { id: string; email: string | null; role: string; active: boolean | null }[]
      >(),
    // Kush e sheh këtë termin. E lexojnë dhe e ndryshojnë të dy: menaxheri
    // dhe admini.
    user.isManager
      ? supabase
          .from("appointment_experts")
          .select("expert_id, granted_by")
          .eq("appointment_id", termini.id)
          .returns<{ expert_id: string; granted_by: string | null }[]>()
      : Promise.resolve({ data: [], error: null }),
  ]);

  const notes = notesResult.data ?? [];

  // Emri i shfaqur për secilin autor. Nëse rregullat e bazës nuk e lejojnë
  // leximin e emailit të tjetrit, mbetet një vizë.
  const emailet = new Map(
    (profilesResult.data ?? []).map((p) => [p.id, p.email ?? "—"])
  );
  const autorLabel = (id: string) =>
    id === user.id ? user.email : (emailet.get(id) ?? "—");

  const agjenti =
    termini.user_id === user.id ? null : (emailet.get(termini.user_id) ?? null);

  // Terminin e ndryshon VETËM menaxheri dhe admini — edhe atë që e ka caktuar
  // dikush tjetër, edhe atë që e ka caktuar vetë ai. Përdoruesi i thjeshtë e
  // lexon dhe shkruan feedback. Kufiri i vërtetë rri te baza
  // (`supabase/ndryshimi-menaxherit.sql`); kjo vendos vetëm ç'të vizatohet.
  const mundTaNdryshoje = user.isManager;

  // Eksperti e shënon vetë rezultatin — dhe VETËM rezultatin — te terminet
  // që i janë dhënë. Te kjo faqe ai arrin vetëm për ato: rregulli i leximit
  // ia fsheh të tjerat, dhe adresa e drejtpërdrejtë kthen 404.
  //
  // Arsyeja është e thjeshtë: te termini shkon ai. Ai e di nëse u mbajt dhe
  // nëse doli kontratë. Pa këtë, ajo e dhënë duhej kaluar me gojë te dikush
  // tjetër — dhe numrat e dashboard-it varen pikërisht prej saj.
  const mundTaShenojeRezultatin = user.isExpert;

  // Ekspertët: ata që e shohin tashmë, dhe llogaritë që mund të shtohen.
  const meAkses = ekspertetResult.data ?? [];
  const ekspertetAktuale: ExpertAccess[] = meAkses.map((e) => ({
    expert_id: e.expert_id,
    email: emailet.get(e.expert_id) ?? "—",
    granted_by_email: e.granted_by ? (emailet.get(e.granted_by) ?? null) : null,
  }));
  const kaAkses = new Set(meAkses.map((e) => e.expert_id));
  // Vetëm ekspertët që hyjnë ende. T'i japësh një termin dikujt që s'hyn dot
  // do të thotë ta lësh atë termin pa u parë nga askush — dhe pa asnjë shenjë
  // se ashtu ndodhi.
  const ekspertetELira = (profilesResult.data ?? [])
    .filter((p) => p.role === "expert" && p.active !== false && !kaAkses.has(p.id))
    .map((p) => ({ id: p.id, email: p.email ?? "—" }));

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10">
      <header className="mb-6">
        <div>
          <Link
            href="/"
            className="text-sm text-slate-500 transition hover:text-slate-900"
          >
            {t.backToList}
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {termini.nr != null && (
                <span className="mr-2 font-normal text-slate-400">
                  #{termini.nr}
                </span>
              )}
              {termini.name}
            </h1>
            {/* Rezultati i madh, arsyeja e vogël pas tij: kategoria është
                ajo që numërohet, arsyeja thotë vetëm pse. */}
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                categoryStyle(termini.category).shenje
              }`}
            >
              {appointmentCategoryLabel(termini.category, t)}
            </span>
            <span className="text-xs text-slate-500">
              {appointmentStatusLabel(termini.status, t)}
            </span>
            {agjenti && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 ring-1 ring-slate-200 ring-inset">
                {t.assignedBy}: {agjenti}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {formatBeograd(termini.scheduled_at, locale)}
          </p>
          {/* Koha e regjistrimit e sheh çdo rol, jo vetëm përdoruesi. */}
          <p className="mt-0.5 text-xs text-slate-400">
            {t.registeredOn(formatDate(termini.created_at, locale))}
          </p>
        </div>
      </header>

      <Tabs
        tabs={[
          { id: "personalia", label: t.tabPersonalia },
          { id: "teknike", label: t.tabTechnical },
          { id: "rezultati", label: t.tabResult },
          { id: "detaje", label: t.tabDetails },
          { id: "feedback", label: t.tabFeedback(notes.length) },
          // Skeda e ekspertëve: menaxheri dhe admini. Të tjerët as nuk e
          // shohin se ekziston.
          ...(user.isManager
            ? [
                {
                  id: "eksperte",
                  label: `${t.expertsTitle} (${ekspertetAktuale.length})`,
                },
              ]
            : []),
        ]}
      >
      {mundTaNdryshoje ? (
        <AppointmentForm
          appointment={termini}
          scheduledDefault={toBeogradInput(termini.scheduled_at)}
          lang={lang}
        />
      ) : (
        /* Termini i dikujt tjetër: lexohet, por nuk ndryshohet. */
        <div className="space-y-6">
          <TabPanel id="personalia">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              {t.tabPersonalia}
            </h2>
            <dl className="grid gap-4 text-sm sm:grid-cols-3">
              <Fusha etiketa={t.fCustomerNumber} vlera={termini.customer_number} />
              <Fusha etiketa={t.fGender} vlera={genderLabel(termini.gender, t)} />
              <Fusha etiketa={t.fNationality} vlera={termini.nationality} />
              <Fusha
                etiketa={t.fBirthDate}
                vlera={
                  termini.birth_date ? formatDateOnly(termini.birth_date, locale) : null
                }
              />
              <Fusha etiketa={t.fPhone} vlera={termini.phone} />
              <Fusha etiketa={t.fMobile} vlera={termini.mobile} />
              <Fusha etiketa={t.fEmail} vlera={termini.email} />
              <Fusha etiketa={t.fStreet} vlera={termini.street} />
              <Fusha
                etiketa={t.fPlace}
                vlera={
                  [termini.postal_code, termini.city, termini.canton]
                    .filter(Boolean)
                    .join(", ") || null
                }
              />
            </dl>
          </section>

          </TabPanel>

          <TabPanel id="teknike">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              {t.tabTechnical}
            </h2>
            <dl className="grid gap-4 text-sm sm:grid-cols-3">
              <Fusha etiketa={t.fCallCenter} vlera={termini.call_center} />
              <Fusha etiketa={t.fCurrentInsurance} vlera={termini.current_insurance} />
              <Fusha etiketa={t.fLanguage} vlera={termini.language} />
              <Fusha
                etiketa={t.fCallDate}
                vlera={termini.call_date ? formatDateOnly(termini.call_date, locale) : null}
              />
              <Fusha
                etiketa={t.fPersonsCount}
                vlera={String(termini.persons_count)}
              />
              <Fusha etiketa={t.fCreatedAt} vlera={formatDate(termini.created_at, locale)} />
            </dl>
          </section>

          </TabPanel>

          <TabPanel id="rezultati">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              {t.tabResult}
            </h2>
            {mundTaShenojeRezultatin ? (
              <ResultForm appointment={termini} lang={lang} />
            ) : (
              <dl className="grid gap-4 text-sm sm:grid-cols-3">
                <Fusha
                  etiketa={t.fCategory}
                  vlera={appointmentCategoryLabel(termini.category, t)}
                />
                <Fusha
                  etiketa={t.fStatus}
                  vlera={appointmentStatusLabel(termini.status, t)}
                />
                <Fusha
                  etiketa={t.fContractsClosed}
                  vlera={String(termini.contracts_closed)}
                />
                <Fusha
                  etiketa={t.fMultiYear}
                  vlera={termini.multi_year_contract ? t.yes : t.noValue}
                />
              </dl>
            )}
          </section>

          </TabPanel>

          <TabPanel id="detaje">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              {t.tabDetails}
            </h2>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <Fusha etiketa={t.fFamilyDetails} vlera={termini.family_details} />
              <Fusha etiketa={t.fCurrentTreatment} vlera={termini.current_treatment} />
              <Fusha etiketa={t.fTreatmentType} vlera={termini.treatment_type} />
              <Fusha etiketa={t.fMedications} vlera={termini.medications} />
            </dl>
            <p className="mt-4 text-xs text-slate-500">
              {t.readOnlyHint}
            </p>
          </section>
          </TabPanel>
        </div>
      )}

      {/* ---------- Shënimet ---------- */}
      <TabPanel id="feedback">
      <section>
        <div className="mb-4">
          <NoteForm appointmentId={termini.id} lang={lang} />
        </div>

        {notesResult.error && (
          <p className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {t.noteLoadError}: {notesResult.error.message}
          </p>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="p-4 font-medium whitespace-nowrap">{t.noteColUser}</th>
                <th className="p-4 font-medium">{t.noteColBody}</th>
                <th className="p-4 font-medium whitespace-nowrap">{t.noteColDate}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {notes.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="p-8 text-center text-sm text-slate-500"
                  >
                    {t.noteEmpty}
                  </td>
                </tr>
              ) : (
                notes.map((note) => (
                  <NoteRow
                    key={note.id}
                    note={note}
                    autori={autorLabel(note.user_id)}
                    canEdit={user.isAdmin || note.user_id === user.id}
                    createdLabel={formatDate(note.created_at, locale)}
                    lang={lang}
                    updatedLabel={
                      note.updated_at ? formatDate(note.updated_at, locale) : null
                    }
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-2 text-xs text-slate-500">
          {t.noteFooter(notes.length)}
        </p>
      </section>
      </TabPanel>
      {user.isManager && (
        <TabPanel id="eksperte">
          <Experts
            appointmentId={termini.id}
            aktualet={ekspertetAktuale}
            teLira={ekspertetELira}
            lang={lang}
          />
        </TabPanel>
      )}
      </Tabs>

      {/* Fshirja rri jashtë skedave dhe në fund: veprim i rrallë, i pakthyeshëm. */}
      {user.isManager && (
        <DeleteButton
          appointmentId={termini.id}
          emri={termini.name}
          numriIShenimeve={notes.length}
          lang={lang}
        />
      )}
    </main>
  );
}
