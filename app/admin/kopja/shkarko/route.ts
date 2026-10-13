import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import {
  BOM,
  emriISkedes,
  merrKopjen,
  merrTeGjitha,
  siCsv,
  TABELAT_E_KOPJES,
} from "@/lib/backup";

export const dynamic = "force-dynamic";

/**
 * `/admin/kopja/shkarko?lloji=json` — e tërë kopja.
 * `/admin/kopja/shkarko?lloji=csv&tabela=appointments` — një tabelë për Excel.
 *
 * Adresa është e hapur për këdo që e shkruan, prandaj roli kontrollohet KËTU,
 * jo vetëm te faqja që tregon butonat. Kush s'është admin merr 404 — jo një
 * mesazh «nuk ke leje», që as vetë ekzistenca e kësaj adrese të mos dihet.
 *
 * Leximi bëhet me llogarinë e adminit të kyçur, jo me çelësin e shërbimit:
 * kopja përmban pikërisht atë që admini e sheh gjithsesi, dhe asnjë çelës i
 * fuqishëm nuk përzihet me shkarkimin.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return new NextResponse(null, { status: 404 });

  const { searchParams } = new URL(request.url);
  const lloji = searchParams.get("lloji") ?? "json";
  const supabase = await createClient();

  try {
    if (lloji === "csv") {
      const tabela = searchParams.get("tabela") ?? "";
      // Vetëm tabelat e njohura: pa këtë, adresa do të lexonte çfarëdo emri.
      if (!TABELAT_E_KOPJES.includes(tabela as never)) {
        return new NextResponse("Tabelë e panjohur", { status: 400 });
      }
      const rreshtat = await merrTeGjitha(supabase, tabela);
      return new NextResponse(BOM + siCsv(rreshtat), {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="${emriISkedes("csv", tabela)}"`,
          // Një kopje nuk ruhet kurrë te memoria e shfletuesit apo e serverit.
          "cache-control": "no-store",
        },
      });
    }

    const kopja = await merrKopjen(supabase);
    return new NextResponse(JSON.stringify(kopja, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="${emriISkedes("json")}"`,
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    // Një kopje e gjysmuar është më e keqe se asnjë: më mirë dështon hapur.
    const mesazhi = e instanceof Error ? e.message : String(e);
    return new NextResponse(`Kopja NUK u krijua: ${mesazhi}`, { status: 500 });
  }
}
