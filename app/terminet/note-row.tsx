"use client";

import { useActionState, useState } from "react";
import { updateNote } from "@/app/actions";
import { type FormState, type Note } from "@/lib/types";
import { DICTS, type Lang } from "@/lib/i18n";

/**
 * Një rresht i tabelës së shënimeve: përdoruesi, teksti, data.
 *
 * Me një klikim mbi "Ndrysho", qeliza e tekstit bëhet fushë shkrimi — pa
 * dritare shtesë dhe pa dalë nga tabela.
 *
 * Datat vijnë të gatshme si tekst nga serveri, që faqja të mos ndryshojë mes
 * serverit (orë botërore) dhe shfletuesit (orë lokale).
 */
export default function NoteRow({
  note,
  autori,
  canEdit,
  createdLabel,
  updatedLabel,
  lang,
}: {
  note: Note;
  autori: string;
  canEdit: boolean;
  createdLabel: string;
  updatedLabel: string | null;
  lang: Lang;
}) {
  // Fjalori merret këtu: funksionet e tij nuk kalojnë dot nga serveri.
  const t = DICTS[lang];
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateNote,
    {}
  );

  const [handled, setHandled] = useState<FormState | null>(null);
  if (state.ok && state !== handled) {
    setHandled(state);
    setEditing(false);
  }

  return (
    <tr className="align-top">
      <td className="p-4 whitespace-nowrap text-slate-700">{autori}</td>

      <td className="p-4">
        {editing ? (
          <form action={action}>
            <input type="hidden" name="noteId" value={note.id} />
            <textarea
              name="body"
              data-testid="note-edit"
              rows={3}
              required
              defaultValue={note.body}
              className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-brand"
            />
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                data-testid="note-save"
                disabled={pending}
                className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-50"
              >
                {pending ? t.saving : t.save}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50"
              >
                {t.cancel}
              </button>
              {state.error && (
                <p className="text-sm text-red-600" role="alert">
                  {state.error}
                </p>
              )}
            </div>
          </form>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <p className="whitespace-pre-wrap text-slate-900">{note.body}</p>
            {canEdit && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="shrink-0 text-xs text-slate-500 underline transition hover:text-slate-900"
              >
                {t.noteEdit}
              </button>
            )}
          </div>
        )}
      </td>

      <td className="p-4 whitespace-nowrap text-slate-500">
        {createdLabel}
        {updatedLabel && (
          <span className="mt-0.5 block text-xs text-slate-400">
            {t.noteChanged} {updatedLabel}
          </span>
        )}
      </td>
    </tr>
  );
}
