import type { Dict } from "./i18n";

/** Gjinia. Emrat e lexueshëm janë te `lib/i18n.ts`. */
export const GENDERS = [
  { value: "f", key: "genderF" },
  { value: "m", key: "genderM" },
] as const;

export function genderLabel(value: string | null, t: Dict): string {
  const g = GENDERS.find((x) => x.value === value);
  return g ? t[g.key] : "—";
}

/**
 * Fushat pa të cilat një termin i ri nuk ka kuptim.
 *
 * Një termin është një takim me një person te një adresë. Pa emrin, pa një
 * numër ku të merret, dhe pa adresën e plotë, agjenti nuk shkon dot atje —
 * prandaj këto gjashtë kërkohen kur caktohet termini.
 *
 * `phone` është i vetmi numër i detyrueshëm; celulari mbetet i lirë.
 *
 * KUJDES — rregulli vlen vetëm për terminet e reja. Nga 17 terminet e vjetra,
 * 6 s'kanë kanton dhe 4 s'kanë adresë; po t'i kërkonim edhe atyre, kush do
 * vetëm të ndërrojë rezultatin e një termini të vjetër do të bllokohej te një
 * fushë që s'e di. Prandaj shih `fushaQeMungon()`: te një termin ekzistues
 * kërkohet vetëm ajo që e ka pasur tashmë — ç'ka është bosh mbetet bosh, por
 * ç'ka është plot nuk zbrazet dot.
 */
export const FUSHAT_E_DETYRUESHME = [
  { fusha: "name", gabimi: "errNameRequired" },
  { fusha: "phone", gabimi: "errPhoneRequired" },
  { fusha: "street", gabimi: "errStreetRequired" },
  { fusha: "postal_code", gabimi: "errPostalRequired" },
  { fusha: "city", gabimi: "errCityRequired" },
  { fusha: "canton", gabimi: "errCantonRequired" },
] as const;

/** Vlerat e vjetra që na duhen për të ditur se çfarë kishte termini. */
export type VleraTeVjetra = Partial<
  Record<(typeof FUSHAT_E_DETYRUESHME)[number]["fusha"], string | null>
>;

/**
 * A duhet plotësuar kjo fushë tani?
 *
 * Te termini i ri: gjithmonë. Te një termin ekzistues: vetëm nëse e ka
 * pasur — që rregulli i ri të mos i bllokojë terminet e vjetra, por as të
 * mos lejojë zbrazjen e atyre që janë plotësuar.
 */
export function eDetyrueshme(
  fusha: (typeof FUSHAT_E_DETYRUESHME)[number]["fusha"],
  iVjetri: VleraTeVjetra | null
): boolean {
  return !iVjetri || Boolean(iVjetri[fusha]);
}

/**
 * Terminet ndahen në TRE kategori. Kaq sheh njeriu te lista, dhe kaq e
 * ngjyros rreshtin:
 *
 *   🟢 e suksesshme — u mbajt DHE u nënshkrua kontratë
 *   🟡 në bisedim   — puna vazhdon; mund të provohet sërish
 *   🔴 e dështuar   — mbaroi pa gjë
 *
 * Kategoria është ajo që numërohet te raportet. Arsyeja (më poshtë) thotë
 * PSE, dhe rri brenda kategorisë.
 */
export const APPOINTMENT_CATEGORIES = [
  { value: "success", key: "catSuccess" },
  { value: "talking", key: "catTalking" },
  { value: "failed", key: "catFailed" },
] as const;

export type AppointmentCategory =
  (typeof APPOINTMENT_CATEGORIES)[number]["value"];

export function appointmentCategoryLabel(value: string, t: Dict): string {
  const c = APPOINTMENT_CATEGORIES.find((x) => x.value === value);
  return c ? t[c.key] : value;
}

