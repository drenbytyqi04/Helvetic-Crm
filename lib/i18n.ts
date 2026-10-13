/**
 * Dy gjuhët e CRM-së: gjermanisht (e parazgjedhur) dhe shqip.
 *
 * Çdo tekst që sheh njeriu rri këtu, jo në kod. Kështu përkthimi bëhet në
 * një vend të vetëm, dhe asnjë fjalë nuk mbetet e harruar në ndonjë faqe.
 *
 * `Dict` merr formën e gjermanishtes, prandaj TypeScript-i ankohet nëse
 * shqipes i mungon ndonjë çelës — mungesat kapen para se të dalin në ekran.
 */

export const LANGS = [
  { code: "de", label: "Deutsch" },
  { code: "sq", label: "Shqip" },
] as const;

export type Lang = (typeof LANGS)[number]["code"];

/** Gjuha kur nuk ka zgjedhur askush. */
export const LANG_PARAZGJEDHUR: Lang = "de";

/** Emri i cookie-t ku ruhet zgjedhja. */
export const LANG_COOKIE = "gjuha";

export function eshteLang(v: string | undefined): v is Lang {
  return v === "de" || v === "sq";
}

/** Formati i datave për secilën gjuhë. Zona mbetet gjithmonë Beogradi. */
export const LOCALE: Record<Lang, string> = {
  de: "de-DE",
  sq: "sq-AL",
};

/**
 * Numri bashkë me emrin, në njëjës ose shumës.
 *
 * Pa këtë del «1 Termine» ose «1 shënime» — numri thotë një, fjala thotë
 * shumë. Të dyja gjuhët e bëjnë njësoj: një formë për 1, një për të tjerat.
 */
function sasi(n: number, njejes: string, shumes: string): string {
  return `${n} ${n === 1 ? njejes : shumes}`;
}

