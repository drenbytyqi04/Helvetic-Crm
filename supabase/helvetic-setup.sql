-- =====================================================================
-- HELVETIC — NGRITJA E PLOTË E BAZËS, NË NJË SKEDË
--
-- Bashkon të gjitha skedat e kësaj dosjeje me radhën e saktë, që një
-- projekt i ri Supabase të dalë njësoj si CRM-ja e mëparshme.
--
-- SI PËRDORET:
--   Supabase -> SQL Editor -> New query -> ngjit GJITHË këtë -> Run
--   Ekzekutoje VETËM NJË HERË, mbi një projekt bosh (herën e dytë ndalet).
--
-- Pastaj:
--   1. Authentication -> Sign In / Providers -> Email -> fik
--      "Allow new users to sign up".
--   2. Authentication -> Users -> Add user (emaili yt + fjalëkalim).
--   3. Bëje veten admin:
--        update public.profiles set role = 'admin' where email = 'emaili.yt@shembull.com';
--
-- `pastrimi.sql` NUK është përfshirë: ajo ishte fshirja e të dhënave të
-- provës te klienti i mëparshëm.
-- =====================================================================


-- #####################################################################
-- schema.sql
-- #####################################################################

-- =====================================================================
-- Skema e bazës — CRM me termine
--
-- Sistemi ka NJË njësi: terminin. Të dhënat e personit rrinë mbi vetë
-- terminin, sepse çdo termin regjistrohet si ngjarje më vete. Tabela e
-- klientëve nuk ekziston më.
--
-- Tabelat:
--   appointments  — termini: personalia, të dhënat teknike, rezultati
--   notes         — shënime te një termin
--   profiles      — llogaria dhe roli (user / manager / admin)
--   activity_days — koha aktive për çdo përdorues, ditë pas dite
--
-- Skedat fqinje mbajnë pjesët e veçanta:
--   roles.sql     — rolet dhe lejet
--   activity.sql  — përcjellja e kohës
--
-- STATUSI: e gjithë skema është ZBATUAR në projektin "crm-test".
-- =====================================================================

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),

  -- Kush e caktoi terminin (menaxheri ose admini).
  user_id uuid not null default auth.uid()
    -- VINI RE: `llogari-pa-humbje.sql` e kthen këtë lidhje te `profiles`,
    -- që fshirja e një llogarie të mos marrë me vete punën e saj. Këtu nuk
    -- bëhet dot: `profiles` krijohet më vonë, te `admin.sql`.
    references auth.users (id) on delete cascade,

  -- --- Personalia e personit që takohet ---
  name text not null,
  customer_number text,
  gender text,
  nationality text,
  birth_date date,
  street text,
  postal_code text,
  city text,
  canton text,
  phone text,
  mobile text,
  email text,

  -- --- Të dhëna teknike ---
  call_center text,
  current_insurance text,
  call_date date,
  scheduled_at timestamptz not null,
  language text,
  persons_count integer not null default 1 check (persons_count > 0),

  -- --- Rezultati ---
  -- NJË status i vetëm, jo disa kuti të pavarura: kështu raportet nuk dalin
  -- kurrë kontradiktore (p.sh. "u mbajt" dhe "i anuluar" njëkohësisht).
  status text not null default 'open' check (status in (
    'open', 'held', 'cancelled', 'not_reached', 'refused',
    'negative', 'not_home', 'address_not_found', 'advisor_failed'
  )),
  multi_year_contract boolean not null default false,
  treatment boolean not null default false,

  -- Nuk lejohen më shumë kontrata se persona.
  contracts_closed integer not null default 0
    check (contracts_closed >= 0 and contracts_closed <= persons_count),

  -- --- Detaje të këshillimit (të dhëna të ndjeshme) ---
  family_details text,
  current_treatment text,
  treatment_type text,
  medications text,

  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists appointments_user_scheduled_idx
  on public.appointments (user_id, scheduled_at desc);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null
    references public.appointments (id) on delete cascade,
  user_id uuid not null default auth.uid()
    -- VINI RE: `llogari-pa-humbje.sql` e kthen këtë lidhje te `profiles`,
    -- që fshirja e një llogarie të mos marrë me vete punën e saj. Këtu nuk
    -- bëhet dot: `profiles` krijohet më vonë, te `admin.sql`.
    references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists notes_appointment_idx
  on public.notes (appointment_id, created_at desc);

alter table public.appointments enable row level security;
alter table public.notes        enable row level security;

-- Rregullat e leximit dhe të shkrimit janë te `roles.sql`.


-- #####################################################################
-- admin.sql
-- #####################################################################

-- =====================================================================
-- HAPI I ADMINISTRATORIT
--
-- Kjo skedë shton rolet: një "admin" që sheh të gjithë përdoruesit dhe
-- të gjitha të dhënat, ndërsa përdoruesit e zakonshëm mbeten të kufizuar
-- te të vetat.
--
-- STATUSI: kjo skedë është ZBATUAR TASHMË në projektin "crm-test", dhe
-- llogaria `dren.bytyqi19@gmail.com` është vendosur admin. Skeda ruhet si
-- dëshmi e strukturës; do të të duhej vetëm për një projekt tjetër.
--
-- SI PËRDORET (për një projekt të ri):
--   1. https://supabase.com/dashboard -> projekti yt
--   2. Menyja e majtë -> "SQL Editor" -> "New query"
--   3. Kopjo GJITHË këtë skedë, ngjite atje, kliko "Run"
--   4. Pastaj ekzekuto rreshtin e fundit (poshtë) me emailin tënd
--
-- Mund ta ekzekutosh disa herë pa dëm.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tabela e roleve
-- ---------------------------------------------------------------------
-- Një rresht për çdo llogari. Roli zgjerohet në 'manager' te `roles.sql`.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- Llogaritë që ekzistojnë tashmë marrin profilin e tyre tani.
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 2. Profili krijohet vetvetiu për çdo llogari të re
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 3. Pyetja "a është admin ai që po kërkon?"
-- ---------------------------------------------------------------------
-- `security definer` do të thotë që funksioni e lexon tabelën me të drejtat
-- e pronarit. Kjo është e nevojshme, përndryshe kontrolli do të hynte në
-- një cikël të pafund me vetë rregullat e sigurisë.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Këta dy funksione punojnë me të drejtat e pronarit, prandaj ua heqim
-- mundësinë e thirrjes nga jashtë atyre që s'u duhet:
--   - `handle_new_user()` është vetëm për trigger-in, askush s'duhet ta thërrasë.
--   - `is_admin()` u duhet përdoruesve të kyçur (thirret brenda rregullave RLS),
--     por jo vizitorëve pa llogari. Kthen thjesht "a jam unë admin?", prandaj
--     nuk zbulon asgjë për të tjerët.
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.is_admin() from anon, public;
grant  execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------
-- 4. Kush i sheh rolet
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- VINI RE: `roles.sql` e zëvendëson këtë rregull me një më të hapur
-- (`profiles_select_all`), që tabela e feedback-ut te termini të tregojë se
-- kush e shkroi secilin shënim. Ekzekutoje `roles.sql` pas kësaj skede.

