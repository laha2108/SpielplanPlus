# Hockey Spielplan Plus 3.3.30

Interner Neuaufbau auf Basis des Funktionsumfangs von 3.2.7:
- zentrales, normalisiertes Datenmodell
- Spielplan- und Tabellenparser getrennt
- Zuordnung der Mannschaften über Club-URLs
- Hervorhebung ausschließlich via CSS-Klasse
- gefilterter, unveränderlicher PDF-Snapshot
- gezielter MutationObserver, der eigene DOM-Änderungen ignoriert
- PDF-Vorschau, Gruppentabellen, Clublogos und Filter bleiben erhalten

- Korrektur: Der PDF-Snapshot enthält keine DOM-Knoten mehr. Dadurch verursacht structuredClone keine DataCloneError-Ausnahme mehr.
- Druck- und Einstellungsbuttons sind explizit type="button" und lösen keine Formulare der WHV-Seite aus.

- Eigene Mannschaft wird zusätzlich über die stabile Club-URL erkannt.
- Datumszuordnung verwendet die letzte Datumsüberschrift vor jeder Spielzeile; spätere Hallenspieltage werden vollständig erkannt.
- Spiel-IDs enthalten den Zeilenindex und kollidieren nicht bei wiederkehrenden Begegnungen.
- PDF-Zusammenfassung und Druckvorschau nutzen luftige Karten statt einer gequetschten Textzeile.

- Spielzeilen werden jetzt über die beiden Club-Links erkannt statt ausschließlich über Gruppenzellen.
- Datumsüberschriften werden nur aus direkten Textknoten/Attributen gelesen; Container mit geerbtem Datum verfälschen die Zuordnung nicht mehr.
- Der gesamte Dokumentbereich wird auf nachgeladene Spieltage überwacht; Filter-Dropdowns werden danach vollständig neu aufgebaut.

- Gruppentabellen werden anhand der tatsächlichen Mannschafts-URLs mit den Gruppen aus dem Spielplan abgeglichen. Die DOM-Reihenfolge oder Reiterreihenfolge bestimmt die Gruppenzuordnung nicht mehr.

- Tabellen werden wieder erkannt, auch wenn WHV-Tabellenzeilen keine anklickbaren Club-Links enthalten.
- Zuordnung nutzt vollständige Team-URL, Club-URL und Mannschaftsnamen als abgestufte Verfahren.
- Bei Gruppenfilter gibt es einen inhaltsbasierten Fallback auf die Tabelle mit den meisten Mannschaftsübereinstimmungen.

- Wenn die WHV-Tabelle technisch nicht im DOM erkennbar ist, wird je Gruppe eine vollständige Fallback-Tabelle aus dem Spielplan aufgebaut, sodass die Tabellen-Seite nicht mehr fehlt.
- PDF-Vorschau vollständig neu gestaltet: getrennte Kennzahlen, klarer Tabellenstatus, Dateiname und gut sichtbare Aktionen.

- Dropdowns bleiben geöffnet: Der MutationObserver ist während eigener UI-Aktualisierungen getrennt und ignoriert Erweiterungselemente.
- Eine zusammengefasste WHV-Tabelle wird an jeder wiederholten Kopfzeile in einzelne Gruppentabellen geteilt.
- Jede Teil-Tabelle wird über ihre Mannschaften genau einer Gruppe zugeordnet; Gruppen werden nicht mehrfach vergeben.

- Fehlerkorrektur: groupNameRosters ist wieder vollständig definiert und wird vor parseStandings geladen.
- Automatische Prüfung auf aufgerufene, aber nicht definierte HSP-Funktionen ergänzt.

- Unter jeder gedruckten Gruppentabelle werden Kennzahlen ausschließlich für das eigene Team ausgegeben: Punkte je Spiel, Siegquote, Ungeschlagen-Quote, Tore/Gegentore/Tordifferenz je Spiel sowie gefilterte Ansetzungen, beendete Spiele, Heim/Auswärts und Gegnerzahl.

- Modernisiertes PDF-Design mit weicheren Flächen, abgerundeten Containern, klarerer Typografie und dezenteren Tabellenlinien.
- Abstand zwischen Tabelle und Statistik auf 20px erhöht.
- Doppelte Tabellenangabe in der PDF-Vorschau entfernt.
- Vorschaukarten verwenden white-space: nowrap und eine breitere Dialogfläche.

- Spieltagsdarstellung repariert: Spieltabellen verwenden wieder ein eigenes, zusammengeklapptes Rahmenmodell mit vollständigen Zellrändern.
- Feste Spaltenbreiten, gleichmäßige Zeilenhöhen und stabile Ausrichtung für Heim, Gast, Ergebnis und Uhrzeit.
- Spieltagskopf als stabiles Raster; lange Spielorte werden abgeschnitten statt das Layout zu verschieben.

- Mehr visuelle Dynamik in der PDF: sportlicher Titelbereich, Akzentleisten, weichere Verläufe, stärkere Abschnittshierarchie, hervorgehobene eigene Spiele und lebendigere Statistik-Karten.
- Die reparierte Geometrie der Spieltagstabellen aus 3.3.11 bleibt unverändert.

