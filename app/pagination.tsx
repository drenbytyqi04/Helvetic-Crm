import Link from "next/link";
import type { Dict } from "@/lib/i18n";

/**
 * Butonat e faqeve poshtë listës: ‹ 1 2 3 … 40 ›
 *
 * Pse faqe e jo scroll i pafund: numri i faqes rri te adresa. Prandaj mund
 * ta dërgosh lidhjen dikujt, ta ruash, ose të kthehesh te e njëjta pikë pasi
 * hap një termin — gjëra që scroll-i i pafund i humb të gjitha.
 *
 * Me 40 faqe nuk vizatohen 40 butona. Duken vetëm e para, e fundit, dhe një
 * fqinjë majtas e djathtas; pjesa tjetër zëvendësohet me «…». Kështu rreshti
 * mbetet i njëjti gjatësi qoftë me 3 faqe, qoftë me 400.
 */

/** Cilat numra faqesh të vizatohen. `null` do të thotë «…». */
function numratEFaqeve(faqja: number, gjithsej: number): (number | null)[] {
  if (gjithsej <= 7) {
    return Array.from({ length: gjithsej }, (_, i) => i + 1);
  }

  const numrat = new Set([1, gjithsej, faqja, faqja - 1, faqja + 1]);
  const rradha = [...numrat]
    .filter((n) => n >= 1 && n <= gjithsej)
    .sort((a, b) => a - b);

  const dalja: (number | null)[] = [];
  let iFundit = 0;
  for (const n of rradha) {
    // Një vrimë prej më shumë se një faqeje bëhet «…». Nëse mungon vetëm
    // një faqe, vizatohet ajo — «…» për një numër të vetëm është më e gjatë
    // se vetë numri.
    if (n - iFundit === 2) dalja.push(iFundit + 1);
    else if (n - iFundit > 2) dalja.push(null);
    dalja.push(n);
    iFundit = n;
  }
  return dalja;
}

const kuti =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm transition";

export default function Pagination({
  faqja,
  gjithsej,
  adresa,
  t,
}: {
  faqja: number;
  gjithsej: number;
  /** Ndërton adresën e një faqeje, duke ruajtur filtrin dhe kërkimin. */
  adresa: (faqe: number) => string;
  t: Dict;
}) {
  if (gjithsej <= 1) return null;

  return (
    <nav
      aria-label={t.pageOf(faqja, gjithsej)}
      className="mt-4 flex flex-wrap items-center justify-center gap-1"
    >
      {faqja > 1 ? (
        <Link
          href={adresa(faqja - 1)}
          rel="prev"
          className={`${kuti} border border-slate-300 text-slate-700 hover:bg-white`}
        >
          ‹ {t.pagePrev}
        </Link>
      ) : (
        <span className={`${kuti} border border-slate-200 text-slate-300`}>
          ‹ {t.pagePrev}
        </span>
      )}

      {numratEFaqeve(faqja, gjithsej).map((n, i) =>
        n === null ? (
          <span key={`x${i}`} className={`${kuti} text-slate-400`}>
            …
          </span>
        ) : n === faqja ? (
          <span
            key={n}
            aria-current="page"
            className={`${kuti} bg-brand font-medium text-white tabular-nums`}
          >
            {n}
          </span>
        ) : (
          <Link
            key={n}
            href={adresa(n)}
            className={`${kuti} border border-slate-300 text-slate-700 tabular-nums hover:bg-white`}
          >
            {n}
          </Link>
        )
      )}

      {faqja < gjithsej ? (
        <Link
          href={adresa(faqja + 1)}
          rel="next"
          className={`${kuti} border border-slate-300 text-slate-700 hover:bg-white`}
        >
          {t.pageNext} ›
        </Link>
      ) : (
        <span className={`${kuti} border border-slate-200 text-slate-300`}>
          {t.pageNext} ›
        </span>
      )}
    </nav>
  );
}
