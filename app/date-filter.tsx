"use client";

import { useRouter } from "next/navigation";
import { dataShkurt, javaKetu, muajiKetu, todayInBeograd } from "@/lib/types";
import { adresaEListes, type GjendjaEListes } from "@/lib/lista";
import { DICTS, type Lang } from "@/lib/i18n";

/**
 * Filtri sipas datës së TERMINIT — jo sipas datës kur u regjistrua.
 *
 * Ky është dallimi i tërë. Lista renditet sipas kohës së regjistrimit, sepse
 * termini që sapo u shtua duhet gjetur menjëherë. Por pyetja e përditshme e
 * një qendre thirrjesh është tjetër: «çfarë kemi nesër?», «sa termine u bënë
 * javën e kaluar?». Ajo pyetje është për `scheduled_at`.
 *
 * Tri shkurtoret nuk janë zbukurim: «Sot» dhe «Kjo javë» janë pikërisht dy
 * pyetjet që bëhen çdo ditë, dhe pa to do të duheshin dy zgjedhje datash për
 * secilën.
 */
export default function DateFilter({
  gjendja,
  lang,
}: {
  gjendja: GjendjaEListes;
  lang: Lang;
}) {
  // Fjalori merret këtu: funksionet e tij nuk kalojnë dot nga serveri.
  const t = DICTS[lang];
  const router = useRouter();

  const vendos = (nga: string, deri: string) =>
    router.push(adresaEListes(gjendja, { nga, deri }));

  const aktiv = Boolean(gjendja.nga || gjendja.deri);
  const sot = todayInBeograd();
  const java = javaKetu();
  const muaji = muajiKetu();

  const shkurtore =
    "rounded-lg border px-2.5 py-1 text-xs transition " +
    "border-slate-300 text-slate-600 hover:bg-white";
  const shkurtoreZgjedhur =
    "rounded-lg border border-brand bg-brand px-2.5 py-1 text-xs text-white";

  /** A është kjo shkurtore pikërisht intervali që duket tani? */
  const njesoj = (nga: string, deri: string) =>
    gjendja.nga === nga && gjendja.deri === deri;

  const kuti =
    "rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm " +
    "text-slate-900 outline-none focus:border-brand";

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-slate-500">{t.filterDate}</span>

      <label className="sr-only" htmlFor="nga">
        {t.filterDateFrom}
      </label>
      <input
        id="nga"
        data-testid="date-from"
        type="date"
        value={gjendja.nga}
        max={gjendja.deri || undefined}
        aria-label={t.filterDateFrom}
        onChange={(e) => vendos(e.target.value, gjendja.deri)}
        className={kuti}
      />
      <span className="text-slate-400">–</span>
      <label className="sr-only" htmlFor="deri">
        {t.filterDateTo}
      </label>
      <input
        id="deri"
        data-testid="date-to"
        type="date"
        value={gjendja.deri}
        min={gjendja.nga || undefined}
        aria-label={t.filterDateTo}
        onChange={(e) => vendos(gjendja.nga, e.target.value)}
        className={kuti}
      />

      <button
        type="button"
        onClick={() => vendos(sot, sot)}
        className={njesoj(sot, sot) ? shkurtoreZgjedhur : shkurtore}
      >
        {t.filterDateToday}
      </button>
      <button
        type="button"
        onClick={() => vendos(java.nga, java.deri)}
        className={njesoj(java.nga, java.deri) ? shkurtoreZgjedhur : shkurtore}
      >
        {t.filterDateWeek}
      </button>
      <button
        type="button"
        onClick={() => vendos(muaji.nga, muaji.deri)}
        className={njesoj(muaji.nga, muaji.deri) ? shkurtoreZgjedhur : shkurtore}
      >
        {t.filterDateMonth}
      </button>

      {aktiv && (
        <>
          {/* Intervali me shkronjat tona. Fushat lart i vizaton shfletuesi
              sipas gjuhës së VET: një kompjuter në anglisht e shkruan 5
              shtatorin «09/05», dhe kjo lexohet si 9 maji. */}
          <span data-testid="date-range" className="text-slate-500">
            {gjendja.nga ? dataShkurt(gjendja.nga) : "…"}
            {" – "}
            {gjendja.deri ? dataShkurt(gjendja.deri) : "…"}
          </span>
          <button
            type="button"
            data-testid="date-clear"
            onClick={() => vendos("", "")}
            className="text-sm text-slate-500 underline-offset-2 hover:underline"
          >
            {t.filterDateClear}
          </button>
        </>
      )}
    </div>
  );
}