- Spieltage verwenden jetzt dieselbe abgerundete Kartenstruktur wie die Gruppentabellen: gemeinsamer gerundeter Außenrahmen, weichere Kopfzeile und sauber maskierter Tabellenkörper.
- Instabile CSS-:has-Hervorhebung entfernt; dadurch keine roten Seitenbalken oder beschädigten Zellrahmen mehr.
- Eigene Mannschaft wird weiterhin ausschließlich als kompaktes rotes Badge hervorgehoben.

- Runde Schatten und geschlossene rechte Kanten für Spieltags- und Gruppentabellen.
- Statistik zeigt nur den konfigurierten langen Clubnamen, nicht zusätzlich den Kurznamen aus der Tabellenzeile.
- PDF-Fuß mit Erweiterungsname, Druckdatum/-zeit und Seite X / Y. Der Erweiterungsname wurde aus dem PDF-Kopf entfernt.

- Dekorativen Stern aus dem Statistikbereich entfernt.
- Abstand zwischen aufeinanderfolgenden Spieltagen von 22px auf 30px erhöht.
- PDF-Dateiname robuster: Titel von Druck-Frame und Elternseite wird unmittelbar vor dem Druckdialog auf den vorgesehenen Dateinamen gesetzt und danach zurückgesetzt.

- Statistik erweitert um Tabellenplatz, Punkteausbeute, Niederlagenquote, Torverhältnis, Gesamttore je Spiel, Bilanz, offene Ansetzungen und Spielplanfortschritt.
- Kennzahlenlayout auf vier Spalten für Tabellenwerte und drei Spalten für Spielplandaten optimiert.

- Statistik listet das beste und schlechteste abgeschlossene Spiel des eigenen Teams im aktuellen PDF-Filter auf. Grundlage ist die Tordifferenz aus Sicht des eigenen Teams; bei Gleichstand entscheiden erzielte beziehungsweise kassierte Tore.

- Statistik trennt Gruppenphasentabelle, weiterführende Runden und Gesamtturnier. Tore, Gegentore, Bilanz und Best-/Schlechtspiel berücksichtigen alle Folgerunden des eigenen Teams.
- Endplatzierung wird aus Spielen um Platz beziehungsweise dem Finale ermittelt, sofern ein abgeschlossenes entsprechendes Spiel erkannt wurde.
- Altersklasse aus der URL berücksichtigt das Geschlecht, zum Beispiel weibliche-u14 -> wU14 und maennliche-u16 -> mU16; der Dateiname verwendet diese Kennung.

- Ergebnisparser liest nur noch echte Ergebnisfelder, nie mehr Datum, Uhrzeit oder beliebigen Zeilentext. Unplausible Werte über 25 Tore werden verworfen. Dadurch entstehen keine falschen Ergebnisse wie 30:15 und keine fiktiven 39:20 Gesamttore.
- Wertungsfortschritt basiert auf den in der Gruppentabelle gewerteten Spielen im Verhältnis zu den angesetzten Gruppenspielen. Ergebniserfassung wird separat ausgewiesen.
- Platzierungsspiele der Formen „Spiel um Platz 11“, „Platz 11/12“ und „Platz 11-12“ werden ausgewertet.

- Ergebnis-Fallback liest plausible eindeutige Resultate aus der Spielzeile, schließt die Uhrzeit aus und akzeptiert keine Werte über 20. So wird 5:0 erkannt, ohne 15:30 oder 30:15 als Ergebnis zu übernehmen.
- Unsicher zuordenbare Spiele werden transparent gemeldet und nicht in Gesamtwerte eingerechnet. Weiterführende Runden werden nur über eindeutige Phasenbezeichnungen gezählt.
- Irreführender Wertungsfortschritt entfernt. Platzierungslabels mit „11 und 12“ beziehungsweise „11./12. Platz“ werden unterstützt.
- Alleinstehende leere Tabellenseite entfernt; Gruppentabellen dürfen bei Bedarf über Seiten umbrechen.

- Ergebnisse werden aus exakten Ergebniszellen beziehungsweise exakten Blatt-Elementen gelesen; Uhrzeitfelder sind ausgeschlossen.
- Phasen werden über echte Überschriften in Dokumentreihenfolge zugeordnet. Gruppenwerte stammen zuverlässig aus der Gruppentabelle; Zwischen-/Endrunden aus den zugehörigen Spielresultaten; Gesamtwerte kombinieren beide Quellen.
- Gruppentabelle und Statistik sind wieder getrennte Karten. Die abgerundete Tabelle bleibt geschlossen und wird nicht durch Statistik-/Seitenumbrüche zerlegt.

- WHV-Phasenbezeichnungen wie „Plätze 9-12“, „Spiele um die Plätze 9 bis 12“ und „Spiel um Platz 11 und 12“ werden als Platzierungsrunde erkannt.
- Weiterführende Runde zählt alle eigenen Spiele; Spiele ohne hinterlegtes Ergebnis werden separat ausgewiesen und nicht in Tore/Bilanz eingerechnet.
- Ergebnis 5:0 wird aus Ergebnisattributen, direktem Ergebnistext oder einem eindeutigen Ergebnis-Blattelement gelesen.
- Endplatzierung wird aus dem letzten abgeschlossenen Platzierungsspiel und dessen Platzbereich ermittelt.