const de = {
  // ---------- E përbashkët ----------
  appName: "Helvetic",
  appTagline: "Termine",
  save: "Speichern",
  cancel: "Abbrechen",
  delete: "Löschen",
  yes: "Ja",
  no: "Nein",
  saving: "Wird gespeichert…",
  deleting: "Wird gelöscht…",
  noValue: "—",
  language: "Sprache",

  // ---------- Menyja anash ----------
  navDashboard: "Dashboard",
  navAppointments: "Termine",
  navProfile: "Profil",
  navUsers: "Benutzer",
  navActivity: "Aktivität",
  navBackup: "Datensicherung",

  signOut: "Abmelden",
  // ---------- Datensicherung ----------
  backupTitle: "Datensicherung",
  backupIntro:
    "Eine vollständige Kopie aller Daten — zum Herunterladen und Aufbewahren, unabhängig von Supabase und von dieser App.",
  backupFullTitle: "Vollständige Kopie",
  backupFullHint:
    "Eine einzige Datei mit allem. Aus ihr lassen sich die Daten vollständig wiederherstellen. Bewahren Sie sie dort auf, wo Sie auch Ihre Verträge aufbewahren.",
  backupTotal: "Zeilen insgesamt",
  backupDownloadFull: "Vollständige Kopie herunterladen (JSON)",
  backupToday: (data: string) => `Stand: ${data}`,
  backupCsvTitle: "Einzelne Tabellen für Excel",
  backupCsvHint:
    "Zum Ansehen und Auswerten. Zum Wiederherstellen ist die vollständige Kopie oben gedacht.",
  backupWhereTitle: "Wo aufbewahren, und wie oft",
  backupWhere1:
    "Nicht nur auf dem Rechner, auf dem Sie arbeiten: eine Kopie gehört an einen zweiten Ort (externe Festplatte, Cloud-Ordner).",
  backupWhere2:
    "Die Datei enthält Namen, Telefonnummern, Adressen und Gesundheitsangaben. Sie gehört nicht in einen öffentlichen Ordner und nicht in ein öffentliches Repository.",
  backupWhere3:
    "Einmal pro Woche genügt bei diesem Umfang; nach einem arbeitsreichen Tag lieber gleich.",
  bkTblProfiles: "Konten",
  bkTblAppointments: "Termine",
  bkTblNotes: "Feedback",
  bkTblExperts: "Experten-Zugriffe",
  bkTblActivity: "Arbeitszeiten",

  // ---------- Hyrja ----------
  loginHeading: "Anmelden",
  loginAccessRemoved:
    "Ihr Zugang wurde entzogen. Wenden Sie sich an den Administrator.",
  loginTitle: "Melden Sie sich mit Ihrem Konto an.",
  loginEmail: "E-Mail",
  loginPassword: "Passwort",
  loginButton: "Anmelden",
  loginWaiting: "Bitte warten…",
  loginPasswordHint: "mindestens 6 Zeichen",
  loginNoSignup:
    "Keine freie Registrierung. Ihr Konto wird vom Administrator angelegt.",
  loginBadCredentials: "E-Mail oder Passwort ist falsch.",
  loginNotConfirmed:
    "Die E-Mail wurde noch nicht bestätigt. Bitte prüfen Sie Ihr Postfach.",
  loginFillBoth: "Bitte E-Mail und Passwort ausfüllen.",

  // ---------- Rolet ----------
  roleUser: "Benutzer",
  roleManager: "Manager",
  roleAdmin: "Admin",
  roleExpert: "Experte",

  // ---------- Gjinia ----------
  genderF: "Weiblich",
  genderM: "Männlich",

  // ---------- Tri kategoritë ----------
  catSuccess: "Erfolgreich",
  catTalking: "In Gespräch",
  catFailed: "Gescheitert",

  // ---------- Arsyet, brenda kategorive ----------
  statusContractSigned: "Vertrag abgeschlossen",
  statusOpen: "Termin steht noch aus",
  statusHeldThinking: "Stattgefunden — überlegt noch",
  statusNotReached: "Nicht erreicht",
  statusNotHome: "Nicht angetroffen",
  statusAddressNotFound: "Adresse nicht gefunden",
  statusCancelled: "Storniert",
  statusRefused: "Kein Termin gewünscht",
  statusNegative: "Negativ",
  statusAdvisorFailed: "Keine Beratung möglich",

  // ---------- Lista e termineve ----------
  listTitle: "Termine",
  listSummary: (n: number, held: number, contracts: number) =>
    `${sasi(n, "Termin", "Termine")} · ${held} erfolgreich · ${sasi(
      contracts,
      "Vertrag",
      "Verträge"
    )}`,
  /** Kur numrat e plotë s'merren dot (funksioni i bazës mungon ende). */
  listSummaryShort: (n: number) => sasi(n, "Termin", "Termine"),
  listAll: "Alle",
  listMine: "Meine",
  listNewAppointment: "Neuen Termin anlegen",
  listEmpty: "Keine Termine vorhanden.",
  listLoadError: "Termine konnten nicht geladen werden",
  activeToday: "Heute aktiv",
  activeTodayTitle: "Heute im CRM verbrachte Zeit",
  colNr: "Nr",
  colName: "Name",
  colDate: "Termindatum",
  colInsurance: "Versicherung",
  colPersons: "Pers.",
  colContracts: "Vertr.",
  colNotes: "Notiz.",
  colExpert: "Experte",
  noExpert: "—",
  colStatus: "Ergebnis",
  filterStatus: "Ergebnis",
  filterAll: "Alle",

  // ---------- Filter nach Termindatum ----------
  filterDate: "Termindatum",
  filterDateFrom: "Von",
  filterDateTo: "Bis",
  filterDateToday: "Heute",
  filterDateWeek: "Diese Woche",
  filterDateMonth: "Dieser Monat",
  filterDateClear: "Zeitraum zurücksetzen",
  dateNoResult: "Keine Termine in diesem Zeitraum.",

  // ---------- Kërkimi dhe faqet ----------
  searchLabel: "Suche",
  searchPlaceholder: "Name oder Nr.",
  searchButton: "Suchen",
  searchClear: "Zurücksetzen",
  searchNoResult: (q: string) => `Kein Termin gefunden für «${q}».`,
  searchFound: (n: number, q: string) =>
    `${sasi(n, "Treffer", "Treffer")} für «${q}»`,
  pagePrev: "Zurück",
  pageNext: "Weiter",
  pageOf: (faqja: number, gjithsej: number) =>
    `Seite ${faqja} von ${gjithsej}`,
  pageRange: (nga: number, deri: number, gjithsej: number) =>
    `${nga}–${deri} von ${gjithsej}`,

  // ---------- Faqja e terminit ----------
  backToList: "← Alle Termine",
  assignedBy: "Angelegt von",
  registeredOn: (kur: string) => `Angelegt am ${kur} · Belgrader Zeit`,
  tabPersonalia: "Personalien",
  tabTechnical: "Technische Daten",
  tabResult: "Ergebnis",
  tabDetails: "Details",
  tabFeedback: (n: number) => `Feedback (${n})`,
  readOnlyHint:
    "Termine werden nur vom Manager oder Admin geändert — auch die, die Sie selbst angelegt haben. Ihr Feedback schreiben Sie im Tab «Feedback».",

  // Personalia
  fName: "Vor- und Nachname",
  fCustomerNumber: "Kundennummer",
  fGender: "Geschlecht",
  fNationality: "Nationalität",
  fBirthDate: "Geburtsdatum",
  fPhone: "Telefon",
  fMobile: "Mobil",
  fEmail: "E-Mail",
  fStreet: "Straße",
  fPostalCode: "PLZ",
  fCity: "Ort",
  fCanton: "Kanton",
  fPlace: "Ort",

  // Teknike
  fCallCenter: "Call Center",
  fCurrentInsurance: "Aktuelle Versicherung",
  fLanguage: "Sprache",
  fCallDate: "Anrufdatum",
  fScheduledDate: "Datum des Termins",
  fScheduledTime: "Uhrzeit",
  fTimeHint: "24-Stunden-Format, z. B. 09:00 oder 22:00",
  fPersonsCount: "Anzahl Personen",
  fCreatedAt: "Angelegt am",

  // Rezultati
  fCategory: "Ergebnis",
  fStatus: "Grund",
  categoryHint: "Erfolgreich heißt: stattgefunden UND Vertrag abgeschlossen.",
  reasonHint:
    "Warum dieses Ergebnis. Die Auswahl richtet sich nach dem Ergebnis oben.",
  fContractsClosed: "Abgeschlossene Verträge",
  fMultiYear: "Mehrjahresvertrag",
  fTreatment: "Behandlung",
  contractsHint: "Nicht mehr als die Anzahl der Personen.",

  // Detaje
  fFamilyDetails: "Familiäre Angaben",
  fCurrentTreatment: "Laufende Behandlung",
  fTreatmentType: "Art der Behandlung",
  fMedications: "Regelmäßige Medikamente",
  detailsHint:
    "Gesundheitsdaten sind sensibel. Bitte nur ausfüllen, wenn sie für die Beratung nötig sind und die Person informiert ist.",

  // Butonat e formularit
  createAppointment: "Termin anlegen",
  saveChanges: "Änderungen speichern",
  resultOnlyHint:
    "Nur das Ergebnis. Name, Adresse und Termindatum ändert der Manager.",
  errResultNotYours:
    "Das Ergebnis trägt nur der zugewiesene Experte oder der Manager ein.",
  appointmentCreated: "Termin wurde angelegt.",
  appointmentUpdated: "Termin wurde aktualisiert.",

  // Fshirja e terminit
  deleteAppointment: "Termin löschen",
  deleteAppointmentAsk: (emri: string) => `Termin «${emri}» löschen?`,
  deleteAppointmentNotes: (n: number) =>
    `Dabei ${n === 1 ? "wird" : "werden"} auch ${sasi(
      n,
      "Notiz",
      "Notizen"
    )} gelöscht. Das lässt sich nicht rückgängig machen.`,
  deleteAppointmentPlain: "Das lässt sich nicht rückgängig machen.",
  deleteConfirm: "Ja, löschen",

  // ---------- Ekspertët ----------
  expertsTitle: "Experten mit Zugriff",
  expertsHint:
    "Nur diese Experten sehen diesen Termin. Zugriff vergeben Manager und Administrator.",
  expertsNone: "Noch kein Experte hat Zugriff auf diesen Termin.",
  expertsAdd: "Zugriff geben",
  expertsAdding: "Wird hinzugefügt…",
  expertsRemove: "Zugriff entziehen",
  expertsPick: "Experte wählen",
  expertsNoAccounts:
    "Es gibt noch keine Experten-Konten. Legen Sie eines unter «Benutzer» an.",
  expertsGranted: (email: string) => `${email} sieht diesen Termin jetzt.`,
  expertsRevoked: (email: string) => `${email} sieht diesen Termin nicht mehr.`,
  expertsCount: (n: number) => sasi(n, "Experte", "Experten"),
  expertsGrantedBy: "hinzugefügt von",
  errExpertsManagerOnly: "Zugriff vergeben nur Manager und Administrator.",
  errExpertNoAccess:
    "Dieses Konto hat keinen Zugang mehr. Es kann keine Termine erhalten.",
  errBulkNoneSelected: "Bitte mindestens einen Termin auswählen.",
  bulkSelected: (n: number) => `${sasi(n, "Termin", "Termine")} ausgewählt`,
  bulkAssign: "Einem Experten zuweisen",
  bulkSelectAll: "Alle auf dieser Seite auswählen",
  bulkGranted: (n: number, email: string, kishte: number) =>
    kishte > 0
      ? `${sasi(n, "Termin", "Termine")} an ${email} vergeben. ${kishte} hatte er bereits.`
      : `${sasi(n, "Termin", "Termine")} an ${email} vergeben.`,
  bulkAllAlready: (n: number) =>
    `${sasi(n, "Termin", "Termine")} — der Zugriff bestand bereits.`,
  errExpertMissing: "Bitte einen Experten wählen.",
  errExpertNotExpert: "Dieses Konto ist kein Experte.",
  errExpertAlready: "Diese Person hat bereits Zugriff.",
  errExpertFailed: "Der Zugriff konnte nicht geändert werden",
  expertNoAppointments:
    "Ihnen wurde noch kein Termin zugewiesen. Manager und Administrator geben Ihnen Zugriff.",

  // ---------- Feedback ----------
  feedbackTitle: "Feedback zum Termin",
  noteNew: "Neue Notiz",
  noteAdd: "Notiz hinzufügen",
  notePlaceholder:
    "z. B. Kd ist bei Helsana mit VVG, 1000 CHF im Monat. Termin fix um 10:00 Uhr.",
  noteColUser: "Benutzer",
  noteColBody: "Notiz",
  noteColDate: "Datum",
  noteEmpty: "Noch keine Notizen zu diesem Termin.",
  noteEdit: "Bearbeiten",
  noteChanged: "geändert",
  noteFooter: (n: number) =>
    `${sasi(n, "Notiz", "Notizen")} · Strg+Enter im Feld oben speichert sofort.`,
  noteLoadError: "Notizen konnten nicht geladen werden",
  noteUpdated: "Notiz wurde geändert.",

  // ---------- Dashboard ----------
  dashTitle: "Dashboard",
  dashSubtitle:
    "Überblick über die Termine. Die Zahlen werden bei jedem Aufruf neu berechnet.",
  dashTotal: "Termine gesamt",
  dashPersons: (n: number) => sasi(n, "Person", "Personen"),
  dashHeld: "Erfolgreich",
  dashOfAll: (p: number) => `${p} % aller Termine`,
  dashContracts: "Abgeschlossene Verträge",
  dashCloseRate: (p: number) =>
    `${p} % der abgeschlossenen Termine waren erfolgreich`,
  dashUpcoming: "Bevorstehend",
  dashTodayN: (n: number) => `${n} heute`,
  dashTalkingN: (n: number) => `${n} noch in Gespräch`,
  dashNoneToday: "keine heute",
  dashByStatus: "Nach Ergebnis",
  dashByStatusHint:
    "Jeder Termin gehört immer zu genau einer der drei Kategorien.",
  dashByReason: "Gründe im Detail",
  dashByReasonHint: "Warum die Termine so ausgegangen sind.",
  dashByDay: "Nach Tag",
  dashByDayHint: (muaji: string) => `${muaji}, Tag für Tag · Belgrader Zeit.`,
  dashMonth: "Monat",
  dashAll: "Alle",
  dashMine: "Meine",
  dashScopeMine: "Nur Ihre eigenen Termine.",
  dashScopeAll: "Alle Termine im Haus.",
  dashScopeAssigned: "Nur die Ihnen zugewiesenen Termine.",
  dashInMonth: "Termine in diesem Monat",
  dashInMonthHint: "Nach Datum geordnet.",
  dashNoneInMonth: "In diesem Monat keine Termine.",
  dashNext: "Nächste Termine",
  dashNextHint: "Die fünf nächsten.",
  dashNoUpcoming: "Kein offener Termin in der Zukunft.",
  dashPeople: "Arbeit der Einzelnen",
  dashPeopleHint: (muaji: string) =>
    `Wer wie viel im Monat ${muaji} gemacht hat. Auch Konten ohne Termine stehen hier.`,
  dashColPerson: "Person",
  dashColRole: "Rolle",
  dashColAppointments: "Termine",
  dashExpertNote:
    "Beim Experten heißt «Termine»: wie viele ihm zugewiesen wurden. Experten legen selbst keine Termine an.",
  dashByAgent: "Nach Mitarbeiter",
  dashByAgentHint: "Wer die Termine angelegt hat und wie viele Verträge daraus wurden.",
  dashContractsLine: "Verträge",
  dashNotes: "Notizen",
  dashNotesHint: "Feedback zu den Terminen.",
  dashNotesMine: (n: number) => `${n} davon von Ihnen.`,
  dashNoAppointments: "Noch keine Termine.",
  dashPersShort: "Pers.",

  // ---------- Profili ----------
  profileTitle: "Mein Profil",
  profileActiveToday: "Heute aktiv",
  profileActiveTodayHint: "Zeit im CRM",
  profileLastDays: (n: number) => `Die letzten ${n} Tage`,
  profileWorkDays: (n: number) => sasi(n, "Arbeitstag", "Arbeitstage"),
  profileAverage: "Durchschnitt pro Tag",
  profileAverageHint: "nur Tage mit Aktivität",
  profileNotesWritten: "Geschriebene Notizen",
  profileNotesHint: "Feedback zu Terminen",
  profileTimeChart: "Meine Zeit, Tag für Tag",
  profileTimeChartHint: (n: number) => `Minuten im CRM, die letzten ${n} Tage.`,
  profileAccount: "Konto",
  profileEmail: "E-Mail",
  profileRole: "Rolle",
  profileCreatedAt: "Konto angelegt am",
  profileUrl: "Adresse der Termine",
  profilePasswordNote:
    "Passwörter werden nirgends lesbar gespeichert, deshalb auch hier nicht angezeigt. Sie werden im Supabase-Panel geändert.",
  profileMyAppointments: "Meine Termine",
  profileMyAppointmentsHint: "Die von mir angelegten.",
  profileAppointments: "Termine",
  profileContracts: "Verträge",
  profileToday: "heute",
  profileByStatus: "Nach Status",
  profileByStatusHint: "Nur meine Termine.",
  profileNoAppointments: "Sie haben noch keinen Termin angelegt.",
  profilePermissions: "Was Sie dürfen",
  profilePermissionsHint:
    "Diese Regeln setzt die Datenbank selbst durch, nicht die Oberfläche.",

  permReadAll: "Alle angelegten Termine lesen",
  permReadOwn: "Nur die eigenen Termine lesen",
  permNoEditOwn: "Termine ändern, auch die eigenen",
  permWriteOwnNotes: "Feedback zu den eigenen Terminen schreiben",
  permNoDeleteAppointments: "Termine löschen",
  permNoReadOthers: "Termine anderer sehen",
  permWriteNotes: "Feedback zu jedem Termin schreiben",
  permCreateAppointments: "Neue Termine anlegen",
  permEditAppointments: "Jeden Termin ändern",
  permDeleteAppointments: "Termine löschen",
  permEditAnyNote: "Jede Notiz schreiben und ändern",
  permGrantExperts: "Experten Zugriff auf Termine geben",
  permSeeUsers: "Benutzer und deren Arbeitszeit sehen",
  permNoCreateAppointments: "Termine anlegen oder ändern",
  permReadAssigned: "Nur die zugewiesenen Termine lesen",
  permNoReadAll: "Alle Termine sehen",
  permNoSeeUsers: "Benutzer und Aktivität sehen",
  permNoChangeRoles: "Rollen ändern",
  permNoChangeRolesAdmin:
    "Rollen ändern — das geht nur im Supabase-Panel",

  // ---------- Përdoruesit ----------
  usersTitle: "Benutzer",
  usersSubtitle:
    "Alle Konten, die sich anmelden können. Nur Sie legen neue Konten an und entziehen den Zugang.",
  usersCountsMissing:
    "Die Zahlen für Termine und Feedback konnten nicht geladen werden: supabase/numrat.sql wurde noch nicht ausgeführt. Bis dahin stehen hier Nullen — sie sind nicht echt.",
  usersLoadError: "Benutzer konnten nicht geladen werden",
  usersColEmail: "E-Mail",
  usersColRole: "Rolle",
  usersColActiveToday: "Heute aktiv",
  usersColAppointments: "Termine",
  usersColNotes: "Notizen",
  usersColRegistered: "Angelegt",
  usersNoAccess: "kein Zugang",
  usersActiveNow: "Jetzt aktiv",
  usersNotActive: "Nicht aktiv",
  usersYou: "Sie",
  usersChangePassword: "Neues Passwort",
  usersChangePasswordFor: (email: string) => `Passwort für ${email}`,
  usersPasswordHint:
    "Das alte Passwort wird weder gebraucht noch angezeigt — gespeichert ist nur eine verschlüsselte Spur davon. Geben Sie das neue Passwort persönlich weiter; die Person kann es später selbst ändern.",
  usersNewPassword: "Neues Passwort",
  usersPasswordPlaceholder: "mindestens 8 Zeichen",
  usersShowPassword: "Passwort anzeigen",
  usersSavePassword: "Passwort setzen",
  usersRemoveAccess: "Zugang entziehen",
  usersRemoveAsk: (email: string) => `${email} den Zugang entziehen?`,
  usersRemoveExplain: (t: number, n: number) =>
    `Die Person kann sich nicht mehr anmelden. Aber ihre ${sasi(
      t,
      "Termin",
      "Termine"
    )} und ${sasi(
      n,
      "Notiz",
      "Notizen"
    )} bleiben erhalten und tragen weiterhin ihren Namen.`,
  usersRemoveConfirm: "Ja, Zugang entziehen",
  usersRemoving: "Wird entzogen…",
  usersKeepDataNote:
    "Diese Liste zeigt nur Konten, die sich noch anmelden können. Wenn Sie jemandem den Zugang entziehen, verschwindet die Zeile von hier — aber ihre Termine, Notizen und Arbeitszeiten bleiben und tragen weiterhin ihren Namen. Auch die Datensicherung enthält weiterhin alle Konten.",
  usersRolesNote:
    "Rollen werden nur im Supabase-Panel geändert (Table Editor → profiles), damit sich niemand über die Anwendung selbst zum Admin machen kann. Werte:",

  // Hapja e llogarive
  userNewPanel: "Neues Konto anlegen",
  userNewEmail: "E-Mail",
  userNewPassword: "Erstes Passwort",
  userNewPasswordHint:
    "Geben Sie es der Person persönlich; sie kann es später ändern.",
  userNewPasswordPlaceholder: "mindestens 8 Zeichen",
  userNewRole: "Rolle",
  userNewRoleUser: "Benutzer — liest nur und schreibt Notizen",
  userNewRoleManager: "Manager — legt Termine an",
  userNewRoleExpert: "Experte — sieht nur zugewiesene Termine",
  userNewButton: "Konto anlegen",
  userNewCreating: "Wird angelegt…",
  userNewAdminNote:
    "Die Rolle admin wird hier nicht vergeben. Ein zweiter Admin wird von Hand in Supabase → Table Editor → profiles gesetzt, damit ein gestohlenes Admin-Konto keine weiteren wie sich selbst anlegen kann.",

  // ---------- Aktiviteti ----------
  activityTitle: "Aktivität",
  activitySubtitle: "Im CRM verbrachte Zeit, die letzten Tage.",
  activityLoadError: "Aktivität konnte nicht geladen werden",
  activityColUser: "Benutzer",
  activityColTotal: "Gesamt",
  activityToday: "Heute",
  activityLastSeen: "Zuletzt gesehen",

  // ---------- Gabimet e serverit ----------
  errNoAppointment: "Der zugehörige Termin fehlt.",
  errEmptyNote: "Die Notiz darf nicht leer sein.",
  errNoteNotSaved: "Notiz konnte nicht gespeichert werden",
  errNoteMissing: "Die zu ändernde Notiz fehlt.",
  errNoteNotFound: "Diese Notiz wurde nicht gefunden.",
  errNoteNotYours: "Diese Notiz hat jemand anderes geschrieben.",
  errNoteRejected:
    "Die Notiz wurde nicht gespeichert: die Datenbank hat den Vorgang abgelehnt.",
  errNameRequired: "Vor- und Nachname sind erforderlich.",
  errPhoneRequired: "Die Telefonnummer ist erforderlich.",
  errStreetRequired: "Die Straße ist erforderlich.",
  errPostalRequired: "Die PLZ ist erforderlich.",
  errCityRequired: "Der Ort ist erforderlich.",
  errCantonRequired: "Der Kanton ist erforderlich.",
  errBadEmail: "Die E-Mail sieht nicht richtig aus (Beispiel: name@beispiel.com).",
  errDateRequired: "Datum und Uhrzeit des Termins sind erforderlich.",
  errPersonsMin: "Es muss mindestens 1 Person sein.",
  errContractsBad: "Die Anzahl der Verträge ist nicht gültig.",
  errContractsTooMany: (c: number, p: number) =>
    `${sasi(c, "Vertrag", "Verträge")} sind bei ${sasi(
      p,
      "Person",
      "Personen"
    )} nicht möglich.`,
  errUnknownCategory: "Dieses Ergebnis gibt es nicht.",
  errReasonNotInCategory: "Der Grund passt nicht zum gewählten Ergebnis.",
  errSuccessNeedsContract:
    "«Erfolgreich» setzt mindestens einen abgeschlossenen Vertrag voraus.",
  errUnknownStatus: "Der gewählte Grund ist unbekannt.",
  errAppointmentNotSaved: "Der Termin konnte nicht gespeichert werden",
  errAppointmentMissing: "Der zu ändernde Termin fehlt.",
  errAppointmentNotFound: "Dieser Termin wurde nicht gefunden.",
  errEditManagerOnly:
    "Termine werden nur vom Manager oder Admin geändert. Ihr Feedback können Sie im Tab «Feedback» schreiben.",
  errChangesRejected:
    "Die Änderungen wurden nicht gespeichert: die Datenbank hat den Vorgang abgelehnt.",
  errDeleteMissing: "Der zu löschende Termin fehlt.",
  errDeleteFailed: "Der Termin wurde nicht gelöscht",
  errDeleteRejected:
    "Der Termin wurde nicht gelöscht: die Datenbank hat den Vorgang abgelehnt. Möglicherweise wurde supabase/fshirja.sql noch nicht ausgeführt.",
  errFillBoth: "Bitte E-Mail und Passwort ausfüllen.",
  errPasswordShort: "Das Passwort muss mindestens 8 Zeichen haben.",
  errPasswordMissing: "Bitte ein neues Passwort eingeben.",
  errNoAccessNoPassword:
    "Dieses Konto hat keinen Zugang mehr — es gibt kein Login, dem ein Passwort gesetzt werden könnte.",
  errPasswordNotChanged: "Das Passwort wurde nicht geändert",
  okPasswordChanged: (email: string) =>
    `Das Passwort für ${email} wurde geändert. Geben Sie es der Person weiter. Achtung: eine bereits offene Sitzung bleibt bestehen — wer sofort ausgesperrt werden soll, dem entziehen Sie den Zugang.`,
  errUnknownRole: "Die gewählte Rolle ist unbekannt.",
  errEmailExists: "Für diese E-Mail gibt es bereits ein Konto.",
  errAccountNotCreated: "Das Konto wurde nicht angelegt",
  errRoleNotSet: (m: string) =>
    `Das Konto wurde angelegt, aber die Rolle nicht gesetzt: ${m}. Bitte die Rolle in der Tabelle profiles ändern.`,
  okAccountCreated: (email: string, role: string) =>
    `Konto ${email} wurde als ${role} angelegt. Geben Sie das Passwort weiter; die Person kann es später ändern.`,
  errAccountMissing: "Das Konto fehlt.",
  errCannotRemoveSelf: "Sie können sich den Zugang nicht selbst entziehen.",
  errAccountNotFound: "Dieses Konto wurde nicht gefunden.",
  errAlreadyNoAccess: "Dieses Konto hat ohnehin keinen Zugang.",
  errLastAdmin: "Das ist der letzte Admin — er kann nicht entfernt werden.",
  errAccessNotRemoved: "Der Zugang wurde nicht entzogen",
  errProfileNotMarked: (m: string) =>
    `Der Zugang wurde entzogen, aber das Profil nicht als geschlossen markiert: ${m}`,
  okAccessRemoved: (email: string) =>
    `${email} kann sich nicht mehr anmelden. Die Daten bleiben erhalten.`,
};

