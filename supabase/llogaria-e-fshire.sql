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