- Zwei getrennte Aktionen: Spielplan erzeugt nur den Spielplan als PDF; Statistik erzeugt nur Tabellen und Statistiken. Beide besitzen eine eigene Druckvorschau.
- Ergebnis-Cache in storage.local: erkannte Resultate werden automatisch gespeichert, manuell ergänzte Resultate dauerhaft wiederverwendet.
- Vor der Statistik werden fehlende Ergebnisse vergangener eigener Spiele in einem separaten Dialog abgefragt. Zukünftige Spiele werden nicht abgefragt.

- Fehlende vergangene Ergebnisse werden nun vor Spielplan und Statistik abgefragt und dauerhaft gecacht.
- Zwischen-/Endrunden werden zusätzlich über die Zahl offizieller Gruppenspiele erkannt: eigene Spiele über dem Tabellenwert Sp. werden als Folgerunden ausgewertet.
- Statistikoption ergänzt; bei Deaktivierung wird der Statistikbutton nicht gerendert.
- Optionen schließen nach Speichern/Abbrechen; Speichern lädt alle geöffneten WHV-Seiten neu.

- Manuell bestätigte Ergebnisse haben dauerhaft Vorrang und werden durch WHV-Erkennung nicht überschrieben. Nicht bestätigte Folgerunden werden einmal mit vorausgefüllten Werten zur Kontrolle angeboten.
- Platzierungslogik für Viererbereich 9-12: Niederlage im ersten Spiel plus Sieg im zweiten ergibt Platz 11; Niederlage plus Niederlage ergibt Platz 12.
- Weiterführende Runde und Gesamtstatistik verwenden die bestätigten Heim-/Auswärtsergebnisse aus dem Cache.

- WHV-Zeilenphase wird direkt aus dem Spielblock gelesen, z. B. „Platzierungsrunde (Platz 9-12)“.
- Bei Ergebnisdarstellungen wie „5:0 (2:0)“ wird der erste Wert als Endstand und der zweite als Halbzeitstand behandelt.
- Damit fließt GHTC–Club Raffelberg 2 mit 5:0 in die Platzierungs- und Saisonstatistik ein.

- Abschlussplatzierung wird oberhalb der Gruppenphasentabelle als große Hervorhebung angezeigt.
- Gruppenphase und Platzierungsrunde/Endrunde verwenden identisch angeordnete Statistik-Kacheln.
- Shutouts werden je Phase als Spiele ohne Gegentor ausgewiesen.
- Bei zwei angezeigten Resultaten gilt weiterhin der obere Wert als Endstand; der untere Wert ist der Halbzeitstand.

- Ergebnisermittlung korrigiert: Bei Endstand und Halbzeitstand wird konsequent der zuerst/oben dargestellte Endstand verwendet.
- WHV-Ergebnisse haben Vorrang vor älteren manuellen Cachewerten; erkannte Ergebnisse werden nicht mehr zur Bestätigung vorgeschlagen.
- Beste/schlechteste Spiele und phasenbezogene Kennzahlen verwenden dieselbe korrigierte Ergebnisquelle.

- Endstand/Halbzeit robust korrigiert: Ergebnisfelder werden nach ihrer sichtbaren vertikalen Position ausgewertet. Das oben dargestellte Ergebnis ist verbindlich, versteckte responsive Duplikate werden ignoriert.
- Die Best-/Schlechtspielermittlung erhält ausschließlich diesen visuellen Endstand.

- Ergebnisparser erneut gehärtet: sichtbare atomare Ergebnisfelder werden in WHV-Quellreihenfolge gelesen; der erste Wert ist der Endstand, der zweite der Halbzeitstand.
- Der fehlerhaft befüllte Ergebnis-Cache älterer Parserstände wird beim ersten Start von 3.3.30 automatisch zurückgesetzt.

- Korrektur innerhalb Version 3.3.30: Endstand wird direkt aus der sichtbaren Zeilenreihenfolge gelesen. Bei „3:0 / 2:0“ gilt 3:0, bei „5:0 / 2:0“ gilt 5:0.
- Ergebnis-Cache wird wegen der Parserkorrektur erneut automatisch zurückgesetzt.

- Korrektur innerhalb Version 3.3.30: Statistikseite kompakter gestaltet und erzwungener Seitenumbruch vor der Gruppentabelle entfernt, damit Tabelle und Statistiken nach Möglichkeit auf Seite 1 passen.

- Korrektur innerhalb Version 3.3.30: Schatten unter der Abschlussplatzierung entfernt; Gruppentabelle als Abschlusstabelle der Gruppenphase beschriftet; bestes/schlechtestes Spiel mit Sieg/Niederlage ergänzt.

