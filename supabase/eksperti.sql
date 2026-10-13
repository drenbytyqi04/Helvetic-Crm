-- =====================================================================
-- ROLI I KATËRT: EKSPERTI
-- =====================================================================
--
-- Eksperti sheh VETËM terminet që ia jep admini. Mbi to lexon të dhënat e
-- personit dhe shkruan feedback — si përdoruesi i thjeshtë, por i kufizuar
-- te ato që i janë dhënë. Nuk cakton, nuk ndryshon dhe nuk fshin termine.
--
-- Një termin mund t'u jepet DISA ekspertëve njëherësh. Aksesin e jep vetëm
-- admini.
--
-- KJO NDRYSHON DIÇKA THEMELORE. Deri tani rregulli i leximit ishte
-- `using (true)`: çdo i kyçur i shihte të gjitha terminet dhe të gjitha
-- shënimet. Për tri rolet e para kjo mbetet ashtu — asgjë nuk ndryshon për
-- ta. Por eksperti nuk mund të mbetet nën atë rregull, ndryshe do t'i
-- lexonte të gjitha; prandaj rregulli bëhet i vetëdijshëm për rolin.
--
-- Shënimet kërkojnë të njëjtin kujdes. Po ta linim `using (true)`, eksperti
-- do të mos e shihte terminin e huaj te lista, por do t'i lexonte shënimet e
-- tij përmes API-së. Të dyja mbyllen bashkë.

-- ---------------------------------------------------------------------
-- 1. Roli
-- ---------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('user', 'manager', 'admin', 'expert'));

/**
 * A është eksperti ai që po pyet?
 *
 * `security definer` sepse duhet të lexojë `profiles` pa u kapur nga vetë
 * rregulli që po e llogarit. E njëjta arsye si te `is_admin()` dhe
 * `is_manager()`.
 */
create or replace function public.is_expert()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'expert'
  );
$$;

revoke execute on function public.is_expert() from anon, public;
grant  execute on function public.is_expert() to authenticated;

-- ---------------------------------------------------------------------
-- 2. Kush e sheh cilin termin
-- ---------------------------------------------------------------------
-- Një rresht për çdo çift (termin, ekspert). Disa ekspertë për një termin
-- janë thjesht disa rreshta.

create table if not exists public.appointment_experts (
  appointment_id uuid not null
    references public.appointments (id) on delete cascade,
  expert_id uuid not null
    references public.profiles (id) on delete restrict,
  -- Kush ia dha aksesin, dhe kur. Nuk fshihet bashkë me llogarinë e atij që
  -- e dha: gjurma e kujt e hapi derën mbetet.
  granted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (appointment_id, expert_id)
);

comment on table public.appointment_experts is
  'Cili ekspert e sheh cilin termin. Vetem admini shton e heq.';

-- Terminet e një eksperti: kërkohen sa herë ai hap listën.
create index if not exists appointment_experts_expert_idx
  on public.appointment_experts (expert_id);

-- `granted_by` tregon një profil. Pa indeks, fshirja e një llogarie do të
-- skanonte tërë tabelën për të gjetur rreshtat që e përmendin.
create index if not exists appointment_experts_granted_by_idx
  on public.appointment_experts (granted_by);

alter table public.appointment_experts enable row level security;

-- Eksperti i sheh rreshtat e vet (që të dijë ç'i është dhënë). Admini dhe
-- menaxheri i shohin të gjithë, që paneli te faqja e terminit të tregojë kush
-- e ka aksesin.
drop policy if exists appointment_experts_select on public.appointment_experts;
create policy appointment_experts_select on public.appointment_experts
  for select to authenticated
  using (
    expert_id = (select auth.uid())
    or (select public.is_manager())
  );

-- Shton dhe heq VETËM admini. Menaxheri jo — ashtu u vendos.
drop policy if exists appointment_experts_insert_admin on public.appointment_experts;
create policy appointment_experts_insert_admin on public.appointment_experts
  for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists appointment_experts_delete_admin on public.appointment_experts;
create policy appointment_experts_delete_admin on public.appointment_experts
  for delete to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- 3. Leximi i termineve, tani i vetëdijshëm për rolin
-- ---------------------------------------------------------------------
-- Për user, manager dhe admin: si më parë, të gjitha.
-- Për ekspertin: vetëm ato që i janë dhënë.

drop policy if exists appointments_select_all on public.appointments;
create policy appointments_select_all on public.appointments
  for select to authenticated
  using (
    not (select public.is_expert())
    or exists (
      select 1 from public.appointment_experts ae
      where ae.appointment_id = appointments.id
        and ae.expert_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------
-- 4. Leximi i shënimeve, po ashtu
-- ---------------------------------------------------------------------
-- Pa këtë, eksperti do t'i lexonte shënimet e termineve që s'i sheh dot.

drop policy if exists notes_select_all on public.notes;
create policy notes_select_all on public.notes
  for select to authenticated
  using (
    not (select public.is_expert())
    or exists (
      select 1 from public.appointment_experts ae
      where ae.appointment_id = notes.appointment_id
        and ae.expert_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------
-- 5. Shkrimi i shënimeve
-- ---------------------------------------------------------------------
-- Eksperti shkruan shënim, por vetëm te terminet që i janë dhënë. Rregulli i
-- vjetër kërkonte thjesht që termini të ekzistonte.

drop policy if exists notes_insert_any_appointment on public.notes;
create policy notes_insert_any_appointment on public.notes
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.appointments a where a.id = notes.appointment_id
    )
    and (
      not (select public.is_expert())
      or exists (
        select 1 from public.appointment_experts ae
        where ae.appointment_id = notes.appointment_id
          and ae.expert_id = (select auth.uid())
      )
    )
  );

-- ---------------------------------------------------------------------
-- 6. Terminet: eksperti nuk i prek
-- ---------------------------------------------------------------------
-- Rregullat e shkrimit tashmë kërkojnë `is_manager()`, dhe eksperti nuk është
-- menaxher — prandaj s'ka nevojë për asgjë të re. Shënohet këtu vetëm që të
-- mos kërkohet kot më vonë.
