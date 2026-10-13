import AppointmentPage from "@/app/terminet/appointment-page";

export const dynamic = "force-dynamic";

/**
 * `/user/terminet/1001` — faqja e terminit siç e sheh përdoruesi i thjeshtë.
 *
 * Vetë faqja është e përbashkët për të tri rolet; këtu i themi vetëm se nga
 * cila adresë erdhi kërkesa. Menaxheri dhe admini dërgohen te prefiksi i
 * tyre, prandaj kjo adresë nuk ia heq askujt asnjë të drejtë.
 */
export default async function Page({
  params,
}: PageProps<"/user/terminet/[nr]">) {
  const { nr } = await params;
  return <AppointmentPage nr={nr} prefiks="user" />;
}
