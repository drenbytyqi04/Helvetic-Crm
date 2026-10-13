"use client";

import { useActionState } from "react";
import { grantExpert, revokeExpert } from "./expert-actions";
import { DICTS, type Lang } from "@/lib/i18n";
import type { FormState } from "@/lib/types";

export type ExpertAccess = {
  expert_id: string;
  email: string;
  granted_by_email: string | null;
};

/**
 * Paneli me të cilin administratori vendos kush e sheh këtë termin.
 *
 * Duket vetëm për adminin. Por fshehja e panelit nuk është mbrojtje: kufiri i
 * vërtetë rri te rregullat e bazës, që e kërkojnë `is_admin()` për çdo shtim
 * e heqje. Kjo faqe thjesht nuk i tregon butona që s'i hapen dot.
 */
export default function Experts({
  appointmentId,
  aktualet,
  teLira,
  lang,
}: {
  appointmentId: string;
  /** Ekspertët që e shohin tashmë këtë termin. */
  aktualet: ExpertAccess[];
  /** Llogaritë e ekspertëve që ende nuk e shohin. */
  teLira: { id: string; email: string }[];
  lang: Lang;
}) {
  // Fjalori merret këtu: funksionet e tij nuk kalojnë dot nga serveri.
  const t = DICTS[lang];
  const [gjendja, jep, dukeJapur] = useActionState<FormState, FormData>(
    grantExpert,
    {}
  );
  const [heqja, hiq] = useActionState<FormState, FormData>(revokeExpert, {});

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-base font-semibold text-slate-900">
        {t.expertsTitle}
      </h2>
      <p className="mt-1 text-xs text-slate-500">{t.expertsHint}</p>

      {aktualet.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
          {t.expertsNone}
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
          {aktualet.map((e) => (
            <li
              key={e.expert_id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
            >
              <div className="min-w-0">
                <span className="text-sm font-medium text-slate-900">
                  {e.email}
                </span>
                {e.granted_by_email && (
                  <span className="ml-2 text-xs text-slate-500">
                    {t.expertsGrantedBy} {e.granted_by_email}
                  </span>
                )}
              </div>
              <form action={hiq}>
                <input type="hidden" name="appointmentId" value={appointmentId} />
                <input type="hidden" name="expertId" value={e.expert_id} />
                <input type="hidden" name="email" value={e.email} />
                <button
                  type="submit"
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                >
                  {t.expertsRemove}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {teLira.length === 0 && aktualet.length === 0 ? (
        <p className="mt-4 text-xs text-slate-500">{t.expertsNoAccounts}</p>
      ) : (
        teLira.length > 0 && (
          <form action={jep} className="mt-4 flex flex-wrap items-center gap-2">
            <input type="hidden" name="appointmentId" value={appointmentId} />
            <label className="sr-only" htmlFor="expertId">
              {t.expertsPick}
            </label>
            <select
              id="expertId"
              name="expertId"
              defaultValue=""
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand"
            >
              <option value="" disabled>
                {t.expertsPick}
              </option>
              {teLira.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.email}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={dukeJapur}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-50"
            >
              {dukeJapur ? t.expertsAdding : t.expertsAdd}
            </button>
          </form>
        )
      )}

      {(gjendja.error || heqja.error) && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {gjendja.error || heqja.error}
        </p>
      )}
      {(gjendja.message || heqja.message) && (
        <p className="mt-3 text-sm text-emerald-700">
          {gjendja.message || heqja.message}
        </p>
      )}
    </section>
  );
}