/**
 * Arsyeja — pse termini përfundoi në atë kategori.
 *
 * Secila arsye i përket një kategorie të vetme, prandaj kategoria dhe
 * arsyeja nuk bien dot në kundërshtim. E njëjta lidhje ruhet edhe te baza
 * (`supabase/kategorite.sql`), që as një kërkesë e drejtpërdrejtë të mos
 * fusë një çift të pamundur.
 *
 * Këtu rrinë vetëm vlerat që shkojnë te baza. Emrat e lexueshëm janë te
 * `lib/i18n.ts`, sepse ndryshojnë me gjuhën.
 */
export const APPOINTMENT_STATUSES = [
  // E suksesshme
  { value: "contract_signed", key: "statusContractSigned", category: "success" },
  // Në bisedim
  { value: "open", key: "statusOpen", category: "talking" },
  { value: "held_thinking", key: "statusHeldThinking", category: "talking" },
  { value: "not_reached", key: "statusNotReached", category: "talking" },
  { value: "not_home", key: "statusNotHome", category: "talking" },
  { value: "address_not_found", key: "statusAddressNotFound", category: "talking" },
  // E dështuar
  { value: "cancelled", key: "statusCancelled", category: "failed" },
  { value: "refused", key: "statusRefused", category: "failed" },
  { value: "negative", key: "statusNegative", category: "failed" },
  { value: "advisor_failed", key: "statusAdvisorFailed", category: "failed" },
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number]["value"];

export function appointmentStatusLabel(value: string, t: Dict): string {
  const s = APPOINTMENT_STATUSES.find((x) => x.value === value);
  return s ? t[s.key] : value;
}

/** Arsyet e një kategorie, në radhën e menysë. */
export function reasonsForCategory(category: string) {
  return APPOINTMENT_STATUSES.filter((s) => s.category === category);
}

/** Kategoria së cilës i përket një arsye. `null` nëse arsyeja s'njihet. */
export function categoryOfStatus(status: string): AppointmentCategory | null {
  return APPOINTMENT_STATUSES.find((s) => s.value === status)?.category ?? null;
}

/**
 * Ngjyrat e tri kategorive.
 *
 * `rresht` ngjyros tërë rreshtin e listës, dhe `shirit` vizaton vijën me
 * ngjyrë majtas.
 *
 * E gjelbra dhe e kuqja janë të plota: ato janë përfundimet, dhe syri duhet
 * t'i kapë menjëherë. E verdha mbetet e lehtë me qëllim — «në bisedim» është
 * gjendja e zakonshme dhe zë shumicën e rreshtave. Po ta forconim edhe atë,
 * faqja do të dilte e verdhë nga fillimi në fund, dhe atëherë asnjë ngjyrë
 * nuk do të thoshte më gjë.
 */
export const CATEGORY_STYLES: Record<
  string,
  { rresht: string; shirit: string; shenje: string }
> = {
  success: {
    rresht: "bg-emerald-200 hover:bg-emerald-300/80",
    shirit: "bg-emerald-600",
    shenje: "bg-emerald-600 text-white ring-emerald-700",
  },
  talking: {
    rresht: "bg-amber-50 hover:bg-amber-100/80",
    shirit: "bg-amber-500",
    shenje: "bg-amber-100 text-amber-800 ring-amber-200",
  },
  failed: {
    rresht: "bg-rose-200 hover:bg-rose-300/80",
    shirit: "bg-rose-600",
    shenje: "bg-rose-600 text-white ring-rose-700",
  },
};

export function categoryStyle(category: string | null) {
  return CATEGORY_STYLES[category ?? ""] ?? CATEGORY_STYLES.talking;
}

