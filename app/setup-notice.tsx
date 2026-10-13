/** Shfaqet kur `.env.local` nuk është plotësuar ende. */
export default function SetupNotice() {
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-6">
      <h2 className="text-base font-semibold text-amber-900">
        Lidhja me Supabase nuk është konfiguruar ende
      </h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-amber-900">
        <li>
          Në dosjen e projektit kopjo{" "}
          <code className="rounded bg-amber-100 px-1">.env.local.example</code> si{" "}
          <code className="rounded bg-amber-100 px-1">.env.local</code>:
          <br />
          <code className="rounded bg-amber-100 px-1">
            cp .env.local.example .env.local
          </code>
        </li>
        <li>
          Skeda i ka të dyja vlerat tashmë të mbushura
          (<code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
          dhe{" "}
          <code className="rounded bg-amber-100 px-1">
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
          </code>
          ).
        </li>
        <li>
          Ndale serverin (Ctrl+C) dhe nise sërish me{" "}
          <code className="rounded bg-amber-100 px-1">npm run dev</code>.
        </li>
      </ol>
    </div>
  );
}
