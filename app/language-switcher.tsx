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
    <div className="flex gap-1">
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
          className={`rounded px-2 py-1 text-xs transition ${
            g.code === aktive
              ? "bg-brand font-medium text-white"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          {g.label}
        </button>
      ))}
    </div>
  );
}
