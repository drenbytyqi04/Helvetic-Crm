import AppointmentPage from "@/app/terminet/appointment-page";

export const dynamic = "force-dynamic";

/**
 * `/ekspert/terminet/1001` — faqja e terminit siç e sheh eksperti.
 *
 * Eksperti i sheh vetëm terminet që ia ka dhënë admini. Këtë NUK e vendos
 * kjo faqe: e vendos vetë baza (`supabase/eksperti.sql`). Nëse termini nuk i
 * është dhënë, kërkesa kthen bosh dhe faqja del 404 — njësoj sikur ai termin
 * të mos ekzistonte fare. Kështu as vetë numri nuk tregon nëse ekziston.
 */
export default async function Page({
  params,
}: PageProps<"/ekspert/terminet/[nr]">) {
  const { nr } = await params;
  return <AppointmentPage nr={nr} prefiks="ekspert" />;
}