-- VINI RE: nuk ka asnjë rregull për ndryshim (update/insert/delete).
-- Prandaj asnjë përdorues nuk mund ta bëjë veten admin. Rolet ndryshohen
-- vetëm nga ti, nga paneli i Supabase-it.

-- ---------------------------------------------------------------------
-- 5. Rregullat e leximit dhe të shkrimit
-- ---------------------------------------------------------------------
-- Këto janë te `supabase/roles.sql`, sepse varen nga të tri rolet
-- (user / manager / admin). Ekzekutoje atë skedë pas kësaj.

-- =====================================================================
-- 6. BËJE VETEN ADMIN
-- =====================================================================
-- Zëvendëso emailin me tëndin dhe ekzekuto këtë rresht:
--
--   update public.profiles set role = 'admin' where email = 'emaili.yt@shembull.com';
--
-- Kontrollo pastaj se u krye:
--
--   select email, role from public.profiles order by role;
--
-- E njëjta gjë mund të bëhet edhe pa SQL:
-- Table Editor -> profiles -> kliko qelizën `role` -> shkruaj `admin`.


-- #####################################################################
-- roles.sql
-- #####################################################################

-- =====================================================================
-- TRI ROLET: user, manager, admin
--
-- Kush çfarë mundet:
--
--   | Veprimi                      | user | manager | admin |
--   |------------------------------|------|---------|-------|
--   | Lexon terminet e regjistruara|  po  |   po    |  po   |
--   | Shkruan shënime              |  po  |   po    |  po   |
--   | Cakton/ndryshon termine      |  JO  |   po    |  po   |
--   | Fshin termine                |  JO  |   po    |  po   |
--   | Përdoruesit dhe aktiviteti   |  JO  |   JO    |  po   |
--   | Ndryshon rolet               |  JO  |   JO    |  JO*  |
--
--   * Rolet ndryshohen vetëm nga paneli i Supabase-it, jo nga aplikacioni.
--
-- VINI RE: leximi është i përbashkët — çdo i kyçur i sheh të gjitha terminet
-- e regjistruara. Shkrimi mbetet i mbyllur: terminet i prek vetëm menaxheri.
--
-- ROLI I KATËRT: `supabase/eksperti.sql` shton `expert` dhe e ngushton
-- rregullin e leximit vetëm për të. Për këto tri role asgjë nuk ndryshon.
--
-- STATUSI: kjo skedë është ZBATUAR TASHMË në projektin "crm-test".
--
-- SI PËRDORET (për një projekt të ri):
--   Supabase -> SQL Editor -> New query -> ngjit -> Run
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Roli i ri
-- ---------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('user', 'manager', 'admin'));

-- Menaxheri dhe admini kanë të njëjtat të drejta mbi klientët e terminet.
create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('manager', 'admin')
  );
$$;

revoke execute on function public.is_manager() from anon, public;
grant  execute on function public.is_manager() to authenticated;

-- ---------------------------------------------------------------------
-- 1b. Emrat e kolegëve
-- ---------------------------------------------------------------------
-- Tabela e feedback-ut te termini ka kolonën "Përdoruesi". Që aty të dalë
-- emaili i atij që e shkroi shënimin — dhe jo një vizë — çdo i kyçur duhet
-- ta lexojë listën e profileve. Lexohet vetëm `id`, `email` dhe `role`;
-- ndryshimi i rolit mbetet i mbyllur për të gjithë (s'ka rregull update).
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select to authenticated
  using (true);

-- ---------------------------------------------------------------------
-- 2. Shënimet — i shkruan kushdo, në emrin e vet
-- ---------------------------------------------------------------------
drop policy if exists "notes_select_by_client_or_admin" on public.notes;
drop policy if exists "notes_select_all" on public.notes;
create policy "notes_select_all" on public.notes
  for select to authenticated
  using (true);

drop policy if exists "notes_insert_any_appointment" on public.notes;
create policy "notes_insert_any_appointment" on public.notes
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.appointments a where a.id = appointment_id)
  );

-- Ndryshimi i shënimit mbetet i autorit, ose i adminit.
drop policy if exists "notes_update_author_or_admin" on public.notes;
create policy "notes_update_author_or_admin" on public.notes
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------
-- 3. Terminet
-- ---------------------------------------------------------------------
drop policy if exists "appointments_select_own_or_admin" on public.appointments;
drop policy if exists "appointments_select_all" on public.appointments;
create policy "appointments_select_all" on public.appointments
  for select to authenticated
  using (true);

drop policy if exists "appointments_insert_manager" on public.appointments;
create policy "appointments_insert_manager" on public.appointments
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_manager());

drop policy if exists "appointments_update_own_or_admin" on public.appointments;
drop policy if exists "appointments_update_manager" on public.appointments;
create policy "appointments_update_manager" on public.appointments
  for update to authenticated
  using (public.is_manager())
  with check (public.is_manager());

