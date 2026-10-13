-- =====================================================================
-- HYRJA E HEQUR VLEN MENJËHERË
-- =====================================================================
--
-- Kur admini i hiqte hyrjen dikujt, ai person vazhdonte të punonte: hapte
-- faqe, caktonte termine, shkruante shënime. Deri në një orë.
--
-- Pse: fshihej rreshti te `auth.users`, por çelësi që mban shfletuesi i tij
-- (JWT) është i nënshkruar dhe vlen deri sa t'i mbarojë koha — te Supabase,
-- rreth një orë. Deri atëherë `auth.uid()` kthen ende id-në e tij, dhe
-- ASNJË rregull leximi a shkrimi nuk e pyeste nëse llogaria ishte ende e
-- gjallë: ato pyesnin vetëm për rolin.
--
-- Prandaj shenja `active` te `profiles` — e cila deri tani shërbente vetëm
-- për t'i vënë një etiketë te lista — bëhet kusht i vërtetë. Nga tani asnjë
-- veprim nuk kalon pa të.
--
-- Faqja e kontrollon veç e veç (`lib/auth.ts`), dhe ajo e nxjerr njeriun
-- jashtë me klikimin e parë. Kjo skedë është shtresa poshtë saj: mbron edhe
-- nga një kërkesë e dërguar drejt te baza, jashtë faqes sonë, me çelësin që
-- i ka mbetur në dorë.

-- ---------------------------------------------------------------------
-- 1. A e ka ende hyrjen ai që po pyet?
-- ---------------------------------------------------------------------
-- `security definer`, si tri funksionet e roleve: duhet ta lexojë profilin
-- edhe kur vetë rregullat e profileve nuk do ta lejonin.
--
-- Pa profil -> `false`. Kjo është zgjedhje: një gabim këtu e mban njeriun
-- jashtë, jo brenda. Kolona `active` është `not null default true`, prandaj
-- asnjë llogari e rregullt nuk bie këtu pa dashje.

create or replace function public.eshte_aktiv()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.active from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

comment on function public.eshte_aktiv is
  'A e ka ende hyrjen llogaria që po bën kërkesën. Pa profil kthen false.';

revoke execute on function public.eshte_aktiv() from anon, public;
grant  execute on function public.eshte_aktiv() to authenticated;

-- ---------------------------------------------------------------------
-- 2. Rolet vlejnë vetëm sa kohë vlen hyrja
-- ---------------------------------------------------------------------
-- Një menaxher të cilit i është hequr hyrja nuk është më menaxher.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active and role = 'admin'
  );
$$;

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active and role in ('manager', 'admin')
  );
$$;

create or replace function public.is_expert()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active and role = 'expert'
  );
$$;

-- ---------------------------------------------------------------------
-- 3. Çdo rregull nis me të njëjtën pyetje
-- ---------------------------------------------------------------------
-- Kushti i vjetër mbetet fjalë për fjalë; para tij shtohet vetëm hyrja.
-- Për degët që kalojnë nga `is_manager()` a `is_expert()` kjo është e
-- tepërt — ato tani e kërkojnë vetë — por rregulli lexohet më lehtë kur
-- pyetja e parë është e njëjta kudo.

-- ---------- profiles ----------
-- KUJDES te dega e dytë: secili e sheh GJITHMONË rreshtin e vet, edhe pa
-- hyrje. Pa të, faqja nuk e mëson dot se llogaria u hoq — ajo e lexon
-- `active` pikërisht nga ky rresht, dhe një rregull që ia fsheh atë do ta
-- linte njeriun brenda, i trajtuar si përdorues i zakonshëm.
--
-- Nuk rrjedh asgjë: sheh vetëm veten, dhe asnjë veprim tjetër nuk i hapet.
drop policy if exists profiles_select_all on public.profiles;
create policy profiles_select_all on public.profiles
  for select to authenticated
  using ((select public.eshte_aktiv()) or id = (select auth.uid()));

-- ---------- activity_days ----------
drop policy if exists activity_select_own_or_admin on public.activity_days;
create policy activity_select_own_or_admin on public.activity_days
  for select to authenticated
  using (
    (select public.eshte_aktiv())
    and ((user_id = (select auth.uid())) or (select public.is_admin()))
  );

-- ---------- appointments ----------
drop policy if exists appointments_insert_own on public.appointments;
create policy appointments_insert_own on public.appointments
  for insert to authenticated
  with check (
    (select public.eshte_aktiv())
    and user_id = (select auth.uid())
    and not (select public.is_expert())
  );

drop policy if exists appointments_select_scoped on public.appointments;
create policy appointments_select_scoped on public.appointments
  for select to authenticated
  using (
    (select public.eshte_aktiv())
    and (
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
    )
  );

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
drop policy if exists notes_select_scoped on public.notes;
create policy notes_select_scoped on public.notes
  for select to authenticated
  using (
    (select public.eshte_aktiv())
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

drop policy if exists notes_insert_scoped on public.notes;
create policy notes_insert_scoped on public.notes
  for insert to authenticated
  with check (
    (select public.eshte_aktiv())
    and user_id = (select auth.uid())
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

drop policy if exists notes_update_author_or_admin on public.notes;
create policy notes_update_author_or_admin on public.notes
  for update to authenticated
  using (
    (select public.eshte_aktiv())
    and ((user_id = (select auth.uid())) or (select public.is_admin()))
  )
  with check (
    (select public.eshte_aktiv())
    and ((user_id = (select auth.uid())) or (select public.is_admin()))
  );

-- ---------- appointment_experts ----------
drop policy if exists appointment_experts_select on public.appointment_experts;
create policy appointment_experts_select on public.appointment_experts
  for select to authenticated
  using (
    (select public.eshte_aktiv())
    and (expert_id = (select auth.uid()) or (select public.is_manager()))
  );

-- ---------------------------------------------------------------------
-- 4. Ora e punës nuk numërohet më
-- ---------------------------------------------------------------------
-- `record_activity()` është `security definer`, pra shkruan pa kaluar nga
-- rregullat. Pa këtë kusht, shfletuesi i një llogarie të hequr do të
-- vazhdonte t'i dërgonte sinjalin «jam aktiv» dhe orët do të rriteshin.

create or replace function public.record_activity()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid   uuid := auth.uid();
  sot   date := (now() at time zone 'Europe/Belgrade')::date;
  boshllek numeric;
begin
  -- I vetmi ndryshim nga `supabase/activity.sql`: edhe hyrja, jo vetëm
  -- kyçja. Trupi tjetër mbetet fjalë për fjalë ai që ishte.
  if uid is null or not public.eshte_aktiv() then
    return;
  end if;

  select extract(epoch from (now() - last_seen_at))
    into boshllek
    from public.activity_days
   where user_id = uid and day = sot;

  insert into public.activity_days (user_id, day, active_seconds, last_seen_at)
  values (uid, sot, 0, now())
  on conflict (user_id, day) do update
     set active_seconds = public.activity_days.active_seconds
                          + least(coalesce(boshllek, 0), 300)::int,
         last_seen_at   = now();
end;
$$;
