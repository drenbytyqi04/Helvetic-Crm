import UserForm from "./user-form";
import DeleteUser from "./delete-user";
import PasswordForm from "./password-form";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { getI18n } from "@/lib/i18n-server";
import {
  ROLE_CLASSES,
  beogradDay,
  formatDateOnlyShkurt,
  formatDuration,
  isRecent,
  roleLabel,
  todayInBeograd,
  type ActivityDay,
  type Profile,
} from "@/lib/types";

export const dynamic = "force-dynamic";

/** Një rresht i `puna_per_person()`: sa ka bërë secili. */
type PunaEPersonit = { user_id: string; terminet: number; shenimet: number };

/** Faqja e administratorit: të gjithë përdoruesit dhe sa të dhëna ka secili. */
export default async function AdminPage() {
  // Kush s'është admin, dërgohet te faqja kryesore.
  // Vetëm admini e hap këtë faqe.
  const { t, lang, locale } = await getI18n();
  const admin = await requireAdmin();
  const supabase = await createClient();

  // Dita e sotme sipas orës së Beogradit, si te funksioni në bazë.
  const sot = todayInBeograd();

  const [profilesResult, punaResult, activityResult] =
    await Promise.all([
    // VETËM LLOGARITË QË HYJNË ENDE.
    //
    // Më parë këtu dilnin edhe ato me hyrjen e hequr, të shënuara «pa hyrje»,
    // që emri i tyre të mos zhdukej. Por lista mbushej: sa herë hapet sërish
    // një llogari me të njëjtin email, rreshti i vjetër mbetet përkrah të
    // riut — dhe pas disa muajsh gjysma e listës janë llogari që nuk hyjnë
    // dot më. Ato as nuk ndryshohen dot: nuk kanë as fjalëkalim për të
    // ndërruar, as hyrje për t'u hequr.
    //
    // Të dhënat e tyre NUK preken: terminet, shënimet dhe orët mbeten te
    // baza dhe vazhdojnë të mbajnë emrin e autorit, ashtu si më parë. Edhe
    // kopja e të dhënave (Pjesa 12) i merr të gjitha llogaritë, përfshirë
    // këto. Ndryshon vetëm kjo listë.
    supabase
      .from("profiles")
      .select("id, email, role, active, created_at")
      .eq("active", true)
      // Llogaritë e shënuara `hidden` nuk duken këtu për ASKËND — as për
      // adminët e tjerë (`supabase/llogari-e-fshehur.sql`). Kjo ndryshon
      // vetëm pamjen e kësaj liste: ato hyjnë si gjithmonë, e mbajnë rolin,
      // dhe puna e tyre numërohet kudo tjetër.
      //
      // Shenja vihet nga paneli i Supabase-it, si roli. Tabela `profiles` ka
      // një rregull të vetëm leximi dhe asnjë rregull ndryshimi, prandaj as
      // admini nuk e prek dot këtë kolonë nga faqja.
      .eq("hidden", false)
      .order("created_at", { ascending: true })
      .returns<Profile[]>(),
    // Numërimin e bën baza (`supabase/numrat.sql`): një rresht për person, në
    // vend të TË GJITHA termineve dhe TË GJITHA shënimeve. Ashtu si ishte,
    // mbi 1000 rreshta Supabase i priste në heshtje dhe numrat dilnin të
    // gabuar — më të vegjël se e vërteta, pa asnjë shenjë.
    supabase.rpc("puna_per_person"),
    supabase
      .from("activity_days")
      .select("user_id, day, active_seconds, last_seen_at")
      .eq("day", sot)
      .returns<ActivityDay[]>(),
  ]);

  const profiles = profilesResult.data ?? [];

  const termineCounts = new Map<string, number>();
  const noteCounts = new Map<string, number>();
  // Tipi vjen nga vetë funksioni te baza; këtu thuhet shprehimisht, sepse
  // tipat e Supabase-it nuk e njohin një funksion që s'është te skema e tyre.
  const puna = (punaResult.data ?? []) as PunaEPersonit[];
  for (const rresht of puna) {
    termineCounts.set(rresht.user_id, Number(rresht.terminet));
    noteCounts.set(rresht.user_id, Number(rresht.shenimet));
  }

  // Aktiviteti i sotëm: sa kohë dhe kur u pa së fundi.
  const sotSekonda = new Map<string, number>();
  const paSeFundi = new Map<string, string>();
  for (const rresht of activityResult.data ?? []) {
    sotSekonda.set(rresht.user_id, rresht.active_seconds);
    paSeFundi.set(rresht.user_id, rresht.last_seen_at);
  }
  const eshteAktiv = (userId: string) => isRecent(paSeFundi.get(userId));

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10">
      {/* Lidhjet, emaili dhe "Dil" rrinë te menyja anash. */}
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {t.usersTitle}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {t.usersSubtitle}
        </p>
      </header>

      <UserForm lang={lang} />

      {profilesResult.error && (
        <p className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {t.usersLoadError}: {profilesResult.error.message}
        </p>
      )}

      {/* Pa këtë, mungesa e funksionit do të dukej si «të gjithë kanë zero» —
          pikërisht numri i gabuar që u desh të hiqej. */}
      {punaResult.error && (
        <p className="mb-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
          {t.usersCountsMissing}
        </p>
      )}

      {/* PA SCROLL ANËSOR — tabela hyn e tëra brenda ekranit.
          Me `p-4` te shtatë kolona, vetëm hapësira e brendshme zinte 224px.
          Shtoji emailin me `whitespace-nowrap`, datën e plotë («11. September
          2026») dhe dy butonat njëri pas tjetrit, dhe tabela kërkonte 1023px
          kur dritarja i jepte më së shumti 982. Pra rrëshqiste gjithmonë,
          edhe te ekrani më i gjerë.

          Tani: hapësira zvogëlohet, emaili dhe data thyhen, butonat rrinë
          njëri mbi tjetrin kur s'ka vend, dhe kolonat dytësore vijnë vetëm
          kur ka hapësirë. */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-2 py-3 font-medium md:px-3 lg:px-4">{t.usersColEmail}</th>
              <th className="px-2 py-3 font-medium md:px-3 lg:px-4">{t.usersColRole}</th>
              <th className="hidden px-2 py-3 font-medium lg:table-cell lg:px-4">{t.usersColActiveToday}</th>
              <th className="hidden px-2 py-3 font-medium md:table-cell md:px-3 lg:px-4">{t.usersColAppointments}</th>
              <th className="hidden px-2 py-3 font-medium md:table-cell md:px-3 lg:px-4">{t.usersColNotes}</th>
              <th className="hidden px-2 py-3 font-medium lg:table-cell lg:px-4">{t.usersColRegistered}</th>
              <th className="px-2 py-3 font-medium md:px-3 lg:px-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {profiles.map((profile) => (
              <tr key={profile.id}>
                <td className="px-2 py-3 md:px-3 lg:px-4">
                  {/* `flex-wrap` + `break-all`: emaili është një fjalë e vetme
                      e gjatë. Me `whitespace-nowrap` kolona nuk ngushtohej dot
                      nën gjatësinë e tij — 249px vetëm për të. */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span
                      className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                        eshteAktiv(profile.id) ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                      title={eshteAktiv(profile.id) ? t.usersActiveNow : t.usersNotActive}
                    />
                    {/* Pa shenjën «pa hyrje»: llogaritë e hequra nuk vijnë
                        më deri këtu, prandaj çdo rresht i kësaj liste është
                        një llogari që hyn. */}
                    <span className="min-w-0 break-all text-slate-900">
                      {profile.email ?? "—"}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-3 md:px-3 lg:px-4">
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                      ROLE_CLASSES[profile.role] ?? ROLE_CLASSES.user
                    }`}
                  >
                    {roleLabel(profile.role, t)}
                  </span>
                </td>
                <td className="hidden px-2 py-3 whitespace-nowrap text-slate-600 lg:table-cell lg:px-4">
                  {formatDuration(sotSekonda.get(profile.id) ?? 0)}
                </td>
                <td className="hidden px-2 py-3 text-slate-600 tabular-nums md:table-cell md:px-3 lg:px-4">
                  {termineCounts.get(profile.id) ?? 0}
                </td>
                <td className="hidden px-2 py-3 text-slate-600 tabular-nums md:table-cell md:px-3 lg:px-4">
                  {noteCounts.get(profile.id) ?? 0}
                </td>
                <td className="hidden px-2 py-3 text-slate-500 lg:table-cell lg:px-4">
                  {formatDateOnlyShkurt(beogradDay(profile.created_at), locale)}
                </td>
                <td className="px-2 py-3 align-middle md:px-3 lg:px-4">
                  {/* Dy veprimet e llogarisë: i pari e rikthen personin në
                      punë, i dyti e nxjerr jashtë. Etiketa e secilit mbetet
                      në një rresht (`nowrap` te vetë butoni), por të dy bashkë
                      thyhen njëri mbi tjetrin kur kolona ngushtohet — kjo është
                      ajo që e lejon tabelën të hyjë te ekrani i vogël. */}
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <PasswordForm
                      userId={profile.id}
                      email={profile.email ?? "—"}
                      aktiv={profile.active}
                      lang={lang}
                    />
                  <DeleteUser
                    userId={profile.id}
                    email={profile.email ?? "—"}
                    termine={termineCounts.get(profile.id) ?? 0}
                    shenime={noteCounts.get(profile.id) ?? 0}
                    vetja={profile.id === admin.id}
                    lang={lang}
                    aktiv={profile.active}
                  />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-slate-500">
        {t.usersKeepDataNote}
      </p>

      <p className="mt-3 text-sm text-slate-500">
        {t.usersRolesNote}{" "}
        <code className="rounded bg-slate-100 px-1">user</code>,{" "}
        <code className="rounded bg-slate-100 px-1">manager</code>,{" "}
        <code className="rounded bg-slate-100 px-1">admin</code>.
      </p>
    </main>
  );
}
