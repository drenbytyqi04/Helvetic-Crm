import AppointmentPage from "@/app/terminet/appointment-page";

export const dynamic = "force-dynamic";

/**
 * `/menager/terminet/1001` — faqja e terminit siç e sheh menaxheri.
 *
 * Vetë faqja është e përbashkët për të tri rolet; këtu i themi vetëm se nga
 * cila adresë erdhi kërkesa. Kush nuk është menaxher dërgohet te prefiksi i
 * rolit të vet, prandaj kjo adresë nuk jep asnjë të drejtë më shumë.
 */
export default async function Page({
  params,
}: PageProps<"/menager/terminet/[nr]">) {
  const { nr } = await params;
  return <AppointmentPage nr={nr} prefiks="menager" />;
}
