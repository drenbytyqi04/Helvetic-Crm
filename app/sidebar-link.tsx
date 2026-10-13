"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Ikonat e menysë — vija të holla, njësoj si te shumica e paneleve. Rrinë
 * këtu, jo në një bibliotekë, sepse janë vetëm gjashtë.
 */
const IKONAT = {
  dashboard: "M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z",
  appointments:
    "M8 2v3M16 2v3M3.5 9.09h17M21 8.5V17c0 3-1.5 5-5 5H8c-3.5 0-5-2-5-5V8.5c0-3 1.5-5 5-5h8c3.5 0 5 2 5 5Z",
  profile:
    "M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM20.59 22c0-3.87-3.85-7-8.59-7s-8.59 3.13-8.59 7",
  users:
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21c0-3.31 3.13-6 7-6s7 2.69 7 6M16 3.13a4 4 0 0 1 0 7.75M22 21c0-2.7-1.7-5-4.5-5.7",
  activity: "M22 12h-4l-3 9L9 3l-3 9H2",
  backup:
    "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
} as const;

export type Ikona = keyof typeof IKONAT;

/**
 * Një lidhje e menysë anash, që ndriçon kur je te ajo faqe.
 *
 * `usePathname()` punon vetëm në shfletues, prandaj kjo skedë është "use
 * client" — pjesa tjetër e menysë mbetet në server.
 */
export default function SidebarLink({
  href,
  label,
  icon,
  /** Ndriçon edhe te nënfaqet, p.sh. `/admin/aktiviteti` për `/admin`. */
  exact = false,
}: {
  href: string;
  label: string;
  icon: Ikona;
  exact?: boolean;
}) {
  const path = usePathname();
  const aktiv = exact ? path === href : path === href || path.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={aktiv ? "page" : undefined}
      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
        aktiv
          ? "bg-white/10 font-medium text-white"
          : "text-slate-300 hover:bg-white/5 hover:text-white"
      }`}
    >
      {/* Shiriti i kuq majtas: e njëjta e kuqe si kryqi te logoja. */}
      {aktiv && (
        <span className="absolute inset-y-1.5 left-0 hidden w-1 rounded-full bg-accent sm:block" />
      )}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={`hidden h-[18px] w-[18px] shrink-0 sm:block ${
          aktiv ? "text-white" : "text-slate-400 group-hover:text-white"
        }`}
      >
        <path d={IKONAT[icon]} />
      </svg>
      {label}
    </Link>
  );
}
