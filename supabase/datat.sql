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
