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
