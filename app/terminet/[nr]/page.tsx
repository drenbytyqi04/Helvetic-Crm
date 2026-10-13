import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { rolePrefix } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Adresa e vjetër, pa prefiksin e rolit: `/terminet/1001`.
 *
 * Terminet tani rrinë nën `/admin/`, `/menager/` ose `/user/`, sipas rolit.
 * Kjo faqe nuk shfaq asgjë — vetëm e çon përdoruesin te adresa e vet, që
 * lidhjet e ruajtura më parë të mos prishen.
 */
export default async function Page({ params }: PageProps<"/terminet/[nr]">) {
  const { nr } = await params;
  const user = await requireUser();
  redirect(`/${rolePrefix(user.role)}/terminet/${nr}`);
}