-- Fshirja: po ashtu vetëm menaxheri dhe admini. Shënimet e terminit
-- fshihen bashkë me të (`on delete cascade` te schema.sql).
drop policy if exists "appointments_delete_manager" on public.appointments;
create policy "appointments_delete_manager" on public.appointments
  for delete to authenticated
  using (public.is_manager());

-- =====================================================================
-- Si i cakton rolet
-- =====================================================================
--   update public.profiles set role = 'manager' where email = 'dikush@shembull.com';
--   update public.profiles set role = 'user'    where email = 'dikush@shembull.com';
--
-- Ose pa SQL: Table Editor -> profiles -> kliko qelizën `role`.


-- #####################################################################
-- nr.sql
-- #####################################################################

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


-- #####################################################################
-- mbetur.sql
-- #####################################################################

-- =====================================================================
-- ÇFARË KA MBETUR PA U ZBATUAR
--
-- Kjo skedë i bashkon dy gjërat e vetme që aplikacioni pret ende nga baza.
-- Të dyja janë pjesë të `roles.sql` dhe `nr.sql`; këtu janë bashkuar që t'i
-- ekzekutosh me një të ngjitur, jo dy.
--
-- SI PËRDORET:
--   Supabase -> SQL Editor -> New query -> ngjit GJITHË këtë -> Run
--   Ekzekutoje VETËM NJË HERË, mbi një projekt bosh (herën e dytë ndalet).
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


-- #####################################################################
-- activity.sql
-- #####################################################################

-- =====================================================================
-- PËRCJELLJA E AKTIVITETIT
--
-- Çfarë mat: kohën që secili përdorues e kalon VËRTET brenda aplikacionit,
-- ditë pas dite. Nuk mat "orë pune" — nëse dikush punon në telefon ose në
-- letër, këtu nuk shfaqet.
--
-- Si funksionon: sa herë që dikush ka faqen hapur, shfletuesi i dërgon
-- serverit një sinjal të vogël çdo 2 minuta. Serveri i shton kohën e kaluar
-- që nga sinjali i fundit, por jo më shumë se 5 minuta përnjëherë — kështu
-- një pushim i gjatë nuk numërohet si punë.
--
-- SI PËRDORET (një herë):
--   1. https://supabase.com/dashboard -> projekti "crm-test"
--   2. Menyja e majtë -> "SQL Editor" -> "New query"
--   3. Kopjo GJITHË këtë skedë, ngjite atje, kliko "Run"
--
-- Mund ta ekzekutosh disa herë pa dëm.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tabela: një rresht për çdo përdorues për çdo ditë
-- ---------------------------------------------------------------------
create table if not exists public.activity_days (
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Dita llogaritet me orën e Beogradit, që "dita" të mos ndahet në mesnatë
  -- sipas orës botërore.
  day date not null,
  active_seconds integer not null default 0,
  last_seen_at timestamptz not null default now(),
  primary key (user_id, day)
);

create index if not exists activity_days_day_idx
  on public.activity_days (day desc);

-- ---------------------------------------------------------------------
-- 2. Funksioni që shton kohën
-- ---------------------------------------------------------------------
-- `security definer` = shkruan me të drejtat e pronarit. Kështu përdoruesit
-- nuk mund t'i shkruajnë vetë numrat e tyre; ata vetëm e thërrasin këtë
-- funksion, i cili llogarit kohën vetë.
--
-- `least(..., 300)` = shtohen më së shumti 5 minuta për çdo thirrje, edhe
-- nëse dikush ka munguar tri orë. Prandaj thirrjet e përsëritura nuk e
-- fryjnë dot numrin: nëse s'ka kaluar kohë, nuk shtohet asgjë.
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
  if uid is null then
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

revoke execute on function public.record_activity() from anon, public;
grant  execute on function public.record_activity() to authenticated;

-- ---------------------------------------------------------------------
-- 3. Kush i sheh numrat
-- ---------------------------------------------------------------------
-- Secili e sheh aktivitetin e vet; administratori i sheh të gjithë.
-- Nuk ka rregull shkrimi: shkruan vetëm funksioni i mësipërm.
alter table public.activity_days enable row level security;

drop policy if exists "activity_select_own_or_admin" on public.activity_days;
create policy "activity_select_own_or_admin" on public.activity_days
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());


-- #####################################################################
-- fshirja.sql
-- #####################################################################

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


-- #####################################################################
-- llogari-pa-humbje.sql
-- #####################################################################

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


-- #####################################################################
-- faqosja.sql
-- #####################################################################

-- =====================================================================
-- FAQOSJA E LISTËS — që lista të mos e tërheqë tërë bazën njëherësh
-- =====================================================================
--
-- Deri tani faqja kryesore i merrte TË GJITHA terminet, sa herë hapej. Me
-- 2000 termine kjo prishet në tri mënyra: faqja bëhet 1.6 MB, kolona e
-- shënimeve kthen gabimin 431 (adresa e kërkesës kalon 72 KB), dhe Supabase
-- i pret rreshtat te kufiri i vet (`max-rows`) pa thënë asgjë.
--
-- Tani lista merr vetëm një faqe. Por përmbledhja lart — sa termine, sa u
-- mbajtën, sa kontrata — duhet të mbetet e tërë bazës, jo vetëm e faqes që
-- sheh. Prandaj numrat i llogarit baza me këtë funksion, dhe kthen tri
-- numra në vend të mijëra rreshtave.
--
-- SIGURIA: funksioni është `security invoker` (e parazgjedhura), pra
-- rregullat e leximit (RLS) vlejnë njësoj si te çdo kërkesë tjetër. Secili
-- numëron vetëm atë që ka të drejtë ta shohë. Po ta bënim `security
-- definer`, do të numëronte edhe terminet që s'i sheh dot — dhe numri lart
-- do të tregonte më shumë se lista poshtë.

