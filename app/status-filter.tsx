"use client";

import { useRouter } from "next/navigation";
import { APPOINTMENT_CATEGORIES } from "@/lib/types";
import { adresaEListes, type GjendjaEListes } from "@/lib/lista";
import { DICTS, type Lang } from "@/lib/i18n";

/**
 * Filtri i rezultatit: tri kategoritë.
 *
 * Më parë ishin nëntë statuse. Tani lista ndahet në tri kategori, dhe arsyeja
 * e hollësishme rri brenda terminit.
 *
 * Zgjedhjet e tjera ruhen — pamja «Të mijat», kërkimi, intervali i datave.
 * Adresën e ndërton `adresaEListes`, që asnjëra të mos harrohet.
 */
export default function StatusFilter({
  gjendja,
  lang,
}: {
  gjendja: GjendjaEListes;
  lang: Lang;
}) {
  // Fjalori merret këtu: funksionet e tij nuk kalojnë dot nga serveri.
  const t = DICTS[lang];
  const router = useRouter();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-slate-500">{t.filterStatus}</span>
      <select
        data-testid="status-filter"
        value={gjendja.status}
        onChange={(e) => {
          // Statusi i ri nis nga faqja e parë: rezultatet janë të tjera,
          // prandaj `faqe` nuk jepet dhe bie vetë.
          router.push(adresaEListes(gjendja, { status: e.target.value }));
        }}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900 outline-none focus:border-brand"
      >
        <option value="">{t.filterAll}</option>
        {APPOINTMENT_CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {t[c.key]}
          </option>
        ))}
      </select>
    </label>
  );
}
