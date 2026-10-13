"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LANGS, type Lang } from "@/lib/i18n";
import { setLang } from "./language-action";

/**
 * Zgjedhja e gjuhës te menyja anash.
 *
 * Zgjedhja ruhet në një cookie te serveri, jo në shfletues. Kështu faqja
 * vjen e përkthyer që në kërkesën e parë, dhe gjuha mbetet edhe pas
 * mbylljes së shfletuesit.
 */
export default function LanguageSwitcher({ aktive }: { aktive: Lang }) {
  const router = useRouter();
  const [duke, startTransition] = useTransition();

  return (
    <div className="flex gap-0.5 rounded-lg bg-white/5 p-0.5">
      {LANGS.map((g) => (
        <button
          key={g.code}
          type="button"
          disabled={duke || g.code === aktive}
          onClick={() =>
            startTransition(async () => {
              await setLang(g.code);
              router.refresh();
            })
          }
          className={`rounded-md px-2 py-1 text-xs transition ${
            g.code === aktive
              ? "bg-white font-medium text-brand-dark"
              : "text-slate-300 hover:text-white"
          }`}
        >
          {g.label}
        </button>
      ))}
    </div>
  );
}