/** Një rresht i tabelës `appointments`. */
export type Appointment = {
  id: string;
  /**
   * Numri i shkurtër i terminit — ai që del në adresë: `/terminet/1001`.
   *
   * Është `null` vetëm nëse `supabase/nr.sql` nuk është ekzekutuar ende;
   * atëherë adresa bie prapa te `id`. Shih `appointmentPath()`.
   */
  nr: number | null;
  /** Kush e caktoi terminin. */
  user_id: string;

  // --- Personalia e personit që takohet ---
  name: string;
  customer_number: string | null;
  gender: string | null;
  nationality: string | null;
  birth_date: string | null;
  street: string | null;
  postal_code: string | null;
  city: string | null;
  canton: string | null;
  phone: string | null;
  mobile: string | null;
  email: string | null;

  // --- Të dhëna teknike ---
  call_center: string | null;
  current_insurance: string | null;
  call_date: string | null;
  scheduled_at: string;
  language: string | null;
  persons_count: number;
  status: AppointmentStatus;
  /** Njëra nga tri kategoritë. E ngjyros rreshtin dhe numërohet te raportet. */
  category: AppointmentCategory;
  multi_year_contract: boolean;
  treatment: boolean;
  contracts_closed: number;
  family_details: string | null;
  current_treatment: string | null;
  treatment_type: string | null;
  medications: string | null;
  created_at: string;
  updated_at: string | null;
};

/** Kolonat e terminit që lexojmë. `*` e mban faqen të gjallë edhe nëse
 * ndonjë kolonë e re nuk është krijuar ende në bazë. */
export const APPOINTMENT_COLUMNS = "*";

/**
 * Pjesa e parë e adresës, sipas rolit të atij që është i kyçur:
 *
 *   admin    -> /admin/terminet/1001
 *   manager  -> /menager/terminet/1001
 *   user     -> /user/terminet/1001
 *
 * Prefiksi është vetëm emërtim: ai NUK jep asnjë të drejtë. Lejet dalin
 * gjithmonë nga roli në tabelën `profiles`, dhe faqja e kthen përdoruesin
 * te prefiksi i rolit të vet nëse provon një tjetër.
 */
export const ROLE_PREFIXES = {
  user: "user",
  manager: "menager",
  admin: "admin",
  expert: "ekspert",
} as const;

export type RolePrefix = (typeof ROLE_PREFIXES)[keyof typeof ROLE_PREFIXES];

export function rolePrefix(role: string): RolePrefix {
  return ROLE_PREFIXES[role as keyof typeof ROLE_PREFIXES] ?? "user";
}

/**
 * Adresa e faqes së një termini për atë që është i kyçur.
 *
 * Numri i shkurtër (`/admin/terminet/1001`). Nëse `supabase/nr.sql` nuk
 * është ekzekutuar ende, kolona `nr` mungon dhe përdoret `id`-ja e gjatë —
 * kështu asnjë lidhje nuk prishet gjatë kalimit.
 */
export function appointmentPath(
  t: { id: string; nr?: number | null },
  role: string
): string {
  return `/${rolePrefix(role)}/terminet/${t.nr ?? t.id}`;
}

const TZ = "Europe/Belgrade";

/**
 * Ora shkruhet gjithmonë 0–23, në të dyja gjuhët.
 *
 * Pa këtë, shqipja e shkruante orën me 12 dhe me «p.d./m.d.» — dhe atëherë
 * numri që lexohej NUK ishte ora e terminit:
 *
 *     14:30  ->  «02:30 m.d.»     e lexon 2 pas mesnate
 *     23:45  ->  «11:45 m.d.»     e lexon 11 paradite
 *     00:15  ->  «12:15 p.d.»     mesnata dilte 12
 *
 * Te një sistem terminesh kjo nuk është hollësi: një agjent që lexon «02:30»
 * dhe shkon në 2 pas mesnate e ka humbur terminin. Gjermanishtja e kishte
 * gjithmonë 24-orëshin, prandaj gabimi dukej vetëm në shqip.
 *
 * `h23` dhe jo `hour12: false`: kjo e fundit e shkruan mesnatën «24:00» te
 * disa gjuhë. `h23` e mban 00:00.
 */
const ORA24 = "h23" as const;

/**
 * Sa minuta larg orës botërore është Beogradi në atë çast (60 ose 120).
 * E llogarisim, sepse ora e verës e ndryshon dy herë në vit.
 */
function beogradOffsetMinutes(date: Date): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      // `h23` dhe jo `hour12: false`: kjo e fundit e kthen mesnatën si "24",
      // dhe atëherë `Date.UTC(...)` e hidhte llogarinë një ditë përpara.
      hourCycle: ORA24,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  );
  const sikurTeIshteUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second)
  );
  return (sikurTeIshteUTC - date.getTime()) / 60000;
}

