import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * `/auth/dil` — dalja e detyruar, kur llogarisë i është hequr hyrja.
 *
 * Është adresë më vete dhe jo thjesht ridrejtim te `/login`, sepse çelësi te
 * shfletuesi është ende i vlefshëm: proxy-ja do ta shihte njeriun si të kyçur
 * dhe do ta kthente te «/», e ajo faqe do ta dërgonte prapë këtu — unazë pa
 * fund. Këtu sesioni fshihet vërtet, dhe pastaj s'ka më ku të kthehet.
 *
 * `/auth` është rrugë publike te proxy-ja, prandaj kjo adresë hapet edhe kur
 * çelësi ende vlen, edhe kur jo.
 */
export async function GET() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Adresë RELATIVE me qëllim. `new URL("/login", request.url)` e ndërton
  // adresën nga hosti që sheh serveri brenda, dhe ai jo gjithmonë është ai
  // që ka shkruar njeriu: te prova doli «localhost» ndërsa shfletuesi ishte
  // te «127.0.0.1». Për shfletuesin ato janë dy vende të ndryshme, prandaj
  // humbte edhe cookie-ja e gjuhës — faqja dilte gjermanisht.
  //
  // 303: pas një veprimi që ndryshoi gjendjen, faqja e re merret me GET.
  return new Response(null, {
    status: 303,
    headers: { Location: "/login?hequr=1" },
  });
}
