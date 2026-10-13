"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

/**
 * Skedat e faqes së terminit.
 *
 * Blloqet nuk fshihen nga faqja — vetëm nga sytë (`hidden`). Kjo është me
 * qëllim: fushat e formularit rrinë brenda faqes edhe kur nuk duken, prandaj
 * butoni "Ruaj ndryshimet" i dërgon të gjitha njëherësh, pavarësisht se te
 * cila skedë ndodhesh. Po t'i hiqnim nga faqja, ato do të ruheshin bosh.
 */
type TabsContextValue = { aktive: string };

const TabsContext = createContext<TabsContextValue | null>(null);

export type TabDef = { id: string; label: string };

export function Tabs({
  tabs,
  children,
  fillestare,
}: {
  tabs: TabDef[];
  children: ReactNode;
  /** Skeda e hapur në fillim. Pa të, hapet e para. */
  fillestare?: string;
}) {
  const [aktive, setAktive] = useState(fillestare ?? tabs[0]?.id ?? "");

  return (
    <TabsContext.Provider value={{ aktive }}>
      <div
        role="tablist"
        className="mb-5 flex flex-wrap gap-1 border-b border-slate-200"
      >
        {tabs.map((t) => {
          const eshte = t.id === aktive;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={eshte}
              onClick={() => setAktive(t.id)}
              className={`-mb-px rounded-t-lg border-b-2 px-4 py-2.5 text-sm transition ${
                eshte
                  ? "border-slate-900 font-medium text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {children}
    </TabsContext.Provider>
  );
}

/**
 * Një bllok që i përket një ose disa skedave.
 *
 * Jashtë `<Tabs>` — p.sh. te paneli "Cakto termin të ri" në faqen kryesore —
 * nuk ka skeda fare, prandaj shfaqet gjithmonë.
 */
export function TabPanel({
  id,
  children,
}: {
  id: string | string[];
  children: ReactNode;
}) {
  const ctx = useContext(TabsContext);
  if (!ctx) return <>{children}</>;

  const idet = Array.isArray(id) ? id : [id];
  return <div hidden={!idet.includes(ctx.aktive)}>{children}</div>;
}
