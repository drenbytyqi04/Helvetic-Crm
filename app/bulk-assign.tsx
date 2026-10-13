"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { grantExpertBulk } from "./terminet/expert-actions";
import { DICTS, type Lang } from "@/lib/i18n";
import type { FormState } from "@/lib/types";

/**
 * Zgjedhja e disa termineve njëherësh, dhe dhënia e tyre një eksperti.
 *
 * Duket vetëm për adminin — dhe vetëm nëse ka llogari ekspertësh.
 *
 * Vetë tabela mbetet e ndërtuar te serveri: ajo hyn këtu si `children`.
 * Kështu nuk u desh të bëhej e tëra kod shfletuesi vetëm për disa kutiza.
 *
 * Numri i të zgjedhurve lexohet drejt nga kutizat brenda formularit, jo nga
 * një gjendje e dytë që do të duhej mbajtur në përputhje me to. Një burim i
 * vetëm i së vërtetës: vetë formulari.
 */
export default function BulkAssign({
  eksperte,
  lang,
  vetemFemijet,
  children,
}: {
  eksperte: { id: string; email: string }[];
  lang: Lang;
  /** Për këdo tjetër veç adminit: tabela del ashtu siç ishte, pa formular. */
  vetemFemijet: boolean;
  children: ReactNode;
}) {
  // Fjalori merret këtu: funksionet e tij nuk kalojnë dot nga serveri.
  const t = DICTS[lang];
  const formRef = useRef<HTMLFormElement>(null);
  const [sa, setSa] = useState(0);
  const [state, action, pending] = useActionState<FormState, FormData>(
    grantExpertBulk,
    {}
  );

  /** Numëron kutizat e shënuara brenda formularit. */
  const rinumero = () => {
    const f = formRef.current;
    if (!f) return;
    setSa(
      f.querySelectorAll<HTMLInputElement>(
        'input[name="appointmentIds"]:checked'
      ).length
    );
  };

  // Pas dhënies, zgjedhja pastrohet — ndryshe do të mbetej e shënuar dhe
  // klikimi i dytë do t'i jepte të njëjtat termine një eksperti tjetër pa
  // qenë e qartë.
  const trajtuar = useRef<FormState | null>(null);
  useEffect(() => {
    if (state.ok && trajtuar.current !== state) {
      trajtuar.current = state;
      formRef.current
        ?.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
        .forEach((k) => (k.checked = false));
      setSa(0);
    }
  }, [state]);

  if (vetemFemijet) return <>{children}</>;

  const zgjedhTeGjitha = (e: React.ChangeEvent<HTMLInputElement>) => {
    formRef.current
      ?.querySelectorAll<HTMLInputElement>('input[name="appointmentIds"]')
      .forEach((k) => (k.checked = e.target.checked));
    rinumero();
  };

  return (
    <form ref={formRef} action={action} onChange={rinumero}>
      {/* Shiriti i zgjedhjes nis nga 768px e lart.
          Poshtë tij nuk ka hapësirë: te 640px shfaqet menyja anash dhe i merr
          tabelës 224px, prandaj mbeten 374px për gjithë rreshtin. Kolona e
          kutizave do t'i hante 38 prej tyre dhe tabela do të dilte jashtë
          ekranit — pikërisht ajo që u hoq. Caktimi me shumicë është punë
          tavoline gjithsesi; te telefoni termini hapet një nga një. */}
      <div
        className={`mb-3 hidden flex-wrap items-center gap-3 rounded-xl border px-4 py-3 transition md:flex ${
          sa > 0
            ? "border-slate-300 bg-white"
            : "border-dashed border-slate-200 bg-transparent"
        }`}
      >
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            onChange={zgjedhTeGjitha}
            className="h-4 w-4 rounded border-slate-300"
          />
          {t.bulkSelectAll}
        </label>

        <span
          className={`text-sm tabular-nums ${
            sa > 0 ? "font-medium text-slate-900" : "text-slate-400"
          }`}
        >
          {t.bulkSelected(sa)}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="bulkExpertId">
            {t.expertsPick}
          </label>
          <select
            id="bulkExpertId"
            name="expertId"
            defaultValue=""
            disabled={sa === 0}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-brand disabled:opacity-50"
          >
            <option value="" disabled>
              {t.expertsPick}
            </option>
            {eksperte.map((e) => (
              <option key={e.id} value={e.id}>
                {e.email}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={sa === 0 || pending}
            className="rounded-lg bg-brand px-4 py-1.5 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-40"
          >
            {pending ? t.expertsAdding : t.bulkAssign}
          </button>
        </div>
      </div>

      {state.error && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.message && !pending && (
        <p className="mb-3 text-sm text-emerald-700">{state.message}</p>
      )}

      {children}
    </form>
  );
}
