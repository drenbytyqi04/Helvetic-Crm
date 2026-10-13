"use client";

import { useActionState } from "react";
import { updateAppointmentResult } from "../actions";
import {
  APPOINTMENT_CATEGORIES,
  categoryStyle,
  reasonsForCategory,
  type Appointment,
  type FormState,
} from "@/lib/types";
import { DICTS, type Lang } from "@/lib/i18n";
import { useState } from "react";

/**
 * Rezultati i terminit, i shënuar nga vetë eksperti.
 *
 * VETËM KËTO PESË FUSHA. Formulari i plotë i menaxherit ka edhe emrin,
 * telefonin, adresën dhe datën; këtu ato as nuk vizatohen, as nuk dërgohen.
 * Kufiri i vërtetë rri te baza — rregulli i RLS-së vendos cilin termin, dhe
 * trigger-i cilat kolona (`supabase/rezultati-ekspertit.sql`) — por edhe
 * vetë formulari s'ka çfarë t'i japë asaj një fushë tjetër.
 */
export default function ResultForm({
  appointment,
  lang,
}: {
  appointment: Appointment;
  lang: Lang;
}) {
  // Fjalori merret këtu: funksionet e tij nuk kalojnë dot nga serveri.
  const t = DICTS[lang];
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateAppointmentResult,
    {}
  );
  const [kategoria, setKategoria] = useState(appointment.category);
  const arsyet = reasonsForCategory(kategoria);

  const etiketa = "mb-1 block text-sm font-medium text-slate-700";
  const kuti =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm " +
    "text-slate-900 outline-none focus:border-brand";

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="appointmentId" value={appointment.id} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={etiketa}>{t.fCategory}</span>
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
          <span className={etiketa}>{t.fStatus}</span>
          <select
            name="status"
            // `key` e detyron menynë të rifillojë kur ndërron kategoria, që
            // të mos mbetet e zgjedhur një arsye e kategorisë së vjetër.
            key={kategoria}
            defaultValue={
              arsyet.some((s) => s.value === appointment.status)
                ? appointment.status
                : arsyet[0]?.value
            }
            className={`${kuti} bg-white`}
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
          <span className={etiketa}>{t.fContractsClosed}</span>
          <input
            name="contractsClosed"
            type="number"
            min={0}
            defaultValue={appointment.contracts_closed}
            className={kuti}
          />
          <span className="mt-1 block text-xs text-slate-500">
            {t.contractsHint}
          </span>
        </label>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="multiYearContract"
            defaultChecked={appointment.multi_year_contract}
            className="h-4 w-4"
          />
          {t.fMultiYear}
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="treatment"
            defaultChecked={appointment.treatment}
            className="h-4 w-4"
          />
          {t.fTreatment}
        </label>
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.message && !pending && (
        <p className="text-sm text-emerald-700">{state.message}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-50"
        >
          {pending ? t.saving : t.saveChanges}
        </button>
        {/* Thuhet hapur se çfarë ndryshon këtu dhe çfarë jo — përndryshe
            mungesa e fushave të tjera duket si gabim. */}
        <span className="text-xs text-slate-500">{t.resultOnlyHint}</span>
      </div>
    </form>
  );
}