/**
 * Nga data e ruajtur në formën që pret fusha `datetime-local`, në orën e
 * Beogradit: "2026-01-30T10:00".
 *
 * E llogarisim gjithmonë me orën e Beogradit (jo me orën e kompjuterit), që
 * serveri dhe shfletuesi të nxjerrin saktësisht të njëjtin tekst.
 */
export function toBeogradInput(iso: string): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: ORA24,
  })
    .format(new Date(iso))
    .replace(" ", "T");
}

/**
 * E kundërta: "2026-01-30T10:00" (orë Beograd) -> data e plotë për ruajtje.
 *
 * Bëhet në dy hapa, dhe hapi i dytë nuk është i tepërt.
 *
 * Hapi i parë e merr largësinë nga ora botërore SIKUR ai tekst të ishte
 * çast botëror. Zakonisht del e njëjta gjë. Por natën kur ora shtyhet para —
 * te ne, e diela e fundit e marsit — ajo largësi mund të jetë e verës,
 * ndërsa vetë ora që shkroi njeriu është ende e dimrit. Atëherë termini
 * ruhej një orë përpara: shkruaje 01:30, lexoje 00:30.
 *
 * Prandaj llogaritet sërish mbi çastin që dilte, dhe nëse largësia doli
 * tjetër, merret ajo. Kjo prek një orë të vetme në vit — por një termin i
 * humbur është i humbur edhe kur është i rrallë.
 */
export function fromBeogradInput(local: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(local)) return null;
  const sikurUTC = new Date(`${local.slice(0, 16)}:00Z`);
  if (Number.isNaN(sikurUTC.getTime())) return null;

  const iPari = beogradOffsetMinutes(sikurUTC);
  const provë = new Date(sikurUTC.getTime() - iPari * 60000);
  const iDyti = beogradOffsetMinutes(provë);

  return (iDyti === iPari
    ? provë
    : new Date(sikurUTC.getTime() - iDyti * 60000)
  ).toISOString();
}

/** Ora e parazgjedhur për një termin të ri: nesër në orën 10:00. */
export function defaultAppointmentSlot(): string {
  const neser = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return `${new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(
    neser
  )}T10:00`;
}

/**
 * Data dhe ora e terminit për ta lexuar njeriu, në orën e Beogradit.
 *
 * `locale` vjen nga gjuha e zgjedhur: "28. August 2026" ose "28 gusht 2026".
 * Zona kohore mbetet gjithmonë Beogradi, pavarësisht gjuhës.
 */
export function formatBeograd(iso: string, locale = "de-DE"): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: ORA24,
  }).format(new Date(iso));
}

/** Një rresht i tabelës `notes`. */
export type Note = {
  id: string;
  appointment_id: string;
  /** Kush e shkroi shënimin. */
  user_id: string;
  body: string;
  created_at: string;
  /** Kur u ndryshua për herë të fundit; `null` nëse s'është prekur kurrë. */
  updated_at: string | null;
};

/** Një rresht i tabelës `profiles` (llogaria dhe roli i saj). */
export type Profile = {
  id: string;
  email: string | null;
  role: "user" | "manager" | "admin";
  /**
   * A hyn ende ky person?
   *
   * Profili nuk fshihet kurrë — ai mban emrin e autorit te terminet dhe
   * shënimet e tij. Kur admini i heq hyrjen, fshihet vetëm llogaria te
   * `auth.users` dhe kjo bëhet `false`.
   */
  active: boolean;
  created_at: string;
};

/** Emrat e roleve. Teksti vjen nga fjalori, sipas gjuhës. */
const ROLE_KEYS = {
  user: "roleUser",
  manager: "roleManager",
  admin: "roleAdmin",
  expert: "roleExpert",
} as const;

export function roleLabel(role: string, t: Dict): string {
  const k = ROLE_KEYS[role as keyof typeof ROLE_KEYS];
  return k ? t[k] : role;
}

