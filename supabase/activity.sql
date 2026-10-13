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
