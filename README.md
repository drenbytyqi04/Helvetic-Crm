# Helvetic CRM — termine

Një aplikacion për të regjistruar termine: të dhënat e personit, kur është
caktuar termini, si shkoi dhe sa kontrata u mbyllën. Çdo termin mban shënimet e
veta. Hyrja bëhet me email dhe fjalëkalim, dhe tri role vendosin kush çfarë
mundet.

---

## Pjesa 1 — Çfarë është secila gjë (shpjegim i shkurtër)

Nëse s'ke programuar kurrë, këta janë emrat që do t'i hasësh:

| Fjala | Çfarë do të thotë këtu |
| --- | --- |
| **Next.js** | Programi që ndërton faqet e internetit. Ai është "aplikacioni" yt. |
| **Supabase** | Baza e të dhënave në internet — aty ruhen terminet dhe shënimet, edhe kur kompjuteri fiket. |
| **Node.js / npm** | Mjetet që e ndezin projektin në kompjuterin tënd. `npm` shkarkon bibliotekat. |
| **Terminali** | Dritarja ku shkruan komanda me tastierë. Në Windows: "PowerShell"; në Mac: "Terminal". |
| **Server** | Kompjuteri (këtu: yti) që përgatit faqen para se ta shohë vizitori. |
| **`.env.local`** | Një skedë me rregullimet e lidhjes me Supabase-in. |
| **RLS** | Roja te dera e tabelës: lejon secilin përdorues të prekë vetëm rreshtat e vet. |

Dy fjalë për strukturën: **termini** është një rresht në tabelën `appointments`
dhe mban brenda vetes edhe të dhënat e personit. Çdo **shënim** është një rresht
në tabelën `notes` që "tregon" me gisht se cilit termin i përket. Nuk ka kartelë
klienti veç — termini është njësia e vetme.

---

## Pjesa 2 — Përgatitja (një herë të vetme)

### Hapi 1: Instalo Node.js

Shko te <https://nodejs.org> dhe shkarko versionin **LTS**. Instaloje si çdo
program tjetër (Next → Next → Finish).

Për të parë nëse u instalua, hap terminalin dhe shkruaj:

```bash
node -v
```

Nëse të kthen diçka si `v22.x.x`, gjithçka është në rregull.

### Hapi 2: Hap projektin në terminal

```bash
cd rruga/drejt/Helvetic-Crm
```

`cd` do të thotë "change directory" — hyr në dosje.

### Hapi 3: Shkarko bibliotekat

```bash
npm install
```

Kjo krijon dosjen `node_modules` (kod i shkruar nga të tjerët që projekti e
përdor). Zgjat një-dy minuta dhe bëhet vetëm një herë.

### Hapi 4–5: Baza e të dhënave

| | |
| --- | --- |
| Adresa (URL) | `https://gfgwjwjoxsgrpmonumbn.supabase.co` |

Tabelat krijohen me një skedë të vetme: `supabase/helvetic-setup.sql`.
Supabase → **SQL Editor** → **New query** → ngjit gjithë skedën → **Run**.
Ekzekutohet vetëm një herë, mbi projektin bosh. Udhëzimet për llogarinë e
parë (admin) janë në krye të skedës.

### Hapi 6: Kopjo skedën e rregullimeve

```bash
cp .env.local.example .env.local
```

Kaq. Skeda vjen me të dyja vlerat tashmë të mbushura (adresa e projektit dhe
çelësi publik). Nuk ka më çelës sekret: të dhënat i mbron hyrja me llogari dhe
rregullat e bazës, jo fshehja e një çelësi.

### Hapi 7: Nise aplikacionin

```bash
npm run dev
```

Hap shfletuesin te <http://localhost:3000>. Do të të dalë faqja e hyrjes.

Për ta ndalur serverin: kliko në terminal dhe shtyp **Ctrl + C**.

### Hapi 8: Llogaritë

**Nuk ka regjistrim të lirë.** Faqja e hyrjes ka vetëm butonin *Hyr*.

Llogaritë e reja i hap **administratori** nga faqja **Përdoruesit** →
*Hap llogari të re*: shkruan emailin, një fjalëkalim të parë (të paktën 8
shenja) dhe zgjedh rolin — *Përdorues* ose *Menaxher*. Emaili shënohet i
konfirmuar vetvetiu, prandaj njeriu hyn menjëherë; ti ia jep fjalëkalimin dhe
ai e ndryshon më pas.

Që kjo të punojë, aplikacionit i duhet çelësi `service_role` — shih
**Hapi 6** dhe skedën `.env.local.example`.

Roli **admin** nuk jepet nga aplikacioni. Një admin i dytë caktohet me dorë te
Supabase → **Table Editor** → `profiles`. Kjo është me qëllim: një llogari
admin e vjedhur nuk duhet të krijojë dot të tjera si vetja.

Llogaria e parë (kjo është kryer tashmë) u hap nga paneli:
<https://supabase.com/dashboard> → projekti i Helvetic-ut → **Authentication** →
**Users** → **Add user** → emaili, fjalëkalimi dhe **Auto Confirm User**.

---

### Hapi 9: Administratori — I GATSHËM ✅

Administratori sheh të gjithë përdoruesit dhe të gjitha të dhënat e tyre.
Kjo është kryer tashmë: tabela e roleve u krijua dhe llogaria
**dren.bytyqi19@gmail.com** është vendosur admin. Kur hyn me të, pranë emailit
del shenja **Admin** dhe një lidhje e re, **Përdoruesit**.

Për të ndryshuar ose shtuar një administrator tjetër, një rresht i vetëm te
Supabase → **SQL Editor**:

```sql
update public.profiles set role = 'admin' where email = 'emaili.i.ri@shembull.com';
```

Për ta hequr rolin, po ashtu: `set role = 'user'`. E njëjta gjë bëhet edhe pa
SQL: Table Editor → `profiles` → kliko qelizën `role`.

### Hapi 10: Akses i plotë për administratorin — I GATSHËM ✅

Administratori shkruan dhe ndryshon çdo shënim, edhe ato të shkruara nga të
tjerët. Rregullat janë te `supabase/roles.sql`.

### Hapi 11: Përcjellja e kohës — E GATSHME ✅

Tabela dhe funksioni që numërojnë kohën aktive janë zbatuar
(skeda `supabase/activity.sql`). Shih **Pjesa 6** për mënyrën e matjes.

### Hapi 12: Terminet — TË GATSHME ✅

Termini është njësia e vetme e sistemit; tabela e klientëve u hoq dhe të dhënat
e personit kaluan mbi vetë terminin. Shih **Pjesa 7**.

### Hapi 13: Katër rolet — TË GATSHME ✅

Rregullat e roleve `user`, `manager`, `admin` dhe `expert` janë zbatuar
(skedat `supabase/roles.sql`, `supabase/eksperti.sql` dhe
`supabase/useri.sql`). Shih tabelën te **Pjesa 3**.

Roli caktohet me një rresht te Supabase → SQL Editor:

```sql
update public.profiles set role = 'manager' where email = 'dikush@shembull.com';
```

---

## Pjesa 3 — Si përdoret

- **Cakto termin:** paneli *Cakto termin të ri* në faqen kryesore. Gjashtë
  fusha janë të detyrueshme dhe shënohen me yll të kuq: **Emri dhe mbiemri**,
  **Telefoni**, **Rruga**, **Kodi postar**, **Qyteti**, **Kantoni**. Pa to
  agjenti nuk shkon dot te takimi. Celulari, emaili dhe të tjerat mbeten të
  lira. Shih **Pjesa 10**.
- **Radha e listës:** termini i regjistruar i fundit rri lart, pavarësisht se
  për cilën datë është caktuar. Kështu ai që sapo u shtua gjendet menjëherë.
- **Ora:** shkruhet gjithmonë **0–23**, edhe kur lexohet, edhe kur shkruhet.
  Data dhe ora janë dy fusha veç: fusha e vjetër `datetime-local` e vizatonte
  vetë shfletuesi sipas gjuhës së kompjuterit, dhe te një kompjuter shqip ajo
  shkruante «10:00 PM» në vend të «22:00». Atë pamje faqja nuk e urdhëron dot
  — s'ka as atribut, as stil që ta detyrojë 24-orëshin — prandaj fusha e orës
  u ndërtua vetë: shkruhet `HH:MM`, dhe çdo gjë tjetër nuk pranohet. Shqipja e shkruan
  orën me 12 nëse nuk i thuhet ndryshe, dhe atëherë 14:30 del «02:30 m.d.» —
  numri që lexon agjenti nuk është ora e terminit. Te një sistem terminesh kjo
  nuk është hollësi. Të gjitha datat dhe orët shfaqen me **orën e Beogradit**
  (`Europe/Belgrade`), me orën e verës të llogaritur vetvetiu. Kjo shkruhet
  shprehimisht në kod: serverat e Vercel-it punojnë me orën botërore (UTC),
  prandaj pa këtë ora do të dilte 1–2 orë prapa. Te faqja e terminit shkruhet
  edhe se kur u regjistrua: *Regjistruar më ... · ora e Beogradit*.
- **Lista:** një tabelë e ngjeshur — *Nr · Emri · Data e terminit · Sigurimi ·
  Pers. · Kontr. · Shën. · Statusi* — ku çdo termin zë një rresht të vetëm.
  Në ekran të vogël kolonat dytësore fshihen vetvetiu.
- **Logoja dhe ngjyra:** shenja e Helvetic rri te menyja anash, dhe
  logoja e plotë te faqja e hyrjes. Bluja e markës (`#0069C8`) është ngjyra e
  butonave dhe e lidhjes së zgjedhur. Skedat: `public/shenja.png`,
  `public/logo.png`, `app/icon.png` (ikona e skedës së shfletuesit).
- **Gjuha:** CRM-ja flet **gjermanisht** dhe **shqip**. Gjermanishtja është e
  parazgjedhur; çelësi *Deutsch / Shqip* rri poshtë te menyja anash dhe e
  ndryshon gjithë faqen menjëherë. Zgjedhja ruhet te shfletuesi dhe mbetet
  edhe pas daljes.
- **Filtro:** menyja *Statusi* lart. Përmbledhja tregon sa termine, sa u
  mbajtën dhe sa kontrata u mbyllën — për **tërë bazën**, jo vetëm për faqen
  që sheh.
- **Faqet:** lista jep 50 termine për faqe, me butonat ‹ 1 2 … 40 › poshtë.
  Numri i faqes rri te adresa (`/?faqe=7`), prandaj lidhja mund të dërgohet
  ose të ruhet, dhe kthimi nga një termin të lë aty ku ishe.
- **Kërko:** kutia djathtas filtrit gjen sipas emrit (kudo brenda tekstit)
  ose sipas numrit të shkurtër (`2998`).
- **Data e terminit:** rreshti i dytë i filtrave, *Nga … Deri*. Filtron sipas
  datës **për të cilën është caktuar** termini — jo sipas datës kur u shtua te
  sistemi. Të dyja anët janë të lira: vetëm *Nga* do të thotë «prej asaj dite
  e tutje», vetëm *Deri* «gjithçka para saj». Për një ditë të vetme, e njëjta
  datë në të dyja anët — ose shkurtorja *Sot*; ka edhe *Kjo javë* (e hënë–e
  diel) dhe *Ky muaj*.

  Kur ka filtër date, lista renditet sipas **orës së terminit**, nga i pari i
  ditës te i fundit — sepse atëherë pyetja s'është më «çfarë u shtua së
  fundi», por «si e kemi të mërkurën». Pa filtër date, radha mbetet si ishte:
  i fundit i regjistruar rri lart.

  Fushat e datës i vizaton vetë shfletuesi, sipas gjuhës së tij: një
  kompjuter i vendosur në anglisht e shkruan 5 shtatorin si `09/05`. Prandaj
  intervali përsëritet pranë tyre me shkronjat tona, dita e para:
  `5.9.2026 – 12.9.2026`.
