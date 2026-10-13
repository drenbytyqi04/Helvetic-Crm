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
