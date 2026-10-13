"use client";

import { useActionState, useEffect, useRef } from "react";
import { createUserAccount } from "./actions";
import type { FormState } from "@/lib/types";
import { DICTS, type Lang } from "@/lib/i18n";

const label = "mb-1 block text-sm font-medium text-slate-700";
const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand";

/** Paneli me të cilin administratori hap një llogari të re. */
export default function UserForm({ lang }: { lang: Lang }) {
  // Fjalori merret këtu: funksionet e tij nuk kalojnë dot nga serveri.
  const t = DICTS[lang];
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<FormState, FormData>(
    createUserAccount,
    {}
  );

  // Pas hapjes së llogarisë fushat zbrazen, që të mos dërgohet dy herë.
  const trajtuar = useRef<FormState | null>(null);
  useEffect(() => {
    if (state.ok && trajtuar.current !== state) {
      trajtuar.current = state;
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <details className="mb-6 rounded-xl border border-slate-200 bg-white">
      <summary className="cursor-pointer px-5 py-4 text-sm font-medium text-slate-700 select-none">
        {t.userNewPanel}
      </summary>

      <form
        ref={formRef}
        action={action}
        className="border-t border-slate-200 p-5"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className={label}>{t.userNewEmail}</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="off"
              placeholder="emri@shembull.com"
              className={input}
            />
          </label>

          <label className="block">
            <span className={label}>{t.userNewPassword}</span>
            <input
              name="password"
              type="text"
              required
              minLength={8}
              autoComplete="off"
              placeholder={t.userNewPasswordPlaceholder}
              className={input}
            />
            <span className="mt-1 block text-xs text-slate-500">
              {t.userNewPasswordHint}
            </span>
          </label>

          <label className="block">
            <span className={label}>{t.userNewRole}</span>
            <select name="role" defaultValue="user" className={input}>
              <option value="user">{t.userNewRoleUser}</option>
              <option value="manager">{t.userNewRoleManager}</option>
              <option value="expert">{t.userNewRoleExpert}</option>
            </select>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-50"
          >
            {pending ? t.userNewCreating : t.userNewButton}
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

        <p className="mt-4 text-xs text-slate-500">{t.userNewAdminNote}</p>
      </form>
    </details>
  );
}