- **Filtrat udhëtojnë bashkë.** Rezultati, kërkimi, intervali i datës, pamja
  *Të mijat* dhe numri i faqes rrinë të gjitha te adresa dhe asnjëri nuk i
  fshin të tjerët: ndërro rezultatin dhe data mbetet; kërko dhe të dyja
  mbeten. Ndërrimi i një filtri e kthen listën te faqja e parë — rezultatet
  janë të tjera, prandaj faqja 7 e mëparshme s'ka kuptim.
- **Tabela nuk rrëshqet anash.** Lista hyn e tëra brenda ekranit, pa shirit
  rrëshqitës poshtë. Sa kolona duken varet nga hapësira: numri, emri, data e
  terminit dhe rezultati duken gjithmonë; nga 768px shtohen kutizat e
  zgjedhjes, *Pers.* dhe *Kontr.*; nga 1024px edhe *Sigurimi* dhe *Shën.*
  Asgjë nuk pritet me tri pika — çdo vlerë duket e plotë, edhe kur i duhen dy
  rreshta. Data rri në dy rreshta: data sipër, ora poshtë.
- **Hap një termin:** kliko mbi emrin. Faqja ndahet në pesë skeda —
  *Personalia*, *Të dhëna teknike*, *Rezultati*, *Detaje*, *Feedback* — dhe
  duket vetëm njëra njëherësh, që të mos zbresësh gjatë. Butoni *Ruaj
  ndryshimet* i ruan të gjitha skedat njëherësh, jo vetëm atë që sheh.
- **Menyja anash:** shtylla e majtë mban lidhjet, emailin, rolin dhe *Dil*.
  Në telefon shndërrohet në një shirit të hollë sipër.
- **Përdoruesit:** vetëm llogaritë që hyjnë ende. Kur i heq hyrjen dikujt,
  rreshti i tij ikën nga kjo listë — por terminet, shënimet dhe orët e tij
  mbeten dhe vazhdojnë të mbajnë emrin e tij. Edhe kopja e të dhënave i merr
  të gjitha llogaritë, përfshirë ato të hequra.
- **Dashboard:** numrat e përgjithshëm — sa termine, sa u mbajtën, sa kontrata
  dolën, sa janë të ardhshme — plus ndarja sipas statusit, të regjistruarit
  ditë pas dite, dhe terminet e radhës. Admini sheh edhe ndarjen sipas
  agjentit. Numrat llogariten sa herë hapet faqja, nuk ruhen askund.
- **Profili:** koha jote brenda CRM-së (sot, 14 ditët e fundit, mesatarja),
  sa shënime ke shkruar, dhe — për këdo që cakton termine — sa termine ke
  caktuar dhe sa kontrata dolën prej tyre. Poshtë rri lista e asaj që roli yt
  mund e nuk mund të bëjë.
- **Numri i terminit:** çdo termin ka një numër të shkurtër — `#1000`, `#1001`
  e kështu me radhë — që del te lista, te kreu i faqes dhe te adresa. Numri
  jepet nga baza, nuk ndryshohet kurrë, dhe kështu mund ta thuash me gojë ose
  ta shkruash në një mesazh.
- **Adresa sipas rolit:** i njëjti termin hapet nën prefiksin e atij që është
  i kyçur — `/admin/terminet/1001`, `/menager/terminet/1001` ose
  `/user/terminet/1001`. Prefiksi është vetëm emërtim: ai NUK jep asnjë të
  drejtë. Kush hap prefiksin e një roli tjetër kthehet te i veti, dhe lejet
  dalin gjithmonë nga roli te tabela `profiles`.
- **Fshirja e terminit:** poshtë faqes, vetëm për menaxherin dhe adminin.
  Kërkon dy klikime: i pari hap pyetjen dhe tregon sa shënime fshihen bashkë
  me terminin, i dyti e kryen. Nuk kthehet mbrapsht.
- **Rezultati:** një status i vetëm (I hapur, U mbajt, I anuluar, Nuk u arrit,
  S'deshi termin, Negativ, S'ishte në shtëpi, Adresa s'u gjet, S'u këshillua dot)
  plus kontratat e mbyllura. Baza nuk lejon më shumë kontrata se persona.
- **Feedback i terminit:** poshtë terminit rri një tabelë me tri kolona —
  *Përdoruesi*, *Shënimi*, *Data* — njësoj si te TH-CRM. Kutia e shkrimit rri
  gjithmonë e hapur mbi tabelë: shkruaj dhe shtyp **Ctrl+Enter** (ose butonin
  *Shto shënimin*). Shënimin tënd e ndryshon me *Ndrysho* pa dalë nga tabela;
  te kolona *Data* shfaqet edhe "ndryshuar më".
- **Aktiv sot:** lart djathtas, koha që ke kaluar sot brenda CRM-së.
- **Kopja e të dhënave:** vetëm admini, te menyja anash. Shkarkon gjithçka në
  një skedë të vetme, ose tabelat veç për Excel. Shih **Pjesa 12**.

### Kush çfarë mundet

| Veprimi | Ekspert | Përdorues | Menaxher | Admin |
| --- | :---: | :---: | :---: | :---: |
| Lexon **të gjitha** terminet | ❌ | ❌ | ✅ | ✅ |
| Lexon terminet **e veta** | — | ✅ | ✅ | ✅ |
| Lexon terminet **që i jepen** | ✅ | — | ✅ | ✅ |
| Shkruan shënime | ✅\* | ✅\*\* | ✅ | ✅ |
| Cakton termine | ❌ | ✅ | ✅ | ✅ |
| Ndryshon termine — edhe të vetat | ❌ | ❌ | ✅ | ✅ |
| Shënon **rezultatin** e terminit | ✅\*\*\* | ❌ | ✅ | ✅ |
| Fshin termine | ❌ | ❌ | ✅ | ✅ |
| Jep akses ekspertëve | ❌ | ❌ | ✅ | ✅ |
| Sheh kolonën *Eksperti* te lista | ❌ | ❌ | ✅ | ✅ |
| Hap llogari dhe heq hyrjen | ❌ | ❌ | ❌ | ✅ |
| Faqja *Përdoruesit* dhe *Aktiviteti* | ❌ | ❌ | ❌ | ✅ |

\* Eksperti shkruan shënime vetëm te terminet që i janë caktuar.
\*\* Përdoruesi i thjeshtë vetëm te terminet e veta.
\*\*\* Vetëm rezultatin — kategorinë, arsyen, kontratat — dhe vetëm te terminet që i janë dhënë. Emrin, telefonin, adresën dhe datën nuk i prek dot.
Shih **Pjesa 9**.

**Përdoruesi i thjeshtë** cakton terminet e veta dhe shkruan feedback mbi to
— dhe sheh vetëm ato. Terminet e të tjerëve për të nuk ekzistojnë: nuk dalin
te lista, nuk hyjnë te numrat e përmbledhjes as te dashboard-i, dhe adresa e
drejtpërdrejtë kthen 404 — jo «nuk ke leje», që as vetë numri të mos tregojë
nëse ekziston.

**Ndryshimin e bën vetëm menaxheri ose admini** — edhe te terminet që i ka
caktuar vetë useri. Pra useri nuk e mbyll dot terminin e vet. Fshirja po
ashtu i mbetet menaxherit: ajo merr me vete edhe shënimet e terminit dhe
nuk kthehet mbrapsht.

**Një përjashtim i vetëm: rezultati.** Ekspertit që shkon te termini i
lejohet ta shënojë vetë se si përfundoi — kategorinë, arsyen, kontratat.
Asgjë tjetër: emri, telefoni, adresa dhe data mbeten të paprekshme për të.

> **KUJDES gjatë kalimit.** Deri para kësaj, përdoruesi i thjeshtë i lexonte
> TË GJITHA terminet dhe nuk caktonte asnjë. Pas `supabase/useri.sql` ai sheh
> vetëm të vetat — pra dikush që dje shihte një listë të plotë, sot e sheh
> bosh derisa të caktojë vetë. Kjo është pikërisht ajo që u kërkua, por s'ka
> si të mos vihet re. Kush duhet t'i shohë të gjitha, bëhet **menaxher**.

**Eksperti** e bën të njëjtën gjë, por **vetëm te terminet që i jepen** — nga
menaxheri ose nga admini.
Për të, ato që s'i janë dhënë nuk ekzistojnë fare: nuk dalin te lista, nuk
numërohen te përmbledhja, dhe adresa e drejtpërdrejtë kthen 404 — jo një
mesazh «nuk ke leje», që as vetë numri i terminit të mos tregojë nëse ekziston.

Ky kufi rri te **baza**, jo te faqja. Rregulli i leximit dikur thoshte
`using (true)` — çdo i kyçur i shihte të gjitha. Ai u bë i vetëdijshëm për
rolin te `supabase/eksperti.sql` (dega e ekspertit) dhe pastaj te
`supabase/useri.sql` (dega e userit). E njëjta ndarje vlen edhe për
**shënimet** — ndryshe dikush do të mos e shihte terminin e huaj te lista,
por do t'i lexonte shënimet e tij përmes API-së. Shih **Pjesa 9**.

Një termin mund t'u jepet **disa ekspertëve** njëherësh. Kujt i është dhënë
secili termin duket te kolona *Eksperti* e listës — për menaxherin dhe
adminin, nga 1280px e sipër (shih **Pjesa 11**). Aksesin e japin — dhe e
heqin — **menaxheri dhe admini**, në dy mënyra:

- **Nga lista, disa njëherësh.** Te lista dalin kutiza majtas çdo rreshti.
  Zgjidhen sa termine të duhen — ose të gjitha me një klikim — zgjidhet
  eksperti nga menyja lart, dhe u jepet me një klikim. Kështu caktohet puna e
  një dite pa u hapur çdo termin veç.

  Deri para pak këtë e bënte vetëm admini, dhe kjo e kthente atë në pengesë:
  menaxheri e cakton terminin dhe e njeh rastin, por duhej të priste dikë
  tjetër vetëm për t'ia dhënë një eksperti (`supabase/ekspertet-menaxheri.sql`).
  Eksperti vetë vazhdon të mos i prekë këto rreshta: as s'ia jep vetes një
  termin, as s'ia heq dikujt.
- **Një nga një**, te skeda *Ekspertët me akses* brenda terminit. Aty duket
  edhe kush ia dha aksesin, dhe butoni për ta hequr.

Nëse mes të zgjedhurve ka ndonjë që eksperti e ka tashmë, ai **nuk është
gabim**: thjesht nuk shtohet dy herë, dhe mesazhi thotë sa u shtuan vërtet.
Ndryshe një zgjedhje e gjerë do të dështonte tërësisht sapo njëri prej tyre të
ishte dhënë më parë.

Kur ekspertit i hiqet aksesi, shënimet që ka shkruar **mbeten** — si te heqja
e një llogarie.

> **E ZBATUAR ✅** — `supabase/ekspertet-menaxheri.sql` u ekzekutua më 3 shtator
> 2026 mbi bazën e vërtetë, dhe u mat aty me llogaritë reale, brenda një
> transaksioni që u kthye mbrapsht. Nga 10 llogaritë: **jep dhe heq akses**
> vetëm dy adminët aktivë dhe menaxheri aktiv; ekspertët, përdoruesit e
> thjeshtë dhe çdo llogari pa hyrje — përfshirë një **admin** dhe një
> **menaxher** të hequr — nuk e bëjnë as njërën as tjetrën. Heqja u mat me
> `row_count`, jo me gabim: një fshirje që rregullat e bazës nuk e lejojnë
> nuk kthen gabim, thjesht nuk prek asnjë rresht — matur si gabim, do të
> dukej sikur u lejua.

Administratori ka edhe:

