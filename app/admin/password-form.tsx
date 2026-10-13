"use client";

import { useActionState, useState } from "react";
import { changeUserPassword } from "./actions";
import type { FormState } from "@/lib/types";
import { DICTS, type Lang } from "@/lib/i18n";

/**
 * Ndërrimi i fjalëkalimit të një llogarie — vetëm te faqja e adminit.
 *
 * Nuk ka email rikthimi te ky sistem: llogaritë i hap admini, prandaj edhe
 * fjalëkalimin e harruar e zëvendëson ai. Fjalëkalimi i vjetër nuk shfaqet
 * askund, sepse baza mban vetëm një gjurmë të koduar të tij.
 *
 * Dritare në qendër, jo panel brenda qelizës: brenda tabelës ajo del jashtë
 * dhe pritet në skaj — e njëjta arsye si te fshirja e llogarisë.
 */
export default function PasswordForm({
  userId,
  email,
  aktiv,
  lang,
}: {
  userId: string;
  email: string;
  /** Llogaritë pa hyrje s'kanë ku ta mbajnë fjalëkalimin. */
  aktiv: boolean;
  lang: Lang;
}) {
  // Fjalori merret këtu: funksionet e tij nuk kalojnë dot nga serveri.
  const t = DICTS[lang];
  const [hapur, setHapur] = useState(false);
  const [shfaq, setShfaq] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(
    changeUserPassword,
    {}
  );

  if (!aktiv) return null;

  if (!hapur) {
    return (
      <button
        type="button"
        onClick={() => setHapur(true)}
        className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs whitespace-nowrap text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
      >
        {t.usersChangePassword}
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setHapur(false)}
        aria-label={t.cancel}
        className="fixed inset-0 z-40 cursor-default bg-brand/30"
      />

      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-x-4 top-1/4 z-50 mx-auto max-w-sm rounded-xl border border-slate-200 bg-white p-5 text-left shadow-xl"
      >
        <p className="text-base font-semibold text-slate-900">
          {t.usersChangePasswordFor(email)}
        </p>
        <p className="mt-2 text-sm text-slate-600">{t.usersPasswordHint}</p>

        <form action={action} className="mt-4">
          <input type="hidden" name="userId" value={userId} />

          <label className="mb-1 block text-sm font-medium text-slate-700">
            {t.usersNewPassword}
          </label>
          <input
            name="password"
            type={shfaq ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder={t.usersPasswordPlaceholder}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand"
          />

          {/* Fjalëkalimi shkruhet një herë dhe u jepet me gojë: pa e parë,
              një gabim shtypi zbulohet vetëm kur personi s'hyn dot. */}
          <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={shfaq}
              onChange={(e) => setShfaq(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300"
            />
            {t.usersShowPassword}
          </label>

          <div className="mt-5 flex flex-col gap-2">
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-50"
            >
              {pending ? t.saving : t.usersSavePassword}
            </button>
            <button
              type="button"
              onClick={() => setHapur(false)}
              disabled={pending}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {t.cancel}
            </button>
          </div>
        </form>

        {state.error && (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {state.error}
          </p>
        )}
        {state.ok && state.message && (
          <p className="mt-3 text-sm text-emerald-700">{state.message}</p>
        )}
      </div>
    </>
  );
}
