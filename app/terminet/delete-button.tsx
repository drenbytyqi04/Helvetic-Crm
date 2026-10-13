"use client";

import { useActionState, useState } from "react";
import { deleteAppointment } from "@/app/actions";
import type { FormState } from "@/lib/types";
import { DICTS, type Lang } from "@/lib/i18n";

/**
 * Fshirja e një termini — vetëm për menaxherin dhe adminin.
 *
 * Kërkon dy klikime me qëllim. Klikimi i parë nuk fshin asgjë; ai vetëm
 * hap pyetjen, ku shkruhet sa shënime humbin bashkë me terminin. Kështu
 * askush nuk e fshin një termin duke kaluar rastësisht mbi butonin.
 */
export default function DeleteButton({
  appointmentId,
  emri,
  numriIShenimeve,
  lang,
}: {
  appointmentId: string;
  emri: string;
  numriIShenimeve: number;
  lang: Lang;
}) {
  // Fjalori merret këtu: funksionet e tij nuk kalojnë dot nga serveri.
  const t = DICTS[lang];
  const [pyet, setPyet] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(
    deleteAppointment,
    {}
  );

  if (!pyet) {
    return (
      <div className="mt-8 border-t border-slate-200 pt-6">
        <button
          type="button"
          onClick={() => setPyet(true)}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 transition hover:bg-red-50"
        >
          {t.deleteAppointment}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5">
      <p className="text-sm font-medium text-red-900">
        {t.deleteAppointmentAsk(emri)}
      </p>
      <p className="mt-1 text-sm text-red-800">
        {numriIShenimeve > 0
          ? t.deleteAppointmentNotes(numriIShenimeve)
          : t.deleteAppointmentPlain}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <form action={action}>
          <input type="hidden" name="appointmentId" value={appointmentId} />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {pending ? t.deleting : t.deleteConfirm}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setPyet(false)}
          disabled={pending}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          {t.cancel}
        </button>

        {state.error && (
          <p className="text-sm text-red-700" role="alert">
            {state.error}
          </p>
        )}
      </div>
    </div>
  );
}
