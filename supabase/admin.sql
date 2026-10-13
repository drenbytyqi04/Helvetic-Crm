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