create or replace function public.appointments_summary(
  p_user uuid default null,
  p_status text default null,
  p_search text default null
)
returns table (total bigint, held bigint, contracts bigint)
language sql
stable
set search_path = public
as $$
  select
    count(*),
    count(*) filter (where a.status = 'held'),
    coalesce(sum(a.contracts_closed), 0)
  from appointments a
  where (p_user is null or a.user_id = p_user)
    and (p_status is null or a.status = p_status)
    and (
      p_search is null
      or a.name ilike '%' || p_search || '%'
      or a.nr::text = p_search
    );
$$;

comment on function public.appointments_summary is
  'Numrat e përmbledhjes së listës: sa termine, sa u mbajtën, sa kontrata. '
  'Kthen tri numra në vend të gjithë rreshtave. RLS vlen normalisht.';

-- Kush mund ta thërrasë: çdo i kyçur. Rregullat e leximit e ngushtojnë vetë
-- se çfarë numërohet.
grant execute on function public.appointments_summary(uuid, text, text)
  to authenticated;

-- =====================================================================
-- INDEKSET — që faqja e 40-të të mos jetë më e ngadaltë se e para
-- =====================================================================

-- Radha e listës: i fundit i regjistruar rri lart, dhe `nr` e mbyll barazimin.
--
-- KUJDES: indeksi duhet të përputhet me RADHËN E PLOTË, jo vetëm me kolonën e
-- parë. Një indeks vetëm mbi `created_at desc` nuk e mbulon renditjen
-- `created_at desc, nr desc` — baza e lë indeksin dhe kalon në skanim të
-- plotë. E matur me 50 000 termine: 125 ms me indeksin e gabuar, 0.06 ms me
-- këtë.
create index if not exists appointments_created_nr_idx
  on public.appointments (created_at desc, nr desc);

-- Çelësi «Të mijat»: terminet e një menaxheri, po ashtu të renditura.
create index if not exists appointments_user_created_nr_idx
  on public.appointments (user_id, created_at desc, nr desc);

-- Numri i shkurtër (#1000): kërkimi shkon drejt e te rreshti.
create index if not exists appointments_nr_idx
  on public.appointments (nr);

-- Shënimet e një faqeje merren me `appointment_id in (...)`.
create index if not exists notes_appointment_idx
  on public.notes (appointment_id);

-- Kërkimi sipas emrit është `ilike '%...%'` — një indeks i zakonshëm nuk e
-- ndihmon dot, sepse teksti kërkohet edhe në mes të fjalës. `pg_trgm` e bën.
--
-- Skema `extensions`, jo `public`: zgjerimet te `public` i dalin përpara
-- tabelave te search_path-i dhe këshilltari i Supabase-it e shënon si rrezik.
create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

-- `extensions.gin_trgm_ops`, me skemën përpara: pasi zgjerimi u nxor nga
-- `public`, emri i thjeshtë nuk gjendet më te search_path-i i parazgjedhur.
create index if not exists appointments_name_trgm_idx
  on public.appointments using gin (name extensions.gin_trgm_ops);


-- #####################################################################
-- rls-shpejtesi.sql
-- #####################################################################

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


-- #####################################################################
-- kategorite.sql
-- #####################################################################

-- =====================================================================
-- TRI KATEGORITË — dhe arsyeja brenda tyre
-- =====================================================================
--
-- Deri tani termini kishte NJË fushë: `status`, me nëntë vlera. Nëntë ngjyra
-- nuk lexohen dot me bisht të syrit, dhe raportet ndaheshin në nëntë copa aq
-- të vogla sa nuk thoshin gjë.
--
-- Tani ka dy fusha:
--
--   `category` — njëra nga TRE: success | talking | failed
--                Kjo ngjyros rreshtin dhe kjo numërohet te raportet.
--
--   `status`   — arsyeja: PSE përfundoi ashtu.
--                Rri brenda kategorisë dhe nuk humb asnjë hollësi.
--
-- Rregulli i «suksesit»: u mbajt DHE u nënshkrua kontratë. Prandaj një
-- termin i suksesshëm duhet të ketë të paktën një kontratë — kjo ruhet nga
-- baza, jo vetëm nga formulari.

-- ---------------------------------------------------------------------
-- 1) Fusha e re
-- ---------------------------------------------------------------------
alter table public.appointments
  add column if not exists category text;

-- ---------------------------------------------------------------------
-- 2) Arsyet e reja
-- ---------------------------------------------------------------------
-- Së pari hiqet kufizimi i vjetër: ai i lejon vetëm nëntë vlerat e dikurshme,
-- prandaj pa e hequr, asnjë arsye e re nuk hyn dot. Vendin e tij e zë më
-- poshtë kufizimi i çifteve (kategori + arsye), që është më i rreptë: ai
-- nuk kontrollon vetëm se arsyeja njihet, por edhe se i përket kategorisë.
alter table public.appointments
  drop constraint if exists appointments_status_check;

-- `held` (u mbajt) ndahet në dy, sepse vetë ai nuk thoshte nëse doli gjë:
--   held + kontratë  -> contract_signed  (e suksesshme)
--   held pa kontratë -> held_thinking    (në bisedim; personi po mendohet)
--
-- Ky është i vetmi vend ku një status i vjetër ndahet në dy. Të tjerët
-- kalojnë një-për-një.

update public.appointments
   set status = case
         when contracts_closed > 0 then 'contract_signed'
         else 'held_thinking'
       end
 where status = 'held';

-- ---------------------------------------------------------------------
-- 3) Kategoria e çdo termini ekzistues
-- ---------------------------------------------------------------------
-- Në të verdhë rrinë ato ku puna ende vazhdon dhe mund të provohet sërish.
-- Në të kuqe ato ku mbaroi pa gjë.

update public.appointments
   set category = case status
         when 'contract_signed'   then 'success'
         when 'open'              then 'talking'
         when 'held_thinking'     then 'talking'
         when 'not_reached'       then 'talking'
         when 'not_home'          then 'talking'
         when 'address_not_found' then 'talking'
         when 'cancelled'         then 'failed'
         when 'refused'           then 'failed'
         when 'negative'          then 'failed'
         when 'advisor_failed'    then 'failed'
         -- Një vlerë e panjohur nuk fshihet dhe nuk trillohet: shkon te
         -- «në bisedim», që dikush ta shohë dhe ta ndreqë.
         else 'talking'
       end
 where category is null;

