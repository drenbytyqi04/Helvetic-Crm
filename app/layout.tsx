import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import ActivityTracker from "./activity-tracker";
import Sidebar from "./sidebar";
import { getCurrentUser } from "@/lib/auth";
import { hasSupabaseConfig } from "@/lib/supabase/server";
import { getLang } from "@/lib/i18n-server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Helvetic",
  description: "Termine — Helvetic",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Menyja anash del vetëm për të kyçurit. Faqja e hyrjes mbetet e zhveshur,
  // sepse aty s'ka ende as llogari e as ku të shkosh.
  const user = hasSupabaseConfig() ? await getCurrentUser() : null;
  // `lang` i thotë shfletuesit në ç'gjuhë është faqja: e ndihmon leximin
  // me zë dhe përkthimin automatik.
  const lang = await getLang();

  return (
    <html lang={lang} className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50">
        {user ? (
          <div className="flex min-h-screen flex-col sm:flex-row">
            <Sidebar user={user} />
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        ) : (
          children
        )}
        {/* Nuk vizaton asgjë; vetëm shënon kohën aktive. */}
        <ActivityTracker />
      </body>
    </html>
  );
}