- Korrektur innerhalb Version 3.3.30: Gelb markierte Kopfzusätze und Ergebnisabdeckungs-Kacheln auf der Statistikseite entfernt.
- Bestes und schlechtestes Spiel gesamt über Gruppenphase und Platzierungs-/Endrunde ergänzt.
- Kompakte, einseitige DIN-A4-Statistik mit dezenten SVG-Symbolen für Gruppenphase, Endrunde und Gesamtturnier.

- Korrektur innerhalb Version 3.3.30: Statistik-Symbole deutlich vergrößert.
- Tabellengeometrie stabilisiert: feste Spaltenbreiten, zusammengeklappte Rahmen und geschlossene Außenkanten.
- Ergebnisdarstellung bei bestem und schlechtestem Spiel erfolgt immer aus Sicht der konfigurierten Mannschaft: eigene Tore zuerst, gegnerische Tore danach.

- Korrektur innerhalb Version 3.3.30: Ergebniszeile folgt der sprachlichen Paarung. Bei einer Niederlage wird das Siegergebnis des Gegners gegen die konfigurierte Mannschaft angezeigt, z. B. „Niederlage · 3:2 gegen Gladbacher HTC“. Bei einem Sieg wird das Ergebnis der konfigurierten Mannschaft gegen den Gegner angezeigt.

- Korrektur innerhalb Version 3.3.30: Die Bezeichnung Sieg, Unentschieden oder Niederlage wird bei besten und schlechtesten Spielen ausschließlich durch den Torvergleich ermittelt. Ein schlechtestes Spiel kann daher weiterhin ein Sieg sein, wenn alle Spiele der Phase gewonnen wurden.

- Korrektur innerhalb Version 3.3.30: Bestes und schlechtestes Spiel werden generell relativ aus allen abgeschlossenen Spielen ermittelt, unabhängig davon, ob alle Spiele Siege, Unentschieden oder Niederlagen sind. Die Ergebnisart wird separat anhand der Tore bestimmt.

- Korrektur innerhalb Version 3.3.30: Highlight-Karten werden immer aus Sicht der konfigurierten Mannschaft formuliert. Eigene Tore stehen links; nach „gegen“ wird stets der tatsächliche Gegner angezeigt. Eine Niederlage wird beispielsweise als „Niederlage · 3:4 gegen Düsseldorfer HC 2“ ausgegeben, nicht als Spiel gegen die eigene Mannschaft.

- Korrektur innerhalb Version 3.3.30: Plätze 1 bis 4 werden aus dem vollständigen Turnierbaum des letzten Tages von „Viertelfinale & Endrunde“ ermittelt. Die ersten beiden Spiele werden als Halbfinals ausgewertet; anschließend werden Finale und Spiel um Platz 3 über die Halbfinalsieger beziehungsweise Halbfinalverlierer eindeutig erkannt. Für mU14 ergibt dies GHTC Platz 1, Blau-Weiß Köln Platz 2, ETB Essen Platz 3 und Düsseldorfer HC 2 Platz 4.

- Korrektur innerhalb Version 3.3.30: Explizite Platzierungsrunden haben Vorrang vor der Top-4-Endrunde. In Platz 9-12 ergibt Niederlage im ersten und Sieg im zweiten Spiel Platz 11. Die Top-4-Ermittlung berücksichtigt ausschließlich Spiele mit der Phase „Viertelfinale & Endrunde“. Bei Ergebnissen aus dem Cache wird die gespeicherte Phase übernommen.

- Korrektur innerhalb Version 3.3.30: Vollständige WHV-Phasenbezeichnungen einschließlich „(Platz 9-12)“ werden gespeichert. Dadurch liefert Niederlage im ersten und Sieg im zweiten Spiel zuverlässig Platz 11. Die Cache-Migration behält manuell erfasste Ergebnisse bei und verwirft nur veraltete automatisch erkannte Einträge. Die Top-4-Endrunde bleibt separat funktionsfähig.

- Korrektur innerhalb Version 3.3.30: Endplatzierung trennt Top-4-Endrunde strikt von Platzierungsrunden. Ein Platzierungsbereich wird nur verwendet, wenn mindestens zwei eigene Spiele eindeutig demselben Bereich zugeordnet sind. „Viertelfinale & Endrunde“ wird vollständig erkannt. Statistik druckt stets nur die Gruppenphasentabelle der konfigurierten Mannschaft. Erwartete Kontrollwerte: mU14 Platz 1, wU14 Platz 11.

- Korrektur innerhalb Version 3.3.30: Gruppenphase und Endrunde werden für die eigene Mannschaft verbindlich über die offizielle Sp.-Zahl der Gruppenphasentabelle getrennt. Die ersten N eigenen Spiele sind Gruppenphase, nur nachfolgende Spiele sind Platzierungs-/Endrunde. Dadurch erscheinen Gruppen-Best-/Schlechtspiel wieder und das Gruppenphasenspiel gegen DSC wird nicht mehr der Endrunde zugerechnet.

