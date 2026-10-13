-- =====================================================================
-- PASTRIMI I TË DHËNAVE TË PROVËS — 3 SHTATOR 2026
-- =====================================================================
--
-- Deri sot baza mbante 21 termine prove, të krijuara duke e ndërtuar
-- aplikacionin: emra si «adwdawd», «TEST-01», «dilill». Nga sot puna nis me
-- të dhëna të vërteta, prandaj ato u hoqën.
--
-- Kjo skedë ruhet si DËSHMI e asaj që u ekzekutua, dhe si udhëzim për
-- rikthimin. Nuk duhet ta ekzekutosh sërish — po ta bëje, do të fshinte
-- terminet e vërteta.
--
-- ÇFARË U FSHI          ÇFARË MBETI E PAPREKUR
--   21 termine            11 profile (llogaritë dhe rolet)
--   24 shënime            21 ditë të orëve të punës (`activity_days`)
--    4 akses ekspertësh   çdo rregull, funksion dhe indeks
--
-- Numri i shkurtër u kthye te #1000, sepse tabela mbeti bosh dhe s'ka si
-- të përplaset me ndonjë termin ekzistues. Pra termini i parë i vërtetë
-- është sërish #1000, jo #1077.

-- ---------------------------------------------------------------------
-- 1. KOPJA — u bë PARA fshirjes
-- ---------------------------------------------------------------------
--
-- Kopja rri brenda vetë bazës, jo si skedë diku tjetër. Kështu asnjë rresht
-- nuk kalon nëpër duar dhe nuk ka si të humbasë ndonjë shkronjë gjatë
-- kopjimit — dhe rikthimi është një `insert ... select` i vetëm.
--
-- Skema `arkiv` NUK është nder ato që Supabase i nxjerr te API-ja (aty është
-- vetëm `public`). Përveç kësaj, `usage` mbi skemën u hoq shprehimisht nga
-- `anon` dhe `authenticated`: edhe sikur skema të hapej një ditë pa dashje,
-- një token i zakonshëm nuk lexon dot asgjë prej saj.

create schema if not exists arkiv;
revoke all on schema arkiv from anon, authenticated;
grant usage on schema arkiv to postgres, service_role;

create table arkiv.appointments_20260903 as select * from public.appointments;
create table arkiv.notes_20260903 as select * from public.notes;
create table arkiv.appointment_experts_20260903 as select * from public.appointment_experts;

revoke all on all tables in schema arkiv from anon, authenticated;

-- Kopja u krahasua me origjinalin jo vetëm me numrin e rreshtave, por edhe
-- me përmbajtjen — `except` në të dy drejtimet. Të tria tabelat dolën
-- identike rresht për rresht.

-- ---------------------------------------------------------------------
-- 2. FSHIRJA
-- ---------------------------------------------------------------------
--
-- Fëmijët të parët. `on delete cascade` do ta bënte edhe vetë, por kështu
-- numri i secilit del i matur, jo i nënkuptuar.
--
-- E TËRA NË NJË FJALI TË VETME, me qëllim. Nëse do të ishin tri fjali dhe
-- e dyta dështonte, baza do të mbetej përgjysmë e pastruar — pa shënime,
-- por me termine. Një `with ... delete` është atomike: ose të tria, ose
-- asnjëra.
--
-- KUJDES ME `begin;` TE SQL EDITOR-i. Herën e parë e shkrova fshirjen brenda
-- `begin; ... ` pa `commit;` — dhe asgjë nuk u fshi, sepse transaksioni u
-- kthye mbrapsht kur lidhja u lirua. Dukej sikur punoi: përgjigjja tregoi
-- «u fshinë 21». Vetëm numërimi pas saj e tregoi të vërtetën.

with
  a as (delete from public.appointment_experts returning 1),
  n as (delete from public.notes returning 1),
  t as (delete from public.appointments returning 1)
select
  (select count(*) from a) as u_fshine_akseset,
  (select count(*) from n) as u_fshine_shenimet,
  (select count(*) from t) as u_fshine_terminet;

-- ---------------------------------------------------------------------
-- 3. NUMRAT E SHKURTËR NISIN SËRISH NGA #1000
-- ---------------------------------------------------------------------
--
-- `false` si argument i tretë do të thotë «numri tjetër është pikërisht ky»,
-- jo «ky u përdor tashmë».

select setval('public.appointment_nr_seq', 1000, false);

-- =====================================================================
-- RIKTHIMI, nëse ndonjëherë duhen sërish të dhënat e vjetra
-- =====================================================================
--
-- Ekzekuto këtë. Rreshtat kthehen me id-të e tyre origjinale, prandaj edhe
-- lidhjet mes termineve, shënimeve dhe aksesit të ekspertëve mbeten të
-- njëjta. Radha është e kundërta e fshirjes: prindërit të parët.
--
--   begin;
--   insert into public.appointments        select * from arkiv.appointments_20260903;
--   insert into public.notes               select * from arkiv.notes_20260903;
--   insert into public.appointment_experts select * from arkiv.appointment_experts_20260903;
--   select setval('public.appointment_nr_seq',
--                 (select max(nr) from public.appointments), true);
--   commit;
--
-- Nëse ndërkohë janë shtuar termine të vërteta, ato NUK preken: rikthimi
-- shton rreshta, nuk fshin asgjë. Por numrat e shkurtër mund të përplasen
-- me njëri-tjetrin, prandaj `setval` në fund merr numrin më të madh që
-- gjendet.
--
-- KUR TË SIGUROHESH se të dhënat e vjetra nuk duhen më, kopja hiqet me:
--
--   drop schema arkiv cascade;
--
-- Kjo është e pakthyeshme. Mos e bëj derisa të kalojë ca kohë me të dhënat
-- e reja.
