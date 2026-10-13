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
    <main className="flex min-h-screen">
      {/* Majtas, vetëm në ekran të gjerë: logoja dhe motoja e firmës mbi
          blunë e errët të markës. Logoja rri në pllakë të bardhë, sepse
          shkronjat e saj janë po ajo blu. */}
      <section className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-brand-dark p-12 text-white lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-brand/40 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-accent/20 blur-3xl"
        />
        <div className="relative w-fit rounded-2xl bg-white px-8 py-6 shadow-xl shadow-black/20">
          <Image
            src="/logo.png"
            alt={t.appName}
            width={900}
            height={612}
            priority
            className="h-40 w-auto"
          />
        </div>
        <div className="relative">
          <p className="text-3xl leading-tight font-semibold tracking-tight">
            Swiss quality.
            <br />
            Global talent.
          </p>
          <div className="mt-6 h-1 w-16 rounded-full bg-accent" />
        </div>
        <p className="relative text-xs text-slate-400">
          © {new Date().getFullYear()} Helvetic Connect Solutions L.L.C
        </p>
      </section>

      <section className="flex flex-1 flex-col items-center justify-center gap-8 px-5 py-10">
        {/* Në telefon dhe tablet logoja del mbi kartë, sepse s'ka panel majtas. */}
        <Image
          src="/logo.png"
          alt={t.appName}
          width={900}
          height={612}
          priority
          className="h-32 w-auto lg:hidden"
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
      </section>
    </main>
  );
}
