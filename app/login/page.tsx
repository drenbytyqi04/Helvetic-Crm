import Image from "next/image";
import LoginForm from "./login-form";
import SetupNotice from "../setup-notice";
import { hasSupabaseConfig } from "@/lib/supabase/server";
import { getI18n } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { lang, t } = await getI18n();
  // Vjen nga `/auth/dil`: personi nuk doli vetë, iu hoq hyrja. Pa këtë
  // rresht, dalja e papritur do të dukej si prishje e faqes.
  const { hequr } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-5 py-10">
      {/* Logoja e plotë rri vetëm këtu: faqja e hyrjes është e vetmja që s'ka
          menynë anash, dhe e vetmja që e sheh dikush para se të njohë faqen. */}
      <Image
        src="/logo.png"
        alt="Helvetic"
        width={900}
        height={612}
        priority
        className="h-36 w-auto"
      />
      {hequr === "1" && (
        <p
          role="status"
          className="max-w-sm rounded-lg bg-amber-50 px-4 py-3 text-center text-sm text-amber-900"
        >
          {t.loginAccessRemoved}
        </p>
      )}
      {hasSupabaseConfig() ? <LoginForm lang={lang} /> : <SetupNotice />}
    </main>
  );
}