alter table public.appointments
  alter column category set not null,
  alter column category set default 'talking';

alter table public.appointments
  alter column status set default 'open';

-- ---------------------------------------------------------------------
-- 4) Çiftet e mundshme
-- ---------------------------------------------------------------------
-- Kategoria dhe arsyeja nuk bien dot në kundërshtim: lista e çifteve të
-- lejuara rri këtu. Kështu as një kërkesë e drejtpërdrejtë te API-ja — jo
-- vetëm formulari ynë — nuk fut dot «e suksesshme + i anuluar».

alter table public.appointments
  drop constraint if exists appointments_category_status_ck;

alter table public.appointments
  add constraint appointments_category_status_ck check (
    (category, status) in (
      ('success', 'contract_signed'),
      ('talking', 'open'),
      ('talking', 'held_thinking'),
      ('talking', 'not_reached'),
      ('talking', 'not_home'),
      ('talking', 'address_not_found'),
      ('failed',  'cancelled'),
      ('failed',  'refused'),
      ('failed',  'negative'),
      ('failed',  'advisor_failed')
    )
  );

-- Sukses do të thotë kontratë. Pa këtë, «e suksesshme» do të ishte thjesht
-- një ngjyrë që kushdo mund ta vendoste.
alter table public.appointments
  drop constraint if exists appointments_success_needs_contract_ck;

alter table public.appointments
  add constraint appointments_success_needs_contract_ck check (
    category <> 'success' or contracts_closed >= 1
  );

-- ---------------------------------------------------------------------
-- 5) Indeksi i filtrit
-- ---------------------------------------------------------------------
-- Lista filtrohet sipas kategorisë dhe renditet sipas kohës. Indeksi i mban
-- të dyja, që faqja e filtruar të mos jetë më e ngadaltë se ajo e plotë.
create index if not exists appointments_category_created_idx
  on public.appointments (category, created_at desc, nr desc);

-- ---------------------------------------------------------------------
-- 6) Numrat e përmbledhjes
-- ---------------------------------------------------------------------
-- Rreshti lart te lista thoshte «sa u mbajtën». Tani thotë «sa dolën të
-- suksesshme», dhe filtri vjen sipas kategorisë, jo sipas arsyes.

drop function if exists public.appointments_summary(uuid, text, text);

create or replace function public.appointments_summary(
  p_user uuid default null,
  p_category text default null,
  p_search text default null
)
returns table (total bigint, held bigint, contracts bigint)
language sql
stable
set search_path = public
as $$
  select
    count(*),
    count(*) filter (where a.category = 'success'),
    coalesce(sum(a.contracts_closed), 0)
  from appointments a
  where (p_user is null or a.user_id = p_user)
    and (p_category is null or a.category = p_category)
    and (
      p_search is null
      or a.name ilike '%' || p_search || '%'
      or a.nr::text = p_search
    );
$$;

comment on function public.appointments_summary is
  'Numrat e permbledhjes se listes: sa termine, sa te suksesshme, sa kontrata. '
  'Kthen tre numra ne vend te gjithe rreshtave. RLS vlen normalisht.';

grant execute on function public.appointments_summary(uuid, text, text)
  to authenticated;


-- #####################################################################
-- eksperti.sql
-- #####################################################################

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


-- #####################################################################
-- useri.sql
-- #####################################################################

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


-- #####################################################################
-- numrat.sql
-- #####################################################################

-- =====================================================================
-- NUMRAT PËR PERSON — pa e tërhequr tërë tabelën
-- =====================================================================
--
-- Faqja «Përdoruesit» tregonte, për secilën llogari, sa termine ka caktuar
-- dhe sa shënime ka shkruar. Për ata dy numra ajo lexonte TË GJITHA terminet
-- dhe TË GJITHA shënimet, sa herë hapej.
--
-- Dy probleme, dhe i dyti është më i keqi:
--
--   1. Me 50 000 termine, faqja tërhiqte 50 000 rreshta për të treguar tetë
--      numra.
--   2. Supabase i pret rreshtat te `max-rows` (zakonisht 1000) DHE NUK JEP
--      GABIM. Pra mbi 1000 termine, numrat DILNIN THJESHT TË GABUAR — më të
--      vegjël se e vërteta, pa asnjë shenjë se diçka mungonte.
--
-- Tani numërimin e bën baza dhe kthen një rresht për person.
--
-- SIGURIA: funksioni është `security invoker` (e parazgjedhura), pra
-- rregullat e leximit vlejnë njësoj. Secili numëron vetëm atë që ka të
-- drejtë ta shohë; për adminin kjo do të thotë gjithçka, siç ishte edhe më
-- parë. Po ta bënim `security definer`, një përdorues i thjeshtë do të
-- numëronte terminet e të tjerëve pa i parë dot.

create or replace function public.puna_per_person()
returns table (user_id uuid, terminet bigint, shenimet bigint)
language sql
stable
set search_path = public
as $$
  select
    p.id,
    (select count(*) from appointments a where a.user_id = p.id),
    (select count(*) from notes n where n.user_id = p.id)
  from profiles p;
$$;

comment on function public.puna_per_person is
  'Sa termine ka caktuar dhe sa shënime ka shkruar secili. Një rresht për '
  'person, në vend të tërë tabelës. RLS vlen normalisht.';

grant execute on function public.puna_per_person() to authenticated;

-- Numërimi sipas autorit ka nevojë për indeks: pa të, çdo person do të
-- kërkonte një skanim të plotë të tabelës së shënimeve.
create index if not exists notes_user_idx on public.notes (user_id);


-- #####################################################################
-- ndryshimi-menaxherit.sql
-- #####################################################################

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


-- #####################################################################
-- hyrja-e-hequr.sql
-- #####################################################################

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


-- #####################################################################
-- ekspertet-menaxheri.sql
-- #####################################################################

