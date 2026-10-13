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
