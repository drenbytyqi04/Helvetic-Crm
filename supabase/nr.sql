-- =====================================================================
-- NUMRI I SHKURTËR I TERMINIT
--
-- Deri tani adresa e një termini ishte një varg i gjatë, si:
--   /terminet/9a8d1413-ab8f-4ecc-9451-def98ae6336c
--
-- Ky numër i jep secilit termin një etiketë të shkurtër, si te TH-CRM:
--   /terminet/1001
--
-- Numri i brendshëm (`id`) nuk ndryshon — ai mbetet çelësi te të cilin
-- lidhen shënimet. `nr` është thjesht një emër i lehtë për njeriun.
--
-- SI PËRDORET:
--   Supabase -> SQL Editor -> New query -> ngjit gjithë skedën -> Run
--
-- Mund ta ekzekutosh disa herë pa dëm.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Numëratori
-- ---------------------------------------------------------------------
-- Fillon nga 1000, që numrat të kenë katër shifra qysh në fillim.
-- Ndrysho `start with` nëse do të nisin nga diku tjetër — por vetëm PARA
-- se ta ekzekutosh herën e parë.
create sequence if not exists public.appointment_nr_seq start with 1000;

alter table public.appointments add column if not exists nr bigint;

-- ---------------------------------------------------------------------
-- 2. Numrat për terminet që ekzistojnë tashmë
-- ---------------------------------------------------------------------
-- Sipas radhës së krijimit, që termini më i vjetër të marrë numrin më të
-- vogël. Rreshtat që kanë numër nuk preken, prandaj skeda ekzekutohet dot
-- disa herë.
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

-- Numëratori vazhdon aty ku mbaruan terminet ekzistuese.
select setval(
  'public.appointment_nr_seq',
  greatest(coalesce((select max(nr) from public.appointments), 999), 999)
);

-- ---------------------------------------------------------------------
-- 3. Që çdo termin i ri ta marrë numrin vetvetiu
-- ---------------------------------------------------------------------
alter table public.appointments
  alter column nr set default nextval('public.appointment_nr_seq');
alter table public.appointments alter column nr set not null;

-- Dy termine s'mund të kenë të njëjtin numër.
create unique index if not exists appointments_nr_key
  on public.appointments (nr);

-- Numëratori i përket kolonës: fshihet bashkë me të.
alter sequence public.appointment_nr_seq owned by public.appointments.nr;

-- Aplikacioni shkruan si përdorues i kyçur, prandaj i duhet leja për ta
-- lëvizur numëratorin përpara.
grant usage, select on sequence public.appointment_nr_seq to authenticated;

-- ---------------------------------------------------------------------
-- 4. Numri nuk ndryshohet më kurrë
-- ---------------------------------------------------------------------
-- Adresa e një termini duhet të mbetet e njëjtë përgjithmonë. Ky trigger
-- e kthen numrin e vjetër edhe nëse dikush përpiqet ta shkruajë tjetër.
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
-- 5. Kontrolli
-- ---------------------------------------------------------------------
--   select nr, name, created_at from public.appointments order by nr;
