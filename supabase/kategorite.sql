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
