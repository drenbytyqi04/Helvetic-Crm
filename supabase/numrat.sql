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
