import Link from "next/link";
import { BarRow, Card, DayBars, StatTile } from "@/app/stats";
import MonthFilter from "./month-filter";
import { createClient } from "@/lib/supabase/server";
import { merrTeGjitha } from "@/lib/faqet";
import { requireUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n-server";
import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_CATEGORIES,
  categoryStyle,
  appointmentPath,
  beogradDay,
  beogradMonth,
  currentMonth,
  eshteMuaj,
  formatBeograd,
  formatDayShort,
  formatMonth,
  muajtEFundit,
  todayInBeograd,
  roleLabel,
  ROLE_CLASSES,
  type Appointment,
} from "@/lib/types";

/** Një llogari, aq sa i duhet tabelës së punës. */
type Profil = {
  id: string;
  email: string | null;
  role: string;
  active: boolean | null;
};

export const dynamic = "force-dynamic";

/** Sa muaj prapa mund të shohësh. */
const MUAJ = 24;

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const { t, lang, locale } = await getI18n();
  const user = await requireUser();
  const supabase = await createClient();

  const { muaji: muajiParam, view } = await searchParams;
  const muajt = muajtEFundit(MUAJ);
  // Muaji vjen nga adresa dhe mund të jetë çfarëdo. Nëse s'është muaj i
  // vlefshëm, kthehemi te ai i tanishmi në vend që të nxjerrim faqe bosh.
  const muaji =
    typeof muajiParam === "string" && eshteMuaj(muajiParam)
      ? muajiParam
      : currentMonth();
  const sot = todayInBeograd();

  /**
   * Kush sheh çfarë.
   *
   * Admini i sheh të gjitha; mund t'i ngushtojë te të vetat me çelësin.
   * Menaxheri dhe useri shohin vetëm terminet që kanë caktuar vetë.
   *
   * Eksperti është rasti i veçantë: te terminet e tij `user_id` është ai që
   * i caktoi, jo ai vetë. Po ta filtronim sipas `user_id`, do të dilte bosh.
   * Për të, kufirin e ka vënë tashmë baza — sheh vetëm ato që i janë dhënë —
   * prandaj këtu nuk shtohet asgjë.
   */
  const vetemTeMijat = user.isAdmin ? view === "mine" : !user.isExpert;

  /**
   * Kufijtë e muajit, si çaste botërore.
   *
   * Merret një ditë më shumë nga të dyja anët, dhe ndarja e saktë bëhet më
   * poshtë me `beogradMonth`. Ndryshe do të duhej llogaritur me dorë sa është
   * dallimi i Beogradit nga ora botërore atë ditë — dhe ai ndryshon me orën
   * e verës. Kështu përgjigjen e jep kalendari, jo ne.
   */
  const [vitiM, muajiM] = muaji.split("-").map(Number);
  const ngaISO = new Date(Date.UTC(vitiM, muajiM - 1, 1, -36)).toISOString();
  const deriISO = new Date(Date.UTC(vitiM, muajiM, 1, 36)).toISOString();

  /** Terminet e muajit — një faqe, me kufijtë e dhënë. */
  const faqjaETermineve = (nga: number, deri: number) => {
    let k = supabase
      .from("appointments")
      .select("*", { count: "exact" })
      .gte("scheduled_at", ngaISO)
      .lt("scheduled_at", deriISO)
      .order("scheduled_at", { ascending: true });
    if (vetemTeMijat) k = k.eq("user_id", user.id);
    return k.range(nga, deri);
  };

  const [
    terminetResult,
    shenimeGjithsej,
    shenimetEMia,
    profilesResult,
    aksesetResult,
  ] = await Promise.all([
      // Faqe pas faqeje: një muaj i ngarkuar i kalon 1000 terminet, dhe
      // Supabase i pret aty pa dhënë gabim.
      merrTeGjitha<Appointment>(faqjaETermineve, "terminet"),
      // Shënimet numërohen te baza. Më parë merreshin TË GJITHA — çdo shënim
      // i çdo termini, sa herë hapej dashboard-i — vetëm për dy numra.
      // `head: true` s'sjell asnjë rresht: vetëm numrin.
      supabase.from("notes").select("*", { count: "exact", head: true }),
      supabase
        .from("notes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("profiles")
        .select("id, email, role, active")
        .returns<Profil[]>(),
      // Kush ekspert e sheh cilin termin. Tabela është e vogël, por lexohet
      // faqe pas faqeje si çdo tjetër: eksperti nuk cakton termine, prandaj
      // «sa ka bërë» për të del vetëm nga kjo listë.
      user.isAdmin && !vetemTeMijat
        ? merrTeGjitha<{ appointment_id: string; expert_id: string }>(
            (nga, deri) =>
              supabase
                .from("appointment_experts")
                .select("appointment_id, expert_id", { count: "exact" })
                .range(nga, deri),
            "aksesi i ekspertëve"
          )
        : Promise.resolve({ data: [], error: null }),
    ]);

  // Ndarja e saktë e muajit bëhet këtu, me orën e Beogradit.
  const terminet = (terminetResult.data ?? []).filter(
    (a) => beogradMonth(a.scheduled_at) === muaji
  );
  const saShenime = shenimeGjithsej.count ?? 0;
  const saShenimetEMia = shenimetEMia.count ?? 0;
  /**
   * Sa përqind e muajit zë ky numër.
   *
   * Me zero termine, pjesëtimi jep `NaN` dhe te faqja dilte «NaN%» —
   * dukej gabim programi, ndërsa ishte thjesht një muaj bosh.
   */
  const perqind = (sa: number) =>
    terminet.length > 0 ? Math.round((sa / terminet.length) * 100) : 0;

  // ---------- Numrat kryesorë ----------
  const persona = terminet.reduce((s, t) => s + t.persons_count, 0);
  const kontrata = terminet.reduce((s, t) => s + t.contracts_closed, 0);
  // Të suksesshme: u mbajtën DHE dhanë kontratë. Kategoria e mban vetë atë
  // kusht, prandaj mjafton ta numërosh atë.
  const uMbajten = terminet.filter((t) => t.category === "success").length;

  // Sa nga terminet që s'janë më në bisedim përfunduan me sukses. Kjo tregon
  // cilësinë e punës më mirë se numri i thatë i kontratave.
  const teMbyllura = terminet.filter((t) => t.category !== "talking").length;
  const normaMbylljes =
    teMbyllura > 0 ? Math.round((uMbajten / teMbyllura) * 100) : 0;

  const teDeshtuara = terminet.filter((t) => t.category === "failed").length;
  const neBisedim = terminet.filter((t) => t.category === "talking").length;
  const sotTermine = terminet.filter(
    (t) => beogradDay(t.scheduled_at) === sot
  ).length;

  // ---------- Ndarja sipas rezultatit (tri kategoritë) ----------
  // Radha mbetet ajo e kategorive, jo sipas sasisë: tri shtylla që hidhen
  // sa herë ndryshojnë numrat lexohen më keq se tri shtylla që rrinë fiks.
  const sipasStatusit = APPOINTMENT_CATEGORIES.map((c) => ({
    ...c,
    sa: terminet.filter((t) => t.category === c.value).length,
  }));
  const maksStatus = Math.max(1, ...sipasStatusit.map((s) => s.sa));

  // ---------- Arsyet, brenda kategorive ----------
  const sipasArsyes = APPOINTMENT_STATUSES.map((s) => ({
    ...s,
    sa: terminet.filter((t) => t.status === s.value).length,
  }))
    .filter((s) => s.sa > 0)
    .sort((a, b) => b.sa - a.sa);
  const maksArsye = Math.max(1, ...sipasArsyes.map((s) => s.sa));

  // ---------- Ditët e muajit ----------
  // Grafiku tregon ditët e vetë muajit të zgjedhur, jo 14 ditët e fundit:
  // ndryshe do të kishte dy periudha të ndryshme në të njëjtën faqe.
  const ditetEMuajit = Array.from(
    { length: new Date(Date.UTC(vitiM, muajiM, 0)).getUTCDate() },
    (_, i) => `${muaji}-${String(i + 1).padStart(2, "0")}`
  );
  const perDite = ditetEMuajit.map((dita) => ({
    dita,
    etiketa: formatDayShort(dita),
    vlera: terminet.filter((a) => beogradDay(a.scheduled_at) === dita).length,
  }));

  // ---------- Puna e secilit brenda muajit (vetëm për adminin) ----------
  //
  // Një rresht për çdo llogari, edhe për ata që s'kanë bërë asgjë: pikërisht
  // ata janë të vështirët për t'u parë, sepse mungojnë nga çdo listë që
  // ndërtohet mbi terminet.
  //
  // KUJDES te kolona «Termine». Për user, menaxher e admin ajo do të thotë
  // «sa ka caktuar» (`user_id`). Për EKSPERTIN do të thotë «sa i janë dhënë»,
  // sepse eksperti nuk cakton asnjë — te terminet e tij `user_id` është ai që
  // ia caktoi. Po ta numëronim edhe atë sipas `user_id`, çdo ekspert do të
  // dilte me zero, dhe tabela do të gënjente për tërë punën e tij.
  const idetEMuajit = new Set(terminet.map((a) => a.id));
  const terminiSipasId = new Map(terminet.map((a) => [a.id, a]));

  /** Terminet e këtij muaji që i janë dhënë secilit ekspert. */
  const perEkspert = new Map<string, Appointment[]>();
  for (const akses of aksesetResult.data ?? []) {
    if (!idetEMuajit.has(akses.appointment_id)) continue;
    const lista = perEkspert.get(akses.expert_id) ?? [];
    lista.push(terminiSipasId.get(akses.appointment_id)!);
    perEkspert.set(akses.expert_id, lista);
  }

  const puna = (profilesResult.data ?? [])
    .map((p) => {
      const tijat =
        p.role === "expert"
          ? (perEkspert.get(p.id) ?? [])
          : terminet.filter((a) => a.user_id === p.id);
      return {
        id: p.id,
        email: p.email ?? "—",
        role: p.role,
        active: p.active !== false,
        eDhene: p.role === "expert",
        termine: tijat.length,
        suksese: tijat.filter((a) => a.category === "success").length,
        kontrata: tijat.reduce((n, a) => n + a.contracts_closed, 0),
      };
    })
    // Llogaritë pa hyrje mbeten vetëm nëse kanë punë atë muaj: përndryshe
    // tabela do të mbushej me emra që s'punojnë më.
    .filter((r) => r.active || r.termine > 0)
    .sort((a, b) => b.termine - a.termine || a.email.localeCompare(b.email));

  const maksAgjent = Math.max(1, ...puna.map((p) => p.termine));
  const kaEkspert = puna.some((p) => p.eDhene);

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {t.dashTitle}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {user.isExpert
            ? t.dashScopeAssigned
            : vetemTeMijat
              ? t.dashScopeMine
              : t.dashScopeAll}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <MonthFilter
            vlera={muaji}
            muajt={muajt.map((m) => ({
              vlera: m,
              etiketa: formatMonth(m, locale),
            }))}
            vetemTeMijat={vetemTeMijat}
            lang={lang}
          />

          {/* Vetëm admini i sheh të gjitha, prandaj vetëm ai ka ç'të
              ngushtojë. Për të tjerët kufiri s'është zgjedhje. */}
          {user.isAdmin && (
            <nav className="flex gap-2 text-sm">
              <Link
                href={`/dashboard?muaji=${muaji}`}
                className={`rounded-lg px-3 py-1.5 transition ${
                  vetemTeMijat
                    ? "border border-slate-300 text-slate-600 hover:bg-white"
                    : "bg-brand text-white"
                }`}
              >
                {t.dashAll}
              </Link>
              <Link
                href={`/dashboard?muaji=${muaji}&view=mine`}
                className={`rounded-lg px-3 py-1.5 transition ${
                  vetemTeMijat
                    ? "bg-brand text-white"
                    : "border border-slate-300 text-slate-600 hover:bg-white"
                }`}
              >
                {t.dashMine}
              </Link>
            </nav>
          )}
        </div>
      </header>

      {terminetResult.error && (
        <p className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {t.listLoadError}: {terminetResult.error.message}
        </p>
      )}

      {/* ---------- Numrat e mëdhenj ---------- */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          etiketa={t.dashTotal}
          vlera={terminet.length}
          nen={t.dashPersons(persona)}
        />
        <StatTile
          etiketa={t.dashHeld}
          vlera={uMbajten}
          nen={
            terminet.length > 0
              ? t.dashOfAll(Math.round((uMbajten / terminet.length) * 100))
              : t.noValue
          }
        />
        <StatTile
          etiketa={t.dashContracts}
          vlera={kontrata}
          nen={t.dashCloseRate(normaMbylljes)}
        />
        <StatTile
          etiketa={t.catFailed}
          vlera={teDeshtuara}
          nen={sotTermine > 0 ? t.dashTodayN(sotTermine) : t.dashTalkingN(neBisedim)}
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {/* ---------- Statuset ---------- */}
        <Card
          titull={t.dashByStatus}
          nen={t.dashByStatusHint}
        >
          {sipasStatusit.length === 0 ? (
            <p className="text-sm text-slate-500">{t.dashNoAppointments}</p>
          ) : (
            <div>
              {sipasStatusit.map((s) => (
                <BarRow
                  key={s.value}
                  etiketa={t[s.key]}
                  vlera={s.sa}
                  maks={maksStatus}
                  perqindje={perqind(s.sa)}
                  shenja={
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        categoryStyle(s.value).shirit
                      }`}
                    />
                  }
                />
              ))}
            </div>
          )}
        </Card>

        {/* ---------- Arsyet, brenda kategorive ---------- */}
        <Card titull={t.dashByReason} nen={t.dashByReasonHint}>
          {sipasArsyes.length === 0 ? (
            <p className="text-sm text-slate-500">{t.dashNoAppointments}</p>
          ) : (
            <div>
              {sipasArsyes.map((s) => (
                <BarRow
                  key={s.value}
                  etiketa={t[s.key]}
                  vlera={s.sa}
                  maks={maksArsye}
                  perqindje={perqind(s.sa)}
                  shenja={
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        categoryStyle(s.category).shirit
                      }`}
                    />
                  }
                />
              ))}
            </div>
          )}
        </Card>

        {/* ---------- Ditët e fundit ---------- */}
        <Card
          titull={t.dashByDay}
          nen={t.dashByDayHint(formatMonth(muaji, locale))}
        >
          <DayBars dite={perDite} />
        </Card>
      </div>

      {/* ---------- Terminet e radhës ---------- */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card titull={t.dashInMonth} nen={t.dashInMonthHint}>
          {terminet.length === 0 ? (
            <p className="text-sm text-slate-500">{t.dashNoneInMonth}</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {terminet
                .slice(0, 5)
                .map((termini) => (
                  <li key={termini.id}>
                    <Link
                      href={appointmentPath(termini, user.role)}
                      className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition hover:bg-slate-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-slate-900">
                          {termini.nr != null && (
                            <span className="mr-1.5 text-slate-400">
                              #{termini.nr}
                            </span>
                          )}
                          {termini.name}
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                          {formatBeograd(termini.scheduled_at, locale)}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-slate-400">
                        {termini.persons_count} {t.dashPersShort}
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          )}
        </Card>

        <Card titull={t.dashNotes} nen={t.dashNotesHint}>
          <p className="text-3xl font-semibold tracking-tight text-slate-900">
            {saShenime}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {t.dashNotesMine(saShenimetEMia)}
          </p>
        </Card>
      </div>

      {/* ---------- Puna e secilit ----------
           Vetëm admini, dhe vetëm kur sheh të gjitha: te «Të mijat» do të
           ishte një rresht i vetëm. Zë tërë gjerësinë, sepse është tabelë. */}
      {user.isAdmin && !vetemTeMijat && (
        <div className="mt-4">
          <Card titull={t.dashPeople} nen={t.dashPeopleHint(formatMonth(muaji, locale))}>
            {puna.length === 0 ? (
              <p className="text-sm text-slate-500">{t.dashNoAppointments}</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-500">
                        <th className="pb-2 font-medium">{t.dashColPerson}</th>
                        <th className="pb-2 font-medium">{t.dashColRole}</th>
                        <th className="pb-2 pl-3 font-medium">
                          {t.dashColAppointments}
                        </th>
                        <th className="pb-2 pl-3 text-right font-medium">
                          {t.catSuccess}
                        </th>
                        <th className="hidden pb-2 pl-3 text-right font-medium sm:table-cell">
                          {t.colContracts}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {puna.map((p) => (
                        <tr key={p.id}>
                          <td className="py-2 pr-3">
                            <span className="block truncate text-slate-900">
                              {p.email}
                            </span>
                            {!p.active && (
                              <span className="text-xs text-slate-400">
                                {t.usersNoAccess}
                              </span>
                            )}
                          </td>
                          <td className="py-2 pr-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                                ROLE_CLASSES[p.role] ?? ROLE_CLASSES.user
                              }`}
                            >
                              {roleLabel(p.role, t)}
                            </span>
                          </td>
                          {/* Shtylla e vogël bën që radha të lexohet me një
                              vështrim, pa i krahasuar numrat një nga një. */}
                          <td className="w-1/3 py-2 pl-3">
                            <div className="flex items-center gap-2">
                              <div className="h-2 min-w-24 flex-1 rounded-full bg-slate-100">
                                {p.termine > 0 && (
                                  <div
                                    className="h-2 rounded-full bg-brand"
                                    style={{
                                      width: `${Math.max(
                                        Math.round((p.termine / maksAgjent) * 100),
                                        3
                                      )}%`,
                                    }}
                                  />
                                )}
                              </div>
                              <span className="w-8 text-right tabular-nums text-slate-900">
                                {p.termine}
                              </span>
                              {p.eDhene && (
                                <span className="text-xs text-slate-400">*</span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 pl-3 text-right tabular-nums text-slate-900">
                            {p.suksese}
                          </td>
                          <td className="hidden py-2 pl-3 text-right tabular-nums text-slate-900 sm:table-cell">
                            {p.kontrata}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {kaEkspert && (
                  <p className="mt-3 text-xs text-slate-500">
                    * {t.dashExpertNote}
                  </p>
                )}
              </>
            )}
          </Card>
        </div>
      )}
    </main>
  );
}
