export type HomepageFaq = Readonly<{
  question: string;
  answer: string;
}>;

export const homepageFaqs: readonly HomepageFaq[] = [
  {
    question: "Was ist A-KlassenHoiz?",
    answer:
      "A-KlassenHoiz ist ein privates Fußball-Tippspiel für Freundeskreise. Ihr tippt gemeinsam die Ergebnisse veröffentlichter Spiele und vergleicht eure Punkte in der eigenen Tipprunde.",
  },
  {
    question: "Ist das Fußball-Tippspiel kostenlos?",
    answer:
      "Ja, A-KlassenHoiz kann kostenlos genutzt werden. Für das Erstellen einer Tipprunde, Einladungen und die gemeinsame Rangliste ist keine kostenpflichtige Mitgliedschaft nötig.",
  },
  {
    question: "Wie erstelle ich eine private Tipprunde?",
    answer:
      "Nach der Registrierung legst du einen Namen und deinen Rundennickname fest und wählst eine verfügbare Liga aus. Als Besitzer verwaltest du die Runde anschließend selbst.",
  },
  {
    question: "Wie kann ich Freunde zu meiner Tipprunde einladen?",
    answer:
      "Als Besitzer erzeugst du einen privaten Einladungslink, den du direkt teilen kannst. Zusätzlich erstellt A-KlassenHoiz einen QR-Code, über den Freunde die Einladung auf ihrem Smartphone öffnen können.",
  },
  {
    question: "Kann ich meine Tipps nachträglich ändern?",
    answer:
      "Ja, bereits eingetragene Tipps können bis zum jeweiligen Anpfiff geändert und erneut gespeichert werden. Nach Spielbeginn ist die Tippabgabe für dieses Spiel gesperrt.",
  },
  {
    question: "Bis wann kann ein Fußballspiel getippt werden?",
    answer:
      "Die Tippfrist endet für jedes Spiel genau mit dem hinterlegten Anpfiff. Dadurch können Spiele desselben Spieltags unterschiedliche Fristen haben.",
  },
  {
    question: "Brauche ich ein Konto?",
    answer:
      "Ja, für eine eigene Tipprunde, den Beitritt per Einladung und das Speichern deiner Tipps brauchst du ein Konto. Die Registrierung erfolgt mit E-Mail-Adresse, Passwort und Anzeigename.",
  },
  {
    question: "Welche Fußballligen kann ich tippen?",
    answer:
      "Beim Erstellen einer Tipprunde siehst du alle Ligen, die aktuell für neue Runden veröffentlicht sind. Das verfügbare Angebot kann sich je nach Saison und zentral gepflegtem Spielplan ändern.",
  },
] as const;
