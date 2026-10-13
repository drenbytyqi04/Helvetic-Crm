import type { ReactNode } from "react";

/**
 * Pjesët e vogla nga të cilat ndërtohen Dashboard-i dhe Profili.
 *
 * Grafikët janë HTML i thjeshtë — asnjë bibliotekë e jashtme. Një shtyllë
 * është thjesht një kuti me gjerësi në përqindje, prandaj punon kudo dhe
 * ngarkohet menjëherë.
 */

/** Një numër i vetëm, i madh, me etiketën e vet. */
export function StatTile({
  etiketa,
  vlera,
  nen,
}: {
  etiketa: string;
  vlera: string | number;
  nen?: string;
}) {
  return (
    <div
      className="rounded-xl border border-slate-200 bg-white p-4"
      data-stat={etiketa}
    >
      <p className="text-sm text-slate-500">{etiketa}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
        {vlera}
      </p>
      {nen && <p className="mt-0.5 text-xs text-slate-400">{nen}</p>}
    </div>
  );
}

/** Kuti me titull, ku futet një grafik ose një tabelë. */
export function Card({
  titull,
  nen,
  children,
}: {
  titull: string;
  nen?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-base font-semibold text-slate-900">{titull}</h2>
      {nen && <p className="mt-0.5 mb-4 text-xs text-slate-500">{nen}</p>}
      {!nen && <div className="mb-4" />}
      {children}
    </section>
  );
}

/**
 * Një rresht i grafikut me shtylla horizontale.
 *
 * Emri dhe numri shkruhen gjithmonë me shkronja, jo vetëm me ngjyrë — kështu
 * grafiku lexohet edhe nga ai që s'i dallon ngjyrat, edhe i shtypur bardh e zi.
 */
export function BarRow({
  etiketa,
  vlera,
  maks,
  shenja,
  perqindje,
}: {
  etiketa: string;
  vlera: number;
  maks: number;
  /** Etiketa e vogël me ngjyrë përbri emrit (p.sh. statusi). */
  shenja?: ReactNode;
  perqindje?: number;
}) {
  const gjeresi = maks > 0 ? Math.round((vlera / maks) * 100) : 0;

  return (
    <div className="grid grid-cols-[minmax(0,11rem)_1fr_auto] items-center gap-3 py-1.5">
      <div className="flex min-w-0 items-center gap-2">
        {shenja}
        <span className="truncate text-sm text-slate-700">{etiketa}</span>
      </div>

      <div
        className="h-2.5 rounded-full bg-slate-100"
        title={`${etiketa}: ${vlera}`}
      >
        {vlera > 0 && (
          <div
            className="h-2.5 rounded-full bg-brand"
            style={{ width: `${Math.max(gjeresi, 2)}%` }}
          />
        )}
      </div>

      <span className="text-sm tabular-nums text-slate-900">
        {vlera}
        {perqindje !== undefined && (
          <span className="ml-1 text-xs text-slate-400">{perqindje}%</span>
        )}
      </span>
    </div>
  );
}

/**
 * Grafiku i vogël ditor: një shtyllë vertikale për çdo ditë.
 *
 * Lartësia e secilës shtyllë llogaritet në piksela, jo në përqindje.
 * Përqindjet brenda një kutie fleksibile nuk kanë gjithmonë prej nga të
 * maten, prandaj shtyllat dilnin fare pa lartësi.
 *
 * Numri shkruhet vetëm mbi ditën më të lartë — një numër mbi çdo shtyllë do
 * ta bënte grafikun të palexueshëm. Të tjerat i tregon shfletuesi kur rri me
 * miun sipër.
 */
export function DayBars({
  dite,
  njesi = "",
}: {
  dite: { dita: string; etiketa: string; vlera: number }[];
  /** Fjala pas numrit te teksti i miut, p.sh. "min". */
  njesi?: string;
}) {
  const maks = Math.max(1, ...dite.map((d) => d.vlera));
  const LARTESIA = 96;

  return (
    <div>
      <div className="flex items-end gap-1" style={{ height: LARTESIA }}>
        {dite.map((d) => {
          const lart =
            d.vlera > 0
              ? Math.max(4, Math.round((d.vlera / maks) * LARTESIA))
              : 2;
          return (
            <div
              key={d.dita}
              className="relative flex-1"
              style={{ height: LARTESIA }}
              title={`${d.etiketa}: ${d.vlera}${njesi ? ` ${njesi}` : ""}`}
            >
              {d.vlera === maks && maks > 0 && (
                <span
                  className="absolute inset-x-0 text-center text-[10px] tabular-nums text-slate-500"
                  style={{ bottom: lart + 2 }}
                >
                  {d.vlera}
                </span>
              )}
              <div
                className={`absolute bottom-0 w-full rounded-t ${
                  d.vlera > 0 ? "bg-brand" : "bg-slate-200"
                }`}
                style={{ height: lart }}
              />
            </div>
          );
        })}
      </div>

      {/* Çdo e dyta etiketë, që emrat e ditëve të mos hipin mbi njëri-tjetrin. */}
      <div className="mt-1.5 flex gap-1">
        {dite.map((d, i) => (
          <span
            key={d.dita}
            className="flex-1 overflow-hidden text-center text-[10px] whitespace-nowrap text-slate-400"
          >
            {i % 2 === dite.length % 2 ? d.etiketa : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
