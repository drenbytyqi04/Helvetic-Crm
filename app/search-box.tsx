import Link from "next/link";
import type { Dict } from "@/lib/i18n";
import {
  adresaEListes,
  fushatEFshehura,
  type GjendjaEListes,
} from "@/lib/lista";

/**
 * Kutia e kërkimit mbi listë: emri i personit ose numri i shkurtër (#1234).
 *
 * Me faqe, pa kërkim, gjetja e një personi do të thoshte të kalosh faqe pas
 * faqeje. Prandaj kërkimi shkon bashkë me faqosjen, jo pas saj.
 *
 * Është një `<form method="get">` i thjeshtë, pa JavaScript: shkruan dhe
 * shtyp Enter. Por një formular dërgon vetëm fushat e veta — prandaj çdo
 * zgjedhje tjetër (rezultati, pamja «Të mijat», intervali i datave) udhëton
 * si fushë e fshehur. Listën e tyre e mban `fushatEFshehura`, që një filtër
 * i ri të mos harrohet këtu pa u vënë re.
 */
export default function SearchBox({
  gjendja,
  t,
}: {
  gjendja: GjendjaEListes;
  t: Dict;
}) {
  return (
    <form action="/" method="get" className="flex items-center gap-2">
      {/* Kërkimi i ri nis gjithmonë te faqja e parë: rezultatet janë të
          tjera, prandaj faqja 7 e kërkimit të mëparshëm s'ka kuptim. */}
      {fushatEFshehura(gjendja, "kerko").map((f) => (
        <input key={f.name} type="hidden" name={f.name} value={f.value} />
      ))}

      <label className="sr-only" htmlFor="kerko">
        {t.searchLabel}
      </label>
      <input
        id="kerko"
        name="kerko"
        type="search"
        defaultValue={gjendja.kerko}
        placeholder={t.searchPlaceholder}
        className="w-44 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand sm:w-56"
      />
      <button
        type="submit"
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50"
      >
        {t.searchButton}
      </button>

      {gjendja.kerko && (
        <Link
          href={adresaEListes(gjendja, { kerko: "" })}
          className="text-sm text-slate-500 underline-offset-2 hover:underline"
        >
          {t.searchClear}
        </Link>
      )}
    </form>
  );
}
