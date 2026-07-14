# Private Nutzungsgrenze und Datenflussentscheidung

**Status:** PRODUKTENTSCHEIDUNG FREIGEGEBEN  
**Gate:** T013  
**Stand:** 2026-07-13

Dieses Dokument hält die verbindliche Entscheidung des Projekteigentümers fest. Es ist keine
individuelle Rechtsberatung und behauptet nicht, dass eine gesetzliche Ausnahme in jedem späteren
Betriebszustand automatisch gilt.

## 1. Verbindlicher V1-Betriebsrahmen

- A-KlassenHoiz V1 ist ausschließlich eine nicht-kommerzielle, einladungsbasierte Website für den
  Projekteigentümer und seinen privaten Freundeskreis.
- Es gibt keine öffentliche Vermarktung, keine entgeltliche Leistung, keine Echtgeldfunktion und
  keine geschäftliche Nutzung.
- V1 veröffentlicht kein Impressum und keine private Anschrift, Steuer-, Register-, Rechtsform- oder
  Unternehmensangaben.
- Eine Öffnung für die Allgemeinheit, Monetarisierung, Werbung oder sonstige geschäftliche Nutzung
  beendet diese Freigabe. Vor einer solchen Änderung müssen rechtliche Pflichten und sichtbare
  Inhalte neu fachkundig geprüft und ausdrücklich freigegeben werden.

Die Entscheidung stützt sich ausschließlich auf die vom Projekteigentümer beschriebenen Tatsachen.
§ 5 DDG knüpft die Informationspflicht an geschäftsmäßige, in der Regel gegen Entgelt angebotene
digitale Dienste. Auch die datenschutzrechtliche Haushaltsausnahme hängt vom tatsächlichen privaten
Kontext ab und ist eng auszulegen. Deshalb ist die oben beschriebene Betriebsgrenze selbst ein
Release-Gate und keine bloße Produktbeschreibung.

## 2. Sichtbarer Hinweis statt Impressum

V1 plant genau eine knappe öffentliche Seite „Privat & Datenschutz“. Sie enthält keine private
Anschrift oder Steuerangaben. Vor Veröffentlichung werden ausschließlich folgende tatsächliche
Produktinformationen geprüft:

- privater, nicht-kommerzieller und einladungsbasierter Zweck;
- verarbeitete Kategorien: Login-E-Mail, Profilname, Mitgliedschaften, Einladungen, Tipps,
  Punktewertungen und notwendige Sicherheitsmetadaten;
- tatsächlich eingebundene technische Dienstleister und deren Funktion;
- Konto-, Tipprunden- und Datenlöschmöglichkeiten;
- keine Produktanalytics und kein Real-User-Monitoring in V1.

Nicht bestätigte Anbieter-, Kontakt-, Frist- oder Rechtsangaben dürfen nicht erfunden werden. Die
technische Aufgabe T218 muss den Hinweis gegen die zu diesem Zeitpunkt tatsächlich konfigurierte
Produktionsumgebung prüfen.

## 3. Bestätigter technischer Stand

- Supabase ist für Auth, PostgreSQL und später Storage vorgesehen. Das bestehende Projekt
  `ewqzhdnfoozjzenzmtlm` liegt laut Supabase-Projektmetadaten in `eu-central-1`.
- Vercel ist für Hosting/Deployment vorgesehen; die konkrete Produktionsverknüpfung bleibt bis zur
  gesonderten Vercel-Freigabe unverändert.
- Auth-E-Mail-Zustellung läuft über die tatsächlich konfigurierte Supabase-Auth-Infrastruktur; eine
  gesonderte Anbieterbehauptung wird ohne Verifikation nicht veröffentlicht.
- GitHub enthält keinen vorgesehenen Produktions-Nutzerdatenbestand.
- V1 erhebt keine Produktanalytics- oder Real-User-Monitoring-Daten.

## 4. Aufbewahrung und Löschung

Die Implementierung muss die in PRD, Spezifikation und Datenmodell definierten Konto-, Einladungs-,
Tipprunden-, Audit- und Hard-Delete-Abläufe umsetzen. Die endgültige Rundlöschung bleibt sofort,
atomar und irreversibel; globale Wettbewerbsdaten und Nutzerkonten bleiben erhalten. Technische
Logs dürfen keine E-Mail-Adressen, Einladungs-Tokens, Tippinhalte oder privaten Rundennamen
enthalten.

Konkrete automatische Aufbewahrungsfristen dürfen erst als Produktverhalten veröffentlicht werden,
wenn sie implementiert und getestet sind. Bis dahin werden keine erfundenen Fristen genannt.

## 5. Gate-Entscheidung

**Entscheidung:** FREIGEGEBEN für den oben beschriebenen privaten V1-Betriebsrahmen  
**Freigebende Person:** Projekteigentümer und Repository-Inhaber `Daniel-Braun123`  
**Rolle/Berechtigung:** Product Owner  
**Freigabedatum:** 2026-07-13  
**Nachweis:** Nutzerentscheidung in diesem Codex-Task: „nur eine website für freunde“ und keine
Anschrift-/Steuerangaben

T013 ist damit abgeschlossen. Die Freigabe autorisiert weder eine öffentliche/geschäftliche Nutzung
noch erfundene Angaben und ersetzt nicht die spätere technische Prüfung des tatsächlichen
Nutzungs-/Datenschutzhinweises in T218 und T257.

## 6. Primärquellen zur Abgrenzung

- § 5 Digitale-Dienste-Gesetz: <https://www.gesetze-im-internet.de/ddg/__5.html>
- EU-Kommission zur rein persönlichen/privaten Datenverarbeitung:
  <https://commission.europa.eu/law/law-topic/data-protection/data-protection-explained_en>
- EuGH, C-212/13 (enge Auslegung der Haushaltsausnahme):
  <https://curia.europa.eu/site/upload/docs/application/pdf/2014-12/cp140175en.pdf>
