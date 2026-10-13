-- =====================================================================
-- FSHIRJA E NJË LLOGARIE PA HUMBUR TË DHËNAT
--
-- PROBLEMI: terminet, shënimet dhe aktiviteti tregonin drejt `auth.users`
-- me `on delete cascade`. Pra fshirja e një menaxheri merrte me vete çdo
-- termin që kishte caktuar dhe çdo shënim që kishte shkruar.
--
-- ZGJIDHJA: tabela `profiles` bëhet regjistri i qëndrueshëm i njerëzve.
-- Ajo nuk fshihet kurrë; fshihet vetëm llogaria te `auth.users`, dhe kjo
-- i heq personit hyrjen. Të dhënat mbeten, dhe mbeten të lidhura me emrin
-- e tij — jo me atë të adminit.
--
--   para:  termine/shënime -> auth.users  (fshihen bashkë me llogarinë)
--   pas:   termine/shënime -> profiles    (profiles nuk fshihet kurrë)
--
-- SI PËRDORET:
--   Supabase -> SQL Editor -> New query -> ngjit -> Run
--
-- Mund ta ekzekutosh disa herë pa dëm.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Profili mbijeton fshirjes së llogarisë
-- ---------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_id_fkey;

-- `active = false` do të thotë: personi është këtu në histori, por nuk hyn dot.
alter table public.profiles
  add column if not exists active boolean not null default true;

-- ---------------------------------------------------------------------
-- 2. Çdo person që ka të dhëna duhet të ketë profil
-- ---------------------------------------------------------------------
-- Përndryshe lidhjet e reja do të refuzoheshin. Kjo mbush çdo profil që
-- mungon, para se të vendosen lidhjet.
insert into public.profiles (id, email, role, active)
select distinct t.user_id, null, 'user', false
from (
  select user_id from public.appointments
  union select user_id from public.notes
  union select user_id from public.activity_days
) t
where t.user_id is not null
  and not exists (select 1 from public.profiles p where p.id = t.user_id);

-- ---------------------------------------------------------------------
-- 3. Të dhënat tregojnë te profili, jo te llogaria
-- ---------------------------------------------------------------------
-- `restrict` do të thotë: profili nuk fshihet dot sa kohë ka të dhëna.
-- Kjo është mbrojtja e fundit kundër humbjes së tyre.
alter table public.appointments drop constraint if exists appointments_user_id_fkey;
alter table public.appointments
  add constraint appointments_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete restrict;

alter table public.notes drop constraint if exists notes_user_id_fkey;
alter table public.notes
  add constraint notes_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete restrict;

alter table public.activity_days drop constraint if exists activity_days_user_id_fkey;
alter table public.activity_days
  add constraint activity_days_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete restrict;

-- VINI RE: `notes.appointment_id -> appointments` mbetet `cascade`, dhe kjo
-- është me qëllim. Një shënim pa terminin e vet s'ka kuptim; kur menaxheri
-- fshin një termin, shënimet e atij termini ikin bashkë me të. Ajo është
-- fshirje e kërkuar shprehimisht, jo pasojë anësore e heqjes së dikujt.

-- ---------------------------------------------------------------------
-- 4. Kontrolli
-- ---------------------------------------------------------------------
--   select conname, confrelid::regclass, confdeltype
--   from pg_constraint where contype='f' and connamespace='public'::regnamespace;
--
--   select email, role, active from public.profiles order by active desc, email;