/** Ngjyrat e etiketës së rolit. */
export const ROLE_CLASSES: Record<string, string> = {
  user: "bg-slate-100 text-slate-600 ring-slate-200",
  manager: "bg-sky-100 text-sky-800 ring-sky-200",
  admin: "bg-slate-900 text-white ring-slate-900",
  expert: "bg-violet-100 text-violet-800 ring-violet-200",
};

/** Formati i përgjigjes që kthejnë format tona (Server Actions). */
export type FormState = {
  ok?: boolean;
  error?: string;
  /** Njoftim pozitiv për përdoruesin, p.sh. "kontrollo emailin". */
  message?: string;
  /**
   * Ç'ka u shkrua te formulari, kur kërkesa u refuzua.
   *
   * React-i e zbraz formularin vetvetiu sapo veprimi mbaron — edhe kur ai
   * ktheu gabim. Me një fushë të detyrueshme kjo mezi vihej re; me gjashtë
   * do të thoshte humbje e tërë punës për një gabim shtypi. Prandaj veprimi
   * i kthen fjalët mbrapsht, dhe formulari i rivendos si vlera fillestare —
   * pra edhe zbrazja e React-it i gjen ato aty.
   */
  values?: Record<string, string>;
};

/** Një rresht i tabelës `activity_days` (aktiviteti i një dite). */
export type ActivityDay = {
  user_id: string;
  day: string;
  active_seconds: number;
  last_seen_at: string;
};

/** Data e sotme sipas orës së Beogradit, p.sh. "2026-08-26". */
export function todayInBeograd(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Belgrade",
  }).format(new Date());
}

/**
 * Dita e Beogradit të cilës i përket ky çast, p.sh. "2026-08-26".
 *
 * Për grupimin e termineve sipas ditës: një termin i regjistruar në orën
 * 00:30 të Beogradit i përket asaj dite, jo asaj të djeshmes sipas orës
 * botërore.
 */
export function beogradDay(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(
    new Date(iso)
  );
}

/** Lista e `sa` ditëve të fundit, nga më e vjetra te sotmja. */
export function ditetEFundit(sa: number): string[] {
  const sot = new Date(`${todayInBeograd()}T12:00:00Z`);
  const lista: string[] = [];
  for (let i = sa - 1; i >= 0; i--) {
    const d = new Date(sot);
    d.setUTCDate(d.getUTCDate() - i);
    lista.push(d.toISOString().slice(0, 10));
  }
  return lista;
}

/**
 * Muaji i Beogradit të cilit i përket ky çast, p.sh. "2026-08".
 *
 * Si `beogradDay`, por deri te muaji. Një termin i caktuar më 1 shtator në
 * orën 00:30 të Beogradit i përket shtatorit — jo gushtit, siç do të dilte
 * po ta llogaritnim me orën botërore.
 */
export function beogradMonth(iso: string): string {
  return beogradDay(iso).slice(0, 7);
}

/** Muaji i tanishëm sipas orës së Beogradit, p.sh. "2026-08". */
export function currentMonth(): string {
  return todayInBeograd().slice(0, 7);
}

/**
 * Lista e `sa` muajve të fundit, nga më i riu te më i vjetri.
 *
 * Filtri i dashboard-it e nis te muaji i tanishëm dhe zbret prapa. Radha
 * është me qëllim e kundërt me atë të ditëve: te një meny, muaji që kërkohet
 * më shpesh duhet të jetë i pari, jo i fundit.
 */
export function muajtEFundit(sa: number): string[] {
  const [v, m] = currentMonth().split("-").map(Number);
  const lista: string[] = [];
  for (let i = 0; i < sa; i++) {
    // `m - 1 - i` mund të dalë negativ; `Date` e kthen vetë vitin prapa.
    const d = new Date(Date.UTC(v, m - 1 - i, 1));
    lista.push(
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
    );
  }
  return lista;
}

/** A duket "2026-08" si muaj i vlefshëm? */
export function eshteMuaj(v: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(v);
}

