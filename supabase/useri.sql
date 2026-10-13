-- =====================================================================
-- USERI: cakton termine, dhe sheh VETËM të vetat
-- =====================================================================
--
-- Deri tani përdoruesi i thjeshtë ishte lexues: i shihte TË GJITHA terminet
-- e regjistruara, por nuk caktonte dot asnjë. Tani është agjent i vogël —
-- cakton terminet e veta, dhe sheh vetëm ato.
--
-- Kush sheh çfarë, pas kësaj skede:
--
--   admin, menaxher   të gjitha terminet
--   ekspert           vetëm ato që ia jep admini (si më parë)
--   user              vetëm ato që ka caktuar vetë
--
-- Kush shkruan çfarë:
--
--   cakton termin     admin, menaxher, user   (jo eksperti)
--   ndryshon termin   admin, menaxher: çdo termin; user: vetëm të vetin
--   fshin termin      admin, menaxher         (pa ndryshim)
--   shënime           te terminet që i sheh
--
-- KUJDES — kjo ngushton pamjen e dikujt që deri dje shihte më shumë. Pas
-- kësaj skede, një përdorues i thjeshtë nuk i sheh më terminet e menaxherëve.
-- Kjo është pikërisht ajo që kërkohet, por s'ka si të mos vihet re.
--
-- Fshirja mbetet vetëm te menaxheri me qëllim: fshirja e një termini merr me
-- vete edhe shënimet e tij (`on delete cascade`) dhe nuk kthehet mbrapsht.
-- Nuk u kërkua, prandaj nuk u dha.

-- ---------------------------------------------------------------------
-- 1. Caktimi i një termini
-- ---------------------------------------------------------------------
-- `user_id = auth.uid()` do të thotë: secili e cakton në emrin e vet. Askush
-- nuk shkruan dot një termin sikur ta kishte caktuar dikush tjetër.
--
-- Eksperti mbetet jashtë: ai lexon dhe shkruan feedback, nuk cakton.

drop policy if exists appointments_insert_manager on public.appointments;
drop policy if exists appointments_insert_own on public.appointments;
create policy appointments_insert_own on public.appointments
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and not (select public.is_expert())
  );

-- ---------------------------------------------------------------------
-- 2. Leximi i termineve
-- ---------------------------------------------------------------------
-- Tri degë, dhe secila mbulon një rol:
--
--   menaxher/admin  gjithçka
--   ekspert         ato që ia ka dhënë admini
--   user            të vetat
--
-- Dega e fundit thotë `not is_expert()` sepse te terminet e ekspertit
-- `user_id` është ai që ia caktoi, jo vetë eksperti — pa këtë kusht, një
-- ekspert që ka caktuar dikur një termin do ta shihte atë përjetë.

drop policy if exists appointments_select_all on public.appointments;
drop policy if exists appointments_select_scoped on public.appointments;
create policy appointments_select_scoped on public.appointments
  for select to authenticated
  using (
    (select public.is_manager())
    or (
      (select public.is_expert())
      and exists (
        select 1 from public.appointment_experts ae
        where ae.appointment_id = appointments.id
          and ae.expert_id = (select auth.uid())
      )
    )
    or (
      not (select public.is_expert())
      and user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------
-- 3. Ndryshimi i një termini
-- ---------------------------------------------------------------------
-- Useri e ndryshon terminin e vet. Pa këtë, ai do ta caktonte terminin dhe
-- pastaj nuk do të shkruante dot kurrë se si përfundoi — as rezultatin, as
-- kontratën. Një termin që nuk mbyllet dot s'i shërben askujt.
--
-- `with check` e njëjtë me `using`: e ndalon dorëzimin e terminit te dikush
-- tjetër duke i ndërruar `user_id`.

drop policy if exists appointments_update_manager on public.appointments;
drop policy if exists appointments_update_own on public.appointments;
create policy appointments_update_own on public.appointments
  for update to authenticated
  using (
    (select public.is_manager())
    or (
      not (select public.is_expert())
      and user_id = (select auth.uid())
    )
  )
  with check (
    (select public.is_manager())
    or (
      not (select public.is_expert())
      and user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------
-- 4. Shënimet: te terminet që i sheh, dhe askund tjetër
-- ---------------------------------------------------------------------
-- E njëjta ndarje si te terminet. Pa këtë, useri do t'i lexonte shënimet e
-- një termini që vetë terminin s'e sheh dot — dhe shënimet mbajnë emra,
-- numra telefoni dhe biseda.
--
-- Dega e userit pyet vetë tabelën `appointments`. Kushti është i shkruar
-- shprehimisht (`a.user_id = auth.uid()`), jo i lënë në dorë të rregullave
-- të asaj tabele: kështu del njësoj pavarësisht se si i zbaton baza
-- rregullat brenda rregullave.

drop policy if exists notes_select_all on public.notes;
drop policy if exists notes_select_scoped on public.notes;
create policy notes_select_scoped on public.notes
  for select to authenticated
  using (
    (select public.is_manager())
    or (
      (select public.is_expert())
      and exists (
        select 1 from public.appointment_experts ae
        where ae.appointment_id = notes.appointment_id
          and ae.expert_id = (select auth.uid())
      )
    )
    or (
      not (select public.is_expert())
      and exists (
        select 1 from public.appointments a
        where a.id = notes.appointment_id
          and a.user_id = (select auth.uid())
      )
    )
  );

drop policy if exists notes_insert_any_appointment on public.notes;
drop policy if exists notes_insert_scoped on public.notes;
create policy notes_insert_scoped on public.notes
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (
      (select public.is_manager())
      or (
        (select public.is_expert())
        and exists (
          select 1 from public.appointment_experts ae
          where ae.appointment_id = notes.appointment_id
            and ae.expert_id = (select auth.uid())
        )
      )
      or (
        not (select public.is_expert())
        and exists (
          select 1 from public.appointments a
          where a.id = notes.appointment_id
            and a.user_id = (select auth.uid())
        )
      )
    )
  );

-- ---------------------------------------------------------------------
-- 5. Indekset
-- ---------------------------------------------------------------------
-- Tashmë ekzistojnë nga `supabase/faqosja.sql`:
--   appointments_user_created_nr_idx  (user_id, created_at desc, nr desc)
--   appointments_user_scheduled_idx   (user_id, scheduled_at desc)
-- I pari mban listën e userit, i dyti dashboard-in e tij. S'ka nevojë për
-- asgjë të re: filtri i userit është pikërisht `user_id`.