export type Dict = typeof de;

const sq: Dict = {
  // ---------- E përbashkët ----------
  appName: "Helvetic",
  appTagline: "Terminet",
  save: "Ruaj",
  cancel: "Anulo",
  delete: "Fshi",
  yes: "Po",
  no: "Jo",
  saving: "Duke ruajtur…",
  deleting: "Duke fshirë…",
  noValue: "—",
  language: "Gjuha",

  navDashboard: "Dashboard",
  navAppointments: "Terminet",
  navProfile: "Profili",
  navUsers: "Përdoruesit",
  navActivity: "Aktiviteti",
  navBackup: "Kopja e të dhënave",

  // ---------- Kopja e të dhënave ----------
  backupTitle: "Kopja e të dhënave",
  backupIntro:
    "Një kopje e plotë e gjithçkaje — për ta shkarkuar dhe për ta mbajtur, e pavarur nga Supabase dhe nga kjo faqe.",
  backupFullTitle: "Kopja e plotë",
  backupFullHint:
    "Një skedë e vetme me gjithçka. Prej saj të dhënat kthehen të plota. Mbaje aty ku mban edhe kontratat.",
  backupTotal: "Rreshta gjithsej",
  backupDownloadFull: "Shkarko kopjen e plotë (JSON)",
  backupToday: (data: string) => `Gjendja: ${data}`,
  backupCsvTitle: "Tabelat veç, për Excel",
  backupCsvHint:
    "Për t'i parë dhe për t'i llogaritur. Për kthimin mbrapsht shërben kopja e plotë sipër.",
  backupWhereTitle: "Ku të mbahet, dhe sa shpesh",
  backupWhere1:
    "Jo vetëm te kompjuteri ku punon: një kopje duhet të rrijë në një vend të dytë (disk i jashtëm, dosje në internet).",
  backupWhere2:
    "Skeda përmban emra, numra telefoni, adresa dhe të dhëna shëndetësore. Nuk shkon te një dosje e hapur, as te një depo publike te GitHub-i.",
  backupWhere3:
    "Një herë në javë mjafton për këtë vëllim; pas një dite me shumë punë, më mirë menjëherë.",
  bkTblProfiles: "Llogaritë",
  bkTblAppointments: "Terminet",
  bkTblNotes: "Feedback-u",
  bkTblExperts: "Aksesi i ekspertëve",
  bkTblActivity: "Orët e punës",
  signOut: "Dil",

  loginHeading: "Hyrje",
  loginAccessRemoved:
    "Hyrja jote është hequr. Drejtohu te administratori.",
  loginTitle: "Hyr në llogarinë tënde.",
  loginEmail: "Emaili",
  loginPassword: "Fjalëkalimi",
  loginButton: "Hyr",
  loginWaiting: "Duke pritur…",
  loginPasswordHint: "të paktën 6 shenja",
  loginNoSignup:
    "Nuk ka regjistrim të lirë. Llogarinë ta hap administratori.",
  loginBadCredentials: "Email ose fjalëkalim i gabuar.",
  loginNotConfirmed:
    "Emaili nuk është konfirmuar ende. Kontrollo kutinë postare.",
  loginFillBoth: "Plotëso emailin dhe fjalëkalimin.",

  roleUser: "Përdorues",
  roleManager: "Menaxher",
  roleAdmin: "Admin",
  roleExpert: "Ekspert",

  genderF: "Femër",
  genderM: "Mashkull",

  catSuccess: "E suksesshme",
  catTalking: "Në bisedim",
  catFailed: "E dështuar",

  statusContractSigned: "Kontratë e nënshkruar",
  statusOpen: "Termini ende s'është mbajtur",
  statusHeldThinking: "U mbajt — po mendohet",
  statusCancelled: "I anuluar",
  statusNotReached: "Nuk u arrit",
  statusRefused: "S'deshi termin",
  statusNegative: "Negativ",
  statusNotHome: "S'ishte në shtëpi",
  statusAddressNotFound: "Adresa s'u gjet",
  statusAdvisorFailed: "S'u këshillua dot",

  listTitle: "Terminet",
  listSummary: (n, held, contracts) =>
    `${sasi(n, "termin", "termine")} · ${held} ${
      held === 1 ? "i suksesshëm" : "të suksesshme"
    } · ${sasi(contracts, "kontratë", "kontrata")}`,
  listSummaryShort: (n) => sasi(n, "termin", "termine"),
  listAll: "Të gjitha",
  listMine: "Të mijat",
  listNewAppointment: "Cakto termin të ri",
  listEmpty: "Nuk ka termine këtu.",
  listLoadError: "Nuk u lexuan dot terminet",
  activeToday: "Aktiv sot",
  activeTodayTitle: "Koha e kaluar sot brenda CRM-së",
  colNr: "Nr",
  colName: "Emri",
  colDate: "Data e terminit",
  colInsurance: "Sigurimi",
  colPersons: "Pers.",
  colContracts: "Kontr.",
  colNotes: "Shën.",
  colExpert: "Eksperti",
  noExpert: "—",
  colStatus: "Rezultati",
  filterStatus: "Rezultati",
  filterAll: "Të gjitha",

  filterDate: "Data e terminit",
  filterDateFrom: "Nga",
  filterDateTo: "Deri",
  filterDateToday: "Sot",
  filterDateWeek: "Kjo javë",
  filterDateMonth: "Ky muaj",
  filterDateClear: "Pastro datat",
  dateNoResult: "Asnjë termin në këtë interval.",

  searchLabel: "Kërko",
  searchPlaceholder: "Emri ose nr.",
  searchButton: "Kërko",
  searchClear: "Pastro",
  searchNoResult: (q) => `Nuk u gjet asnjë termin për «${q}».`,
  searchFound: (n, q) => `${sasi(n, "përputhje", "përputhje")} për «${q}»`,
  pagePrev: "Mbrapa",
  pageNext: "Para",
  pageOf: (faqja, gjithsej) => `Faqja ${faqja} nga ${gjithsej}`,
  pageRange: (nga, deri, gjithsej) => `${nga}–${deri} nga ${gjithsej}`,

  backToList: "← Të gjitha terminet",
  assignedBy: "Caktuar nga",
  registeredOn: (kur) => `Regjistruar më ${kur} · ora e Beogradit`,
  tabPersonalia: "Personalia",
  tabTechnical: "Të dhëna teknike",
  tabResult: "Rezultati",
  tabDetails: "Detaje",
  tabFeedback: (n) => `Feedback (${n})`,
  readOnlyHint:
    "Terminet i ndryshon vetëm menaxheri ose admini — edhe ato që i ke caktuar vetë. Ti shkruan feedback te skeda «Feedback».",

  fName: "Emri dhe mbiemri",
  fCustomerNumber: "Numri i klientit",
  fGender: "Gjinia",
  fNationality: "Kombësia",
  fBirthDate: "Datëlindja",
  fPhone: "Telefoni",
  fMobile: "Celulari",
  fEmail: "Emaili",
  fStreet: "Rruga",
  fPostalCode: "Kodi postar",
  fCity: "Qyteti",
  fCanton: "Kantoni",
  fPlace: "Vendi",

  fCallCenter: "Call center",
  fCurrentInsurance: "Sigurimi aktual",
  fLanguage: "Gjuha",
  fCallDate: "Data e telefonatës",
  fScheduledDate: "Data e terminit",
  fScheduledTime: "Ora",
  fTimeHint: "Ora 0–23, p.sh. 09:00 ose 22:00",
  fPersonsCount: "Numri i personave",
  fCreatedAt: "Shtuar më",

  fCategory: "Rezultati",
  fStatus: "Arsyeja",
  categoryHint: "E suksesshme do të thotë: u mbajt DHE u nënshkrua kontratë.",
  reasonHint: "Pse doli kështu. Zgjedhjet varen nga rezultati lart.",
  fContractsClosed: "Kontrata të mbyllura",
  fMultiYear: "Kontratë shumëvjeçare",
  fTreatment: "Trajtim",
  contractsHint: "Nuk lejohet më shumë se numri i personave.",

  fFamilyDetails: "Detaje familjare",
  fCurrentTreatment: "Trajtim aktual",
  fTreatmentType: "Lloji i trajtimit",
  fMedications: "Medikamente të rregullta",
  detailsHint:
    "Të dhënat shëndetësore janë të ndjeshme. Plotësoji vetëm nëse i duhen këshillimit dhe personi është i informuar.",

  createAppointment: "Cakto terminin",
  saveChanges: "Ruaj ndryshimet",
  resultOnlyHint:
    "Vetëm rezultati. Emrin, adresën dhe datën e terminit i ndryshon menaxheri.",
  errResultNotYours:
    "Rezultatin e shënon vetëm eksperti që e ka terminin, ose menaxheri.",
  appointmentCreated: "Termini u caktua.",
  appointmentUpdated: "Termini u përditësua.",

  deleteAppointment: "Fshi terminin",
  deleteAppointmentAsk: (emri) => `Ta fshij terminin «${emri}»?`,
  deleteAppointmentNotes: (n) =>
    `Bashkë me të ${n === 1 ? "fshihet" : "fshihen"} edhe ${sasi(
      n,
      "shënim",
      "shënime"
    )}. Kjo nuk kthehet mbrapsht.`,
  deleteAppointmentPlain: "Kjo nuk kthehet mbrapsht.",
  deleteConfirm: "Po, fshije",

  expertsTitle: "Ekspertët me akses",
  expertsHint:
    "Vetëm këta ekspertë e shohin këtë termin. Aksesin e jep menaxheri ose administratori.",
  expertsNone: "Asnjë ekspert nuk e sheh ende këtë termin.",
  expertsAdd: "Jepi akses",
  expertsAdding: "Duke shtuar…",
  expertsRemove: "Hiqi aksesin",
  expertsPick: "Zgjidh ekspertin",
  expertsNoAccounts:
    "S'ka ende llogari ekspertësh. Hape një te faqja «Përdoruesit».",
  expertsGranted: (email) => `${email} e sheh tani këtë termin.`,
  expertsRevoked: (email) => `${email} nuk e sheh më këtë termin.`,
  expertsCount: (n) => sasi(n, "ekspert", "ekspertë"),
  expertsGrantedBy: "shtuar nga",
  errExpertsManagerOnly: "Aksesin e jep vetëm menaxheri ose administratori.",
  errExpertNoAccess:
    "Kjo llogari nuk hyn më. Nuk mund t'i jepen termine.",
  errBulkNoneSelected: "Zgjidh të paktën një termin.",
  bulkSelected: (n) => `${sasi(n, "termin", "termine")} të zgjedhur`,
  bulkAssign: "Jepja një eksperti",
  bulkSelectAll: "Zgjidh të gjitha në këtë faqe",
  bulkGranted: (n, email, kishte) =>
    kishte > 0
      ? `${sasi(n, "termin", "termine")} iu dhanë ${email}. ${kishte} i kishte tashmë.`
      : `${sasi(n, "termin", "termine")} iu dhanë ${email}.`,
  bulkAllAlready: (n) =>
    `${sasi(n, "termin", "termine")} — aksesi ekzistonte tashmë.`,
  errExpertMissing: "Zgjidh një ekspert.",
  errExpertNotExpert: "Kjo llogari nuk është ekspert.",
  errExpertAlready: "Ky person e ka tashmë aksesin.",
  errExpertFailed: "Nuk u ndryshua dot aksesi",
  expertNoAppointments:
    "Ende nuk të është caktuar asnjë termin. Aksesin ta jep menaxheri ose administratori.",

  feedbackTitle: "Feedback i terminit",
  noteNew: "Shënim i ri",
  noteAdd: "Shto shënimin",
  notePlaceholder:
    "P.sh. Kd sind bei Helsana me VVG, 1000 CHF në muaj. Termini fiks në orën 10:00.",
  noteColUser: "Përdoruesi",
  noteColBody: "Shënimi",
  noteColDate: "Data",
  noteEmpty: "Ende s'ka shënime për këtë termin.",
  noteEdit: "Ndrysho",
  noteChanged: "ndryshuar",
  noteFooter: (n) =>
    `${sasi(n, "shënim", "shënime")} · Ctrl+Enter te kutia lart e ruan menjëherë.`,
  noteLoadError: "Nuk u lexuan dot shënimet",
  noteUpdated: "Shënimi u ndryshua.",

  dashTitle: "Dashboard",
  dashSubtitle:
    "Pamja e përgjithshme e termineve. Numrat llogariten sa herë hapet faqja.",
  dashTotal: "Termine gjithsej",
  dashPersons: (n) => sasi(n, "person", "persona"),
  dashHeld: "Të suksesshme",
  dashOfAll: (p) => `${p}% e të gjithave`,
  dashContracts: "Kontrata të mbyllura",
  dashCloseRate: (p) => `${p}% e termineve të mbyllura dolën të suksesshme`,
  dashUpcoming: "Të ardhshme",
  dashTodayN: (n) => `${n} sot`,
  dashTalkingN: (n) => `${n} ende në bisedim`,
  dashNoneToday: "asnjë sot",
  dashByStatus: "Sipas rezultatit",
  dashByStatusHint: "Çdo termin i përket vetëm njërës nga tri kategoritë.",
  dashByReason: "Arsyet me hollësi",
  dashByReasonHint: "Pse dolën kështu terminet.",
  dashByDay: "Sipas ditës",
  dashByDayHint: (muaji) => `${muaji}, ditë pas dite · ora e Beogradit.`,
  dashMonth: "Muaji",
  dashAll: "Të gjitha",
  dashMine: "Të mijat",
  dashScopeMine: "Vetëm terminet e tua.",
  dashScopeAll: "Të gjitha terminet e qendrës.",
  dashScopeAssigned: "Vetëm terminet që të janë caktuar.",
  dashInMonth: "Terminet e këtij muaji",
  dashInMonthHint: "Sipas datës.",
  dashNoneInMonth: "Këtë muaj s'ka asnjë termin.",
  dashNext: "Terminet e radhës",
  dashNextHint: "Pesë të parët që vijnë.",
  dashNoUpcoming: "Asnjë termin i hapur në të ardhmen.",
  dashPeople: "Puna e secilit",
  dashPeopleHint: (muaji: string) =>
    `Kush sa ka bërë brenda muajit ${muaji}. Edhe llogaritë pa asnjë termin rrinë këtu.`,
  dashColPerson: "Personi",
  dashColRole: "Roli",
  dashColAppointments: "Termine",
  dashExpertNote:
    "Te eksperti «Termine» do të thotë: sa i janë dhënë. Ekspertët nuk caktojnë vetë termine.",
  dashByAgent: "Sipas agjentit",
  dashByAgentHint: "Kush i ka caktuar terminet dhe sa kontrata dolën.",
  dashContractsLine: "Kontrata",
  dashNotes: "Shënimet",
  dashNotesHint: "Feedback-u i shkruar te terminet.",
  dashNotesMine: (n) => `${n} të shkruara nga ti.`,
  dashNoAppointments: "Ende s'ka termine.",
  dashPersShort: "pers.",

  profileTitle: "Profili im",
  profileActiveToday: "Aktiv sot",
  profileActiveTodayHint: "koha brenda CRM-së",
  profileLastDays: (n) => `${n} ditët e fundit`,
  profileWorkDays: (n) => `${n} ditë pune`,
  profileAverage: "Mesatarja në ditë",
  profileAverageHint: "vetëm ditët me punë",
  profileNotesWritten: "Shënime të shkruara",
  profileNotesHint: "feedback te terminet",
  profileTimeChart: "Koha ime, ditë pas dite",
  profileTimeChartHint: (n) => `Minuta brenda CRM-së, ${n} ditët e fundit.`,
  profileAccount: "Llogaria",
  profileEmail: "Emaili",
  profileRole: "Roli",
  profileCreatedAt: "Llogaria e hapur më",
  profileUrl: "Adresa e termineve",
  profilePasswordNote:
    "Fjalëkalimi nuk ruhet dot i lexueshëm askund, prandaj as këtu nuk shfaqet. Ndryshohet nga paneli i Supabase-it.",
  profileMyAppointments: "Terminet e mia",
  profileMyAppointmentsHint: "Ato që i kam caktuar unë.",
  profileAppointments: "termine",
  profileContracts: "kontrata",
  profileToday: "sot",
  profileByStatus: "Sipas statusit",
  profileByStatusHint: "Vetëm terminet e mia.",
  profileNoAppointments: "Ende s'ke caktuar asnjë termin.",
  profilePermissions: "Çfarë mund të bësh",
  profilePermissionsHint:
    "Këto rregulla i zbaton vetë baza e të dhënave, jo faqja.",

  permReadAll: "Lexon të gjitha terminet e regjistruara",
  permReadOwn: "Lexon vetëm terminet e veta",
  permNoEditOwn: "Ndryshon termine, as të vetat",
  permWriteOwnNotes: "Shkruan feedback te terminet e veta",
  permNoDeleteAppointments: "Fshin termine",
  permNoReadOthers: "Sheh terminet e të tjerëve",
  permWriteNotes: "Shkruan feedback te çdo termin",
  permCreateAppointments: "Cakton termine të reja",
  permEditAppointments: "Ndryshon çdo termin",
  permDeleteAppointments: "Fshin termine",
  permEditAnyNote: "Shkruan dhe ndryshon çdo shënim",
  permGrantExperts: "U jep ekspertëve akses te terminet",
  permSeeUsers: "Sheh përdoruesit dhe kohën e tyre aktive",
  permNoCreateAppointments: "Cakton ose ndryshon termine",
  permReadAssigned: "Lexon vetëm terminet që i janë caktuar",
  permNoReadAll: "Sheh të gjitha terminet",
  permNoSeeUsers: "Sheh përdoruesit dhe aktivitetin",
  permNoChangeRoles: "Ndryshon rolet",
  permNoChangeRolesAdmin:
    "Ndryshon rolet — kjo bëhet vetëm nga paneli i Supabase-it",

  usersTitle: "Përdoruesit",
  usersSubtitle:
    "Të gjitha llogaritë që hyjnë në sistem. Vetëm ti hap llogari të reja dhe u heq hyrjen atyre që largohen.",
  usersCountsMissing:
    "Numrat e termineve dhe të feedback-ut nuk u lexuan dot: supabase/numrat.sql s'është ekzekutuar ende. Deri atëherë këtu rrinë zero — ato nuk janë të vërteta.",
  usersLoadError: "Nuk u lexuan dot përdoruesit",
  usersColEmail: "Emaili",
  usersColRole: "Roli",
  usersColActiveToday: "Aktiv sot",
  usersColAppointments: "Termine",
  usersColNotes: "Shënime",
  usersColRegistered: "Regjistruar",
  usersNoAccess: "pa hyrje",
  usersActiveNow: "Aktiv tani",
  usersNotActive: "Jo aktiv",
  usersYou: "ti",
  usersChangePassword: "Fjalëkalim i ri",
  usersChangePasswordFor: (email: string) => `Fjalëkalimi i ${email}`,
  usersPasswordHint:
    "Fjalëkalimi i vjetër as nuk duhet, as nuk shfaqet — te baza rri vetëm një gjurmë e koduar e tij. Jepja të riun në dorë; personi mund ta ndërrojë vetë më vonë.",
  usersNewPassword: "Fjalëkalimi i ri",
  usersPasswordPlaceholder: "të paktën 8 shenja",
  usersShowPassword: "Shfaqe fjalëkalimin",
  usersSavePassword: "Vendos fjalëkalimin",
  usersRemoveAccess: "Hiqi hyrjen",
  usersRemoveAsk: (email) => `T'ia heq hyrjen ${email}?`,
  usersRemoveExplain: (t, n) =>
    `Nuk hyn më te CRM-ja. Por ${sasi(t, "termini", "terminet")} dhe ${sasi(
      n,
      "shënimi",
      "shënimet"
    )} e tij ${
      t + n === 1 ? "mbetet" : "mbeten"
    }, dhe vazhdojnë të mbajnë emrin e tij.`,
  usersRemoveConfirm: "Po, hiqia hyrjen",
  usersRemoving: "Duke e hequr…",
  usersKeepDataNote:
    "Kjo listë tregon vetëm llogaritë që hyjnë ende. Kur i heq hyrjen dikujt, rreshti i tij ikën nga këtu — por terminet, shënimet dhe orët e tij mbeten, dhe vazhdojnë të mbajnë emrin e tij. Edhe kopja e të dhënave i merr të gjitha llogaritë, përfshirë ato të hequra.",
  usersRolesNote:
    "Rolet ndryshohen vetëm nga paneli i Supabase-it (Table Editor → profiles), që askush të mos e bëjë dot veten admin nga aplikacioni. Vlerat:",

  userNewPanel: "Hap llogari të re",
  userNewEmail: "Emaili",
  userNewPassword: "Fjalëkalimi i parë",
  userNewPasswordHint: "Ia jep vetë njeriut; le ta ndryshojë më pas.",
  userNewPasswordPlaceholder: "të paktën 8 shenja",
  userNewRole: "Roli",
  userNewRoleUser: "Përdorues — vetëm lexon dhe shënon",
  userNewRoleManager: "Menaxher — cakton termine",
  userNewRoleExpert: "Ekspert — sheh vetëm terminet e caktuara",
  userNewButton: "Hap llogarinë",
  userNewCreating: "Duke hapur…",
  userNewAdminNote:
    "Roli admin nuk jepet nga këtu. Një admin i dytë caktohet me dorë te Supabase → Table Editor → profiles, që një llogari admin e vjedhur të mos krijojë dot të tjera si vetja.",

  activityTitle: "Aktiviteti",
  activitySubtitle: "Koha e kaluar brenda aplikacionit, ditët e fundit.",
  activityLoadError: "Nuk u lexua dot aktiviteti",
  activityColUser: "Përdoruesi",
  activityColTotal: "Gjithsej",
  activityToday: "Sot",
  activityLastSeen: "Parë së fundi",

  errNoAppointment: "Mungon termini të cilit i përket shënimi.",
  errEmptyNote: "Shënimi nuk mund të jetë bosh.",
  errNoteNotSaved: "Nuk u ruajt dot shënimi",
  errNoteMissing: "Mungon shënimi që duhet ndryshuar.",
  errNoteNotFound: "Ky shënim nuk u gjet.",
  errNoteNotYours: "Këtë shënim e ka shkruar dikush tjetër.",
  errNoteRejected: "Shënimi nuk u ruajt: baza nuk e lejoi këtë veprim.",
  errNameRequired: "Emri dhe mbiemri janë të detyrueshëm.",
  errPhoneRequired: "Numri i telefonit është i detyrueshëm.",
  errStreetRequired: "Rruga është e detyrueshme.",
  errPostalRequired: "Kodi postar është i detyrueshëm.",
  errCityRequired: "Qyteti është i detyrueshëm.",
  errCantonRequired: "Kantoni është i detyrueshëm.",
  errBadEmail: "Emaili nuk duket i saktë (shembull: emri@shembull.com).",
  errDateRequired: "Data dhe ora e terminit janë të detyrueshme.",
  errPersonsMin: "Numri i personave duhet të jetë të paktën 1.",
  errContractsBad: "Numri i kontratave nuk është i saktë.",
  errContractsTooMany: (c, p) =>
    `Nuk mund të ketë ${sasi(c, "kontratë", "kontrata")} për ${sasi(
      p,
      "person",
      "persona"
    )}.`,
  errUnknownCategory: "Ky rezultat nuk ekziston.",
  errReasonNotInCategory: "Arsyeja nuk i përket rezultatit të zgjedhur.",
  errSuccessNeedsContract:
    "«E suksesshme» kërkon të paktën një kontratë të mbyllur.",
  errUnknownStatus: "Arsyeja e zgjedhur nuk njihet.",
  errAppointmentNotSaved: "Nuk u ruajt dot termini",
  errAppointmentMissing: "Mungon termini që duhet ndryshuar.",
  errAppointmentNotFound: "Ky termin nuk u gjet.",
  errEditManagerOnly:
    "Terminet i ndryshon vetëm menaxheri ose admini. Feedback-un mund ta shkruash te skeda «Feedback».",
  errChangesRejected: "Ndryshimet nuk u ruajtën: baza nuk e lejoi këtë veprim.",
  errDeleteMissing: "Mungon termini që duhet fshirë.",
  errDeleteFailed: "Termini nuk u fshi",
  errDeleteRejected:
    "Termini nuk u fshi: baza nuk e lejoi këtë veprim. Ka gjasë të mos jetë ekzekutuar ende supabase/fshirja.sql.",
  errFillBoth: "Plotëso emailin dhe fjalëkalimin.",
  errPasswordShort: "Fjalëkalimi duhet të ketë të paktën 8 shenja.",
  errPasswordMissing: "Shkruaj fjalëkalimin e ri.",
  errNoAccessNoPassword:
    "Kjo llogari s'ka më hyrje — nuk ka ku të vendoset një fjalëkalim.",
  errPasswordNotChanged: "Fjalëkalimi nuk u ndryshua",
  okPasswordChanged: (email: string) =>
    `Fjalëkalimi i ${email} u ndryshua. Jepja personit. Kujdes: sesioni që është tashmë i hapur vazhdon — kush duhet ndalur menjëherë, i hiqet hyrja.`,
  errUnknownRole: "Roli i zgjedhur nuk njihet.",
  errEmailExists: "Ky email ka tashmë një llogari.",
  errAccountNotCreated: "Llogaria nuk u hap",
  errRoleNotSet: (m) =>
    `Llogaria u hap, por roli nuk u vendos: ${m}. Ndryshoje rolin te tabela profiles.`,
  okAccountCreated: (email, role) =>
    `Llogaria ${email} u hap si ${role}. Jepi fjalëkalimin dhe le ta ndryshojë vetë më pas.`,
  errAccountMissing: "Mungon llogaria.",
  errCannotRemoveSelf: "Nuk e heq dot hyrjen tënde.",
  errAccountNotFound: "Kjo llogari nuk u gjet.",
  errAlreadyNoAccess: "Kjo llogari s'ka hyrje as tani.",
  errLastAdmin: "Ky është admini i fundit — nuk hiqet dot.",
  errAccessNotRemoved: "Hyrja nuk u hoq",
  errProfileNotMarked: (m) =>
    `Hyrja u hoq, por profili nuk u shënua si i mbyllur: ${m}`,
  okAccessRemoved: (email) => `${email} nuk hyn më. Të dhënat e saj mbetën.`,
};

export const DICTS: Record<Lang, Dict> = { de, sq };