- **Fjalëkalim i ri** për çdo llogari — user, menaxher, ekspert ose
  admin tjetër. Nuk ka email rikthimi te ky sistem: llogaritë i hap admini,
  prandaj edhe fjalëkalimin e harruar e zëvendëson ai. Fjalëkalimi i vjetër
  as nuk kërkohet, as nuk shfaqet — baza mban vetëm një gjurmë të koduar të
  tij, prandaj askush nuk e "sheh" fjalëkalimin e dikujt, vetëm e zëvendëson.
  **Kujdes:** ndryshimi nuk e nxjerr jashtë atë që është tashmë i kyçur;
  sesioni i hapur vazhdon derisa t'i mbarojë vetë. Kur dikush duhet ndalur
  menjëherë, përdoret *Hiq hyrjen*.
- **Heqjen e hyrjes** — vetëm admini. Vlen **menjëherë**: me klikimin e parë
  personi del nga aplikacioni dhe sheh njoftimin pse. Llogaria fshihet dhe ai
  nuk hyn më, por **asnjë e dhënë e tij nuk humbet**: terminet që ka caktuar,
  shënimet që ka shkruar dhe orët e tij mbeten, dhe vazhdojnë të mbajnë emrin
  e tij. Rreshti mbetet në listë, i shënuar *pa hyrje*. Tri gjëra ndalohen:
  ta heqësh veten, adminin e fundit, ose ta bësh pa qenë admin.
- **Përdoruesit** — të gjitha llogaritë, rolet, koha aktive sot dhe sa termine e
  shënime ka secili.
- **Aktiviteti** — koha e secilit për 7 ditët e fundit, me pikë jeshile për
  "aktiv tani".
- **Ndryshimin e çdo shënimi**, edhe atyre të shkruara nga të tjerët.

---

## Pjesa 4 — Ku ndodhet çdo gjë në kod

```
app/
  page.tsx                  Faqja kryesore: lista e termineve + paneli i caktimit
  actions.ts                Funksionet që ruajnë terminet dhe shënimet
  sign-out-button.tsx       Butoni "Dil"
  activity-tracker.tsx      Sinjali "jam aktiv" çdo 2 minuta
  setup-notice.tsx          Udhëzimet nëse .env.local mungon
  layout.tsx                Korniza e përbashkët e faqeve
  globals.css               Stilet dhe ngjyrat e markës
  icon.png                  Ikona e skedës te shfletuesi
  login/
    page.tsx                Faqja e hyrjes
    login-form.tsx          Formulari i hyrjes (vetëm "Hyr")
    actions.ts              Hyrja, regjistrimi dhe dalja
  auth/confirm/route.ts     Aty bie lidhja e konfirmimit nga emaili
  auth/dil/route.ts         Dalja e detyruar, kur llogarisë i hiqet hyrja
  admin/page.tsx            Faqja e administratorit: të gjithë përdoruesit
  admin/actions.ts          Hapja e llogarive (vetëm admini)
  admin/user-form.tsx       Paneli "Hap llogari të re"
  admin/password-form.tsx   Ndryshimi i fjalëkalimit të një llogarie
  admin/delete-user.tsx     Heqja e hyrjes së një llogarie
  admin/aktiviteti/page.tsx Koha e secilit përdorues, ditë pas dite
  admin/kopja/page.tsx      Kopja e të dhënave: numrat dhe butonat e shkarkimit
  admin/kopja/shkarko/route.ts  Vetë skeda (JSON ose CSV), me rolin e kontrolluar
  dashboard/page.tsx        Dashboard-i: puna e një muaji, numrat dhe grafikët
  dashboard/month-filter.tsx  Zgjedhja e muajit
  profili/page.tsx          Profili im: koha, puna dhe lejet
  stats.tsx                 Kutitë e numrave dhe grafikët (HTML i thjeshtë)
  status-filter.tsx         Menyja e filtrit sipas statusit
  date-filter.tsx           Filtri sipas datës së terminit + shkurtoret
  pagination.tsx            Butonat e faqeve: ‹ 1 2 … 40 ›
  search-box.tsx            Kutia e kërkimit mbi listë
  bulk-assign.tsx           Zgjedhja e disa termineve dhe dhënia te një ekspert
  sidebar.tsx               Menyja anash: lidhjet, roli dhe "Dil"
  sidebar-link.tsx          Një lidhje e menysë, që ndriçon te faqja e vet
  language-switcher.tsx     Çelësi Deutsch / Shqip
  language-action.ts        Ruan gjuhën e zgjedhur te cookie-ja
  terminet/
    appointment-page.tsx    Faqja e një termini (e përbashkët për tri rolet)
    tabs.tsx                Skedat e faqes së terminit
    delete-button.tsx       Fshirja e terminit, me konfirmim në dy hapa
    experts.tsx             Paneli i adminit: kush e sheh këtë termin
    expert-actions.ts       Dhënia dhe heqja e aksesit
    appointment-form.tsx    Formulari i terminit (caktim dhe ndryshim)
    result-form.tsx         Vetëm rezultati — formulari i ekspertit
    note-form.tsx           Kutia e shpejtë për të shtuar shënim
    note-row.tsx            Një rresht i tabelës, me ndryshim brenda rreshtit
    [nr]/page.tsx           Adresa e vjetër pa prefiks -> te ajo e rolit
  admin/terminet/[nr]/page.tsx     Termini siç e sheh admini
  ekspert/terminet/[nr]/page.tsx   Termini siç e sheh eksperti
  menager/terminet/[nr]/page.tsx   Termini siç e sheh menaxheri
  user/terminet/[nr]/page.tsx      Termini siç e sheh përdoruesi
public/
  logo.png                  Logoja e plotë — vetëm te faqja e hyrjes
  shenja.png                Vetëm shenja — te menyja anash
lib/
  supabase/server.ts        Lidhja me bazën për kodin në server
  supabase/proxy.ts         Mban sesionin e freskët në çdo kërkesë
  supabase/admin.ts         Lidhja me çelësin sekret — vetëm për hapjen e llogarive
  auth.ts                   "Kush është i kyçur?" dhe "çfarë roli ka?"
  backup.ts                 Ç'hyn te kopja, dhe shkrimi i CSV-së
  faqet.ts                  Leximi faqe-pas-faqeje: kurthi i 1000 rreshtave
  lista.ts                  Gjendja e listës dhe e VETMJA adresë që e ndërton
  types.ts                  Tipat, statuset dhe ndihmësit e vegjël
  i18n.ts                   Fjalori: çdo tekst, gjermanisht dhe shqip
  i18n-server.ts            Lexon gjuhën e zgjedhur nga cookie-ja
proxy.ts                    Ndalon të pakyçurit para se të hapin faqet
supabase/
  schema.sql                Tabelat `appointments` dhe `notes`
  admin.sql                 Profilet, roli admin dhe trigger-i
  roles.sql                 Tri rolet dhe lejet
  nr.sql                    Numri i shkurtër i terminit (#1000)
  fshirja.sql               Lejon fshirjen e termineve (menaxher + admin)
  llogari-pa-humbje.sql     Të dhënat mbijetojnë fshirjen e një llogarie
  faqosja.sql               Numrat e përmbledhjes + indekset e listës
  kategorite.sql            Tri kategoritë + arsyeja brenda tyre
  eksperti.sql              Roli i katërt dhe kufiri i leximit
  useri.sql                 Useri cakton terminet e veta, dhe sheh vetëm ato
  numrat.sql                Numërimi për person te baza, jo duke tërhequr tabelën
  ndryshimi-menaxherit.sql  Terminin e ndryshon vetëm menaxheri, as useri të vetin
  ekspertet-menaxheri.sql   Aksesin e ekspertit e jep edhe menaxheri
  llogaria-e-fshire.sql     Fshirja me dorë te Auth-i shënon vetë profilin
  llogari-e-fshehur.sql     Kolona `hidden`: llogari që s'duket te lista
  datat.sql                 Filtri sipas datës së terminit + indekset e tij
  pastrimi.sql              Heqja e të dhënave të provës — dhe si kthehen
  hyrja-e-hequr.sql         Llogaria e hequr ndalet menjëherë, edhe me çelësin e vjetër
  rls-shpejtesi.sql         Rregullat: një llogaritje për kërkesë, jo për rresht
  mbetur.sql                Të dyja migrimet e fundit, në një skedë
  activity.sql              Përcjellja e kohës
```

Tri koncepte që i ndeshni në kod:

- **Server Component** (`app/page.tsx`) — ekzekutohet vetëm në server dhe mund
  ta pyesë bazën e të dhënave drejtpërdrejt me `await`.
- **Server Action** (`app/actions.ts`) — funksione me `"use server"` lart. Kur
  dërgon një formular, shfletuesi e thërret funksionin në server.
- **Proxy** (`proxy.ts`) — kod që ekzekutohet para çdo kërkese. Këtu mban
  sesionin e freskët dhe i kthen te faqja e hyrjes ata që s'janë kyçur.
  (Në Next.js 16 kjo skedë quhej më parë `middleware.ts`.)

---

## Pjesa 5 — Siguria

Të dhënat mbrohen në tri shtresa, njëra mbi tjetrën:

1. **Hyrja me llogari.** Çdo faqe e kontrollon kush je para se të tregojë asgjë.
   Kush s'është i kyçur, dërgohet te faqja e hyrjes.
2. **Rregullat e bazës (RLS).** Vetë baza e të dhënave lejon secilin përdorues
   të prekë vetëm rreshtat ku `user_id` është i tiji. Kjo vlen edhe nëse dikush
   e thërret bazën jashtë aplikacionit tonë.
3. **Filtrim i qartë në kod.** Çdo kërkesë e shkruan edhe vetë "vetëm të miat",
   që një gabim i vetëm të mos mjaftojë për të rrjedhur të dhëna.

Çelësi te `.env.local` është **publik me qëllim** (Supabase e quan
"publishable"). Pa llogari, ai çelës nuk hap asgjë.

**Rolet.** Roli ruhet në tabelën `profiles`, e cila ka RLS pa asnjë rregull
ndryshimi — pra askush nuk e bën dot veten admin apo menaxher nga aplikacioni.
Roli ndryshohet vetëm nga paneli i Supabase-it, ku hyn vetëm ti.

**Secili sheh punën e vet; menaxheri sheh të gjitha.** Rregulli i leximit
dikur thoshte `using (true)` — çdo i kyçur i shihte të gjitha terminet. Sot ai
ka tri degë (`supabase/useri.sql`): menaxheri dhe admini gjithçka, eksperti
ato që i jepen, përdoruesi i thjeshtë të vetat. E njëjta ndarje vlen
edhe për **shënimet** — pa të, dikush do të mos e shihte terminin e huaj te
lista, por do t'i lexonte shënimet e tij përmes API-së.

Shkrimi është më i ngushtë se leximi: terminin e ndryshon vetëm menaxheri
dhe admini, dhe fshirjen po ashtu. `user_id` merret gjithmonë nga sesioni,
kurrë nga formulari, dhe rregulli i shtimit e kërkon `user_id = auth.uid()`
— pra askush nuk shkruan dot një termin në emër të dikujt tjetër, as duke e
thirrur bazën jashtë faqes sonë.

**Një kufi i katërt: cilat kolona.** Eksperti e shënon rezultatin e terminit
të vet, por asgjë tjetër të tijin. Këtë rregullat e RLS-së nuk e bëjnë dot:
ato vendosin nëse rreshti preket, jo se ç'pjesë e tij. Prandaj te
`appointments` rri edhe një trigger `before update`
(`supabase/rezultati-ekspertit.sql`) që, kur ai që shkruan është ekspert,
krahason rreshtin para dhe pas dhe e refuzon çdo ndryshim jashtë pesë
fushave të rezultatit. Fshehja e fushave te formulari nuk do të mjaftonte:
ajo është pamje, dhe një kërkesë e dërguar drejt te baza nuk e sheh fare.
Shih **Pjesa 9**.

Lista e profileve lexohet nga të gjithë (`profiles_select_all`), sepse tabela
e feedback-ut tregon se kush e shkroi secilin shënim — por vetëm lexohet,
roli nuk ndryshohet dot nga aplikacioni.