-- =====================================================================
-- AKSESIN E EKSPERTIT E JEP EDHE MENAXHERI
-- =====================================================================
--
-- Deri tani vetëm admini vendoste se cili ekspert e sheh cilin termin. Kjo
-- e bënte adminin pengesë te puna e përditshme: menaxheri e cakton terminin,
-- e njeh rastin, por duhej të priste dikë tjetër vetëm për t'ia dhënë një
-- eksperti.
--
-- Tani e bën edhe menaxheri. `is_manager()` i mbulon të dy — menaxherin dhe
-- adminin — prandaj rregulli mbetet një i vetëm.
--
-- Çfarë NUK ndryshon:
--   • Eksperti vetë nuk i prek këto rreshta: as s'ia jep vetes një termin,
--     as s'ia heq dikujt. Kjo mbetet siç ishte.
--   • `granted_by` vazhdon ta shkruajë se kush ia dha aksesin — tani aty
--     mund të dalë edhe një menaxher, jo vetëm admini.
--   • Rregulli i leximit mbetet ashtu siç u la te `hyrja-e-hequr.sql`:
--     eksperti sheh rreshtat e vet, menaxheri e admini të gjithë.
--
-- Emrat e vjetër (`..._insert_admin`) hiqen që të mos mbeten dy rregulla
-- paralele: te Postgres-i rregullat e lejimit mblidhen me OSE, prandaj një i
-- harruar do të vazhdonte të vlente pa u vënë re.

drop policy if exists appointment_experts_insert_admin on public.appointment_experts;
drop policy if exists appointment_experts_insert_manager on public.appointment_experts;
create policy appointment_experts_insert_manager on public.appointment_experts
  for insert to authenticated
  with check ((select public.is_manager()));

drop policy if exists appointment_experts_delete_admin on public.appointment_experts;
drop policy if exists appointment_experts_delete_manager on public.appointment_experts;
create policy appointment_experts_delete_manager on public.appointment_experts
  for delete to authenticated
  using ((select public.is_manager()));


-- #####################################################################
-- datat.sql
-- #####################################################################

-- =====================================================================
-- FILTRIMI I LISTËS SIPAS DATËS SË TERMINIT
-- =====================================================================
--
-- Lista e termineve tani filtrohet edhe sipas `scheduled_at` — data për të
-- cilën është caktuar termini, jo data kur u regjistrua.
--
-- Kjo skedë bën dy gjëra, dhe të dyja janë të domosdoshme:
--
--   1. Përmbledhja lart e mëson intervalin. Pa këtë, lista poshtë do të
--      tregonte terminet e një jave, kurse tre numrat lart do të mbeteshin
--      të gjithë bazës — dy të vërteta të ndryshme në të njëjtin ekran.
--
--   2. Indekset. Pa to, filtri sipas datës e detyron bazën të lexojë çdo
--      rresht, dhe pastaj t'i rendisë të gjithë nga e para.
--
-- INTERVALI ËSHTË GJYSMË I HAPUR, dhe kjo vendoset te faqja, jo këtu:
-- `p_from <= scheduled_at < p_to`. «Deri më 5 shtator» i dërgohet bazës si
-- «< 6 shtator, ora 00:00 e Beogradit», që terminet e orës 17:00 të asaj
-- dite të mos mbeten jashtë. Këtu marrim dy çaste të gatshme.

-- Nënshkrimi ndryshon, prandaj i vjetri hiqet. Parametrat e rinj kanë vlerë
-- të parazgjedhur `null`, pra thirrja me tre argumente — ajo që bën një
-- version i vjetër i faqes, ende i pandërtuar — vazhdon të punojë njësoj.
drop function if exists public.appointments_summary(uuid, text, text);
drop function if exists public.appointments_summary(uuid, text, text, timestamptz, timestamptz);