- Korrektur innerhalb Version 3.3.30: Hat die konfigurierte Mannschaft keine Spiele nach der offiziellen Gruppenphase, werden Platzierungsrunde/Endrunde, Gesamtturnier und die leere Abschlussplatzierung vollständig ausgeblendet. In diesem Sonderfall zeigt die Statistikseite ausschließlich Gruppenphasentabelle und Gruppenphasenstatistik.

- Korrektur innerhalb Version 3.3.30: Eine Saison gilt als noch nicht abgeschlossen, solange eine zukünftige Spielpaarung ohne Ergebnis vorhanden ist. In diesem Zustand wird die Endplatzierung grau schraffiert und nicht berechnet; unter der Statistik erscheint „Saison noch nicht abgeschlossen“. Nach Abschluss erscheint „Saison abgeschlossen“ und die ermittelte Endplatzierung wird angezeigt.

- Darstellung angepasst: Das Endplatzierungslabel bleibt bei laufender Saison grau schraffiert. Der Saisonhinweis unter der Statistik erscheint bei laufender Saison rot und bei abgeschlossener Saison grün.

- Kopfbereich erweitert: Unter Altersklasse und Spielform wird die Liga (Regionalliga, Oberliga oder Verbandsliga) angezeigt. In der Feldsaison erhoeht sich der Spieltagszaehler nur an Terminen mit einem Spiel der konfigurierten Mannschaft.

- Statistikdruck auf eine DIN-A4-Seite verdichtet. Feld U8/U10 verwendet wie die Halle das Turnierformat: alle Paarungen eines Datums bilden einen Spieltag. Ab Feld U12 gilt jedes eigene Spiel als einzelner Spieltag; fremde Paarungen erhoehen den Zaehler nicht.

- Statistik skaliert beim Drucken dynamisch auf die verfuegbare DIN-A4-Druckhoehe. Kurze Statistiken bleiben in Originalgroesse; umfangreichere Statistiken werden nur so weit verkleinert, wie fuer eine Seite erforderlich.

- Spielplanblockbildung angepasst: Ist der Filter 'nur eigener Verein' nicht aktiviert, werden alle Partien mit derselben Spieltagsnummer in einem gemeinsamen Spieltagsblock ausgegeben. Bei aktiviertem Filter bleibt die feinere Gruppierung nach Spieltag, Datum und Spielort erhalten.

- Feldspielplaene werden grundsaetzlich ausschliesslich fuer die konfigurierte Mannschaft erzeugt. Der bisherige 'nur eigener Verein'-Schalter wird in der Feldsaison nicht mehr angeboten; Hallensaisons bleiben unveraendert.

- Spielplanstatus erweitert: Bei abgeschlossenen Spieltagsbloecken wird die Spalte 'Uhrzeit' zu 'Status' und zeigt 'ABGESCHLOSSEN'. Offene Spiele ohne Uhrzeit zeigen unter der Spaltenueberschrift 'Uhrzeit' den Wert 'AUSSTEHEND'. Offene Spiele mit Uhrzeit zeigen weiterhin die Anstosszeit.

- Lesbarkeit der Statistik verbessert: Zuerst werden Abstaende und Kartenhoehen moderat verdichtet, danach wird die Grundschrift dynamisch zwischen 9 px und 7,2 px angepasst. Eine zusaetzliche Restskalierung ist auf mindestens 82 Prozent begrenzt. Die Statistik bleibt maximal eine DIN-A4-Seite gross.

- Endplatzierung um die Gesamtzahl der teilnehmenden Mannschaften erweitert. Die Anzahl wird aus allen eindeutigen Heim- und Auswaertsmannschaften des Wettbewerbs ermittelt und beispielsweise als '11. Platz von 20' dargestellt.

- Kopfbereich vereinheitlicht: Der Spielplan verwendet jetzt denselben kompakten Kopf wie die Statistik. Der zusaetzliche Spielplan-Kicker und die Zusammenfassungskarten im PDF-Kopf wurden entfernt.

- Statistik erweitert: Das Clublogo der konfigurierten Mannschaft erscheint im Statistik-Kopf. Liegt fuer die eigene Mannschaft noch kein einziges Ergebnis vor, wird ohne PDF-Erstellung direkt der Hinweis 'Noch keine Ergebnisse zur Auswertung vorhanden.' angezeigt.

- Clublogos in den Spiel-Highlights ergaenzt: Bei bestem und schlechtestem Spiel wird das Logo des jeweiligen gegnerischen Vereins unmittelbar vor dem Vereinsnamen angezeigt. Fehlt ein Logo, bleibt die Darstellung ohne leeren Platzhalter stabil.

- Darstellung der Clublogos in den Spiel-Highlights ueberarbeitet: Ergebnis, 'gegen', Logo und Gegner stehen jetzt kompakt auf einer gemeinsamen Grundlinie. Das Logo wurde auf 12 px reduziert; unruhige Zeilenumbrueche werden vermieden.

- Endplatzierung unter dem Kopf klarer gestaltet: linksausgerichtete Ergebnisleiste mit stark hervorgehobenem Platz, eindeutiger Beschriftung und ruhiger Zusatzzeile. Der offene Zustand zeigt statt eines Gedankenstrichs nun 'Noch offen' und bleibt grau schraffiert.