/** Emri i muajit sipas gjuhës, p.sh. "gusht 2026" / "August 2026". */
export function formatMonth(muaji: string, locale = "de-DE"): string {
  const [v, m] = muaji.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(v, m - 1, 1)));
}

/** A është parë ky çast brenda `minutes` minutave të fundit? */
export function isRecent(iso: string | undefined | null, minutes = 5): boolean {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < minutes * 60 * 1000;
}

/** Sekondat në formë të lexueshme: "2h 15min", "45min", "—". Njësoj në të dyja gjuhët. */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 60) return seconds > 0 ? "< 1min" : "—";
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}min`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}min`;
}

/** Data e shkurtër e një dite, p.sh. "e mar 25/8". */
export function formatDayLabel(day: string, locale = "de-DE"): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "numeric",
  }).format(new Date(`${day}T12:00:00Z`));
}

/** Data më e shkurtër që lexohet ende: "25/8". Për boshtin e grafikëve. */
export function formatDayShort(day: string): string {
  const [, muaj, dita] = day.split("-");
  return `${Number(dita)}/${Number(muaj)}`;
}

/** Vetëm data, pa orë: "28 janar 1985". Për datëlindje e ngjashme. */
export function formatDateOnly(day: string, locale = "de-DE"): string {
  return new Date(`${day.slice(0, 10)}T12:00:00Z`).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Datë e lexueshme në shqip, me orën e Beogradit: "24 gusht 2026, 14:30".
 *
 * Zona kohore shkruhet shprehimisht. Pa të, ora dilte sipas kompjuterit që
 * e ndërton faqen — dhe serverat e Vercel-it punojnë me orën botërore (UTC),
 * pra ora e krijimit shfaqej 1–2 orë prapa.
 */
export function formatDate(iso: string, locale = "de-DE"): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: ORA24,
  }).format(new Date(iso));
}

// =====================================================================
// FILTRI SIPAS DATËS SË TERMINIT
// =====================================================================
//
// Këto funksione i kthejnë dy datat e zgjedhura te lista në dy çaste të
// plota, që baza t'i krahasojë me `scheduled_at`.
//
// Puna e vërtetë këtu është një kurth i vetëm, dhe funksionet janë të ndara
// pikërisht që ai të mos harrohet: një datë e zgjedhur nga njeriu do të
// thotë NJË DITË E TËRË e Beogradit, jo një çast. «Deri më 5 shtator» duhet
// t'i marrë edhe terminet e orës 17:00 të asaj dite. Prandaj fundi nuk është
// «<= 5 shtatori» — ai do të linte jashtë gjithçka pas mesnatës — por
// «< 6 shtatori në orën 00:00». Interval gjysmë i hapur.