create or replace function public.appointments_summary(
  p_user uuid default null,
  p_category text default null,
  p_search text default null,
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns table (total bigint, held bigint, contracts bigint)
language sql
stable
set search_path = public
as $$
  select
    count(*),
    count(*) filter (where a.category = 'success'),
    coalesce(sum(a.contracts_closed), 0)
  from appointments a
  where (p_user is null or a.user_id = p_user)
    and (p_category is null or a.category = p_category)
    and (p_from is null or a.scheduled_at >= p_from)
    and (p_to is null or a.scheduled_at < p_to)
    and (
      p_search is null
      or a.name ilike '%' || p_search || '%'
      or a.nr::text = p_search
    );
$$;

comment on function public.appointments_summary is
  'Numrat e permbledhjes se listes: sa termine, sa te suksesshme, sa kontrata. '
  'Kthen tre numra ne vend te gjithe rreshtave. Intervali i dates eshte '
  'gjysme i hapur: p_from <= scheduled_at < p_to. RLS vlen normalisht.';

-- SIGURIA: funksioni mbetet `security invoker` (e parazgjedhura), pra
-- rregullat e leximit vlejnë njësoj si te çdo kërkesë tjetër. Secili
-- numëron vetëm atë që ka të drejtë ta shohë.
grant execute on function
  public.appointments_summary(uuid, text, text, timestamptz, timestamptz)
  to authenticated;

-- =====================================================================
-- INDEKSET
-- =====================================================================
--
-- Me filtër date, lista renditet sipas `scheduled_at` — jo sipas
-- `created_at` si zakonisht. Indeksi duhet t'i përputhet RADHËS SË PLOTË,
-- jo vetëm kolonës së parë: një indeks veç mbi `scheduled_at` nuk e mbulon
-- renditjen `scheduled_at, nr`, dhe baza kalon në skanim të plotë.
create index if not exists appointments_scheduled_nr_idx
  on public.appointments (scheduled_at, nr);

-- E njëjta gjë për çelësin «Të mijat» dhe për përdoruesin e thjeshtë, që i
-- ka gjithmonë vetëm terminet e veta.
create index if not exists appointments_user_scheduled_nr_idx
  on public.appointments (user_id, scheduled_at, nr);


-- #####################################################################
-- llogaria-e-fshire.sql
-- #####################################################################

-- =====================================================================
-- KUR LLOGARIA FSHIHET ME DORË NGA PANELI I SUPABASE-IT
-- =====================================================================
--
-- PROBLEMI. Aplikacioni e di se kush hyn nga shenja `profiles.active`. Atë
-- shenjë e vë butoni «Hiqi hyrjen»: fshin llogarinë te `auth.users` dhe
-- pastaj shënon `active = false`.
--
-- Por llogaria mund të fshihet edhe nga jashtë — me dorë, te Table Editor-i
-- i Supabase-it. Atëherë `auth.users` mbetet pa të, kurse `profiles` vazhdon
-- të thotë `active = true`. Del një llogari FANTAZMË:
--
--   • duket te lista e përdoruesve sikur hyn ende;
--   • nuk hyn dot, sepse s'ka fjalëkalim as llogari;
--   • dhe NUK HIQET DOT nga aplikacioni, sepse butoni «Hiqi hyrjen» provon
--     ta fshijë një llogari që s'ekziston dhe kthen «User not found».
--
-- Pra rreshti mbetet aty përgjithmonë. Te baza e vërtetë ishin gjashtë të
-- tillë para se kjo skedë të ekzekutohej.
--
-- ZGJIDHJA. Një trigger simetrik me atë që ekziston tashmë për shtimin:
-- `on_auth_user_created` krijon profilin kur lind llogaria; `on_auth_user_
-- deleted` e shënon profilin kur llogaria fshihet. Kështu s'ka rëndësi nga
-- vjen fshirja — nga butoni ynë apo nga paneli — dy tabelat mbeten në
-- përputhje vetë.
--
-- PSE SHËNOHET E JO FSHIHET. Profili mban emrin e autorit: terminet,
-- shënimet dhe orët e punës vazhdojnë ta tregojnë se kush i bëri. Po ta
-- fshinim rreshtin, ato do të mbeteshin pa emër.

create or replace function public.handle_deleted_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set active = false
   where id = old.id
     and active;   -- pa këtë, çdo fshirje shkruan edhe kur s'ka çfarë ndryshon
  return old;
end;
$$;

-- Grantet hiqen shprehimisht.
--
-- Postgres-i i jep çdo funksioni të ri `execute` te `public` — pra edhe te
-- `anon` dhe `authenticated`, dhe Supabase e nxjerr atëherë si
-- `/rest/v1/rpc/handle_deleted_user`. Një funksion trigger-i nuk duhet të
-- jetë i thirrshëm nga API-ja; `handle_new_user` nuk është, dhe as ky.
--
-- Trigger-i vazhdon të punojë: `security definer` e xhiron me të drejtat e
-- pronarit, jo të atij që e nxit. E provuar duke shtuar e fshirë një llogari
-- brenda një transaksioni të kthyer mbrapsht — profili u shënua saktë.
revoke all on function public.handle_deleted_user() from public, anon, authenticated;

comment on function public.handle_deleted_user is
  'Shenon profilin si pa hyrje kur llogaria fshihet te auth.users — edhe kur '
  'fshirja behet me dore nga paneli i Supabase-it, jo nga aplikacioni.';

drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute function public.handle_deleted_user();

-- ---------------------------------------------------------------------
-- Fantazmat që u krijuan PARA se trigger-i të ekzistonte
-- ---------------------------------------------------------------------
--
-- Trigger-i vlen për fshirjet e ardhshme. Ato që ndodhën më parë duhen
-- rregulluar një herë, me dorë. Kushti është i njëjti dhe i pagabueshëm: nuk
-- ka llogari te `auth.users` -> nuk hyn dot -> `active = false`.
--
-- E sigurt të ekzekutohet sërish: rreshtat tashmë të shënuar nuk preken.

update public.profiles p
   set active = false
 where p.active
   and not exists (select 1 from auth.users au where au.id = p.id);


-- #####################################################################
-- llogari-e-fshehur.sql
-- #####################################################################

-- =====================================================================
-- LLOGARI E FSHEHUR NGA LISTA E PËRDORUESVE
-- =====================================================================
--
-- Një llogari mund të duhet të punojë normalisht, por të mos duket te faqja
-- *Përdoruesit* — as për adminët e tjerë. Kjo ndryshon VETËM pamjen e asaj
-- liste; llogaria hyn si gjithmonë, e mban rolin e vet, dhe puna e saj
-- numërohet kudo tjetër.
--
-- PSE NJË KOLONË E RE DHE JO «FSHIHE VETEN».
-- Mënyra e thjeshtë do të ishte: secili admin të mos e shihte rreshtin e vet.
-- Por atëherë admini tjetër do ta shihte prapë. Këtu kërkohej që llogaria të
-- mos dukej nga ASKUSH, prandaj duhet një shenjë te vetë rreshti.
--
-- PSE JO EMAIL I SHKRUAR BRENDA KODIT.
-- Një `if (email === "...")` do të ishte edhe më i shkurtër, dhe i gabuar:
-- emaili do të mbetej te kodi përgjithmonë, i dukshëm te depoja publike, dhe
-- do të duhej një version i ri i aplikacionit sa herë ndryshon mendja.
--
-- SI VIHET DHE SI HIQET. Si roli: nga paneli i Supabase-it, te
-- **Table Editor -> profiles -> hidden**. `true` e fsheh, `false` e kthen.
-- Aplikacioni vetëm e lexon — tabela `profiles` ka RLS me një rregull të
-- vetëm leximi dhe ASNJË rregull ndryshimi, prandaj askush nuk e prek dot
-- këtë kolonë nga faqja, sado admin të jetë.
--
-- KUJDES: një admin i fshehur nuk mbikëqyret dot më nga adminët e tjerë —
-- ata as nuk e dinë se ekziston. Prandaj kjo shenjë duhet përdorur rrallë.

alter table public.profiles
  add column if not exists hidden boolean not null default false;

comment on column public.profiles.hidden is
  'true = kjo llogari nuk duket te faqja Perdoruesit, per asnje admin. '
  'Nuk prek asgje tjeter: hyrja, roli dhe numrat mbeten si per te tjeret. '
  'Vihet vetem nga paneli i Supabase-it.';

-- Nuk shtohet indeks: tabela ka dhjetëra rreshta, jo mijëra, dhe kushti
-- lexohet bashkë me `active` te i njëjti skanim i vogël. Një indeks këtu do
-- të kushtonte më shumë se sa do të kursente.


-- #####################################################################
-- rezultati-ekspertit.sql
-- #####################################################################

-- =====================================================================
-- EKSPERTI E SHËNON VETË REZULTATIN E TERMINIT
-- =====================================================================
--
-- Deri tani terminin e ndryshonte vetëm menaxheri dhe admini
-- (`supabase/ndryshimi-menaxherit.sql`). Por te termini shkon eksperti: ai e
-- di nëse u mbajt, nëse u nënshkrua kontratë, dhe sa. Duke mos pasur ku ta
-- shkruante, ajo e dhënë duhej kaluar me gojë te dikush tjetër — dhe numrat
-- e dashboard-it varen pikërisht prej saj.
--
-- Tani e shënon vetë. POR VETËM REZULTATIN, dhe vetëm te terminet që i janë
-- dhënë atij.
--
-- KUFIRI KA DY PJESË, dhe secila përgjigjet për një pyetje tjetër:
--
--   • CILAT RRESHTA  -> rregulli i RLS-së më poshtë. Vetëm terminet ku emri i
--     tij gjendet te `appointment_experts`. Një termin që s'ia ka dhënë
--     askush mbetet i paprekshëm — dhe i padukshëm, si më parë.
--
--   • CILAT KOLONA   -> trigger-i. RLS-ja vendos nëse rreshti preket, jo se
--     ç'pjesë e tij. Pa trigger, eksperti do të mund të ndryshonte emrin,
--     telefonin ose datën e terminit, mjafton të dërgonte një kërkesë pa
--     kaluar nga faqja jonë.
--
-- PSE JO GRANT NË NIVEL KOLONE. `grant update (…) on appointments to
-- authenticated` do t'i kufizonte të gjithë, edhe menaxherin, sepse roli te
-- Postgres-i është i njëjti për të dy. Dallimin e bën vetëm `is_expert()`,
-- dhe atë e lexon trigger-i.

-- ---------------------------------------------------------------------
-- 1. CILAT RRESHTA
-- ---------------------------------------------------------------------
--
-- Rregullat e lejimit mblidhen me OSE: ky nuk e prek aspak atë të
-- menaxherit, thjesht shtohet pranë tij.
--
-- I njëjti kusht te `using` dhe te `with check`: i pari vendos cilin rresht e
-- prek dot, i dyti si duhet të mbetet pas ndryshimit. Pa të dytin, eksperti
-- do të mund t'ia hiqte vetes aksesin duke e ndryshuar rreshtin.

drop policy if exists appointments_update_expert on public.appointments;
create policy appointments_update_expert on public.appointments
  for update to authenticated
  using (
    (select public.is_expert())
    and exists (
      select 1 from public.appointment_experts ae
      where ae.appointment_id = appointments.id
        and ae.expert_id = (select auth.uid())
    )
  )
  with check (
    (select public.is_expert())
    and exists (
      select 1 from public.appointment_experts ae
      where ae.appointment_id = appointments.id
        and ae.expert_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------
-- 2. CILAT KOLONA
-- ---------------------------------------------------------------------
--
-- Krahasimi bëhet mbi tërë rreshtin, jo kolonë për kolonë me emër: `to_jsonb`
-- e kthen rreshtin në një objekt, kolonat e lejuara hiqen prej të dyve, dhe
-- ajo që mbetet duhet të jetë identike.
--
-- Kjo zgjedhje ka një arsye që vlen më shumë se shkurtësia: nëse nesër te
-- `appointments` shtohet një kolonë e re, ajo është E NDALUAR vetvetiu për
-- ekspertin. Po ta shkruanim listën e kolonave të ndaluara, kolona e re do
-- të ishte e lejuar pa e vënë re askush.

create or replace function public.ekspertit_vetem_rezultatin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Ç'i lejohet ekspertit të prekë. `updated_at` hyn këtu sepse e shkruan
  -- vetë aplikacioni te çdo ruajtje.
  te_lejuara text[] := array[
    'status', 'category', 'contracts_closed',
    'multi_year_contract', 'treatment', 'updated_at'
  ];
  i_vjetri jsonb;
  i_riu jsonb;
begin
  -- Menaxheri dhe admini nuk preken nga ky kufi.
  if not (select public.is_expert()) then
    return new;
  end if;

  i_vjetri := to_jsonb(old) - te_lejuara;
  i_riu := to_jsonb(new) - te_lejuara;

  if i_vjetri is distinct from i_riu then
    raise exception
      'Eksperti ndryshon vetem rezultatin e terminit, jo % .',
      (select string_agg(k, ', ' order by k)
         from jsonb_object_keys(i_riu) k
        where i_riu -> k is distinct from i_vjetri -> k)
      using errcode = '42501';
  end if;

  return new;
end;
$$;

comment on function public.ekspertit_vetem_rezultatin is
  'Eksperti ndryshon vetem rezultatin e terminit: status, category, '
  'contracts_closed, multi_year_contract, treatment. Cdo kolone tjeter — '
  'perfshire ato qe shtohen ne te ardhmen — refuzohet.';

-- Si te `handle_deleted_user`: një funksion trigger-i nuk duhet të jetë i
-- thirrshëm nga API-ja. Postgres-i i jep `execute` te `public` vetvetiu.
revoke all on function public.ekspertit_vetem_rezultatin() from public, anon, authenticated;

drop trigger if exists appointments_ekspertit_vetem_rezultatin on public.appointments;
create trigger appointments_ekspertit_vetem_rezultatin
  before update on public.appointments
  for each row execute function public.ekspertit_vetem_rezultatin();
