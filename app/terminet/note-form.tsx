"use client";

import { useActionState, useEffect, useRef } from "react";
import { addNote } from "@/app/actions";
import type { FormState } from "@/lib/types";
import { DICTS, type Lang } from "@/lib/i18n";

/**
 * Kutia e shpejtë për të shtuar një shënim te termini.
 *
 * Rri gjithmonë e hapur mbi tabelë, që shkrimi të jetë një klikim i vetëm:
 * shkruaj dhe shtyp Ctrl+Enter ose butonin.
 */
export default function NoteForm({
  appointmentId,
  lang,
}: {
  appointmentId: string;
  lang: Lang;
}) {
  // Fjalori merret këtu: funksionet e tij nuk kalojnë dot nga serveri.
  const t = DICTS[lang];
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<FormState, FormData>(
    addNote,
    {}
  );

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="rounded-xl border border-slate-200 bg-white p-4"
    >
      <input type="hidden" name="appointmentId" value={appointmentId} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            {t.noteNew}
          </span>
          <textarea
            name="body"
            rows={2}
            required
            placeholder={t.notePlaceholder}
            className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand"
            onKeyDown={(e) => {
              // Ctrl+Enter e ruan pa e lëvizur dorën nga tastiera.
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-50 sm:mb-1"
        >
          {pending ? t.saving : t.noteAdd}
        </button>
      </div>

      {state.error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
