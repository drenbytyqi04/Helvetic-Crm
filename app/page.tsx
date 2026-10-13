import Link from "next/link";
import AppointmentForm from "./terminet/appointment-form";
import SetupNotice from "./setup-notice";
import StatusFilter from "./status-filter";
import DateFilter from "./date-filter";
import Pagination from "./pagination";
import SearchBox from "./search-box";
import BulkAssign from "./bulk-assign";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n-server";
import {
  APPOINTMENT_COLUMNS,
  APPOINTMENT_CATEGORIES,
  appointmentCategoryLabel,
  appointmentPath,
  categoryStyle,
  defaultAppointmentSlot,
  ditaTjeter,
  eshteDite,
  fillimiIDites,
  formatDuration,
  formatBeogradNdare,
  todayInBeograd,
  type Appointment,
} from "@/lib/types";
import { adresaEListes, type GjendjaEListes } from "@/lib/lista";

// I thotë Next.js-it ta ndërtojë faqen sa herë hapet, që lista të jetë e freskët.
export const dynamic = "force-dynamic";

/**
 * Sa termine në një faqe.
 *
 * Më parë lista i merrte të gjitha. Me 2000 termine faqja dilte 1.6 MB dhe
 * 90 000 piksela e gjatë — rreth 100 ekrane scroll. Kolona e shënimeve
 * prishej fare: adresa e kërkesës arrinte 72 KB dhe serveri e kthente me
 * gabimin 431, prandaj çdo rresht tregonte 0 shënime edhe kur kishte.
 *
 * 50 është aq sa mbush një ekran e ca: sheh menjëherë ku je, dhe faqja
 * mbetet nën 100 KB.
 */
const FAQE_MADHESIA = 50;

