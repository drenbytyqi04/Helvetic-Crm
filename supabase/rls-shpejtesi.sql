-- =====================================================================
-- RREGULLAT E LEXIMIT: një herë për kërkesë, jo një herë për rresht
-- =====================================================================
--
-- Rregullat e RLS-së e thërrisnin `auth.uid()` dhe `is_admin()`/`is_manager()`
-- SI PJESË TË KUSHTIT, prandaj Postgres-i i ekzekutonte ato për çdo rresht që
-- shqyrtonte. Me pak dhjetëra termine kjo s'duket. Me mijëra, po: e njëjta
-- llogari bëhet mijëra herë, dhe përgjigjja është gjithmonë e njëjta.
--
-- `(select auth.uid())` e detyron bazën ta llogarisë NJË HERË në fillim dhe
-- ta mbajë atë vlerë për tërë kërkesën. Kuptimi mbetet fiks i njëjti: të tri
-- funksionet janë `stable` dhe pa argumente, pra brenda një kërkese kthejnë
-- gjithnjë të njëjtën gjë. Ndryshon vetëm sa herë llogariten.
--
-- Kjo është edhe këshilla e vetë Supabase-it (paralajmërimi `auth_rls_initplan`).
--
-- KUJDES: këto janë rregulla sigurie. Matrica e lejeve — kush lexon, kush
-- cakton, kush ndryshon, kush fshin — u shënua para ndryshimit dhe u krahasua
-- pas tij, rresht për rresht. Duhet të dalë e njëjta.

-- ---------- activity_days ----------
drop policy if exists activity_select_own_or_admin on public.activity_days;
create policy activity_select_own_or_admin on public.activity_days
  for select to authenticated
  using ((user_id = (select auth.uid())) or (select public.is_admin()));

-- ---------- appointments ----------
drop policy if exists appointments_insert_manager on public.appointments;
create policy appointments_insert_manager on public.appointments
  for insert to authenticated
  with check ((user_id = (select auth.uid())) and (select public.is_manager()));

drop policy if exists appointments_update_manager on public.appointments;
create policy appointments_update_manager on public.appointments
  for update to authenticated
  using ((select public.is_manager()))
  with check ((select public.is_manager()));

drop policy if exists appointments_delete_manager on public.appointments;
create policy appointments_delete_manager on public.appointments
  for delete to authenticated
  using ((select public.is_manager()));

-- ---------- notes ----------
drop policy if exists notes_insert_any_appointment on public.notes;
create policy notes_insert_any_appointment on public.notes
  for insert to authenticated
  with check (
    (user_id = (select auth.uid()))
    and exists (select 1 from public.appointments a where a.id = notes.appointment_id)
  );

drop policy if exists notes_update_author_or_admin on public.notes;
create policy notes_update_author_or_admin on public.notes
  for update to authenticated
  using ((user_id = (select auth.uid())) or (select public.is_admin()))
  with check ((user_id = (select auth.uid())) or (select public.is_admin()));
