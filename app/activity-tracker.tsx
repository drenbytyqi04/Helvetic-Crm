"use client";

import { useEffect } from "react";
import { recordActivity } from "./actions";

/**
 * Dërgon një sinjal "jam aktiv" çdo 2 minuta, sa kohë faqja është e hapur
 * dhe e dukshme. Nëse përdoruesi kalon në një skedë tjetër ose e minimizon
 * dritaren, sinjalet ndalen — kështu numërohet koha e vërtetë në punë, jo
 * thjesht koha me faqen të hapur diku pas.
 *
 * Nuk vizaton asgjë në faqe.
 */
export default function ActivityTracker() {
  useEffect(() => {
    const ping = () => {
      if (document.visibilityState === "visible") {
        void recordActivity();
      }
    };

    ping();
    const timer = setInterval(ping, 2 * 60 * 1000);
    document.addEventListener("visibilitychange", ping);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", ping);
    };
  }, []);

  return null;
}