- Endplatzierung zentriert und mit einer kleinen Pokalgrafik aufgewertet. Beschriftung, Platzierung und Zusatztext werden durchgehend schwarz dargestellt; dies gilt auch fuer den grau schraffierten offenen Zustand.

- Missverstaendliche Pokalgrafik bei der Endplatzierung entfernt. Stattdessen wird ein neutrales Ranglisten-/Balkensymbol verwendet, das fuer jede Platzierung geeignet ist.

- Platzierungsbild dynamisch: Goldener Pokal fuer Platz 1, silberner Pokal fuer Platz 2, bronzener Pokal fuer Platz 3 und eine neutrale Urkunde fuer alle weiteren beziehungsweise noch offenen Platzierungen.

- PDF-Vorschauen modernisiert: weichgezeichneter Hintergrund, klarer Dialogkopf mit Modussymbol, responsive Informationskarten, Dateibereich mit Dokument-Symbol, modernisierte Schaltflaechen sowie Schliessen per Klick auf den Hintergrund.

- Gruppenauswahl erweitert: Gruppen mit Partien des konfigurierten Clubs werden im Dropdown mit einem Stern und einer roten Hervorhebung gekennzeichnet. Bei Auswahl einer eigenen Gruppe wird auch das geschlossene Auswahlfeld farblich hervorgehoben.

- Hinweis bei fehlender Statistik modernisiert: Statt eines Browser-Alerts erscheint ein eigener Dialog mit unscharfem Hintergrund, Informationsgrafik, klarer Erklaerung und Schaltflaeche. Der Dialog kann per Schaltflaeche, Escape oder Klick auf den Hintergrund geschlossen werden.

- Gesamtspielplan ueber alle Gruppen erweitert: Jede Partie zeigt vor der Heimmannschaft ein kompaktes rotes Gruppenkennzeichen mit fettem Buchstaben beziehungsweise Gruppenkuerzel. Bei Auswahl einer einzelnen Gruppe wird die Kennzeichnung ausgeblendet. Gilt fuer Halle und Feld.

- Gesamtspielplan verbessert: Die Gruppe steht in einer eigenen schmalen Spalte vor Heim und Gast. Innerhalb jedes Spieltags werden Partien bei Alle-Gruppen-Auswahl nach Gruppen sortiert und durch kompakte Gruppentrenner gegliedert. Tabellenzeilen und Tabellenkopf wurden in der Hoehe reduziert.

- Onlinefilter korrigiert: Die Checkbox "nur mein Verein" mit Clublogo bleibt in der Feldansicht sichtbar und filtert nur die Onlineanzeige. Der gewaehlte Spieltag wird im Dropdown als "Aktueller Spieltag" bezeichnet; die uebrigen Eintraege behalten ihre Spieltagsnummer.

- Spieltagsfilter fachlich korrigiert: Spieltage werden nicht mehr aus unterschiedlichen Kalenderdaten abgeleitet, sondern als laufende Spielnummer jeder Mannschaft innerhalb ihrer Gruppe. Spieltag 4 zeigt damit gruppenuebergreifend alle vierten Mannschaftsspiele, unabhaengig vom Datum. Die Dropdown-Anzahl ergibt sich aus der hoechsten tatsaechlich ermittelten Spielnummer.

- Steuerelemente vom Bereich Aktueller Spieltag ausgeschlossen: Gruppenauswahl, Spieltagsauswahl, Vereinscheckbox sowie Spielplan- und Statistikschaltflaeche werden nur noch am regulaeren Spielplanbereich eingefuegt. Ein gleichnamiger Unterbereich innerhalb Aktueller Spieltag wird bewusst uebersprungen.

- Steuerelemente werden ausschliesslich im Bereich Alle Spiele angezeigt, nicht im Bereich Aktueller Spieltag. Der Spielauswahl-Dropdown erkennt und listet vorhandene Qualifizierungsrunden, Platzierungsrunden, Viertelfinals, Halbfinals sowie Endrunden/Finals als separate Filter. Die Auswahl Alle Spiele zeigt den vollstaendigen Plan.

- Einfuegeposition der Steuerung korrigiert: Alle Spiele wird nun als WHV-Tab erkannt, auch wenn das Element keine HTML-Ueberschrift ist. Dropdowns, Vereinscheckbox, Spielplan, Statistik und Einstellungen werden direkt unter der Tabzeile eingefuegt; im Tab Aktueller Spieltag werden keine Steuerelemente erzeugt.

- Rundenfilter korrigiert: Qualifikationsturnier wird neben Qualifizierungsrunde erkannt. Der kombinierte WHV-Bereich Viertelfinale & Endrunde wird als eigener Dropdown-Eintrag angeboten und funktioniert trotz kombinierter Bezeichnung. Die Endrunden-Auswahl umfasst zugleich Finale, Finalrunde und Endrunde. Onlineansicht und PDF verwenden identische Filterlogik.

