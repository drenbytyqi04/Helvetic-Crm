import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Lidhja me Supabase për kodin që ekzekutohet në server.
 *
 * Ndryshe nga më parë, tani NUK përdorim çelës sekret. Përdorim çelësin publik
 * bashkë me sesionin e përdoruesit (i ruajtur në cookies). Kështu baza e të
 * dhënave e di se KUSH po pyet dhe ia kthen vetëm rreshtat e atij përdoruesi.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Thirrur nga një Server Component — sesionin e rifreskon `proxy.ts`.
          }
        },
      },
    }
  );
}

/** A janë vendosur vlerat në `.env.local`? */
export function hasSupabaseConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}