### Publikimi në Vercel

Tani që ka hyrje me llogari, publikimi është i arsyeshëm:

1. Hyr te <https://vercel.com> me llogarinë e GitHub-it.
2. **Add New → Project** dhe zgjidh depon `Helvetic-Crm`.
3. Te **Environment Variables** shto të njëjtat dy rreshta që ke te
   `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Kliko **Deploy** dhe prit rreth një minutë.
5. Kthehu te Supabase → **Authentication** → **URL Configuration** dhe vendos
   te **Site URL** adresën që të dha Vercel (p.sh. `https://helvetic-crm.vercel.app`),
   që lidhjet e konfirmimit të email-it të çojnë atje e jo te `localhost`.

Dy gjëra për t'i mbajtur mend:

- **Supabase falas pauzohet** pas rreth një jave pa përdorim. Riaktivizohet me
  një klikim nga paneli.
- **Kush di adresën, sheh faqen e hyrjes** — por jo të dhënat.
- **Fike regjistrimin edhe te Supabase.** Butoni *Regjistrohu* është hequr nga
  faqja, por kjo vetëm e fsheh — dera e Supabase-it mbetet e hapur për këdo që
  di ta dërgojë kërkesën vetë. Mbyllet vetëm nga paneli: Supabase →
  **Authentication** → **Sign In / Providers** → **Email** → fik
  *Allow new users to sign up*. Pa këtë hap, kushdo mund të hapë llogari.

## Pjesa 6 — Përcjellja e kohës

Administratori sheh sa kohë ka kaluar secili përdorues brenda CRM-së, ditë pas
dite. Ja si matet, saktësisht:

- Sa kohë faqja është **e hapur dhe e dukshme**, shfletuesi dërgon një sinjal
  çdo 2 minuta. Nëse përdoruesi kalon në një skedë tjetër, sinjalet ndalen.
- Serveri shton kohën që nga sinjali i fundit, por **jo më shumë se 5 minuta
  përnjëherë**. Kështu një pushim i gjatë nuk numërohet si punë.
- Numrat i shkruan vetëm baza e të dhënave (funksioni `record_activity`).
  Asnjë përdorues nuk mund t'i fryjë numrat e vet, as duke i dërguar sinjale pa
  pushim: nëse s'ka kaluar kohë, nuk shtohet asgjë.

**Çfarë NUK mat:** punë të bërë me telefon, në termin, në letër, ose në ndonjë
program tjetër. Prandaj kjo tabelë tregon kohën në CRM — jo produktivitetin.
Përdore si tregues, jo si dëshmi.

**Transparenca:** secili përdorues e sheh numrin e vet lart në faqe, po aq sa e
sheh administratori. Kjo është me qëllim: përcjellja e fshehtë e punonjësve
krijon probleme ligjore (rregullat e mbrojtjes së të dhënave kërkojnë që
personi të jetë i informuar) dhe prish besimin. Njoftoji punonjësit para se ta
përdorësh këtë faqe.

## Pjesa 7 — Si janë menduar terminet

Sistemi ka **një njësi të vetme: terminin**. Të dhënat e personit — emri, numri i
klientit, datëlindja, adresa, telefoni — rrinë mbi vetë terminin, jo në një
kartelë të veçantë.

Kjo është me qëllim: çdo termin është një ngjarje më vete, me gjendjen e personit
ashtu siç ishte atë ditë. Nëse i njëjti person takohet sërish pas gjashtë
muajsh, caktohet një termin i ri me të dhënat e reja, dhe historiku i të parit
mbetet i paprekur.

**Rezultati: tri kategori, jo nëntë statuse.** Çdo termin bie në njërën nga
tri:

| | Kuptimi |
|---|---|
| 🟢 **E suksesshme** | U mbajt **dhe** u nënshkrua kontratë |
| 🟡 **Në bisedim** | Puna vazhdon; mund të provohet sërish |
| 🔴 **E dështuar** | Mbaroi pa gjë |

Kategoria e ngjyros tërë rreshtin te lista, dhe kjo numërohet te raportet.
Nëntë ngjyra nuk lexohen dot me bisht të syrit; tri po.

**Arsyeja rri brenda kategorisë.** Hollësia nuk humbi — thjesht zbriti një
shkallë: *E dështuar → S'deshi termin*, *Në bisedim → S'ishte në shtëpi*.
Secila arsye i përket vetëm një kategorie, dhe atë lidhje e ruan vetë baza
(`supabase/kategorite.sql`): «e suksesshme + i anuluar» nuk hyn dot as me një
kërkesë të drejtpërdrejtë te API-ja, jo vetëm përmes formularit.

**Suksesi kërkon kontratë.** Ky s'është vetëm rregull i formularit: baza e
refuzon një termin të suksesshëm me zero kontrata. Pa këtë, «e suksesshme» do
të ishte thjesht një ngjyrë që kushdo mund ta vendoste.

**Vetëm një rezultat njëherësh.** Me kuti të pavarura mund të shënohej
njëkohësisht «e suksesshme» dhe «e dështuar», dhe atëherë asnjë raport nuk do
të ishte i besueshëm. Dy shenjat e pavarura që mbeten — *kontratë
shumëvjeçare* dhe *trajtim* — mund të shoqërojnë çdo rezultat.

**Kontratat nuk fryhen dot:** baza refuzon një numër më të madh se numri i
personave të terminit.

## Pjesa 8 — Dashboard-i: një muaj, dhe puna e secilit

Dashboard-i tregon **një muaj njëherësh**, jo gjithçka që ka ndodhur ndonjëherë.
Muaji zgjidhet lart dhe rri te adresa (`/dashboard?muaji=2026-07`), prandaj
lidhja mund të dërgohet dhe kthimi mbrapa i shfletuesit punon si pret njeriu.
Shkohet deri 24 muaj prapa.

**Në cilin muaj bie një termin** e vendos **data e vetë terminit**, jo ajo kur
u regjistrua. Një termin i caktuar për 3 tetor numërohet te tetori, edhe nëse u
fut te sistemi në shtator. Kjo i përgjigjet pyetjes «sa punë kam në tetor».

**Kush sheh çfarë:**

| Roli | Dashboard-i tregon |
| --- | --- |
| **Admin** | të gjitha terminet e qendrës — me çelës për t'i ngushtuar te të vetat |
| **Menaxher** | vetëm terminet që ka caktuar vetë |
| **Përdorues** | vetëm terminet që ka caktuar vetë |
| **Ekspert** | vetëm terminet që i janë caktuar |

### Puna e secilit — vetëm te admini

Poshtë dashboard-it, admini ka një tabelë me **një rresht për çdo llogari**:
sa termine ka bërë secili brenda atij muaji, sa dolën të suksesshme, dhe sa
kontrata. Edhe llogaritë pa asnjë termin rrinë aty — pikërisht ato janë të
vështirat për t'u parë, sepse mungojnë nga çdo listë që ndërtohet mbi
terminet.

**Te eksperti kolona «Termine» ka kuptim tjetër, dhe kjo shkruhet te tabela.**
Ai numër do të thotë *sa i janë dhënë*, jo *sa ka caktuar*. Eksperti nuk
cakton asnjë termin: te terminet e tij `user_id` është ai që ia caktoi.
Po ta numëronim si të tjerët, çdo ekspert do të dilte me zero dhe tabela do
të gënjente për tërë punën e tij — prandaj numri i tij vjen nga
`appointment_experts`, dhe pas tij rri një yll që e shpjegon.

Tabela del vetëm kur admini sheh **të gjitha**: te «Të mijat» do të ishte një
rresht i vetëm.

Eksperti është rasti i veçantë. Te terminet e tij, kolona që tregon *kush e
caktoi* mban menaxherin, jo atë. Po ta filtronim sipas asaj kolone, dashboard-i
i tij do të dilte bosh. Për të, kufirin e ka vënë tashmë baza — sheh vetëm ato
që i janë dhënë — prandaj s'i shtohet asnjë filtër tjetër.

**Ndarja e muajit bëhet me orën e Beogradit.** Kërkesa merr një ditë më shumë
nga të dyja anët, dhe ndarja e saktë bëhet pastaj. Ndryshe do të duhej
llogaritur me dorë sa është dallimi i Beogradit nga ora botërore atë ditë — dhe
ai ndryshon me orën e verës. Kështu përgjigjen e jep kalendari, jo ne.

**Emrat e muajve formatohen te serveri**, jo te shfletuesi. Kjo doli gjatë
provës: Chrome-i nuk i ka të njëjtat emra shqip si Node-i, prandaj menyja
shkruante «August 2026» ndërsa gjithë faqja ishte shqip — dhe React-i jepte
gabim sepse serveri e shfletuesi vizatonin tekste të ndryshme.

---

## Pjesa 9 — Useri që punon vetë

Deri para pak, përdoruesi i thjeshtë ishte lexues: i shihte **të gjitha**
terminet e regjistruara, por nuk caktonte dot asnjë. Puna e tij ishte vetëm
feedback-u. Tani është agjent i vogël — cakton terminet e veta, dhe sheh
vetëm ato.

> **E ZBATUAR ✅** — `supabase/useri.sql` u ekzekutua më 30 gusht 2026 mbi
> bazën e vërtetë. Matrica e lejeve u mat aty, me llogaritë reale, dhe doli
> siç pritej; provat u kthyen mbrapsht, baza mbeti me 16 termine e 22 shënime.
> Këshilluesi i Supabase-it nuk shtoi asnjë paralajmërim të ri.

Ndryshimi është një skedë e vetme te baza, `supabase/useri.sql`, dhe prek
katër rregulla:

| Rregulli | Përpara | Tani |
| --- | --- | --- |
| Cakton termin | vetëm menaxheri | kushdo veç ekspertit |
| Lexon terminet | të gjithë i shihnin të gjitha | menaxheri të gjitha, useri të vetat, eksperti të caktuarat |
| Ndryshon terminin | vetëm menaxheri | **vetëm menaxheri** — veç rezultatit, që e shënon edhe eksperti |
| Lexon shënimet | të gjithë i lexonin të gjitha | ashtu si terminet |

Fshirja **nuk** ndryshoi: mbetet te menaxheri dhe admini. Ajo merr me vete
edhe shënimet e terminit (`on delete cascade`) dhe nuk kthehet mbrapsht.

### Ndryshimin e bën vetëm menaxheri

Në fillim useri e ndryshonte terminin që kishte caktuar vetë, që të mund ta
mbyllte. Pastaj kjo u hoq me kërkesë (`supabase/ndryshimi-menaxherit.sql`):
useri e cakton terminin dhe shkruan feedback mbi të, por nuk e prek më pas.

Pasoja duhet ditur: **useri nuk e mbyll dot terminin e vet.** Ai mbetet «në
bisedim» derisa t'i shënohet rezultati. Numrat e raporteve — «e suksesshme»,
kontratat — dalin nga rezultati, jo nga feedback-u, prandaj një termin i
mbaruar mirë por i pashënuar nuk numërohet askund. Kjo është zgjedhje pune,
jo teknike: rezultatin e vendos ai që ishte atje ose ai që mban përgjegjësi
për të — eksperti i caktuar, menaxheri, admini. Jo useri që e caktoi.

**Përse `not is_expert()` te dega e leximit.** Te terminet e ekspertit,
`user_id` është ai që ia caktoi, jo vetë eksperti. Pa atë kusht, një llogari
që dikur ka caktuar termine dhe më pas u bë ekspert, do t'i shihte ato përjetë
— jashtë listës së aksesit. E njëjta gjë e detyron faqen të mos e filtrojë
ekspertin sipas `user_id`: do t'i dilte bosh. Për të e bën ndarjen vetëm baza.