- Rundenfilter technisch getrennt: Jede Partie erhaelt beim Parsen einen eindeutigen phaseFilterKey. Viertelfinale & Endrunde wird nicht mehr gleichzeitig dem separaten Endrunde/Finale-Filter zugeordnet. Ein eigenstaendiger Eintrag Endrunde/Finale erscheint nur bei eigenstaendig erkannten Final-/Endrundenpartien. Online- und PDF-Filter greifen exakt auf denselben Schluessel zu.

- Online-Vereinsfilter repariert: Die Checkbox "nur mein Verein" filtert nun in Halle und Feld unabhaengig von der Spielform. Bei gesetztem Haken bleiben ausschliesslich Partien der konfigurierten Mannschaft sichtbar; beim Entfernen des Hakens werden alle Paarungen des aktuellen Gruppen-/Spieltags-/Rundenfilters wieder eingeblendet.

- Onlinefilter technisch gehaertet: Ausgeblendete WHV-Spielzeilen erhalten nun zusaetzlich zum Inline-Stil das hidden-Attribut, ein eigenes Datenattribut und eine display:none!important-Regel. Dadurch koennen WHV-Layoutregeln die Filterung nicht mehr ueberschreiben. Der Rundendropdown reagiert sowohl auf change als auch input.

- Kombinierte Rundenfilter nochmals korrigiert: Die Erkennung liest jetzt nicht nur das intern ermittelte Phasenfeld, sondern auch den tatsaechlich sichtbaren Text der WHV-Spielzeile. Sowohl & als auch &amp; werden behandelt. Ausgeblendet wird der aeusserste Container, der genau eine Partie mit zwei Clublinks enthaelt, damit nicht nur ein inneres unsichtbares Teilsegment gefiltert wird.

- Online-Rundenfilter grundlegend repariert: Vor jedem Filterlauf werden die aktuell von WHV gerenderten Spielzeilen neu eingelesen. Dadurch greifen Dropdown und Vereinscheckbox auch dann, wenn WHV die Zeilenelemente nach dem Seitenaufbau ersetzt hat. Ereignisse werden stabil ueber addEventListener verarbeitet.

- Filter Viertelfinale & Endrunde korrigiert: Die Zuordnung verwendet nun vorrangig den direkt sichtbaren Rundentext im vollstaendigen Spielcontainer. Zeilen mit Gruppe A/B/C usw. werden explizit als Gruppenphase klassifiziert und bei Auswahl der kombinierten Endrunde sicher ausgeblendet. Nur sichtbare Zeilen mit Viertelfinale und Endrunde bleiben stehen.

- Spieltagsfilter auf Heimspielzaehlung umgestellt: Fuer Spieltag X wird je Gruppe das X-te Spiel jeder Heimmannschaft verwendet. Auswaertseinsaetze erhoehen den Zaehler der Mannschaft nicht. Ein erstes Heimspiel des DHC ist damit Spieltag 1, auch wenn DHC zuvor bereits auswaerts gespielt hat.

- Spieltagszuordnung praezisiert: Eine Partie gehoert zu Spieltag X, wenn sie das X-te Gesamtspiel der Heimmannschaft innerhalb ihrer Gruppe ist. Vorherige Auswaertsspiele der spaeteren Heimmannschaft werden mitgezaehlt. Das Kalenderdatum ist fuer die Zuordnung nicht relevant.

- Spieltagszaehlung entscheidend korrigiert: Konkrete Mannschaften desselben Clubs werden nicht mehr ueber die gemeinsame Club-URL zusammengefasst. DHC und DHC 2 besitzen getrennte Zaehler. Vor der Nummerierung werden alle Partien chronologisch nach Datum sortiert; anschliessend erhaelt eine Partie die laufende Gesamtspielnummer ihrer Heimmannschaft.

- Spieltagszaehlung gegen doppelte responsive WHV-Spielzeilen abgesichert. Identische Partien mit gleicher Gruppe, Datum, Heim- und Gastmannschaft erhoehen die Mannschaftszaehler nur einmal und erhalten dieselbe Spieltagsnummer. Das erste Spiel SG MSV Duisburg / Preussen Duisburg gegen Duesseldorfer HC 2 wird dadurch Spieltag 1 zugeordnet.

- Spieltagsfilter final auf die Heimmannschaft ausgerichtet: Spieltag X zeigt das X-te Spiel, in dem jede konkrete Mannschaft als Heimmannschaft gefuehrt wird. Auswaertsspiele werden fuer diesen Zaehler bewusst nicht beruecksichtigt. Das erste Heimspiel SG MSV Duisburg / Preussen Duisburg gegen Duesseldorfer HC 2 ist damit zwingend Spieltag 1.

- Spieltagsfilter wird nun bei jeder Dropdown-Auswahl unmittelbar aus den aktuell gerenderten WHV-Partien neu berechnet. Fuer jede konkrete Heimmannschaft wird ein eigener Zaehler gefuehrt; Gastauftritte beeinflussen ihn nicht. Dadurch liegen SG MSV Duisburg / Preussen Duisburg gegen DHC 2 und DHC 2 gegen Crefelder HTC jeweils auf Spieltag 1, da beide Heimmannschaften dort ihr erstes Heimspiel haben.

