-- =====================================================================
-- LLOGARI E FSHEHUR NGA LISTA E PËRDORUESVE
-- =====================================================================
--
-- Një llogari mund të duhet të punojë normalisht, por të mos duket te faqja
-- *Përdoruesit* — as për adminët e tjerë. Kjo ndryshon VETËM pamjen e asaj
-- liste; llogaria hyn si gjithmonë, e mban rolin e vet, dhe puna e saj
-- numërohet kudo tjetër.
--
-- PSE NJË KOLONË E RE DHE JO «FSHIHE VETEN».
-- Mënyra e thjeshtë do të ishte: secili admin të mos e shihte rreshtin e vet.
-- Por atëherë admini tjetër do ta shihte prapë. Këtu kërkohej që llogaria të
-- mos dukej nga ASKUSH, prandaj duhet një shenjë te vetë rreshti.
--
-- PSE JO EMAIL I SHKRUAR BRENDA KODIT.
-- Një `if (email === "...")` do të ishte edhe më i shkurtër, dhe i gabuar:
-- emaili do të mbetej te kodi përgjithmonë, i dukshëm te depoja publike, dhe
-- do të duhej një version i ri i aplikacionit sa herë ndryshon mendja.
--
-- SI VIHET DHE SI HIQET. Si roli: nga paneli i Supabase-it, te
-- **Table Editor -> profiles -> hidden**. `true` e fsheh, `false` e kthen.
-- Aplikacioni vetëm e lexon — tabela `profiles` ka RLS me një rregull të
-- vetëm leximi dhe ASNJË rregull ndryshimi, prandaj askush nuk e prek dot
-- këtë kolonë nga faqja, sado admin të jetë.
--
-- KUJDES: një admin i fshehur nuk mbikëqyret dot më nga adminët e tjerë —
-- ata as nuk e dinë se ekziston. Prandaj kjo shenjë duhet përdorur rrallë.

alter table public.profiles
  add column if not exists hidden boolean not null default false;

comment on column public.profiles.hidden is
  'true = kjo llogari nuk duket te faqja Perdoruesit, per asnje admin. '
  'Nuk prek asgje tjeter: hyrja, roli dhe numrat mbeten si per te tjeret. '
  'Vihet vetem nga paneli i Supabase-it.';

-- Nuk shtohet indeks: tabela ka dhjetëra rreshta, jo mijëra, dhe kushti
-- lexohet bashkë me `active` te i njëjti skanim i vogël. Një indeks këtu do
-- të kushtonte më shumë se sa do të kursente.