**Si u provua.** Të gjitha migrimet u riluajtën nga zeroja mbi një Postgres 16
lokal, dhe matrica e plotë e lejeve — kush lexon, kush cakton, kush ndryshon,
kush dorëzon, kush fshin, kush shkruan shënim — u shënua **para** dhe **pas**
skedës, për të pesë llogaritë e provës. Për matjen e `update` dhe `delete`
numërohen rreshtat e prekur, jo gabimet: një ndryshim që rregullat nuk e
lejojnë **nuk jep gabim** — thjesht nuk prek asnjë rresht. Po të kishim matur
gabimet, "useri ndryshon terminin e menaxherit" do të dukej i lejuar.

E njëjta matje u përsërit edhe mbi bazën e vërtetë, me llogaritë e vërteta.
Rezultati:

```
roli      sheh  shënime | cakton  në emër të tjetrit | ndryshon  fshin | shënim te termini i huaj
admin      16     22    |   po           JO         |    po      po   |   po
menaxher   16     22    |   po           JO         |    po      po   |   po
ekspert     5      6    |   JO           JO         |    JO      JO   |   JO (po te i dhëni)
user        0      0    |   po           JO         |    JO      JO   |   JO
```

> Ajo matje u bë kur useri e ndryshonte ende terminin e vet; edhe atëherë
> kolona «ndryshon» i dilte JO, sepse ajo mati terminin e dikujt tjetër. Pas
> `supabase/ndryshimi-menaxherit.sql` i del JO edhe te termini i vet — matur
> sërish mbi bazën e vërtetë më 30 gusht 2026, bashkë me kontrollin se
> feedback-un te termini i vet ende e shkruan.

### Rezultatin e shënon edhe eksperti

Te termini shkon eksperti. Ai e di nëse u mbajt, nëse u nënshkrua kontratë,
dhe sa. Deri tani nuk kishte ku ta shkruante: ajo e dhënë duhej kaluar me
gojë te menaxheri, që ta shënonte ai — dhe numrat e dashboard-it varen
pikërisht prej saj. Tani e shënon vetë, te skeda **Rezultati** e terminit.

> **E ZBATUAR ✅** — `supabase/rezultati-ekspertit.sql` u ekzekutua më
> 23 shtator 2026 mbi bazën e vërtetë. Matrica e lejeve u mat aty, brenda një
> transaksioni të kthyer mbrapsht, dhe doli siç pritej.

Ky është **i vetmi** përjashtim nga rregulli i mësipërm, dhe është i ngushtë
me qëllim. Ekspertit i lejohen pesë fusha:

**Kategoria · Arsyeja · Kontratat e mbyllura · Kontratë shumëvjeçare · Trajtim**

Emri, telefoni, adresa, data e terminit, numri i personave, autori — jo. As
fshirja. Formulari i plotë i menaxherit mbetet ashtu siç ishte.

#### Kufiri ka dy pjesë, dhe secila përgjigjet për një pyetje tjetër

| Pyetja | Kush e vendos |
| --- | --- |
| **CILAT RRESHTA** i prek dot | rregulli i RLS-së |
| **CILAT KOLONA** i prek dot brenda rreshtit | trigger-i `before update` |

Kjo ndarje nuk është zbukurim. Rregullat e RLS-së vendosin **nëse** rreshti
preket, jo **se ç'pjesë** e tij. Pa pjesën e dytë, «eksperti shënon
rezultatin» do të ishte në fakt «eksperti ndryshon terminin»: mjaftonte të
dërgonte një kërkesë pa kaluar nga faqja jonë, dhe emri ose data e terminit
do të ndryshonin. Fshehja e fushave te formulari nuk mbron asgjë — ajo është
pamje, dhe pamja nuk e ndalon askënd.

**Përse jo `grant` në nivel kolone.** Zgjidhja e parë që vjen ndër mend është
`grant update (status, category, …) on appointments to authenticated`. Nuk
bën: te Postgres-i menaxheri dhe eksperti janë i **njëjti** rol —
`authenticated`. Një `grant` i tillë do t'i kufizonte të dy. Dallimin e bën
vetëm `is_expert()`, dhe atë e lexon trigger-i.

**Përse krahasim i tërë rreshtit, jo kolonë për kolonë.** Trigger-i e kthen
rreshtin në `jsonb`, heq prej të dyve — të vjetrit dhe të riut — kolonat e
lejuara, dhe kërkon që ajo që mbetet të jetë identike. Po të shkruanim listën
e kolonave **të ndaluara**, një kolonë e re e shtuar nesër te `appointments`
do të ishte e lejuar pa e vënë re askush. Kështu siç është, ajo është e
ndaluar vetvetiu.

#### Matrica, mbi bazën e vërtetë

Matur me `GET DIAGNOSTICS n = row_count`, jo me gabime: një ndryshim që
rregullat nuk e lejojnë shpesh **nuk jep gabim** — thjesht nuk prek asnjë
rresht. Po të kishim matur vetëm gabimet, «eksperti ndryshon terminin e huaj»
do të dukej i lejuar.

```
ekspert: rezultati i tij                1 rresht
ekspert: emri i tij                     refuzuar
ekspert: data e tij                     refuzuar
ekspert: rezultati i huaj               0 rresht
menaxher: emri                          1 rresht
menaxher: rezultati                     1 rresht

gabimi i trigger-it: Eksperti ndryshon vetem rezultatin e terminit, jo name .
```

Vini re dallimin midis dy rreshtave të fundit të ekspertit: **«refuzuar»**
është trigger-i që ndal një kolonë të ndaluar te një termin i tiji;
**«0 rresht»** është RLS-ja që as nuk e sheh fare terminin e huaj. Dy kufij
të ndryshëm, dhe secili duhet të mbajë vetë.

#### Rregullat e rezultatit vlejnë njësoj

Formulari i ekspertit kalon nga të njëjtat kontrolle si ai i menaxherit:
kontratat nuk i kalojnë dot personat e terminit, arsyeja duhet t'i përkasë
kategorisë së zgjedhur, dhe «e suksesshme» pa asnjë kontratë refuzohet. Numri
i personave lexohet nga baza, jo nga formulari — përndryshe do të mjaftonte
ta dërgonte vetë më të madh.

---

## Pjesa 10 — Fushat e detyrueshme

Një termin është një takim me një person te një adresë. Pa emrin, pa një numër
ku të merret, dhe pa adresën e plotë, agjenti nuk shkon dot atje. Prandaj
gjashtë fusha kërkohen kur caktohet një termin i ri:

**Emri dhe mbiemri · Telefoni · Rruga · Kodi postar · Qyteti · Kantoni**

Te formulari ato mbajnë një yll të kuq. **Celulari** mbetet i lirë me qëllim:
telefoni është numri i kërkuar, dhe kush ka vetëm njërin nuk duhet detyruar
ta shkruajë dy herë.

Rregulli qëndron në tri shtresa, dhe secila kap diçka që tjetra nuk e kap:

1. **Ylli te etiketa** — që të dihet përpara, jo pasi të jetë shtypur *Ruaj*.
2. **Ndalesa e shfletuesit** (`required`) — nuk të lë ta dërgosh bosh.
3. **Kontrolli te serveri** — ai që mban vërtet. `required` hiqet me një
   klikim te mjetet e zhvilluesit; prandaj i njëjti rregull ripërsëritet te
   `app/actions.ts`, dhe provat e verifikojnë pikërisht ashtu: duke ia hequr
   formularit ndalesën dhe duke e dërguar gjithsesi.

### Terminet e vjetra nuk bllokohen

Nga 17 terminet që ekzistonin kur u vendos ky rregull, 6 s'kishin kanton dhe 4
s'kishin adresë. Po t'u kërkonim edhe atyre, kushdo që do vetëm të ndërronte
rezultatin e njërit prej tyre do të bllokohej te një fushë që s'e di.

Prandaj rregulli lexon kështu: **te një termin ekzistues kërkohet vetëm ajo që
e ka pasur tashmë.** Ç'ka është bosh mbetet bosh — por ç'ka është plotësuar
një herë nuk zbrazet dot. Te ata terminet, ylli te fushat bosh as nuk shfaqet.

### E meta që doli bashkë me këtë

Duke provuar rregullin u zbulua diçka më e rëndë: **pas çdo refuzimi,
formulari zbrazej i tëri.** React-i e zbraz vetvetiu një formular sapo veprimi
mbaron — edhe kur ai veprim ktheu gabim. Me një fushë të vetme të detyrueshme
kjo mezi vihej re; me gjashtë do të thoshte se një gabim shtypi te kantoni
fshin edhe emrin, edhe adresën, edhe datën.

Zgjidhja: kur kërkesa refuzohet, serveri i kthen mbrapsht fjalët e shkruara
(`FormState.values`), dhe formulari i vë ato si vlera fillestare. Kështu edhe
zbrazja e React-it i gjen ato aty, dhe puna nuk humbet. Pas një ruajtjeje të
suksesshme formulari zbrazet si më parë, gati për terminin tjetër.

---

## Pjesa 11 — Lista me shumë termine

Deri para pak, lista i merrte **të gjitha** terminet sa herë hapej. Me pak
dhjetëra kjo s'duket. Me 2000 prishet, dhe u mat me 2000 të vërtetë:

| | Më parë | Tani |
|---|---|---|
| Rreshta në faqe | 2000 | 50 |
| Pesha e faqes | 1706 KB | 65 KB |
| Gjatësia | 90 392 px (~100 ekrane) | 2694 px |
| Nyje HTML | 24 198 | 810 |
| Kolona *Shën.* | **0 kudo, gabim** | e saktë |

Gabimi i fundit ishte më i keqi, sepse nuk dukej fare. Shënimet e listës
merreshin me një kërkesë të vetme që i numëronte të gjitha id-të njëherësh.
Me 2000 id, adresa e asaj kërkese arrinte **72 080 shkronja** — serveri e
kthente me `431 Request Header Fields Too Large`. Faqja nuk shfaqte asnjë
gabim; thjesht çdo rresht tregonte `0` shënime, edhe kur kishte tri.

**Zgjidhja.** Lista merr një faqe, 50 rreshta. Shënimet merren vetëm për ato
50. Numrat e përmbledhjes lart nuk dalin më nga rreshtat e ngarkuar, por i
llogarit baza me funksionin `appointments_summary` (te `supabase/faqosja.sql`),
që kthen tre numra në vend të mijëra rreshtave.

**Pse faqe e jo scroll i pafund.** Numri i faqes rri te adresa. Prandaj
lidhja dërgohet e ruhet, dhe kthimi nga një termin të lë aty ku ishe. Scroll-i
i pafund i humb të treja, dhe s'arrin dot kurrë te fundi.

**Siguria e funksionit.** Është `security invoker`, jo `definer` — pra
rregullat e leximit vlejnë njësoj si te çdo kërkesë tjetër. Po ta bënim
`definer`, numri lart do të numëronte edhe termine që përdoruesi s'i sheh
dot te lista poshtë. Kjo është provuar: kur RLS-ja i fsheh rreshtat,
funksioni kthen 0.

**Indekset.** `faqosja.sql` shton indekset e listës dhe një `pg_trgm` për
kërkimin sipas emrit. Të matura me **50 000** termine: faqja e parë 0.06 ms,
faqja e 1000-të 4.3 ms, kërkimi 0.6 ms, përmbledhja 11.6 ms.

Një kurth që u kap vetëm duke e matur: indeksi duhet të përputhet me **radhën
e plotë**, jo vetëm me kolonën e parë. Me indeks mbi `created_at desc` dhe
renditje `created_at desc, nr desc`, baza e lë indeksin dhe skanon gjithçka —
**125 ms** në vend të 0.06 ms. Indeksi tani i mban të dyja kolonat.

I njëjti rregull vlen edhe për filtrin sipas datës, i cili rendit sipas
`scheduled_at, nr` (`supabase/datat.sql`). E provuar te vetë baza: me
`appointments_scheduled_nr_idx` plani është një **Index Scan i vetëm, pa
hap renditjeje** — indeksi i shërben edhe kufirit edhe radhës.

