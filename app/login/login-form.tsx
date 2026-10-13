"use client";

import { useActionState } from "react";
import { authenticate } from "./actions";
import type { FormState } from "@/lib/types";
import { DICTS, type Lang } from "@/lib/i18n";

export default function LoginForm({ lang }: { lang: Lang }) {
  // Fjalori merret këtu: funksionet e tij nuk kalojnë dot nga serveri.
  const t = DICTS[lang];
  const [state, action, pending] = useActionState<FormState, FormData>(
    authenticate,
    {}
  );

  return (
    <form
      action={action}
      className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      {/* Emri nuk përsëritet: logoja mbi kartë e mban tashmë. */}
      <h1 className="text-lg font-semibold text-slate-900">{t.loginHeading}</h1>
      <p className="mt-1 mb-5 text-sm text-slate-500">
        {t.loginTitle}
      </p>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          {t.loginEmail}
        </span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="ti@shembull.com"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand"
        />
      </label>

      <label className="mt-4 block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          {t.loginPassword}
        </span>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="current-password"
          placeholder={t.loginPasswordHint}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-5 w-full rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-50"
      >
        {pending ? t.loginWaiting : t.loginButton}
      </button>

      {state.error && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <p className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
        {t.loginNoSignup}
      </p>
    </form>
  );
}
