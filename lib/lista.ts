/**
 * Gjendja e listës së termineve, dhe adresa që e mban atë.
 *
 * PSE NJË SKEDË E VETME. Lista ka tani pesë zgjedhje që rrinë te adresa:
 * pamja («Të gjitha» / «Të mijat»), rezultati, kërkimi, data nga–deri, dhe
 * numri i faqes. Secila prej tyre ndërtohet nga një pjesë tjetër e faqes —
 * menyja e rezultatit, kutia e kërkimit, filtri i datës, butonat e faqeve —
 * dhe secila duhet t'i mbajë të katërt të tjerat.
 *
 * Deri tani secila e ndërtonte adresën vetë, me duar. Me tre parametra kjo
 * ishte e mbajtshme; me pesë nuk është: mjafton që njëra të harrojë njërin
 * parametër, dhe filtri i datës humbet sapo ndërron rezultatin — pa asnjë
 * gabim, thjesht lista të kthehet e tëra pa e kuptuar pse.
 *
 * Prandaj adresën e ndërton VETËM ky funksion, dhe të gjithë e thërrasin atë.
 */

/** Zgjedhjet e listës, ashtu siç rrinë te adresa. */
export type GjendjaEListes = {
  /** Kategoria e rezultatit; "" do të thotë të gjitha. */
  status: string;
  /** Vlen vetëm te menaxheri dhe admini; të tjerët s'kanë çelës. */
  vetemTeMijat: boolean;
  /** Teksti i kërkuar: emri ose numri i shkurtër. */
  kerko: string;
  /** Dita e parë e intervalit, "2026-09-05" ose "". */
  nga: string;
  /** Dita e fundit e intervalit, e përfshirë. */
  deri: string;
};

export const GJENDJA_BOSH: GjendjaEListes = {
  status: "",
  vetemTeMijat: false,
  kerko: "",
  nga: "",
  deri: "",
};

/**
 * Adresa e listës me këto zgjedhje.
 *
 * `ndryshimi` mbivendos atë që jepet dhe i lë të tjerat siç ishin.
 *
 * `faqe` sillet ndryshe nga të tjerat me qëllim: ruhet vetëm nëse jepet
 * shprehimisht. Pra butonat e faqeve e japin, kurse ndërrimi i një filtri jo
 * — dhe atëherë lista kthehet te faqja e parë. Kjo është e drejta: pas një
 * filtri të ri rezultatet janë krejt të tjera, dhe faqja 7 e mëparshme mund
 * as të mos ekzistojë.
 */
export function adresaEListes(
  gjendja: GjendjaEListes,
  ndryshimi: Partial<GjendjaEListes> & { faqe?: number } = {}
): string {
  const v = { ...gjendja, ...ndryshimi };
  const p = new URLSearchParams();
  if (v.vetemTeMijat) p.set("view", "mine");
  if (v.status) p.set("status", v.status);
  if (v.kerko) p.set("kerko", v.kerko);
  if (v.nga) p.set("nga", v.nga);
  if (v.deri) p.set("deri", v.deri);
  if (ndryshimi.faqe && ndryshimi.faqe > 1) p.set("faqe", String(ndryshimi.faqe));
  const q = p.toString();
  return q ? `/?${q}` : "/";
}

/**
 * Fushat e fshehura që një `<form method="get">` duhet të mbajë me vete.
 *
 * Kutia e kërkimit është formular i thjeshtë, pa JavaScript. Formulari
 * dërgon vetëm fushat e veta, prandaj çdo zgjedhje tjetër duhet të udhëtojë
 * si fushë e fshehur — përndryshe një kërkim i ri do t'i fshinte të gjitha.
 */
export function fushatEFshehura(
  gjendja: GjendjaEListes,
  perjashto: keyof GjendjaEListes
): { name: string; value: string }[] {
  const fushat: { name: string; value: string }[] = [];
  if (perjashto !== "vetemTeMijat" && gjendja.vetemTeMijat)
    fushat.push({ name: "view", value: "mine" });
  if (perjashto !== "status" && gjendja.status)
    fushat.push({ name: "status", value: gjendja.status });
  if (perjashto !== "kerko" && gjendja.kerko)
    fushat.push({ name: "kerko", value: gjendja.kerko });
  if (perjashto !== "nga" && gjendja.nga)
    fushat.push({ name: "nga", value: gjendja.nga });
  if (perjashto !== "deri" && gjendja.deri)
    fushat.push({ name: "deri", value: gjendja.deri });
  return fushat;
}