### Filtri sipas datës, dhe një kurth me një ditë të tërë

Një filtër date shkruhet gati gjithmonë me `<=`. Dhe gati gjithmonë është
gabim, sepse njeriu zgjedh një **ditë**, kurse baza mban një **çast**. Me
`scheduled_at <= '5 shtator'`, baza e lexon atë si «5 shtator, ora 00:00» —
pra hyn vetëm mesnata, dhe termini i orës 17:00 të asaj dite mbetet jashtë.
Asnjë gabim nuk shfaqet; lista thjesht del më e shkurtër nga sa duhet, dhe
kjo është pikërisht mënyra si një filtër i tillë rri i prishur me muaj.

Prandaj intervali është **gjysmë i hapur**: `nga 00:00 e ditës së parë` deri
`< 00:00 e ditës PASARDHËSE`. «Deri më 5» i merr edhe terminet e orës 23:59.

Të dyja mesnatat janë të Beogradit, jo të orës botërore — dhe llogariten me
`fromBeogradInput`, që e njeh orën e verës. Nuk është hollësi: në gusht
mesnata e Beogradit është 22:00 e ditës së kaluar sipas orës botërore, në
janar 23:00. Me një largësi të ngurtë, dy herë në vit çdo ditë do të
zhvendosej për një orë — dhe terminet e para ose të fundit të ditës do të
binin te dita e gabuar.

Kjo pjesë është matur në të dyja anët. Te faqja, **32 kontrolle** mbi vetë
llogaritjen, përfshirë të dyja netët kur ndërrohet ora (29 mars dhe 25 tetor
2026) dhe 29 shkurtin e vitit të brishtë. Te baza, mbi të dhënat e vërteta:
25 gushti ka katër termine, nga ora 02:18 deri në 19:31 — dhe filtri «25
gusht – 25 gusht» i kthen **të katërt**. Postgres-i dhe faqja nxjerrin
saktësisht të njëjtin çast për çdo datë të provuar.

> **E ZBATUAR ✅** — `supabase/datat.sql` u ekzekutua më 3 shtator 2026 mbi
> bazën e vërtetë. Funksioni `appointments_summary` mori dy parametra të rinj
> me vlerë të parazgjedhur `null`, prandaj thirrja e vjetër me tre argumente
> vazhdon të punojë — një version i pandërtuar i faqes nuk prishet. Këshilluesi
> i Supabase-it nuk shtoi asnjë paralajmërim të ri.

**Pse edhe përmbledhja.** Numrat lart llogariten nga baza, jo nga rreshtat e
faqes. Po të mos e mësonte edhe ajo intervalin, lista poshtë do të tregonte
terminet e një jave kurse numrat lart do të mbeteshin të gjithë bazës — dy të
vërteta të ndryshme në të njëjtin ekran, që është më keq se asnjë numër fare.

**Një skedë e vetme e ndërton adresën.** Lista ka tani pesë zgjedhje që rrinë
te adresa, dhe secila ndërtohet nga një pjesë tjetër e faqes. Deri para pak
secila e ndërtonte adresën vetë; me tre parametra kjo mbahej, me pesë jo —
mjafton që njëra ta harrojë njërin, dhe filtri i datës humbet sapo ndërron
rezultatin, pa asnjë gabim. Tani adresën e ndërton vetëm `adresaEListes` te
`lib/lista.ts`, dhe të gjitha e thërrasin atë.

**Rregullat e leximit.** `rls-shpejtesi.sql` i rishkruan rregullat e RLS-së
që `auth.uid()` dhe `is_admin()`/`is_manager()` të llogariten **një herë për
kërkesë**, jo një herë për çdo rresht. Kuptimi mbetet fiks i njëjti — të tri
funksionet janë `stable` dhe pa argumente. Meqë këto janë rregulla sigurie,
matrica e lejeve (kush lexon, cakton, ndryshon, fshin — për të tre rolet) u
shënua para ndryshimit dhe u krahasua pas tij: doli identike, rresht për
rresht. E njëjta u ripërsërit edhe te baza e vërtetë, me të shtatë llogaritë,
brenda një transaksioni që u përmbys.

> **Mbetet për t'u bërë:** *Dashboard-i*, *Profili* dhe faqja e *Përdoruesve*
> i lexojnë ende të gjitha terminet për të llogaritur numrat e tyre. Nën 1000
> termine punojnë saktë; mbi atë kufi Supabase i pret rreshtat në heshtje dhe
> numrat dalin më të vegjël se e vërteta. Rregullimi është i njëjti: numrat
> t'i llogarisë baza.

### Tabela pa shirit rrëshqitës

Lista rrinte brenda një `overflow-x-auto`: kur tabela s'hynte, poshtë saj
dilte një shirit që duhej tërhequr me dorë, dhe kolonat e fundit rrinin të
fshehura derisa dikush ta vinte re se ekzistonin.

Heqja e atij shiriti është pjesa e lehtë. E vështira është ta bësh tabelën të
hyjë vërtet — përndryshe scroll-i thjesht ndërron vend, nga tabela te vetë
dritarja. Deshën katër gjëra, dhe asnjëra s'mjafton vetëm:

1. **Asgjë e gjatë e ndaluar të thyhet.** Data («14. September 2026 um 14:00»)
   ishte teksti më i gjatë i tabelës dhe kishte `whitespace-nowrap`. Vetëm ajo
   e nxirrte tabelën jashtë. Tani rri në dy rreshta — data sipër, ora poshtë —
   dhe me muajin shkurt: «14. Sept. 2026».
2. **Emaili nën emër thyhet kudo** (`break-all`). Më parë kishte `truncate`,
   që në një tabelë me gjerësi automatike **nuk pret asgjë**: `truncate` do
   një gjerësi të caktuar për të prerë, dhe pa të vetëm ndalon thyerjen — pra
   e zgjeronte kolonën në vend që ta ngushtonte.
3. **Kolonat vijnë kur ka vërtet vend.** Kufijtë e Tailwind-it maten sipas
   dritares, kurse tabela e ka menynë anash që i merr **224px** — dhe menyja
   shfaqet pikërisht te 640px, në të njëjtin çast kur hapeshin kolona të reja
   `sm:`. Pra hapësira binte nga 597px në 374px dhe kërkesa rritej bashkë me
   të. Tani secila kolonë vjen një shkallë më vonë.
4. **Hapësira anësore zvogëlohet te ekranet e vogla**, dhe teksti bëhet
   `text-xs` nën 768px.

Shiriti i zgjedhjes me shumicë nis nga 768px e lart: kolona e kutizave zë 38px
nga 374px që ka te 640px, dhe pikërisht ajo e nxirrte tabelën jashtë. Kur
kutiza fshihet, shenja me ngjyrë majtas kalon te kolona e numrit — përndryshe
rreshti do të mbetej pa të pikërisht te ekrani i vogël, ku dallimi duhet më
shumë.

**E njëjta gjë te faqja *Përdoruesit*.** Aty ishte edhe më keq: shtatë kolona
me `p-4` zinin **224px** vetëm hapësirë të brendshme, emaili kishte
`whitespace-nowrap` (249px vetëm ai), data ishte e plotë («11. September
2026», 162px) dhe dy butonat rrinin patjetër njëri pas tjetrit. Tabela
kërkonte **1023px** kur dritarja i jep më së shumti 982 — pra rrëshqiste
gjithmonë, edhe te ekrani më i gjerë. Tani hapësira zvogëlohet, emaili dhe
data thyhen, butonat rrinë njëri mbi tjetrin kur s'ka vend, dhe kolonat
dytësore (*Termine*, *Shënime* nga 768px; *Aktiv sot*, *Regjistruar* nga
1024px) vijnë vetëm kur ka hapësirë. Emaili, roli dhe të dy butonat nuk
humbin kurrë — pa to faqja s'ka kuptim.

**Matur, jo parë me sy.** Një `overflow-x-auto` e fsheh problemin: pamja duket
në rregull dhe tabela është e prerë. Prandaj prova mat `scrollWidth` kundrejt
`clientWidth` te **dhjetë gjerësi** (360 … 1920px), në të dyja gjuhët, me
përmbajtje qëllimisht të gjatë — një emër prej 35 shkronjash, një sigurim
«Krankenkasse Luzerner Hinterland», një email i gjatë. Gjermanishtja është
prova e vërtetë: «Termindatum» dhe «Versicherung» janë dukshëm më të gjata se
shqipja, dhe tri herë tabela doli jashtë vetëm në gjermanisht — një herë me
**3px**. Kontrollohet edhe se vetë faqja nuk rrëshqet anash, dhe se
`overflow-x` nuk është kthyer fshehurazi në `auto`.

> **Mbetet për t'u bërë:** faqja *Aktiviteti* rrëshqet ende anash nën 1280px
> (33px te 1024, 472px te 360), dhe *Dashboard-i* nën 768px (rreth 125px).
> Te terminet e hapur, tabela e shënimeve hyn e tëra kudo. Rregullimi është i
> njëjti si këtu.

### Kolona «Eksperti» te lista

Kush e ka terminin dukej vetëm duke e hapur atë, te skeda *Ekspertët*. Me
dyzet termine te një faqe, kjo do të thoshte dyzet hapje për të parë se cili
rresht ishte dhënë e cili jo. Tani duket te vetë lista.

**Vetëm menaxheri dhe admini e shohin kolonën**, dhe kjo nuk është zgjedhje
pamjeje — e detyron rregulli i bazës. `appointment_experts_select` e lejon
ekspertin të lexojë VETËM rreshtat ku emri i tij gjendet, dhe përdoruesin e
thjeshtë asnjë. Pra:

| Roli | Ç'do të tregonte kolona | Prandaj |
| --- | --- | --- |
| Menaxher / admin | të gjithë ekspertët e secilit termin | **tregohet** |
| Ekspert | vetëm veten, te çdo rresht — pa ata që e ndajnë terminin me të | fshihet |
| Përdorues | «—» te çdo rresht, edhe kur termini i tij ËSHTË dhënë | fshihet |

Një kolonë që tregon gjysmën e së vërtetës është më keq se asnjë kolonë: te
useri do të thoshte «askush s'e ka marrë» për një termin që dikush e ka.

**Kërkesa merr vetëm terminet e kësaj faqeje**, si ajo e shënimeve. Me të
gjitha id-të, adresa e kërkesës del shumë e gjatë dhe serveri e kthen me 431
— pa gabim të dukshëm, thjesht çdo rresht do të dukej i padhënë.

**Emrat merren nga lista e plotë e profileve, edhe e atyre pa hyrje.** Një
termin i dhënë dikujt që më pas i është hequr hyrja duhet ta tregojë ende atë
emër — ndryshe rreshti do të dukej i lirë, kurse në të vërtetë rri te dikush
që s'e hap dot. Radha është alfabetike: pa të, baza mund t'i kthejë ndryshe
sa herë, dhe i njëjti rresht do të ndërronte pamje pa ndryshuar asgjë.

#### Pse pret deri te 1280px

Kolona e tetë nuk hyri falas. E matur, doli kështu:

| Gjerësia | Çfarë ndodhi |
| --- | --- |
| 1024px, gjermanisht | tabela doli **16px** jashtë — shirit rrëshqitës |
| 1024px, pas ngushtimit të mbushjes | hynte, por emailet copëtoheshin në **gjashtë** rreshta dhe rreshti trefishohej |
| 1280px e sipër | hyn e tëra, emaili në një ose dy rreshta |

Prandaj kolona vjen te **1280px**, një shkallë më lart se *Sigurimi* dhe
*Shënimet*. Poshtë saj nuk shfaqet fare, dhe gjithçka tjetër mbetet
saktësisht si ishte — mbushja e kolonave të numrave ngushtohet vetëm te
1280px e sipër, aty ku kolona e re ka nevojë për vend.

