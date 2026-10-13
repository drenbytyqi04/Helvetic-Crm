-- =====================================================================
-- FSHIRJA E TERMINEVE
--
-- Deri tani asnjë rregull nuk e lejonte fshirjen, prandaj askush s'fshinte
-- dot asgjë. Ky rregull ia jep atë të drejtë menaxherit dhe adminit.
--
-- Përdoruesi i thjeshtë NUK fshin: `is_manager()` kthen `true` vetëm për
-- rolet 'manager' dhe 'admin'.
--
-- KUJDES: shënimet e një termini fshihen bashkë me të, sepse te `schema.sql`
-- lidhja është `on delete cascade`. Kjo është me qëllim — një shënim pa
-- terminin e vet s'ka kuptim — por do të thotë se fshirja merr me vete edhe
-- feedback-un. Faqja e thotë hapur sa shënime humbin para se të pyesë.
--
-- SI PËRDORET:
--   Supabase -> SQL Editor -> New query -> ngjit -> Run
--
-- Mund ta ekzekutosh disa herë pa dëm.
-- =====================================================================

drop policy if exists "appointments_delete_manager" on public.appointments;
create policy "appointments_delete_manager" on public.appointments
  for delete to authenticated
  using (public.is_manager());

-- Kontrolli:
--   select policyname, cmd from pg_policies
--   where tablename = 'appointments' order by cmd;
