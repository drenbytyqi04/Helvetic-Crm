-- =====================================================================
-- NDRYSHIMIN E TERMINIT E BËN VETËM MENAXHERI
-- =====================================================================
--
-- Me `supabase/useri.sql` përdoruesi i thjeshtë mund ta ndryshonte terminin
-- që kishte caktuar vetë. Kjo hiqet: ai e cakton terminin dhe shkruan
-- feedback mbi të, por nuk e prek më pas.
--
-- Kush çfarë, pas kësaj skede:
--
--   cakton termin      admin, menaxher, user   (pa ndryshim)
--   sheh terminet      admin e menaxher të gjitha; user të vetat;
--                      ekspert ato që ia jep admini   (pa ndryshim)
--   NDRYSHON TERMININ  vetëm admin dhe menaxher       ← ky ndryshim
--   fshin terminin     vetëm admin dhe menaxher       (pa ndryshim)
--   shkruan feedback   te terminet që sheh            (pa ndryshim)
--
-- PASOJA, e vetëdijshme: useri nuk e mbyll dot terminin e vet. E cakton me
-- rezultatin fillestar «në bisedim», dhe rezultatin përfundimtar — u mbajt,
-- doli kontratë, u anulua — e shënon menaxheri. Useri mund ta shkruajë si
-- feedback, por numrat e raporteve dalin nga `category`, jo nga shënimet.
-- Kështu u kërkua.

drop policy if exists appointments_update_own on public.appointments;
drop policy if exists appointments_update_manager on public.appointments;
create policy appointments_update_manager on public.appointments
  for update to authenticated
  using ((select public.is_manager()))
  with check ((select public.is_manager()));