**Shenja e rezultatit.** Kolona e re ia hoqi *Rezultatit* 35px, dhe «Në
bisedim» u thye në dy rreshta — diçka që matja e gjerësisë nuk e kap, sepse
tabela vazhdon të hyjë. Zgjidhja është `xl:whitespace-nowrap` te shenja:
kolona kërkon gjerësinë që i duhet, dhe ajo e ekspertit e lëshon, sepse
emailet aty thyhen kudo (`break-all`) dhe kanë nga ku të ngushtohen. Numri i
rreshtave të tekstit matet me `Range.getClientRects()`, jo me lartësinë
pjesëtuar me `line-height` — mbushja e shenjës e prish atë llogari.

**Matur te 16 gjerësi × 2 gjuhë = 32 matje, asnjëra jashtë.**

---

## Pjesa 12 — Kopja e të dhënave

> **Kjo është pjesa që të shpëton kur diçka shkon keq.** Kodi rishkruhet;
> terminet e një viti jo.

### Butoni: `/admin/kopja`

Vetëm admini. Jep dy gjëra:

- **Kopja e plotë (JSON)** — një skedë me të pesë tabelat: llogaritë, terminet,
  feedback-un, aksesin e ekspertëve dhe orët e punës. Prej saj të dhënat
  kthehen të plota. Kjo është ajo që ruhet.
- **Tabelat veç (CSV)** — për t'i hapur me Excel, për t'i parë e llogaritur.
  Jo për kthim mbrapsht.

Faqja tregon **sa rreshta ka secila tabelë para se të shkarkosh**. Kjo nuk
është zbukurim: nëse skeda e shkarkuar ka më pak, diçka ka shkuar keq — dhe pa
ata numra askush s'do ta vinte re pa hapur skedën.

### Kurthi që e bën një kopje të gënjejë

PostgREST-i i Supabase-it i pret rreshtat te një kufi i vetin (`max-rows`,
zakonisht **1000**) DHE NUK JEP ASNJË GABIM. Një kërkesë e thjeshtë
`select("*")` mbi 5000 termine kthen 1000, me statusin 200, dhe skeda del e
plotë në dukje. E ke kopjen; thjesht i mungojnë katër të pestat.

Prandaj kopja lexohet **faqe pas faqeje**, dhe numri i rreshtave të marrë
krahasohet me numrin e vërtetë te baza. Nëse s'përputhen, kopja **nuk jepet
fare** — më mirë asnjë kopje sesa një kopje që gënjen.

Kjo provohet, nuk supozohet: te provat mbushen 1200 termine dhe verifikohet se
skeda i ka të 1200-tët, jo 1000. Edhe serveri i provës u bë ta presë te 1000
si Supabase — përndryshe prova s'do të provonte asgjë.

### I njëjti kurth ishte edhe te tri faqe

Sapo serveri i provës nisi t'i priste rreshtat si Supabase, doli se tri faqe
numëronin mbi atë që merrnin — pra mbi 1000 termine do të tregonin numra
**thjesht të gabuar**, më të vegjël se e vërteta, pa asnjë shenjë:

| Faqja | Përpara | Tani |
| --- | --- | --- |
| **Përdoruesit** | tërhiqte TË GJITHA terminet dhe TË GJITHA shënimet për tetë numra | i numëron baza, një rresht për person (`supabase/numrat.sql`) |
| **Profili** | merrte terminet e mia me një kërkesë | faqe pas faqeje (`lib/faqet.ts`) |
| **Dashboard** | merrte terminet e muajit me një kërkesë, plus TË GJITHA shënimet | terminet faqe pas faqeje; shënimet i numëron baza me `head: true` |

`head: true` do të thotë: kthe vetëm numrin, asnjë rresht. Dashboard-i tregon
sa shënime ka gjithsej dhe sa janë të miat; për ata dy numra lexonte më parë
çdo shënim të çdo termini, sa herë hapej faqja.

Nëse `supabase/numrat.sql` nuk është ekzekutuar ende, faqja «Përdoruesit»
shfaq një njoftim të verdhë. Pa të, mungesa e funksionit do të dukej si
«të gjithë kanë zero» — pikërisht numri i gabuar që u desh të hiqej.

> **E ZBATUAR ✅** — `supabase/numrat.sql` u ekzekutua më 30 gusht 2026 mbi
> bazën e vërtetë. U verifikua aty se funksioni i respekton rregullat e
> leximit: admini dhe menaxheri shohin numrat e të gjithëve (18 termine, 22
> shënime gjithsej), eksperti vetëm ata që i takojnë terminet e caktuara, dhe
> përdoruesi i thjeshtë vetëm të vetët. Këshilluesi i Supabase-it nuk shtoi
> asnjë paralajmërim të ri.

### Detaje të vogla që kushtojnë kur mungojnë

- **CSV-ja nis me shenjën UTF-8** (BOM). Pa këto tre bajte, Excel-i te
  Windows-i i lexon shkronjat me kodimin e vet: «Zürich» → «ZÃ¼rich».
- **Vlerat mbështillen me thonjëza dhe thonjëzat brenda dyfishohen.** Te
  terminet ka adresa me presje dhe shënime me rreshta të rinj; pa këtë një
  shënim i vetëm i zhvendos tërë kolonat.
- **Adresa e shkarkimit e kontrollon vetë rolin.** Kush s'është admin merr
  404, jo «nuk ke leje» — as vetë ekzistenca e saj nuk tregohet.

### Kjo NUK mjafton vetëm

Butoni është kopja që bën njeriu. Mbrojtja e plotë ka tri shtresa:

| Shtresa | Kundër çfarë | Ku qëndron |
| --- | --- | --- |
| Kopja e Supabase-it | fshirje aksidentale, prishje e bazës | te Supabase, sipas planit |
| Kopja e shkarkuar | humbje e vetë projektit Supabase | te disku yt |
| Vendi i dytë | djegie, vjedhje, disk i prishur | disk i jashtëm ose dosje në internet |

**Plani i Supabase-it ka rëndësi.** Te plani falas **nuk ka kopje automatike**:
nëse projekti fshihet ose prishet, s'ka ku të kthehesh. Kontrollohet te
Supabase → **Database → Backups**. Nëse aty s'ka asgjë, e vetmja mbrojtje është
skeda që shkarkon vetë.

**Kurrë te një depo publike.** Skeda përmban emra, numra telefoni, adresa dhe
të dhëna shëndetësore (mjekime, trajtime). Depoja `Helvetic-Crm` te GitHub-i është
**publike**; një kopje e futur atje do të ishte e lexueshme nga kushdo në
botë. Kodi nuk përmban çelësa — ata rrinë te `.env.local`, i cili nuk dërgohet
kurrë — por të dhënat janë punë tjetër.

### Pastrimi i të dhënave të provës — 3 shtator 2026

Baza mbante 21 termine prove, të krijuara duke e ndërtuar aplikacionin: emra
si «adwdawd», «TEST-01», «dilill». Nga 3 shtatori puna nis me të dhëna të
vërteta, prandaj ato u hoqën: **21 termine, 24 shënime, 4 akses ekspertësh**.
Llogaritë, rolet dhe orët e punës nuk u prekën.

**Kopja u bë brenda vetë bazës**, te skema `arkiv` — jo si skedë diku tjetër.
Kështu asnjë rresht nuk kalon nëpër duar dhe nuk ka si të humbasë ndonjë
shkronjë gjatë kopjimit, dhe rikthimi është një `insert ... select` i vetëm.
Skema nuk është nder ato që Supabase i nxjerr te API-ja, dhe `usage` mbi të u
hoq shprehimisht nga `anon` e `authenticated` — pra edhe sikur të hapej një
ditë pa dashje, një token i zakonshëm nuk lexon dot asgjë prej saj (e matur:
`has_schema_privilege` kthen `false` për të dyja).

Kopja u krahasua me origjinalin jo vetëm me numrin e rreshtave, por edhe me
përmbajtjen — `except` në të dy drejtimet. Të tria tabelat dolën identike
rresht për rresht.

Numri i shkurtër u kthye te **#1000**: tabela mbeti bosh, prandaj s'ka si të
përplaset. Termini i parë i vërtetë është sërish #1000, jo #1077.

> **Një kurth që u kap vetëm duke e matur.** Fshirjen e shkrova në fillim
> brenda `begin; … ` pa `commit;`. Përgjigjja tregoi «u fshinë 21 termine» —
> dhe asgjë nuk ishte fshirë: transaksioni u kthye mbrapsht kur lidhja u
> lirua. Vetëm numërimi pas fshirjes e tregoi. Prandaj çdo veprim mbi bazën
> matet **pas** tij, jo nga ajo që kthen vetë veprimi.

Të gjitha hapat, bashkë me udhëzimin e rikthimit, rrinë te
`supabase/pastrimi.sql`. Kopja mbahet derisa të kalojë ca kohë me të dhënat e
reja; hiqet me `drop schema arkiv cascade`, dhe kjo është e pakthyeshme.

---

## Pjesa 13 — Hyrja e hequr vlen menjëherë

Kur admini i hiqte hyrjen dikujt, ai person vazhdonte të punonte — hapte faqe,
caktonte termine, shkruante shënime. **Deri në një orë.**

Shkaku nuk ishte te fshirja: ajo punonte. Ishte te çelësi. Kur dikush kyçet,
shfletuesi i tij merr një çelës të nënshkruar (JWT) që vlen rreth një orë, dhe
**fshirja e llogarisë nuk e prish atë çelës**. Deri sa t'i mbaronte koha,
`auth.uid()` kthente ende id-në e tij — dhe asnjë rregull i bazës nuk e
pyeste nëse llogaria ishte ende e gjallë. Ato pyesnin vetëm për rolin.

Prandaj shenja `active` te `profiles`, e cila deri tani vinte vetëm një
etiketë te lista e llogarive, u bë kusht i vërtetë, në dy shtresa:

### Llogaritë e hequra nuk rrinë më te lista

Deri para pak, rreshti i një llogarie të hequr mbetej te faqja *Përdoruesit*,
i shënuar «pa hyrje», që emri i saj të mos zhdukej. Ideja ishte e drejtë, por
në praktikë lista mbushej: sa herë hapet sërish një llogari me të njëjtin
email, rreshti i vjetër mbetet përkrah të riut. Me 19 llogari, **7 ishin pa
hyrje** — dhe me to nuk bëhet gjë: nuk kanë as fjalëkalim për të ndërruar, as
hyrje për t'u hequr. Tani lista tregon vetëm ato që hyjnë.

**Çfarë NUK ndryshoi, dhe kjo është gjëja që duhet provuar:** të dhënat
mbeten. Rreshti te `profiles` nuk fshihet, vetëm shënohet `active = false`;
terminet, shënimet dhe orët e tij vazhdojnë të mbajnë emailin e tij te lista;
dhe kopja e të dhënave (Pjesa 12) i merr të gjitha llogaritë, përfshirë këto.
Ikën vetëm rreshti nga një faqe, jo asnjë e dhënë.

**Edhe menyja e ekspertëve u pastrua bashkë me të.** Një ekspert pa hyrje nuk
ofrohet më as te shiriti i zgjedhjes, as te paneli brenda terminit — t'i japësh
një termin dikujt që s'hyn dot do të thotë ta lësh atë termin pa u parë nga
askush, dhe pa asnjë shenjë se ashtu ndodhi. Kufiri rri në dy shtresa: menyja
nuk i tregon, dhe `grantExpert`/`grantExpertBulk` e refuzojnë edhe nëse
kërkesa vjen pa kaluar nga faqja jonë.

### Llogari e fshehur nga lista

Një llogari mund të duhet të punojë normalisht, por të mos duket te faqja
*Përdoruesit* — as për adminët e tjerë. Për këtë ka kolonën `hidden`
(`supabase/llogari-e-fshehur.sql`).

