import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { getI18n } from "@/lib/i18n-server";
import { TABELAT_E_KOPJES } from "@/lib/backup";
import { formatDate } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Emri i lexueshëm i secilës tabelë. */
const EMRAT: Record<string, "bkTblProfiles" | "bkTblAppointments" | "bkTblNotes" | "bkTblExperts" | "bkTblActivity"> = {
  profiles: "bkTblProfiles",
  appointments: "bkTblAppointments",
  notes: "bkTblNotes",
  appointment_experts: "bkTblExperts",
  activity_days: "bkTblActivity",
};

/**
 * `/admin/kopja` — nxjerrja e të dhënave.
 *
 * Numrat lart nuk janë zbukurim: ata thonë se çfarë PIKËRISHT do të hyjë te
 * skeda. Nëse skeda e shkarkuar ka më pak, diçka ka shkuar keq — dhe kjo
 * është e vetmja mënyrë që njeriu ta vërë re pa hapur skedën.
 */
export default async function BackupPage() {
  const { t, locale } = await getI18n();
  await requireAdmin();
  const supabase = await createClient();

  // Vetëm numërim: asnjë rresht nuk merret këtu.
  const numrat = await Promise.all(
    TABELAT_E_KOPJES.map(async (tabela) => {
      const { count, error } = await supabase
        .from(tabela)
        .select("*", { count: "exact", head: true });
      return { tabela, sa: error ? null : (count ?? 0) };
    })
  );

  const gjithsej = numrat.reduce((s, n) => s + (n.sa ?? 0), 0);

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {t.backupTitle}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t.backupIntro}</p>
      </header>

      {/* ---------- Kopja e plotë ---------- */}
      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">
          {t.backupFullTitle}
        </h2>
        <p className="mt-1 mb-4 text-sm text-slate-500">{t.backupFullHint}</p>

        <table className="mb-5 w-full text-sm">
          <tbody className="divide-y divide-slate-100">
            {numrat.map(({ tabela, sa }) => (
              <tr key={tabela}>
                <td className="py-2 text-slate-700">{t[EMRAT[tabela]]}</td>
                <td className="py-2 text-right tabular-nums text-slate-900">
                  {sa === null ? "—" : sa}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-slate-200">
              <td className="py-2 font-medium text-slate-900">{t.backupTotal}</td>
              <td className="py-2 text-right font-medium tabular-nums text-slate-900">
                {gjithsej}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Lidhje e zakonshme, jo formular: shkarkimi nis menjëherë dhe faqja
            mbetet aty ku është. */}
        <a
          href="/admin/kopja/shkarko?lloji=json"
          className="inline-block rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark"
        >
          {t.backupDownloadFull}
        </a>
        <p className="mt-3 text-xs text-slate-500">
          {t.backupToday(formatDate(new Date().toISOString(), locale))}
        </p>
      </section>

      {/* ---------- Për Excel ---------- */}
      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">
          {t.backupCsvTitle}
        </h2>
        <p className="mt-1 mb-4 text-sm text-slate-500">{t.backupCsvHint}</p>
        <div className="flex flex-wrap gap-2">
          {TABELAT_E_KOPJES.map((tabela) => (
            <a
              key={tabela}
              href={`/admin/kopja/shkarko?lloji=csv&tabela=${tabela}`}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              {t[EMRAT[tabela]]}
            </a>
          ))}
        </div>
      </section>

      {/* ---------- Sa shpesh, dhe ku ---------- */}
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-base font-semibold text-slate-900">
          {t.backupWhereTitle}
        </h2>
        <ul className="mt-2 space-y-2 text-sm text-slate-700">
          <li>• {t.backupWhere1}</li>
          <li>• {t.backupWhere2}</li>
          <li>• {t.backupWhere3}</li>
        </ul>
      </section>
    </main>
  );
}
