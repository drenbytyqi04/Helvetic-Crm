"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Një lidhje e menysë anash, që ndriçon kur je te ajo faqe.
 *
 * `usePathname()` punon vetëm në shfletues, prandaj kjo skedë është "use
 * client" — pjesa tjetër e menysë mbetet në server.
 */
export default function SidebarLink({
  href,
  label,
  /** Ndriçon edhe te nënfaqet, p.sh. `/admin/aktiviteti` për `/admin`. */
  exact = false,
}: {
  href: string;
  label: string;
  exact?: boolean;
}) {
  const path = usePathname();
  const aktiv = exact ? path === href : path === href || path.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={aktiv ? "page" : undefined}
      className={`block rounded-lg px-3 py-2 text-sm transition ${
        aktiv
          ? "bg-brand font-medium text-white"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {label}
    </Link>
  );
}
