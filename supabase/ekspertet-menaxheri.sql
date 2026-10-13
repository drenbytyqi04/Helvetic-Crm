-- =====================================================================
-- AKSESIN E EKSPERTIT E JEP EDHE MENAXHERI
-- =====================================================================
--
-- Deri tani vetëm admini vendoste se cili ekspert e sheh cilin termin. Kjo
-- e bënte adminin pengesë te puna e përditshme: menaxheri e cakton terminin,
-- e njeh rastin, por duhej të priste dikë tjetër vetëm për t'ia dhënë një
-- eksperti.
--
-- Tani e bën edhe menaxheri. `is_manager()` i mbulon të dy — menaxherin dhe
-- adminin — prandaj rregulli mbetet një i vetëm.
--
-- Çfarë NUK ndryshon:
--   • Eksperti vetë nuk i prek këto rreshta: as s'ia jep vetes një termin,
--     as s'ia heq dikujt. Kjo mbetet siç ishte.
--   • `granted_by` vazhdon ta shkruajë se kush ia dha aksesin — tani aty
--     mund të dalë edhe një menaxher, jo vetëm admini.
--   • Rregulli i leximit mbetet ashtu siç u la te `hyrja-e-hequr.sql`:
--     eksperti sheh rreshtat e vet, menaxheri e admini të gjithë.
--
-- Emrat e vjetër (`..._insert_admin`) hiqen që të mos mbeten dy rregulla
-- paralele: te Postgres-i rregullat e lejimit mblidhen me OSE, prandaj një i
-- harruar do të vazhdonte të vlente pa u vënë re.

drop policy if exists appointment_experts_insert_admin on public.appointment_experts;
drop policy if exists appointment_experts_insert_manager on public.appointment_experts;
create policy appointment_experts_insert_manager on public.appointment_experts
  for insert to authenticated
  with check ((select public.is_manager()));

drop policy if exists appointment_experts_delete_admin on public.appointment_experts;
drop policy if exists appointment_experts_delete_manager on public.appointment_experts;
create policy appointment_experts_delete_manager on public.appointment_experts
  for delete to authenticated
  using ((select public.is_manager()));
