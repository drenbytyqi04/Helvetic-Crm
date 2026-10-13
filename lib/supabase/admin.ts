import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Lidhja me çelësin `service_role` — ajo që i kapërcen të gjitha rregullat e
 * sigurisë (RLS) dhe mund të krijojë llogari.
 *
 * KUJDES: ky çelës nuk guxon të dalë kurrë te shfletuesi. Ai lexohet nga
 * `SUPABASE_SERVICE_ROLE_KEY`, e cila NUK ka parashtesën `NEXT_PUBLIC_`;
 * Next.js-i i dërgon te shfletuesi vetëm ato me atë parashtesë, prandaj kjo
 * mbetet në server edhe po ta importonte dikush gabimisht.
 *
 * Përdore vetëm brenda Server Action-ave që e kanë kontrolluar më parë se
 * kush po e thërret (`requireAdmin()`).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Mungon SUPABASE_SERVICE_ROLE_KEY. Shtoje te `.env.local` dhe te " +
        "rregullimet e Vercel-it, pastaj rinis serverin."
    );
  }

  return createSupabaseClient(url, key, {
    auth: {
      // Kjo lidhje s'i përket asnjë njeriu: nuk ruan sesion dhe nuk e freskon.
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
