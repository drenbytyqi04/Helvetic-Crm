-- =====================================================================
-- ÇFARË KA MBETUR PA U ZBATUAR
--
-- Kjo skedë i bashkon dy gjërat e vetme që aplikacioni pret ende nga baza.
-- Të dyja janë pjesë të `roles.sql` dhe `nr.sql`; këtu janë bashkuar që t'i
-- ekzekutosh me një të ngjitur, jo dy.
--
-- SI PËRDORET:
--   Supabase -> SQL Editor -> New query -> ngjit GJITHË këtë -> Run
--
-- Mund ta ekzekutosh disa herë pa dëm. E provuar mbi Postgres 16 me të
-- dhëna ekzistuese: numrat dalin sipas radhës së krijimit, asnjë termin nuk
-- mbetet pa numër, dhe ekzekutimi i dytë nuk ndryshon asgjë.
--
-- VINI RE: mbyllja e regjistrimit të lirë NUK bëhet me SQL. Ajo bëhet te
-- Authentication -> Sign In / Providers -> Email -> fik "Allow new users to
-- sign up". Pa atë, kushdo mund të hapë llogari.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Emrat e kolegëve te tabela e feedback-ut
-- ---------------------------------------------------------------------
-- Pa këtë, kolona "Përdoruesi" tregon një vizë për shënimet e të tjerëve,
-- sepse përdoruesi lexon vetëm profilin e vet. Lexohet vetëm id/email/rol;
-- ndryshimi i rolit mbetet i mbyllur për të gjithë (s'ka rregull update).
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select to authenticated
  using (true);


-- ---------------------------------------------------------------------
-- 2. Numri i shkurtër i terminit: /admin/terminet/1000
-- ---------------------------------------------------------------------
create sequence if not exists public.appointment_nr_seq start with 1000;

alter table public.appointments add column if not exists nr bigint;

-- Terminet ekzistuese numërohen sipas radhës së krijimit: më i vjetri merr
-- numrin më të vogël. Rreshtat që kanë numër nuk preken.
with radha as (
  select
    id,
    999 + row_number() over (order by created_at, id) as numri
  from public.appointments
  where nr is null
)
update public.appointments a
set nr = radha.numri
from radha
where a.id = radha.id;

select setval(
  'public.appointment_nr_seq',
  greatest(coalesce((select max(nr) from public.appointments), 999), 999)
);

alter table public.appointments
  alter column nr set default nextval('public.appointment_nr_seq');
alter table public.appointments alter column nr set not null;

create unique index if not exists appointments_nr_key
  on public.appointments (nr);

alter sequence public.appointment_nr_seq owned by public.appointments.nr;

grant usage, select on sequence public.appointment_nr_seq to authenticated;

-- Adresa e një termini duhet të mbetet e njëjtë përgjithmonë.
create or replace function public.keep_appointment_nr()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.nr := old.nr;
  return new;
end;
$$;

drop trigger if exists appointments_keep_nr on public.appointments;
create trigger appointments_keep_nr
  before update on public.appointments
  for each row execute function public.keep_appointment_nr();


-- ---------------------------------------------------------------------
-- 3. Kontrolli
-- ---------------------------------------------------------------------
-- Ekzekutoji këto dy rreshta pas Run-it; duhet të shohësh terminet me numra
-- dhe rregullin e ri të profileve:
--
--   select nr, name, created_at from public.appointments order by nr;
--   select policyname from pg_policies where tablename = 'profiles';