/** A duket "2026-09-05" si ditë e vërtetë? */
export function eshteDite(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  // `Date` e pranon edhe "2026-02-31" dhe e rrëshqet te 3 marsi. Prandaj
  // krahasohet teksti pas kthimit: nëse ndryshoi, dita s'ekzistonte.
  const d = new Date(`${v}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

/** Dita pasardhëse: "2026-09-05" -> "2026-09-06". Kalon vetë muajin e vitin. */
export function ditaTjeter(dita: string): string {
  const d = new Date(`${dita}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Fillimi i një dite sipas orës së Beogradit, si çast i plotë për bazën.
 *
 * Kalon nga `fromBeogradInput`, pra e mban parasysh edhe orën e verës: më 29
 * mars mesnata e Beogradit s'është e njëjta largësi nga ora botërore si më
 * 29 tetor.
 */
export function fillimiIDites(dita: string): string | null {
  return eshteDite(dita) ? fromBeogradInput(`${dita}T00:00`) : null;
}

/**
 * E hëna e javës së tanishme dhe e diela e saj, sipas orës së Beogradit.
 *
 * Java nis të hënën — si te kalendarët këtu, dhe si te vetë puna: «kjo javë»
 * do të thotë e hënë–e diel, jo e diel–e shtunë.
 */
export function javaKetu(): { nga: string; deri: string } {
  const sot = new Date(`${todayInBeograd()}T12:00:00Z`);
  // `getUTCDay()` e nis javën të dielën (0). Kthimi në të hënë: e diela
  // llogaritet si dita e 7-të e javës që shkoi, jo si e para e kësaj.
  const larg = (sot.getUTCDay() + 6) % 7;
  const eHene = new Date(sot);
  eHene.setUTCDate(eHene.getUTCDate() - larg);
  const eDiel = new Date(eHene);
  eDiel.setUTCDate(eDiel.getUTCDate() + 6);
  return {
    nga: eHene.toISOString().slice(0, 10),
    deri: eDiel.toISOString().slice(0, 10),
  };
}

/** Dita e parë dhe e fundit e muajit të tanishëm, sipas orës së Beogradit. */
export function muajiKetu(): { nga: string; deri: string } {
  const [v, m] = currentMonth().split("-").map(Number);
  // Dita 0 e muajit pasardhës është dita e fundit e këtij muaji — pa pasur
  // nevojë të dihet nëse muaji ka 28, 29, 30 apo 31 ditë.
  const fundi = new Date(Date.UTC(v, m, 0));
  return { nga: `${currentMonth()}-01`, deri: fundi.toISOString().slice(0, 10) };
}

/**
 * Data si numra, dita e para: "2026-09-05" -> "5.9.2026".
 *
 * Fushat `type="date"` i vizaton vetë shfletuesi, sipas gjuhës së tij — dhe
 * një kompjuter i vendosur në anglisht e shkruan 5 shtatorin si «09/05».
 * Kush e lexon këtu, e lexon si 9 maj. Prandaj intervali i zgjedhur
 * përsëritet edhe një herë me shkronjat tona, pranë fushave.
 *
 * Me numra e jo me emrin e muajit, dhe pa `Intl`, me qëllim: emrat e muajve
 * nuk janë të njëjtë te Node-i dhe te Chrome-i, dhe kjo pjesë vizatohet në
 * të dyja anët. Një ndryshim i vetëm shkronje mjafton që React-i të ankohet
 * se faqja e serverit s'përputhet me atë të shfletuesit.
 */
export function dataShkurt(dita: string): string {
  const [v, m, d] = dita.split("-");
  return `${Number(d)}.${Number(m)}.${v}`;
}

/**
 * Data e terminit e ndarë në dy pjesë, për listën: `{ data, ora }`.
 *
 * Te lista, data e plotë («14. September 2026 um 14:00») ishte teksti më i
 * gjatë i tërë tabelës dhe, me `whitespace-nowrap`, ajo e vetme e detyronte
 * tabelën të dilte jashtë ekranit. E ndarë në dy rreshta — data sipër, ora
 * poshtë — zë gjysmën e gjerësisë dhe lexohet më shpejt, sepse syri e kërkon
 * orën veç.
 *
 * Muaji shkurt («14. Sept. 2026»), sërish për gjerësinë. Emri i plotë i
 * muajit mbetet aty ku ka vend: brenda vetë terminit.
 */
export function formatBeogradNdare(
  iso: string,
  locale = "de-DE"
): { data: string; ora: string } {
  const çasti = new Date(iso);
  return {
    data: new Intl.DateTimeFormat(locale, {
      timeZone: TZ,
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(çasti),
    ora: new Intl.DateTimeFormat(locale, {
      timeZone: TZ,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: ORA24,
    }).format(çasti),
  };
}

/**
 * Vetëm data, me muajin shkurt: "11 sht 2026" / "11. Sept. 2026".
 *
 * Si `formatDateOnly`, por për tabela ku kolona duhet të jetë e ngushtë.
 * «11. September 2026» zë 162px dhe, me `whitespace-nowrap`, ishte një nga
 * tri kolonat që e nxirrnin tabelën e përdoruesve jashtë ekranit.
 */
export function formatDateOnlyShkurt(day: string, locale = "de-DE"): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${day.slice(0, 10)}T12:00:00Z`));
}
