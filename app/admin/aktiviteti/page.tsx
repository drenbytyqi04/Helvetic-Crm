import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { getI18n } from "@/lib/i18n-server";
import {
  formatDayLabel,
  formatDuration,
  isRecent,
  todayInBeograd,
  type ActivityDay,
  type Profile,
} from "@/lib/types";

export const dynamic = "force-dynamic";

/** Sa ditë prapa shfaqen në tabelë. */
const DITE = 7;

/** Lista e ditëve, nga më e vjetra te sotmja. */
function ditetEFundit(): string[] {
  const sot = new Date(`${todayInBeograd()}T12:00:00Z`);
  const lista: string[] = [];
  for (let i = DITE - 1; i >= 0; i--) {
    const d = new Date(sot);
    d.setUTCDate(d.getUTCDate() - i);
    lista.push(d.toISOString().slice(0, 10));
  }
  return lista;
}

export default async function ActivityPage() {
  // Vetëm admini e hap këtë faqe.
  const { t, locale } = await getI18n();
  await requireAdmin();
  const supabase = await createClient();

  const dite = ditetEFundit();
  const sot = dite[dite.length - 1];

  const [profilesResult, activityResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, role, created_at")
      .order("created_at", { ascending: true })
      .returns<Profile[]>(),
    supabase
      .from("activity_days")
      .select("user_id, day, active_seconds, last_seen_at")
      .gte("day", dite[0])
      .returns<ActivityDay[]>(),
  ]);

  const profiles = profilesResult.data ?? [];
  const activity = activityResult.data ?? [];

  // Kërkim i shpejtë: "përdoruesi X, dita Y" -> sekondat.
  const perDite = new Map<string, number>();
  // t.activityLastSeen merret vetëm nga rreshti i sotëm — një rresht i djeshëm
  // nuk mund të tregojë se dikush është aktiv tani.
  const iFundit = new Map<string, string>();
  for (const rresht of activity) {
    perDite.set(`${rresht.user_id}|${rresht.day}`, rresht.active_seconds);
    if (rresht.day === sot) {
      iFundit.set(rresht.user_id, rresht.last_seen_at);
    }
  }

  // "Aktiv tani" = është parë brenda 5 minutave të fundit.
  const eshteAktiv = (userId: string) => isRecent(iFundit.get(userId));

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {t.activityTitle}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {t.activitySubtitle}
        </p>
      </header>

      {activityResult.error && (
        <p className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {t.activityLoadError}: {activityResult.error.message}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="p-4 font-medium">{t.activityColUser}</th>
              {dite.map((d) => (
                <th
                  key={d}
                  className={`p-4 text-right font-medium whitespace-nowrap ${
                    d === sot ? "text-slate-900" : ""
                  }`}
                >
                  {d === sot ? t.activityToday : formatDayLabel(d, locale)}
                </th>
              ))}
              <th className="p-4 text-right font-medium">{t.activityColTotal}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {profiles.map((profile) => {
              const gjithsej = dite.reduce(
                (sum, d) => sum + (perDite.get(`${profile.id}|${d}`) ?? 0),
                0
              );
              return (
                <tr key={profile.id}>
                  <td className="p-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          eshteAktiv(profile.id)
                            ? "bg-emerald-500"
                            : "bg-slate-300"
                        }`}
                        title={eshteAktiv(profile.id) ? t.usersActiveNow : t.usersNotActive}
                      />
                      <span className="text-slate-900">
                        {profile.email ?? "—"}
                      </span>
                    </div>
                  </td>
                  {dite.map((d) => {
                    const sek = perDite.get(`${profile.id}|${d}`) ?? 0;
                    return (
                      <td
                        key={d}
                        className={`p-4 text-right whitespace-nowrap ${
                          sek > 0 ? "text-slate-700" : "text-slate-300"
                        }`}
                      >
                        {formatDuration(sek)}
                      </td>
                    );
                  })}
                  <td className="p-4 text-right font-medium whitespace-nowrap text-slate-900">
                    {formatDuration(gjithsej)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-500">
        <p>
          Pika jeshile do të thotë se përdoruesi është parë brenda 5 minutave të
          fundit.
        </p>
        <p>
          Koha numërohet vetëm kur faqja e CRM-së është e hapur dhe e dukshme, me
          më së shumti 5 minuta për çdo ndërprerje. Pra kjo mat kohën në
          aplikacion — jo çdo punë që bëhet me telefon apo jashtë tij.
        </p>
      </div>
    </main>
  );
}
