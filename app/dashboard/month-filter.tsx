"use client";

import { useRouter } from "next/navigation";
import { DICTS, type Lang } from "@/lib/i18n";

/**
 * Zgjedhja e muajit te dashboard-i.
 *
 * Muaji rri te adresa (`/dashboard?muaji=2026-07`), jo te një gjendje e
 * brendshme. Kështu lidhja mund të dërgohet, të ruhet, dhe kthimi mbrapa i
 * shfletuesit punon si pret njeriu.
 *
 * KUJDES: emrat e muajve vijnë GATI nga serveri, të formatuar atje. Po t'i
 * formatonim këtu, do të varej nga shfletuesi — dhe Chrome-i nuk i ka të
 * njëjtat emra shqip si Node-i. Rezultati ishte një meny që shkruante
 * «August 2026» ndërsa pjesa tjetër e faqes ishte shqip, plus një gabim
 * hidratimi sepse serveri dhe shfletuesi vizatonin tekste të ndryshme.
 */
export default function MonthFilter({
  vlera,
  muajt,
  vetemTeMijat,
  lang,
}: {
  vlera: string;
  /** `{ vlera: "2026-07", etiketa: "korrik 2026" }` — etiketa vjen nga serveri. */
  muajt: { vlera: string; etiketa: string }[];
  /** Ruhet kur ndërrohet muaji, që admini të mos kthehet te «të gjitha». */
  vetemTeMijat: boolean;
  lang: Lang;
}) {
  // Fjalori merret këtu: funksionet e tij nuk kalojnë dot nga serveri.
  const t = DICTS[lang];
  const router = useRouter();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-slate-500">{t.dashMonth}</span>
      <select
        data-testid="month-filter"
        value={vlera}
        onChange={(e) => {
          const p = new URLSearchParams();
          p.set("muaji", e.target.value);
          if (vetemTeMijat) p.set("view", "mine");
          router.push(`/dashboard?${p.toString()}`);
        }}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900 outline-none focus:border-brand"
      >
        {muajt.map((m) => (
          <option key={m.vlera} value={m.vlera}>
            {m.etiketa}
          </option>
        ))}
      </select>
    </label>
  );
}