export default async function Page({ searchParams }: PageProps<"/">) {
  const { t, lang, locale } = await getI18n();

  if (!hasSupabaseConfig()) {
    return (
      <main className="mx-auto w-full max-w-5xl px-5 py-10">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-slate-900">
          {t.listTitle}
        </h1>
        <SetupNotice />
      </main>
    );
  }

  const user = await requireUser();
  const supabase = await createClient();

  const { status, view, kerko, faqe, nga, deri } = await searchParams;
  const filtri = typeof status === "string" ? status : "";
  const kerkimi = typeof kerko === "string" ? kerko.trim() : "";
  // Datat vijnë nga adresa dhe mund të jenë çfarëdo: «dje», «2026-02-31»,
  // gjysma e një date. Çdo gjë që s'është ditë e vërtetë hidhet poshtë dhe
  // trajtohet si e pazgjedhur — më mirë lista e plotë se një filtër që
  // heshtazi nuk kthen asgjë.
  const dataNga = typeof nga === "string" && eshteDite(nga) ? nga : "";
  const dataDeri = typeof deri === "string" && eshteDite(deri) ? deri : "";
  // I kthyer: kush shkruan «nga 10 shtatori deri më 5» do të thotë 5–10.
  // Alternativa — një listë bosh — e lë njeriun të mendojë se s'ka termine.
  const [ditaNga, ditaDeri] =
    dataNga && dataDeri && dataNga > dataDeri
      ? [dataDeri, dataNga]
      : [dataNga, dataDeri];
  const meDate = Boolean(ditaNga || ditaDeri);
  // Faqja vjen nga adresa dhe mund të jetë çfarëdo: «abc», «-3», «99999».
  // Prandaj kthehet në numër dhe kufizohet më poshtë, pasi dimë sa faqe ka.
  const faqjaEKerkuar = Math.max(1, Number(faqe) || 1);
  // Kush i sheh të gjitha, dhe kush vetëm të vetat.
  //
  // Menaxheri dhe admini i shohin të gjitha, me çelësin «Të mijat» për t'i
  // ngushtuar. Përdoruesi i thjeshtë ka vetëm të vetat, gjithmonë.
  //
  // Eksperti bën përjashtim dhe duhet lënë te «të gjitha»: te terminet e tij
  // `user_id` është ai që ia caktoi, jo vetë ai. Filtri sipas `user_id` do t'i
  // dilte bosh. Për të e bën ndarjen vetë baza (`supabase/eksperti.sql`).
  const showAll = user.isManager ? view !== "mine" : user.isExpert;
  const sot = todayInBeograd();

  // Radha: i fundit i regjistruar rri lart. Kështu termini që sapo u shtua
  // gjendet menjëherë, pa varur nga data për të cilën është caktuar.
  const kategoriaIVlefshme = APPOINTMENT_CATEGORIES.some((c) => c.value === filtri);

  // `count: "exact"` e bën bazën ta numërojë tërë grupin, edhe pse kthen
  // vetëm një faqe. Pa të nuk dihet sa faqe ka — dhe përmbledhja lart do të
  // tregonte 50 në vend të 2000.
  let query = supabase
    .from("appointments")
    .select(APPOINTMENT_COLUMNS, { count: "exact" });

  // Radha ndryshon bashkë me pyetjen që bën njeriu.
  //
  // Pa filtër date, pyetja është «çfarë u shtua së fundi» — prandaj lart rri
  // i fundit i regjistruar. Me filtër date, pyetja është tjetër: «si e kemi
  // të mërkurën». Atë e lexon vetëm një listë e renditur sipas orës së
  // terminit, nga i pari i ditës te i fundit — përndryshe orari i një dite
  // do të dilte i përzier sipas kohës kur dikush e futi te sistemi.
  //
  // Ndarësi i dytë është i detyrueshëm në të dyja rastet, sepse lista është
  // e ndarë në faqe. Dy termine me të njëjtin çast kanë radhë të
  // papërcaktuar: baza mund t'i kthejë ndryshe sa herë, dhe atëherë i njëjti
  // termin del në dy faqe ose në asnjërën. `nr` është unik, prandaj e mbyll.
  query = meDate
    ? query
        .order("scheduled_at", { ascending: true })
        .order("nr", { ascending: true })
    : query
        .order("created_at", { ascending: false })
        .order("nr", { ascending: false });

  if (!showAll) query = query.eq("user_id", user.id);

  // Data e zgjedhur do të thotë ditë e tërë e Beogradit. Fundi është i
  // hapur — «< fillimi i ditës pasardhëse» — sepse «deri më 5» duhet t'i
  // marrë edhe terminet e orës 17:00 të asaj dite; me `<= 5` do të mbetej
  // vetëm mesnata.
  const nisja = ditaNga ? fillimiIDites(ditaNga) : null;
  const fundi = ditaDeri ? fillimiIDites(ditaTjeter(ditaDeri)) : null;
  if (nisja) query = query.gte("scheduled_at", nisja);
  if (fundi) query = query.lt("scheduled_at", fundi);
  if (kategoriaIVlefshme) query = query.eq("category", filtri);
  if (kerkimi) {
    // Emri kudo brenda tekstit, ose numri i shkurtër i saktë (#1234).
    const siNumer = /^#?\d+$/.test(kerkimi) ? Number(kerkimi.replace("#", "")) : null;
    query = siNumer
      ? query.or(`name.ilike.%${kerkimi}%,nr.eq.${siNumer}`)
      : query.ilike("name", `%${kerkimi}%`);
  }

  // Faqja e parë merret gjithmonë; nëse numri i kërkuar del jashtë, faqja
  // rregullohet pasi dimë sa rreshta ka gjithsej.
  const rreshtiIPare = (faqjaEKerkuar - 1) * FAQE_MADHESIA;
  const terminetResult = await query
    .range(rreshtiIPare, rreshtiIPare + FAQE_MADHESIA - 1)
    .returns<Appointment[]>();

  const terminet = terminetResult.data ?? [];
  const sagjithsej = terminetResult.count ?? terminet.length;
  const faqeGjithsej = Math.max(1, Math.ceil(sagjithsej / FAQE_MADHESIA));
  const faqja = Math.min(faqjaEKerkuar, faqeGjithsej);

  /**
   * Adresa e listës me këto zgjedhje.
   *
   * Çdo lidhje e listës — «Të gjitha», «Të mijat», butonat e faqeve — e
   * ndërton adresën këtu, që asnjëra të mos harrojë ndonjë parametër. Kur
   * ndryshon filtri ose pamja, `faqe` bie qëllimisht: rezultatet janë të
   * tjera, prandaj faqja 7 e mëparshme s'ka kuptim.
   */
  // Të gjitha zgjedhjet e listës në një vend. Adresën e ndërton vetëm
  // `adresaEListes` te `lib/lista.ts`, dhe të gjitha pjesët e faqes — menyja
  // e rezultatit, kutia e kërkimit, filtri i datës, butonat e faqeve — e
  // thërrasin atë. Kështu asnjëra s'i harron zgjedhjet e tjetrës.
  //
  // `view` ka kuptim vetëm aty ku ka çelës: te menaxheri dhe admini. Për të
  // tjerët do të ishte një parametër që s'ndryshon asgjë.
  const gjendja: GjendjaEListes = {
    status: filtri,
    vetemTeMijat: user.isManager && !showAll,
    kerko: kerkimi,
    nga: ditaNga,
    deri: ditaDeri,
  };
  const adresa = (
    ndryshimi: Partial<GjendjaEListes> & { faqe?: number } = {}
  ) => adresaEListes(gjendja, ndryshimi);

  const [notesResult, aksesetResult, agjentetResult, aktivitetiIm, permbledhja] = await Promise.all([
    // Shënimet vetëm për terminet e KËSAJ faqeje. Me të gjitha id-të, adresa
    // e kërkesës arrinte 72 KB dhe serveri e kthente me 431 — pa gabim të
    // dukshëm, thjesht çdo rresht tregonte 0 shënime.
    terminet.length > 0
      ? supabase
          .from("notes")
          .select("appointment_id")
          .in(
            "appointment_id",
            terminet.map((t) => t.id)
          )
          .returns<{ appointment_id: string }[]>()
      : Promise.resolve({ data: [], error: null }),
    // Kujt i është dhënë secili termin — vetëm për terminet e KËSAJ faqeje,
    // për të njëjtën arsye si te shënimet: me të gjitha id-të adresa e
    // kërkesës del shumë e gjatë dhe serveri e kthen me 431.
    //
    // Vetëm për menaxherin dhe adminin, dhe kjo s'është zgjedhje pamjeje:
    // rregulli i bazës e lejon ekspertin të shohë VETËM rreshtat e vet, dhe
    // përdoruesin e thjeshtë asnjë. Po ta tregonim kolonën edhe atyre, te
    // eksperti do të dilte emri i tij te çdo rresht — pa ata që e ndajnë
    // terminin bashkë me të — dhe te useri do të dilte bosh edhe kur termini
    // i tij ËSHTË dhënë. Një kolonë që gënjen është më keq se asnjë kolonë.
    terminet.length > 0 && user.isManager
      ? supabase
          .from("appointment_experts")
          .select("appointment_id, expert_id")
          .in(
            "appointment_id",
            terminet.map((t) => t.id)
          )
          .returns<{ appointment_id: string; expert_id: string }[]>()
      : Promise.resolve({ data: [], error: null }),
    // `active` lexohet bashkë me të tjerat: emailet e TË GJITHËVE duhen për
    // kolonën «kush e caktoi» — edhe të atyre që s'hyjnë më — kurse te menyja
    // e ekspertëve duhen vetëm ata që hyjnë ende.
    supabase
      .from("profiles")
      .select("id, email, role, active")
      .returns<
        { id: string; email: string | null; role: string; active: boolean | null }[]
      >(),
    // Koha ime e sotme — çdo përdorues e sheh numrin e vet.
    supabase
      .from("activity_days")
      .select("active_seconds")
      .eq("user_id", user.id)
      .eq("day", sot)
      .maybeSingle<{ active_seconds: number }>(),
    // Numrat e përmbledhjes janë të TËRË grupit, jo të faqes që sheh.
    // Prandaj i llogarit baza (`supabase/faqosja.sql`) dhe kthen tre numra
    // në vend të mijëra rreshtave.
    // Filtri i datës i kalohet edhe këtu, dhe kjo nuk është hollësi: pa të,
    // lista poshtë do të tregonte terminet e një jave, kurse tre numrat lart
    // do të mbeteshin të gjithë bazës. Dy të vërteta të ndryshme në të
    // njëjtin ekran janë më keq se asnjë numër fare.
    supabase
      .rpc("appointments_summary", {
        p_user: showAll ? null : user.id,
        p_category: kategoriaIVlefshme ? filtri : null,
        p_search: kerkimi || null,
        p_from: nisja,
        p_to: fundi,
      })
      .maybeSingle<{ total: number; held: number; contracts: number }>(),
  ]);

  const noteCounts = new Map<string, number>();
  for (const n of notesResult.data ?? []) {
    noteCounts.set(n.appointment_id, (noteCounts.get(n.appointment_id) ?? 0) + 1);
  }
  const agjentet = new Map(
    (agjentetResult.data ?? []).map((p) => [p.id, p.email ?? "—"])
  );

  // Ekspertët e secilit termin, sipas id-së së terminit.
  //
  // Emrat merren nga `agjentet`, që i ka TË GJITHË profilet — edhe ata pa
  // hyrje. Një termin i dhënë dikujt që më pas i është hequr hyrja duhet të
  // vazhdojë ta tregojë atë emër: ndryshe rreshti do të dukej i padhënë,
  // kurse në të vërtetë rri te dikush që s'e hap dot.
  //
  // Radha alfabetike: pa të, baza mund t'i kthejë ndryshe sa herë, dhe i
  // njëjti rresht do të ndërronte pamje pa ndryshuar asgjë.
  const ekspertetETerminit = new Map<string, string[]>();
  for (const rr of aksesetResult.data ?? []) {
    const lista = ekspertetETerminit.get(rr.appointment_id) ?? [];
    lista.push(agjentet.get(rr.expert_id) ?? "—");
    ekspertetETerminit.set(rr.appointment_id, lista);
  }
  for (const lista of ekspertetETerminit.values()) lista.sort();

  // Shiriti i zgjedhjes duket për menaxherin dhe adminin, dhe vetëm nëse ka
  // të kujt t'ia japë. Kufiri i vërtetë rri te baza; kjo është thjesht pamje.
  const eksperte = user.isManager
    ? (agjentetResult.data ?? [])
        // Vetëm ekspertët që hyjnë ende: një termin i dhënë dikujt pa hyrje
        // mbetet pa u parë nga askush, dhe asgjë s'e tregon.
        .filter((p) => p.role === "expert" && p.active !== false)
        .map((p) => ({ id: p.id, email: p.email ?? "—" }))
    : [];
  const meZgjedhje = user.isManager && eksperte.length > 0;

  // Kolona «Eksperti» duket vetëm për menaxherin dhe adminin — shih kërkesën
  // te `Promise.all` më lart. Ndryshe nga shiriti i zgjedhjes, ajo nuk varet
  // nga ekzistenca e ekspertëve: pa asnjë ekspert, kolona tregon «—» te çdo
  // rresht, dhe kjo është e vërteta.
  const meEkspert = user.isManager;

  // Nëse `supabase/faqosja.sql` s'është ngritur ende, funksioni mungon.
  // Atëherë tregohet vetëm numri i termineve — i saktë gjithsesi, sepse vjen
  // nga `count`. Më mirë një numër më pak se tre numra të gabuar.
  const numrat = permbledhja.data;
  const uMbajten = numrat?.held ?? null;
  const kontrata = numrat?.contracts ?? null;

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {t.listTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {uMbajten != null && kontrata != null
              ? t.listSummary(sagjithsej, uMbajten, kontrata)
              : t.listSummaryShort(sagjithsej)}
            {faqeGjithsej > 1 && (
              <span className="text-slate-400">
                {" · "}
                {t.pageOf(faqja, faqeGjithsej)}
              </span>
            )}
          </p>
        </div>

        {/* Emaili, roli dhe "Dil" rrinë te menyja anash. */}
        <span
          className="shrink-0 text-sm text-slate-500"
          title={t.activeTodayTitle}
        >
          {t.activeToday}: {formatDuration(aktivitetiIm.data?.active_seconds ?? 0)}
        </span>
      </header>

      {user.isManager && (
          <nav className="mb-4 flex gap-2 text-sm">
            <Link
              href={adresa({ vetemTeMijat: false })}
              className={`rounded-lg px-3 py-1.5 transition ${
                showAll
                  ? "bg-brand text-white"
                  : "border border-slate-300 text-slate-600 hover:bg-white"
              }`}
            >
              {t.listAll}
            </Link>
            <Link
              href={adresa({ vetemTeMijat: true })}
              className={`rounded-lg px-3 py-1.5 transition ${
                showAll
                  ? "border border-slate-300 text-slate-600 hover:bg-white"
                  : "bg-brand text-white"
              }`}
            >
              {t.listMine}
            </Link>
          </nav>
      )}

      {/* Termin të ri cakton kushdo veç ekspertit. Përdoruesi i thjeshtë e
          sheh pastaj vetëm atë që caktoi vetë. */}
      {user.canCreate && (
          <details className="mb-6 rounded-xl border border-slate-200 bg-white">
            <summary className="cursor-pointer px-5 py-4 text-sm font-medium text-slate-700 select-none">
              {t.listNewAppointment}
            </summary>
            <div className="border-t border-slate-200 p-5">
              <AppointmentForm
                scheduledDefault={defaultAppointmentSlot()}
                lang={lang}
              />
            </div>
          </details>
      )}

      <div className="mb-4 space-y-3 rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusFilter gjendja={gjendja} lang={lang} />
          <SearchBox gjendja={gjendja} t={t} />
        </div>
        <div className="border-t border-slate-100 pt-3">
          <DateFilter gjendja={gjendja} lang={lang} />
        </div>
      </div>

      {terminetResult.error && (
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {t.listLoadError}: {terminetResult.error.message}
        </p>
      )}

      {terminet.length === 0 && !terminetResult.error ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          {kerkimi
            ? t.searchNoResult(kerkimi)
            : meDate
              ? t.dateNoResult
              : user.isExpert
                ? t.expertNoAppointments
                : t.listEmpty}
        </p>
      ) : (
        <BulkAssign eksperte={eksperte} lang={lang} vetemFemijet={!meZgjedhje}>
        {/* PA SCROLL ANËSOR.
            Tabela hyn e tëra brenda ekranit dhe asnjë kolonë nuk mbetet e
            fshehur pas një shiriti rrëshqitës që duhet tërhequr me dorë.
            Kjo kërkon tri gjëra bashkë, dhe asnjëra s'mjafton vetëm:

              1. Asgjë e gjatë me `whitespace-nowrap`. Data ishte teksti më i
                 gjatë dhe e ndaluar të thyhej — vetëm ajo e nxirrte tabelën
                 jashtë. Tani rri në dy rreshta.
              2. Emaili nën emër thyhet kudo (`break-all`). Pa këtë, një adresë
                 e gjatë është një «fjalë» e vetme që kolona s'e ngushton dot
                 më poshtë se gjatësia e saj.
              3. Kolonat shtohen kur ka VËRTET vend. Kufijtë maten sipas
                 ekranit, kurse tabela e ka menynë anash që ia merr 224px —
                 prandaj te 640px dilnin shtatë kolona në 376px hapësirë.
                 Tani secila kolonë vjen një shkallë më vonë.

            `overflow-hidden` mbetet për qoshet e rrumbullakëta: pa të,
            ngjyra e rreshtit të parë e del jashtë harkut. */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                {meZgjedhje && <th className="hidden w-9 py-3 pr-1.5 pl-4 md:table-cell md:pr-2" />}
                <th className="py-3 pr-1.5 pl-3 font-medium whitespace-nowrap md:pr-2 md:pl-4 lg:pr-3">{t.colNr}</th>
                <th className="px-1.5 py-3 font-medium md:px-2 lg:px-3">{t.colName}</th>
                <th className="px-1.5 py-3 font-medium md:px-2 lg:px-3">{t.colDate}</th>
                <th className="hidden px-1.5 py-3 font-medium md:px-2 lg:table-cell lg:px-3">{t.colInsurance}</th>
                <th className="hidden px-1 py-3 text-right font-medium md:table-cell lg:px-3 xl:px-2">{t.colPersons}</th>
                <th className="hidden px-1 py-3 text-right font-medium md:table-cell lg:px-3 xl:px-2">{t.colContracts}</th>
                <th className="hidden px-1 py-3 text-right font-medium lg:table-cell lg:px-3 xl:px-2">{t.colNotes}</th>
                {/* Kolona e ekspertit shfaqet vetëm nga 1280px e sipër, një
                    shkallë më lart se Sigurimi dhe Shënimet. Poshtë saj
                    emailet — fjalë të vetme të gjata — copëtoheshin në gjashtë
                    rreshta dhe rreshti i tabelës trefishohej në lartësi.
                    Tabela nuk duhet të dalë me shirit rrëshqitës, prandaj
                    kolona pret derisa të ketë vërtet vend për të. */}
                {meEkspert && (
                  <th className="hidden px-1.5 py-3 font-medium xl:table-cell xl:px-2">{t.colExpert}</th>
                )}
                <th className="py-3 pr-3 pl-1.5 font-medium md:pr-4 md:pl-2 lg:pl-3">{t.colStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {terminet.map((termini) => {
                const ngj = categoryStyle(termini.category);
                const dataETerminit = formatBeogradNdare(termini.scheduled_at, locale);
                return (
                <tr key={termini.id} className={`transition ${ngj.rresht}`}>
                  {meZgjedhje && (
                    <td className="relative hidden w-9 py-3 pr-1.5 pl-4 md:table-cell md:pr-2">
                      <span
                        aria-hidden
                        className={`absolute inset-y-0 left-0 w-1 ${ngj.shirit}`}
                      />
                      <input
                        type="checkbox"
                        name="appointmentIds"
                        value={termini.id}
                        aria-label={termini.name}
                        className="h-4 w-4 rounded border-slate-400"
                      />
                    </td>
                  )}
                  {/* Shiriti me ngjyrë majtas: dallimi kapet edhe me bisht
                      të syrit, pa e ngarkuar rreshtin me ngjyrë të fortë. */}
                  <td className="relative py-3 pr-1.5 pl-3 whitespace-nowrap text-slate-600 tabular-nums md:pr-2 md:pl-4 lg:pr-3">
                    {/* Shiriti i ngjyrës rri te kolona e parë E DUKSHME. Kur
                        kutiza e zgjedhjes fshihet poshtë 768px, ai kalon këtu
                        — përndryshe rreshti do të mbetej pa shenjën e vet
                        pikërisht te ekrani i vogël, ku dallimi duhet më shumë. */}
                    <span
                      aria-hidden
                      className={`absolute inset-y-0 left-0 w-1 ${ngj.shirit} ${
                        meZgjedhje ? "md:hidden" : ""
                      }`}
                    />
                    {termini.nr != null ? `#${termini.nr}` : "—"}
                  </td>
                  <td className="px-1.5 py-3 md:px-2 lg:px-3">
                    {/* Lidhja rri te emri: një rresht i tërë i klikueshëm
                        nuk lejohet brenda një tabele pa e prishur kuptimin. */}
                    <Link
                      href={appointmentPath(termini, user.role)}
                      className="font-medium break-words text-slate-900 underline-offset-2 hover:underline"
                    >
                      {termini.name}
                    </Link>
                    {termini.user_id !== user.id && (
                      // `break-all`: një email është një fjalë e vetme e gjatë,
                      // dhe pa të kolona nuk ngushtohet dot nën gjatësinë e
                      // tij. Më parë kishte `truncate`, që në një tabelë me
                      // gjerësi automatike nuk pret asgjë — vetëm e ndalon
                      // thyerjen, pra e zgjeronte kolonën.
                      <span className="block text-xs break-all text-slate-600">
                        {agjentet.get(termini.user_id) ?? "—"}
                      </span>
                    )}
                  </td>
                  <td className="px-1.5 py-3 text-slate-600 md:px-2 lg:px-3">
                    <span className="block">{dataETerminit.data}</span>
                    <span className="block tabular-nums">{dataETerminit.ora}</span>
                  </td>
                  <td className="hidden px-1.5 py-3 break-words text-slate-600 md:px-2 lg:table-cell lg:px-3">
                    {termini.current_insurance || "—"}
                  </td>
                  <td className="hidden px-1 py-3 text-right text-slate-600 tabular-nums md:table-cell lg:px-3 xl:px-2">
                    {termini.persons_count}
                  </td>
                  <td className="hidden px-1 py-3 text-right tabular-nums md:table-cell lg:px-3 xl:px-2">
                    <span
                      className={
                        termini.contracts_closed > 0
                          ? "font-medium text-slate-900"
                          : "text-slate-400"
                      }
                    >
                      {termini.contracts_closed}
                    </span>
                  </td>
                  <td className="hidden px-1 py-3 text-right text-slate-600 tabular-nums lg:table-cell lg:px-3 xl:px-2">
                    {noteCounts.get(termini.id) ?? 0}
                  </td>
                  {meEkspert && (
                    <td className="hidden px-1.5 py-3 text-xs text-slate-600 xl:table-cell xl:px-2">
                      {(ekspertetETerminit.get(termini.id) ?? []).length > 0 ? (
                        // `break-all` si te emaili poshtë emrit: një email
                        // është një fjalë e vetme e gjatë, dhe pa të kolona
                        // nuk ngushtohet dot nën gjatësinë e tij.
                        (ekspertetETerminit.get(termini.id) ?? []).map((email) => (
                          // `mt-1` te çdo email veç të parit: dy adresa të
                          // gjata një mbi një, pa hapësirë mes tyre, duken si
                          // një adresë e vetme e thyer.
                          <span key={email} className="mt-1 block break-all first:mt-0">
                            {email}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400">{t.noExpert}</span>
                      )}
                    </td>
                  )}
                  <td className="py-3 pr-3 pl-1.5 md:pr-4 md:pl-2 lg:pl-3">
                    <span
                      // `xl:whitespace-nowrap`: aty ku shtohet kolona e
                      // ekspertit, shenja e rezultatit thyhej në dy rreshta.
                      // Duke e ndaluar thyerjen, kolona kërkon gjerësinë që i
                      // duhet dhe ajo e ekspertit e lëshon — emailet aty
                      // thyhen kudo (`break-all`), prandaj kanë nga ku të
                      // ngushtohen. Poshtë 1280px kolona s'ekziston fare, dhe
                      // gjithçka mbetet saktësisht si ishte.
                      className={`inline-block rounded-full px-1.5 py-0.5 text-xs font-medium break-words ring-1 ring-inset md:px-2 md:py-1 xl:whitespace-nowrap ${ngj.shenje}`}
                    >
                      {appointmentCategoryLabel(termini.category, t)}
                    </span>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </BulkAssign>
      )}

      {/* Butonat e faqeve. Filtri, pamja dhe kërkimi udhëtojnë bashkë me
          numrin e faqes, që të mos humbin sa herë shtyp «Para». */}
      <Pagination
        faqja={faqja}
        gjithsej={faqeGjithsej}
        t={t}
        adresa={(n) => adresa({ faqe: n })}
      />
    </main>
  );
}