Fshehja prek **vetëm atë listë**. Llogaria hyn si gjithmonë, e mban rolin e
vet, puna e saj numërohet te dashboard-i, dhe emaili i saj vazhdon të dalë te
terminet si autor. Nuk është heqje aksesi me emër tjetër — dhe prova e mat
pikërisht këtë, jo vetëm zhdukjen e rreshtit.

Pse një kolonë e re dhe jo «secili admin s'e sheh veten»: ashtu admini tjetër
do ta shihte prapë. Dhe pse jo një email i shkruar brenda kodit: do të mbetej
aty përgjithmonë, i dukshëm te depoja publike, dhe do të duhej një version i
ri i aplikacionit sa herë ndryshon mendja.

Vihet dhe hiqet **si roli**: te paneli i Supabase-it, **Table Editor →
profiles → hidden** (`true` e fsheh, `false` e kthen). Aplikacioni vetëm e
lexon: `profiles` ka një rregull të vetëm leximi dhe asnjë rregull ndryshimi,
prandaj as admini nuk e prek dot këtë kolonë nga faqja.

> **KUJDES.** Një admin i fshehur nuk mbikëqyret dot më nga adminët e tjerë —
> ata as nuk e dinë se ekziston. Përdore rrallë.

> **E ZBATUAR ✅** — kolona u shtua më 16 shtator 2026, dhe
> `dren.bytyqi19@gmail.com` u shënua e fshehur. Mbetet admin: hyn, e hap
> faqen e përdoruesve dhe i sheh faqet vetëm-për-admin. Lista e përdoruesve
> tregon tani 5 rreshta në vend të 6.

### Llogaria «fantazmë»: fshirë te Auth-i, por ende «hyn ende» te profili

Aplikacioni e di se kush hyn nga shenja `profiles.active`. Atë shenjë e vë
butoni *Hiqi hyrjen*: fshin llogarinë te `auth.users`, pastaj shënon
`active = false`.

Por llogaria mund të fshihet edhe **nga jashtë** — me dorë, te Table Editor-i
i Supabase-it. Atëherë `auth.users` mbetet pa të, kurse `profiles` vazhdon të
thotë `active = true`. Del një llogari **fantazmë**:

- duket te lista sikur hyn ende;
- nuk hyn dot, sepse s'ka llogari;
- dhe **nuk hiqet dot** nga aplikacioni, sepse butoni provon të fshijë një
  llogari që s'ekziston dhe kthen `User not found`.

Pra rreshti mbetej aty përgjithmonë. Te baza e vërtetë ishin **gjashtë** të
tillë — nga 19 profile, vetëm 6 kishin llogari te Auth-i.

**Dy mbrojtje, dhe secila mjafton më vete:**

1. **Trigger-i `on_auth_user_deleted`** (`supabase/llogaria-e-fshire.sql`).
   Simetrik me `on_auth_user_created`, që ekzistonte tashmë: njëri e krijon
   profilin kur lind llogaria, tjetri e shënon kur ajo fshihet. Kështu s'ka
   rëndësi nga vjen fshirja — nga butoni ynë apo nga paneli — dy tabelat
   mbeten në përputhje vetë, dhe fantazma as nuk lind më.
2. **«Nuk u gjet» nuk është dështim** (`app/admin/actions.ts`). Nëse llogaria
   te Auth-i ka ikur tashmë, ajo që duam ka ndodhur: personi nuk hyn dot.
   Prandaj vazhdohet me shënimin e profilit në vend që të kthehet gabim. Kjo
   e bën veprimin të përsëritshëm pa dëm — dy klikime radhazi japin të njëjtin
   përfundim — dhe i heq edhe fantazmat e vjetra, të krijuara para trigger-it.

Gabimi njihet nga kodi (`user_not_found`), statusi (404) **ose** teksti. Vetëm
teksti nuk mjafton: ndryshon me gjuhën dhe me versionin e Supabase-it.

**Profili nuk fshihet, vetëm shënohet.** Ai mban emrin e autorit: terminet,
shënimet dhe orët e punës vazhdojnë të tregojnë se kush i bëri.

**Një hollësi që e kapi këshilluesi i Supabase-it.** Postgres-i i jep çdo
funksioni të ri `execute` te `public` — pra edhe te `anon`. Kështu
`handle_deleted_user` doli si `/rest/v1/rpc/...`, i thirrshëm pa u kyçur
fare, ndërsa `handle_new_user` nuk ishte. Grantet u hoqën që të dy të jenë
njësoj. Trigger-i vazhdon të punojë — `security definer` e xhiron me të
drejtat e pronarit, jo të atij që e nxit.

> **E ZBATUAR ✅** — `supabase/llogaria-e-fshire.sql` u ekzekutua më 13 shtator
> 2026 mbi bazën e vërtetë, pas një kopjeje të plotë të `profiles` te skema
> `arkiv`. Gjashtë fantazmat u shënuan; mbetën **zero**. Lista ra nga 19
> rreshta në 6 — pikërisht gjashtë llogaritë që kanë ende hyrje. Prova e
> rikrijon gabimin: me rregullimin e hequr, ajo kthen fjalë për fjalë
> «Hyrja nuk u hoq: User not found».

**Te faqja** (`lib/auth.ts`). Roli lexohet te çdo kërkesë; tani lexohet edhe
`active`. Nëse është `false`, personi trajtohet si i pakyçur dhe dërgohet të
dalë. Kjo e nxjerr jashtë me klikimin e parë.

**Te baza** (`supabase/hyrja-e-hequr.sql`). Funksionet `is_admin()`,
`is_manager()` dhe `is_expert()` tani kërkojnë edhe `active` — një menaxher pa
hyrje nuk është më menaxher. Dhe çdo rregull tjetër nis me `eshte_aktiv()`.
Kjo shtresë mbron nga një kërkesë e dërguar drejt te baza, jashtë faqes sonë,
me çelësin që i ka mbetur në dorë. E njëjta shenjë ndalon edhe orën e punës:
`record_activity()` nuk numëron më.

### Dy gjëra që dolën duke e ndërtuar

**Rregulli i ri ia fshihte njeriut vetë profilin.** Nëse `profiles` kërkonte
`eshte_aktiv()`, atëherë një llogari e hequr nuk e lexonte dot as rreshtin e
vet — dhe faqja nuk e mësonte dot se hyrja i ishte hequr, sepse `active`
rri pikërisht aty. Përfundimi ishte se personi mbetej brenda, i trajtuar si
përdorues i zakonshëm. Prandaj rregulli ka një degë të dytë: **secili e sheh
gjithmonë rreshtin e vet**, edhe pa hyrje. Nuk rrjedh asgjë — sheh vetëm
veten, dhe asnjë veprim tjetër nuk i hapet.

> **E ZBATUAR ✅** — `supabase/hyrja-e-hequr.sql` u ekzekutua më 3 shtator 2026
> mbi bazën e vërtetë, dhe u mat aty me llogaritë reale. Nga 10 llogari, 5
> ishin pa hyrje: pas skedës secila prej tyre sheh **0 termine, 0 shënime dhe
> vetëm rreshtin e vet**, dhe nuk cakton e nuk shkruan dot asgjë — përfshirë
> një llogari me rolin `admin` së cilës i ishte hequr hyrja. Të pesë llogaritë
> me hyrje nuk u prekën fare.
>
> Këshilluesi i Supabase-it shtoi një paralajmërim të vetëm: `eshte_aktiv()`
> i bashkohet katër funksioneve të tjera që janë `security definer`. Kjo është
> e qëllimshme — funksioni duhet ta lexojë profilin edhe kur vetë rregullat e
> profileve nuk do ta lejonin — dhe nuk rrjedh asgjë: kthen vetëm nëse ai që
> pyet e ka hyrjen, gjë që ai e merr vesh gjithsesi duke provuar të hyjë.

**Ridrejtimi te `/login` do të bëhej unazë.** Proxy-ja e sheh çelësin ende të
mirë, e quan njeriun të kyçur, dhe e kthen nga `/login` te «/». Prandaj u
shtua `/auth/dil`: aty sesioni fshihet vërtet, dhe pastaj s'ka më ku të
kthehet. Ridrejtimi është me adresë **relative** — `new URL(..., request.url)`
e ndërton adresën nga hosti që sheh serveri brenda, dhe ai jo gjithmonë është
ai që ka shkruar njeriu; te prova doli «localhost» ndërsa shfletuesi ishte te
«127.0.0.1», dhe bashkë me hostin humbte edhe cookie-ja e gjuhës.

---

## Pjesa 14 — Dy gjuhët

Çdo tekst që sheh njeriu rri te `lib/i18n.ts`, jo nëpër faqe. Aty janë dy
fjalorë: `de` (gjermanisht) dhe `sq` (shqip).

**Si punon.** Gjuha ruhet te një cookie e quajtur `gjuha`. Serveri e lexon me
`getI18n()` te `lib/i18n-server.ts` dhe ia jep faqes fjalorin e duhur. Nëse
askush s'ka zgjedhur ende, hyn gjermanishtja.

**Pse kështu dhe jo `/de/...` e `/sq/...`.** Ashtu do të dyfishoheshin të gjitha
adresat, dhe çdo lidhje do të duhej të mbante gjuhën me vete. Me cookie, adresa
mbetet një e vetme.

**Përkthimi nuk harrohet dot.** Tipi `Dict` merr formën e gjermanishtes. Nëse
shtohet një çelës i ri atje dhe shqipja mbetet pa të, `npx tsc --noEmit` ndalet
me gabim — pra mungesa kapet para se të dalë në ekran, jo nga përdoruesi.

**Njëjës dhe shumës.** Numrat kalojnë nga ndihmësi `sasi()`, që zgjedh formën:
*1 Termin* / *2 Termine*, *1 termin* / *2 termine*. Pa të do të dilte
«1 Termine».

**Datat.** Secila gjuhë ka formatin e vet (`de-DE`, `sq-AL`), por zona mbetet
gjithmonë ajo e Beogradit — gjuha ndryshon fjalët e muajve, jo orën.

**Kujdes te komponentët e shfletuesit.** Fjalori përmban funksione, dhe
funksionet nuk kalojnë dot nga serveri te shfletuesi. Prandaj komponentëve
`"use client"` u jepet vetëm kodi i gjuhës (`lang`), dhe ata e marrin fjalorin
vetë me `DICTS[lang]`.

---

## Pjesa 15 — Kur diçka nuk shkon

| Problemi | Zgjidhja |
| --- | --- |
| Faqja tregon kutinë e verdhë "nuk është konfiguruar" | `.env.local` mungon. Përsërit Hapin 6 dhe rinis serverin. |
| "Email ose fjalëkalim i gabuar" | Llogaria s'është krijuar ende ose emaili s'është konfirmuar. Shih Hapin 8. |
| S'të shfaqet shenja "Admin" | SQL-i i `supabase/admin.sql` s'është ekzekutuar, ose rreshti `update ... set role = 'admin'` ka email tjetër. Shih Hapin 9. |
| Regjistrohesh po s'të vjen emaili | Përdor rrugën B të Hapit 8 (krijo përdoruesin nga paneli me *Auto Confirm*). |
| `relation "appointments" does not exist` | Je lidhur me një projekt tjetër. Kontrollo `NEXT_PUBLIC_SUPABASE_URL` te `.env.local`. |
| `Invalid API key` | Vlerat te `.env.local` u ndryshuan. Kopjoje sërish nga `.env.local.example`. |
| `command not found: npm` | Node.js nuk është instaluar. Përsërit Hapin 1. |
| Porta 3000 është e zënë | Nise me `npm run dev -- -p 3001`. |
| Ndryshimet nuk duken | Rifresko faqen; nëse s'mjafton, ndal serverin (Ctrl+C) dhe nise sërish. |

## Komandat kryesore

```bash
npm run dev     # nis serverin për zhvillim (localhost:3000)
npm run build   # ndërton versionin për publikim
npm start       # nis versionin e ndërtuar
npm run lint    # kontrollon stilin e kodit
```
