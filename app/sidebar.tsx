import Image from "next/image";
import SidebarLink from "./sidebar-link";
import SignOutButton from "./sign-out-button";
import LanguageSwitcher from "./language-switcher";
import { roleLabel } from "@/lib/types";
import { getI18n } from "@/lib/i18n-server";
import type { CurrentUser } from "@/lib/auth";

/**
 * Menyja anash.
 *
 * Mban logon, lidhjet kryesore, llogarinë dhe butonin "Dil", që kreu i çdo
 * faqeje të mos i përsërisë ato dhe të mos zërë vend lart.
 *
 * Ngjyra është bluja e errët e emrit te logoja. Logoja vetë rri mbi një
 * pllakë të bardhë: shkronjat e saj janë po ajo blu, dhe mbi sfondin e
 * errët nuk do të lexoheshin.
 *
 * Në telefon shndërrohet në një shirit të hollë sipër, sepse një shtyllë e
 * ngushtë atje do të hante gjysmën e ekranit.
 */
export default async function Sidebar({ user }: { user: CurrentUser }) {
  const { lang, t } = await getI18n();

  return (
    <aside className="shrink-0 bg-brand-dark text-white sm:sticky sm:top-0 sm:flex sm:h-screen sm:w-64 sm:flex-col">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:block sm:px-4 sm:py-5">
        {/* Telefoni: vetëm shenja. Kompjuteri: logoja e plotë. */}
        <div className="shrink-0 rounded-xl bg-white px-2 py-1.5 sm:px-4 sm:py-3">
          <Image
            src="/shenja.png"
            alt={t.appName}
            width={256}
            height={151}
            priority
            className="h-7 w-auto sm:hidden"
          />
          <Image
            src="/logo.png"
            alt={t.appName}
            width={900}
            height={612}
            priority
            className="mx-auto hidden h-auto w-full max-w-[180px] sm:block"
          />
        </div>

        {/* Në telefon lidhjet rrinë në të njëjtin rresht me logon. */}
        <nav className="flex flex-wrap gap-1 sm:mt-8 sm:block sm:space-y-1">
          <SidebarLink href="/dashboard" label={t.navDashboard} icon="dashboard" />
          <SidebarLink href="/" label={t.navAppointments} icon="appointments" exact />
          <SidebarLink href="/profili" label={t.navProfile} icon="profile" />
          {user.isAdmin && (
            <>
              <p className="mt-6 mb-2 hidden px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase sm:block">
                Admin
              </p>
              <SidebarLink href="/admin" label={t.navUsers} icon="users" exact />
              <SidebarLink href="/admin/aktiviteti" label={t.navActivity} icon="activity" />
              <SidebarLink href="/admin/kopja" label={t.navBackup} icon="backup" />
            </>
          )}
        </nav>
      </div>

      <div className="hidden border-t border-white/10 px-4 py-4 sm:mt-auto sm:block">
        <div className="flex items-center gap-3">
          {/* Shkronja e parë e emailit, si avatar. */}
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold uppercase ring-2 ring-white/10">
            {user.email.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm text-white" title={user.email}>
              {user.email}
            </p>
            <p className="text-xs text-slate-400">{roleLabel(user.role, t)}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          <LanguageSwitcher aktive={lang} />
          <SignOutButton label={t.signOut} />
        </div>
      </div>
    </aside>
  );
}