- Zu viele Paarungen im Spieltagsfilter korrigiert: Responsive WHV-Duplikate werden nicht nur bei der Nummerierung erkannt, sondern im sichtbaren Filterergebnis konsequent ausgeblendet. Pro Gruppe, Datum, Heimteam, Gastteam, Uhrzeit und Ergebnis bleibt genau eine Paarung sichtbar.

- Spieltage werden nun einmalig aus dem vollstaendigen ungefilterten Spielplan in einem Matchday-Cache aufgebaut. Der stabile Mannschaftsschluessel nutzt den vollstaendigen Team-URL-Pfad statt nur Clubnamen oder Club-ID. Bei jeder Onlinefilterung werden neu gerenderte WHV-Zeilen ausschliesslich gegen diesen Cache aufgeloest; bereits ausgeblendete Zeilen koennen die Nummerierung nicht mehr veraendern.

- Fehler im Matchday-Cache korrigiert: Der vollstaendige Mannschaftsname ist jetzt der primaere Schluessel. WHV-Clublinks koennen fuer DHC und DHC 2 identisch sein und duerfen deshalb nicht zur Mannschaftszaehlung verwendet werden. Spieltag X bleibt das X-te Gesamtspiel der aktuellen Heimmannschaft, wobei vorherige Heim- und Auswaertsspiele dieser konkreten Mannschaft mitzaehlen.

- Spieltags-Cache fachlich korrigiert: Die Spieltagsnummer einer Paarung ist jetzt die naechste gemeinsame laufende Spielnummer beider beteiligten Mannschaften. Hatte Heim oder Gast bereits vorher ein Spiel, wird die folgende Paarung entsprechend hoeher eingestuft. Dadurch ist Marienburger SC gegen Bonner THV Spieltag 1, Rot-Weiss Koeln 2 gegen Bonner THV dagegen Spieltag 2.

- Hallen-PDF korrigiert: Beim Druck ueber alle Gruppen werden die Paarungen zuerst nach Gruppe und innerhalb der Gruppe nach Spieltag und Datum sortiert. Dadurch stehen alle Spieltage einer Gruppe geschlossen hintereinander. Feld-PDFs und der Druck einer einzeln ausgewaehlten Gruppe behalten ihre bisherige Reihenfolge.

- Hallen-Spieltage separat geregelt: Innerhalb jeder Gruppe bildet jedes Datum genau einen Spieltag. Alle Partien einer Gruppe am selben Datum erhalten dieselbe Spieltagsnummer; erst beim naechsten Datum dieser Gruppe wird erhoeht. Die Feldlogik bleibt getrennt und unveraendert.

- Tabfilter: Beim Wechsel zu Aktueller Spieltag werden Gruppen-, Spieltags- und Rundenfilter aufgehoben; nur Nur Spiele bleibt aktiv. Beim Wechsel zu Alle Spiele wird das Modell neu aufgebaut und die Dropdowns werden neu erzeugt.

- Erster Wechsel zu Alle Spiele stabilisiert: Alte Tab-Steuerelemente werden sofort entfernt. Der Neuaufbau wird nach dem verzögerten WHV-Rendering wiederholt, bis die vollständige Steuerleiste mit beiden Dropdowns vorhanden ist. Dadurch erscheint beim ersten Wechsel nicht mehr nur der Clubfilter.

- Erster Wechsel zu Alle Spiele erneut korrigiert: Der Neuaufbau wartet jetzt jeweils auf den Abschluss von initialize und prueft nicht nur auf zwei Select-Felder, sondern auf geladene Gruppen, beide Dropdowns sowie Spielplan- und Statistikschaltflaeche. Solange die WHV-Daten noch nicht vollstaendig gerendert sind, wird der Aufbau kontrolliert wiederholt.

- Erster Wechsel zu Alle Spiele repariert: Das vollstaendige ungefilterte Datenmodell wird zwischengespeichert und beim Tabwechsel sofort zur Erzeugung aller Dropdowns und Schaltflaechen verwendet. Eine spaetere WHV-Neuanalyse ersetzt den Cache nur, wenn mindestens ebenso viele Partien erkannt wurden.

- Tabwechsel deterministisch neu aufgebaut: Nach dem WHV-Tabklick wird auf stabile, nicht-leere Spielzeilen gewartet, dann das Modell direkt neu erstellt und die Steuerleiste fuer den Zieltab sichtbar erzwungen. Alle Spiele zeigt immer die vollstaendige Leiste; Aktueller Spieltag nur den Clubfilter.

- Vollstaendiger Spielplan wird beim ersten Seitenaufbau unsichtbar vorgeladen: Die Erweiterung wechselt intern zu Alle Spiele, wartet auf stabile Spielzeilen, erstellt das vollstaendige Modell fuer Gruppen und Spieltage und kehrt anschliessend zu Aktueller Spieltag zurueck. Beim sichtbaren Wechsel zu Alle Spiele stehen Dropdowns und Schaltflaechen dadurch bereits vollstaendig bereit.
