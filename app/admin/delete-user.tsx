"use client";

import { useActionState, useState } from "react";
import { deleteUserAccount } from "./actions";
import type { FormState } from "@/lib/types";
import { DICTS, type Lang } from "@/lib/i18n";

/**
 * Fshirja e një llogarie — vetëm te faqja e adminit.
 *
 * Kërkon dy klikime, dhe i thotë hapur çfarë humbet. Kur llogaria ka
 * termine ose shënime, jepen dy rrugë: t'i marrësh ato te vetja, ose t'i
 * fshish bashkë me llogarinë. E para është e para me qëllim — humbja e
 * padashur e të dhënave është gabimi më i shtrenjtë këtu.
 */
export default function DeleteUser({
  userId,
  email,
  termine,
  shenime,
  vetja,
  aktiv,
  lang,
}: {
  userId: string;
  email: string;
  termine: number;
  shenime: number;
  /** Rreshti im — nuk ia heq dot hyrjen vetes. */
  vetja: boolean;
  /** A hyn ende ky person? */
  aktiv: boolean;
  lang: Lang;
}) {
  // Fjalori merret këtu: funksionet e tij nuk kalojnë dot nga serveri.
  const t = DICTS[lang];
  const [pyet, setPyet] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(
    deleteUserAccount,
    {}
  );

  // Rreshti im, dhe llogaritë pa hyrje: një fjalë e qetë në vend të butonit.
  // Hapësira mbetet e njëjtë, prandaj rreshtat nuk kërcejnë.
  if (vetja) {
    return <span className="px-1 text-xs text-slate-400">{t.usersYou}</span>;
  }

  if (!aktiv || state.ok) {
    return (
      <span className="px-1 text-xs whitespace-nowrap text-slate-400">
        {t.usersNoAccess}
      </span>
    );
  }

  if (!pyet) {
    return (
      <button
        type="button"
        onClick={() => setPyet(true)}
        className="rounded-lg border border-red-200 px-2.5 py-1 text-xs whitespace-nowrap text-red-700 transition hover:border-red-300 hover:bg-red-50"
      >
        {t.usersRemoveAccess}
      </button>
    );
  }

  // Dritare në qendër, jo panel brenda qelizës: te tabela ajo dilte jashtë
  // dhe pritej në skaj, prandaj gjysma e butonave nuk dukej fare.
  return (
    <>
      <button
        type="button"
        onClick={() => setPyet(false)}
        aria-label="Mbyll"
        className="fixed inset-0 z-40 cursor-default bg-brand/30"
      />

      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-x-4 top-1/3 z-50 mx-auto max-w-sm rounded-xl border border-slate-200 bg-white p-5 text-left shadow-xl"
      >
        <p className="text-base font-semibold text-slate-900">
          {t.usersRemoveAsk(email)}
        </p>

        <p className="mt-2 text-sm text-slate-600">
          {t.usersRemoveExplain(termine, shenime)}
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <form action={action}>
            <input type="hidden" name="userId" value={userId} />
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {pending ? t.usersRemoving : t.usersRemoveConfirm}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setPyet(false)}
            disabled={pending}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {t.cancel}
          </button>
        </div>

        {state.error && (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {state.error}
          </p>
        )}
      </div>
    </>
  );
}
