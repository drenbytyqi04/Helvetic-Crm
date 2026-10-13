import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Leximi i një tabele të tërë, pa humbur rreshta.
 *
 * KURTHI: PostgREST-i i Supabase-it i pret rreshtat te një kufi i vetin
 * (`max-rows`, zakonisht 1000) DHE NUK JEP GABIM. Një `select("*")` mbi 5000
 * termine kthen 1000, me statusin 200. Faqja pastaj numëron mbi ato 1000 dhe
 * tregon një numër më të vogël se e vërteta — pa asnjë shenjë se diçka mungon.
 *
 * Kjo është e rrezikshme pikërisht sepse duket se punon. Prandaj çdo vend që
 * numëron ose mbledh mbi TË GJITHË rreshtat duhet të kalojë nga këtu.
 *
 * Kthimi ka të njëjtën formë si një përgjigje e zakonshme e Supabase-it
 * (`{ data, error }`), që faqet të mos ndryshojnë mënyrën si e trajtojnë
 * gabimin. Nëse numri i rreshtave të marrë s'përputhet me numrin e vërtetë te
 * baza, kjo kthehet si gabim: më mirë një mesazh i kuq sesa numra që gënjejnë.
 */

/** Sa rreshta merren me një kërkesë. Nën kufirin e parazgjedhur të Supabase-it. */
export const FAQJA = 1000;

/** Mbrojtje nga një cikël pa fund, nëse faqosja prishet ndonjëherë. */
const KUFIRI_I_SIGURISE = 1_000_000;

type Pergjigje<T> = {
  data: T[] | null;
  error: PostgrestError | { message: string } | null;
  count: number | null;
};

export async function merrTeGjitha<T>(
  /**
   * Ndërton kërkesën për një faqe. Duhet të ketë `count: "exact"` dhe të mos
   * e vendosë vetë `range()` — atë e vendos kjo.
   */
  faqja: (nga: number, deri: number) => PromiseLike<Pergjigje<T>>,
  /** Emri që del te mesazhi i gabimit, p.sh. «terminet». */
  emri: string
): Promise<{ data: T[]; error: { message: string } | null }> {
  const rreshtat: T[] = [];
  let nga = 0;
  let gjithsej: number | null = null;

  for (;;) {
    const { data, error, count } = await faqja(nga, nga + FAQJA - 1);
    if (error) return { data: rreshtat, error };
    if (gjithsej === null) gjithsej = count ?? null;

    const marre = data ?? [];
    rreshtat.push(...marre);

    if (marre.length < FAQJA) break;
    nga += FAQJA;

    if (rreshtat.length > KUFIRI_I_SIGURISE) {
      return {
        data: rreshtat,
        error: { message: `${emri}: mbi një milion rreshta — ndalur` },
      };
    }
  }

  if (gjithsej !== null && rreshtat.length !== gjithsej) {
    return {
      data: rreshtat,
      error: {
        message: `${emri}: u morën ${rreshtat.length} rreshta nga ${gjithsej} që ka baza`,
      },
    };
  }
  return { data: rreshtat, error: null };
}
