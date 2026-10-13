"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createAppointment, updateAppointment } from "@/app/actions";
import {
  APPOINTMENT_CATEGORIES,
  GENDERS,
  categoryStyle,
  eDetyrueshme,
  reasonsForCategory,
  type Appointment,
  type FormState,
} from "@/lib/types";
import { TabPanel } from "./tabs";
import { DICTS, type Lang } from "@/lib/i18n";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand";
const label = "mb-1 block text-sm font-medium text-slate-700";

/**
 * Formulari i terminit — njësia e vetme e sistemit.
 *
 * Të dhënat e personit rrinë mbi vetë terminin: nuk ka kartelë klienti veç,
 * sepse çdo termin regjistrohet si ngjarje më vete.
 *
 * Përdoret në dy mënyra:
 *  - pa `appointment`: cakton një termin të ri
 *  - me `appointment`: ndryshon një termin ekzistues
 */
export default function AppointmentForm({
  appointment,
  scheduledDefault,
  lang,
}: {
  appointment?: Appointment;
  scheduledDefault: string;
  lang: Lang;
}) {
  // Fjalori merret këtu: funksionet e tij nuk kalojnë dot nga serveri.
  const t = DICTS[lang];
  const formRef = useRef<HTMLFormElement>(null);
  const duke = Boolean(appointment);

  /**
   * A kërkohet kjo fushë tani?
   *
   * I njëjti rregull si te serveri (`lib/types.ts`): te termini i ri
   * kërkohen të gjitha, te një i vjetër vetëm ato që i ka pasur. Shfletuesi
   * e ndalon bosh menjëherë, por vendimi i vërtetë mbetet te serveri —
   * `required` hiqet me një klikim te mjetet e zhvilluesit.
   */
  const kerkohet = (fusha: Parameters<typeof eDetyrueshme>[0]) =>
    eDetyrueshme(fusha, appointment ?? null);

  /** Ylli i kuq pas etiketës, kur fusha është e detyrueshme. */
  const ylli = (fusha: Parameters<typeof eDetyrueshme>[0]) =>
    kerkohet(fusha) ? <span className="text-red-600"> *</span> : null;

  /**
   * Vlera fillestare e një fushe.
   *
   * Nëse dërgimi i fundit u refuzua, merret ajo që u shkrua; përndryshe ajo
   * e terminit. React-i e zbraz formularin sapo veprimi mbaron, edhe kur ai
   * ktheu gabim — dhe zbrazja e kthen te kjo vlerë. Pra pikërisht kjo është
   * ajo që e ruan punën e shkruar. Pa të, një gabim shtypi te kantoni do të
   * fshinte edhe emrin, adresën dhe gjithçka tjetër.
   */
  const nis = (emri: string, eTerminit?: string | number | null) =>
    state.values?.[emri] ?? eTerminit ?? "";

  /** E njëjta gjë për kutizat po/jo. */
  const nisKutine = (emri: string, eTerminit: boolean) =>
    state.values ? state.values[emri] === "on" : eTerminit;

  // Rezultati mbahet këtu, jo vetëm te fusha, sepse menyja e dytë varet nga
  // ai: arsyet e «E dështuar» s'kanë punë te «E suksesshme».
  const [kategoria, setKategoria] = useState<string>(
    appointment?.category ?? "talking"
  );
  const arsyet = reasonsForCategory(kategoria);
  // Kur ndërrohet rezultati, arsyeja e mëparshme mund të mos i përkasë më.
  // Atëherë bie te e para e kategorisë së re.
  const arsyeja =
    appointment && arsyet.some((a) => a.value === appointment.status)
      ? appointment.status
      : arsyet[0]?.value;

  // Data dhe ora ndahen këtu: te baza rrinë bashkë, te formulari veç.
  const [dataFillestare, oraFillestare] = scheduledDefault.split("T");

  const [state, action, pending] = useActionState<FormState, FormData>(
    duke ? updateAppointment : createAppointment,
    {}
  );

  // Pas krijimit e zbrazim formularin, që të caktohet termini tjetër.
  const trajtuar = useRef<FormState | null>(null);
  useEffect(() => {
    if (state.ok && !duke && trajtuar.current !== state) {
      trajtuar.current = state;
      formRef.current?.reset();
    }
  }, [state, duke]);

  return (
    // `key` ndryshon sa herë ruhet termini: fushat rimbushen me vlerat e
    // sapo ruajtura, ndërsa mesazhi i suksesit mbetet.
    <form
      key={appointment?.updated_at ?? "i-ri"}
      ref={formRef}
      action={action}
      className="space-y-6"
    >
      {duke && (
        <input type="hidden" name="appointmentId" value={appointment!.id} />
      )}

      {/* ---------- Personalia ---------- */}
      <TabPanel id="personalia">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          {t.tabPersonalia}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block sm:col-span-2">
            <span className={label}>
              {t.fName}
              {ylli("name")}
            </span>
            <input
              name="name"
              required={kerkohet("name")}
              defaultValue={nis("name", appointment?.name)}
              placeholder="Arben Krasniqi"
              className={input}
            />
          </label>
          <label className="block">
            <span className={label}>{t.fCustomerNumber}</span>
            <input
              name="customerNumber"
              defaultValue={nis("customerNumber", appointment?.customer_number)}
              className={input}
            />
          </label>

          <label className="block">
            <span className={label}>{t.fGender}</span>
            <select
              name="gender"
              defaultValue={nis("gender", appointment?.gender)}
              className={`${input} bg-white`}
            >
              <option value="">—</option>
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>
                  {t[g.key]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={label}>{t.fNationality}</span>
            <input
              name="nationality"
              defaultValue={nis("nationality", appointment?.nationality)}
              className={input}
            />
          </label>
          <label className="block">
            <span className={label}>{t.fBirthDate}</span>
            <input
              name="birthDate"
              type="date"
              defaultValue={nis("birthDate", appointment?.birth_date)}
              className={input}
            />
          </label>

          <label className="block">
            <span className={label}>
              {t.fPhone}
              {ylli("phone")}
            </span>
            <input
              name="phone"
              type="tel"
              required={kerkohet("phone")}
              defaultValue={nis("phone", appointment?.phone)}
              className={input}
            />
          </label>
          <label className="block">
            <span className={label}>{t.fMobile}</span>
            <input
              name="mobile"
              type="tel"
              defaultValue={nis("mobile", appointment?.mobile)}
              className={input}
            />
          </label>
          <label className="block">
            <span className={label}>{t.fEmail}</span>
            <input
              name="email"
              type="email"
              defaultValue={nis("email", appointment?.email)}
              className={input}
            />
          </label>

          <label className="block">
            <span className={label}>
              {t.fStreet}
              {ylli("street")}
            </span>
            <input
              name="street"
              required={kerkohet("street")}
              defaultValue={nis("street", appointment?.street)}
              className={input}
            />
          </label>
          <label className="block">
            <span className={label}>
              {t.fPostalCode}
              {ylli("postal_code")}
            </span>
            <input
              name="postalCode"
              required={kerkohet("postal_code")}
              defaultValue={nis("postalCode", appointment?.postal_code)}
              className={input}
            />
          </label>
          <label className="block">
            <span className={label}>
              {t.fCity}
              {ylli("city")}
            </span>
            <input
              name="city"
              required={kerkohet("city")}
              defaultValue={nis("city", appointment?.city)}
              className={input}
            />
          </label>
          <label className="block">
            <span className={label}>
              {t.fCanton}
              {ylli("canton")}
            </span>
            <input
              name="canton"
              required={kerkohet("canton")}
              defaultValue={nis("canton", appointment?.canton)}
              className={input}
            />
          </label>
        </div>
      </section>

      </TabPanel>

      {/* ---------- Të dhëna teknike ---------- */}
      <TabPanel id="teknike">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          {t.tabTechnical}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className={label}>{t.fCallCenter}</span>
            <input
              name="callCenter"
              defaultValue={nis("callCenter", appointment?.call_center)}
              placeholder="I&M Call"
              className={input}
            />
          </label>
          <label className="block">
            <span className={label}>{t.fCurrentInsurance}</span>
            <input
              name="currentInsurance"
              defaultValue={nis("currentInsurance", appointment?.current_insurance)}
              placeholder="Helsana"
              className={input}
            />
          </label>
          <label className="block">
            <span className={label}>{t.fLanguage}</span>
            <input
              name="language"
              defaultValue={nis("language", appointment?.language)}
              placeholder="Gjermanisht"
              className={input}
            />
          </label>
          <label className="block">
            <span className={label}>{t.fCallDate}</span>
            <input
              name="callDate"
              type="date"
              defaultValue={nis("callDate", appointment?.call_date)}
              className={input}
            />
          </label>
          {/* Data dhe ora, në dy fusha.
              Më parë ishte një fushë e vetme `datetime-local`. Atë kontroll e
              vizaton vetë shfletuesi, sipas gjuhës së kompjuterit — dhe te një
              kompjuter shqip ai shkruante «10:00 PM» në vend të «22:00». Faqja
              nuk e urdhëron dot atë pamje: s'ka as atribut, as stil që ta
              detyrojë 24-orëshin. E vetmja rrugë ishte ta ndërtojmë vetë.
              Ora shkruhet HH:MM, gjithmonë 0–23, kudo njësoj. */}
          <label className="block">
            <span className={label}>
              {t.fScheduledDate} <span className="text-red-600">*</span>
            </span>
            <input
              name="scheduledDate"
              type="date"
              required
              defaultValue={nis("scheduledDate", dataFillestare)}
              className={input}
            />
          </label>
          <label className="block">
            <span className={label}>
              {t.fScheduledTime} <span className="text-red-600">*</span>
            </span>
            <input
              name="scheduledTime"
              type="text"
              required
              inputMode="numeric"
              // 00:00 deri 23:59. Shfletuesi e ndalon çdo gjë tjetër, dhe
              // serveri e kontrollon sërish.
              pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
              placeholder="14:30"
              maxLength={5}
              defaultValue={nis("scheduledTime", oraFillestare)}
              className={input}
            />
            <span className="mt-1 block text-xs text-slate-500">
              {t.fTimeHint}
            </span>
          </label>
          <label className="block">
            <span className={label}>{t.fPersonsCount}</span>
            <input
              name="personsCount"
              type="number"
              min={1}
              defaultValue={nis("personsCount", appointment?.persons_count ?? 1)}
              className={input}
            />
          </label>
        </div>
      </section>

      </TabPanel>

      {/* ---------- Rezultati ---------- */}
      <TabPanel id="rezultati">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          {t.tabResult}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={label}>{t.fCategory}</span>
            <div className="flex gap-2">
              {APPOINTMENT_CATEGORIES.map((c) => {
                const zgjedhur = kategoria === c.value;
                const ngj = categoryStyle(c.value);
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setKategoria(c.value)}
                    aria-pressed={zgjedhur}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      zgjedhur
                        ? `${ngj.shenje} border-transparent ring-1 ring-inset`
                        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {t[c.key]}
                  </button>
                );
              })}
            </div>
            {/* Vlera që dërgohet vërtet. Butonat lart janë vetëm pamja. */}
            <input type="hidden" name="category" value={kategoria} />
            <span className="mt-1 block text-xs text-slate-500">
              {t.categoryHint}
            </span>
          </label>

          <label className="block">
            <span className={label}>{t.fStatus}</span>
            <select
              name="status"
              // `key` e detyron menynë të rifillojë kur ndërron kategoria,
              // që të mos mbetet e zgjedhur një arsye e kategorisë së vjetër.
              key={kategoria}
              defaultValue={nis("status", arsyeja)}
              className={`${input} bg-white`}
            >
              {arsyet.map((s) => (
                <option key={s.value} value={s.value}>
                  {t[s.key]}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-slate-500">
              {t.reasonHint}
            </span>
          </label>
          <label className="block">
            <span className={label}>{t.fContractsClosed}</span>
            <input
              name="contractsClosed"
              type="number"
              min={0}
              defaultValue={nis("contractsClosed", appointment?.contracts_closed ?? 0)}
              className={input}
            />
            <span className="mt-1 block text-xs text-slate-500">
              {t.contractsHint}
            </span>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="multiYearContract"
              defaultChecked={nisKutine("multiYearContract", appointment?.multi_year_contract ?? false)}
              className="h-4 w-4"
            />
            {t.fMultiYear}
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="treatment"
              defaultChecked={nisKutine("treatment", appointment?.treatment ?? false)}
              className="h-4 w-4"
            />
            {t.fTreatment}
          </label>
        </div>
      </section>

      </TabPanel>

      {/* ---------- Detaje të këshillimit ---------- */}
      <TabPanel id="detaje">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 text-base font-semibold text-slate-900">
          {t.tabDetails}
        </h2>
        <p className="mb-4 text-xs text-slate-500">
          {t.detailsHint}
        </p>

        <div className="space-y-4">
          <label className="block">
            <span className={label}>{t.fFamilyDetails}</span>
            <input
              name="familyDetails"
              defaultValue={nis("familyDetails", appointment?.family_details)}
              placeholder="Burri: 1986, fëmijët: 2020, 2023"
              className={input}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={label}>{t.fCurrentTreatment}</span>
              <select
                name="currentTreatment"
                defaultValue={nis("currentTreatment", appointment?.current_treatment)}
                className={`${input} bg-white`}
              >
                <option value="">—</option>
                <option value="jo">{t.no}</option>
                <option value="po">{t.yes}</option>
              </select>
            </label>
            <label className="block">
              <span className={label}>{t.fTreatmentType}</span>
              <input
                name="treatmentType"
                defaultValue={nis("treatmentType", appointment?.treatment_type)}
                className={input}
              />
            </label>
          </div>
          <label className="block">
            <span className={label}>{t.fMedications}</span>
            <input
              name="medications"
              defaultValue={nis("medications", appointment?.medications)}
              className={input}
            />
          </label>
        </div>
      </section>
      </TabPanel>

      {/* Butoni i ruajtjes duket te çdo skedë e formularit, jo te Feedback-u:
          ai bllok nuk i përket formularit. */}
      <TabPanel id={["personalia", "teknike", "rezultati", "detaje"]}>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-50"
        >
          {pending ? t.saving : duke ? t.saveChanges : t.createAppointment}
        </button>

        {state.error && (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}
        {state.message && !pending && (
          <p className="text-sm text-emerald-700">{state.message}</p>
        )}
      </div>
      </TabPanel>
    </form>
  );
}
