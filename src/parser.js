(() => {
  'use strict';
  const H = globalThis.HSP;
  H.datePattern = /\b(?:Mo|Di|Mi|Do|Fr|Sa|So)?\.?\s*\d{1,2}\.\d{1,2}\.(?:\d{4}|\d{2})\b/i;
  H.directText = element => H.clean([...element.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent).join(' '));
  H.dateMarkers = () => {
    const markers = [];
    for (const element of document.querySelectorAll('time,h1,h2,h3,h4,h5,div,span,p')) {
      if (element.closest?.('[data-hsp-owned="true"]')) continue;
      const values = [element.getAttribute?.('datetime') || '', element.getAttribute?.('aria-label') || '', H.directText(element)];
      const value = values.find(text => H.datePattern.test(text));
      if (!value) continue;
      const match = value.match(H.datePattern);
      if (match) markers.push({
        element, date: H.clean(match[0])
      });
    }
    return markers.filter((marker, index, array) => !array.slice(0, index).some(previous => previous.date === marker.date && previous.element.contains(marker.element)));
  };
  H.dateForRow = (row, markers) => {
    const own = H.directText(row).match(H.datePattern);
    if (own) return H.clean(own[0]);
    let last = '';
    for (const marker of markers) {
      const relation = marker.element.compareDocumentPosition(row);
      if (relation & Node.DOCUMENT_POSITION_FOLLOWING) last = marker.date;
    }
    return last;
  };
  H.weekday = text => {
    const m = String(text).match(/(\d{1,2})\.(\d{1,2})\.(\d{4}|\d{2})/);
    if (!m) return text;
    let y = +m[3];
    if (y < 100) y += 2000;
    const d = new Date(y, +m[2] - 1, +m[1], 12);
    return `${new Intl.DateTimeFormat('de-DE', { weekday: 'long' }).format(d)}, ${String(text).replace(/^(?:Mo|Di|Mi|Do|Fr|Sa|So)\.?\s*/i, '')}`
  };
  H.rowCandidates = () => {
    const rows = [];
    const seen = new Set();
    for (const link of document.querySelectorAll('a[href*="/club/"]')) {
      let row = H.rowOf(link);
      if (!row) {
        let current = link.parentElement;
        while (current && current !== document.body) {
          if (current.querySelectorAll('a[href*="/club/"]').length >= 2) {
            row = current;
            break
          }
          current = current.parentElement;
        }
      }
      if (!row || seen.has(row)) continue;
      const links = [...row.querySelectorAll('a[href*="/club/"]')];
      const distinct = new Set(links.map(item => item.href));
      if (distinct.size < 2) continue;
      seen.add(row);
      rows.push(row);
    }
    return rows;
  };
  H.teamFromLink = (link, row) => {
    const url = link.href || '';
    const desktop = [...row.querySelectorAll(H.S.teamDesktop)].find(element => element.closest('a[href*="/club/"]') === link || link.contains(element));
    const mobile = [...row.querySelectorAll(H.S.teamMobile)].find(element => element.closest('a[href*="/club/"]') === link || link.contains(element));
    const clone = link.cloneNode(true);
    clone.querySelectorAll('[aria-hidden="true"],[class*="mobile"],[class*="short"],[class*="abbreviation"]').forEach(element => element.remove());
    const name = H.clean(desktop?.textContent) || H.clean(clone.textContent) || H.clean(mobile?.textContent);
    let logo = H.imgUrl(link);
    if (!logo) {
      for (let current = link.parentElement, i = 0;
        current && current !== row && i < 5;
        i++, current = current.parentElement) {
        logo = H.imgUrl(current);
        if (logo) break;
      }
    }
    return {
      name, clubUrl: url, logo
    };
  };
  H.parseTeams = row => {
    const result = [];
    const seen = new Set();
    for (const link of row.querySelectorAll('a[href*="/club/"]')) {
      const key = H.clubUrlKey(link.href) + '|' + link.href.split('/').at(-1);
      if (seen.has(key)) continue;
      const team = H.teamFromLink(link, row);
      if (!team.name || /spielort|sportanlage|halle|stadion/i.test(team.name)) continue;
      seen.add(key);
      result.push(team);
    }
    return result.slice(0, 2);
  };
  H.findText = (row, sels) => {
    for (const selector of sels) for (const element of row.querySelectorAll(selector)) {
      const value = H.clean(element.textContent);
      if (value) return value
    }
    return ''
  };
  H.groupForRow = row => {
    const cell = row.querySelector(H.S.groupCell) || row.querySelector('[class*="group"]');
    const direct = H.clean(cell?.textContent).match(/\bGruppe\s+[A-Z0-9]+\b/i)?.[0];
    return direct || H.clean(row.textContent).match(/\bGruppe\s+[A-Z0-9]+\b/i)?.[0] || '';
  };
  H.phasePattern = /\b(Qualifikationsturnier|Qualifizierungsrunde|Qualifikation|Finalrunde|Endrunde|Zwischenrunde|Halbfinale|Finale|Viertelfinale|Platzierung(?:srunde|sspiele)?|Spiele? um (?:die )?Pl[aä]tze?\s*\d+(?:\s*(?:[-/]|bis|und)\s*\d+)?|Pl[aä]tze?\s*\d+\s*(?:[-/]|bis|und)\s*\d+|\d+\.?\s*(?:[-/]|bis|und)\s*\d+\.?\s*Pl[aä]tze?|Gruppenphase|Gruppe\s+[A-Z0-9]+)\b/i;
  H.phaseLabel = value => {
    const text = H.clean(value);
    if (/viertelfinale\s*&\s*endrunde/i.test(text)) return 'Viertelfinale & Endrunde';
    const placement = text.match(/(?:Platzierungs(?:runde|spiele)?|Spiele? um (?:die )?Pl[aä]tze?)\s*(?:\(\s*)?(?:Platz|Pl[aä]tze)?\s*(\d+)\s*(?:[-/]|bis|und)\s*(\d+)\s*\)?/i);
    if (placement) return `Platzierungsrunde (Platz ${Number(placement[1])}-${Number(placement[2])})`;
    const exact = text.match(/Spiel(?:e)? um (?:den )?Platz\s*(\d+)/i);
    if (exact) return `Spiel um Platz ${Number(exact[1])}`;
    return text.match(H.phasePattern)?.[0] || '';
  };
  H.phaseMarkers = () => {
    const markers = [];
    for (const element of document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"],[class*="headline"],[class*="title"],[class*="round"],[class*="phase"]')) {
      if (element.closest?.('[data-hsp-owned="true"]')) continue;
      const text = H.clean(element.textContent);
      const label = H.phaseLabel(text);
      if (label) markers.push({
        element, label
      });
    }
    return markers;
  };
  H.phaseForRow = (row, markers) => {
    const rowPhase = H.phaseLabel(H.clean(row.textContent));
    if (rowPhase && H.phaseType(rowPhase) !== 'group') return rowPhase;
    const localGroup = H.groupForRow(row);
    let nearest = '';
    for (const marker of markers) {
      const relation = marker.element.compareDocumentPosition(row);
      if (relation & Node.DOCUMENT_POSITION_FOLLOWING) nearest = marker.label;
    }
    const nearestType = H.phaseType(nearest);
    if (nearest && nearestType !== 'group') return nearest;
    return localGroup || nearest;
  };
  H.phaseType = value => {
    const text = H.norm(value);
    if (text.startsWith('gruppe') || text.includes('gruppenphase')) return 'group';
    if (text.includes('qualifikationsturnier') || text.includes('qualifizierungsrunde') || text.includes('qualifikation')) return 'qualification';
    if (text.includes('viertelfinale')) return 'quarterfinal';
    if (text.includes('halbfinale')) return 'semifinal';
    if (text.includes('spiel um platz') || text.includes('spiele um') || text.includes('platzierung') || text.includes('plätze') || /platz\s*\d+/.test(text)) return 'placement';
    if (text.includes('finale') || text.includes('finalrunde')) return 'final';
    if (text.includes('zwischenrunde') || text.includes('endrunde')) return 'knockout';
    return 'other';
  };
  H.scoreCandidates = value => {
    const text = String(value || '');
    return [...text.matchAll(/(?:^|\s)(\d{1,2})\s*:\s*(\d{1,2})(?=\s|$|\(|n\.?P\.?|SO)/gi)].map(match => ({
      home: Number(match[1]), away: Number(match[2]), text: `${Number(match[1])}:${Number(match[2])}`
    })).filter(score => score.home <= 25 && score.away <= 25);
  };
  H.exactScore = value => {
    const match = H.clean(value).match(/^(?:Ergebnis\s*)?(\d{1,2})\s*[:\-]\s*(\d{1,2})(?:\s*(?:n\.?P\.?|SO))?$/i);
    if (!match) return '';
    const home = Number(match[1]), away = Number(match[2]);
    return home <= 20 && away <= 20 ? `${home}:${away}` : '';
  };
  H.scoreFromResultContainer = value => {
    const text = H.clean(value);
    const match = text.match(/(?:^|\s)(\d{1,2})\s*[:\-]\s*(\d{1,2})(?=\s|$|\()/);
    if (!match) return '';
    const home = Number(match[1]), away = Number(match[2]);
    return home <= 20 && away <= 20 ? `${home}:${away}` : '';
  };
  H.resultFromRow = row => {
        /* WHV renders a pairing as: final score first, halftime score second.
     innerText follows the visible reading order, unlike the responsive child DOM. */ const visibleText = String(row.innerText || '');
    const timeMatch = visibleText.match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)(?:\s*Uhr)?\b/i);
    const timeValue = timeMatch ? `${Number(timeMatch[1])}:${Number(timeMatch[2])}` : '';
    const scores = [...visibleText.matchAll(/(\d{1,2})\s*:\s*(\d{1,2})/g)].map(match => ({
      home: Number(match[1]), away: Number(match[2])
    })).filter(score => score.home <= 25 && score.away <= 25).map(score => `${score.home}:${score.away}`).filter(score => score !== timeValue);
    if (scores.length) return scores[0];
        /* Fallback for rows without usable innerText. Keep source order and choose the first
     score from a result container. */ for (const element of row.querySelectorAll('[data-result],[data-score],[aria-label*="Ergebnis"],[class*="result"],[class*="score"],[class*="ergebnis"]')) {
      for (const source of [element.getAttribute('data-result'), element.getAttribute('data-score'), element.getAttribute('aria-label'), element.textContent]) {
        const candidates = [...String(source || '').matchAll(/(\d{1,2})\s*:\s*(\d{1,2})/g)].map(match => `${Number(match[1])}:${Number(match[2])}`).filter(score => score !== timeValue && score.split(':').every(value => Number(value) <= 25));
        if (candidates.length) return candidates[0];
      }
    }
    return '';
  };
  H.resultCacheKey = (rawDate, home, away) => [rawDate || 'kein-datum', H.teamIdentity?.(home?.clubUrl) || H.clubUrlKey(home?.clubUrl) || H.norm(home?.name), H.teamIdentity?.(away?.clubUrl) || H.clubUrlKey(away?.clubUrl) || H.norm(away?.name)].join('|');
  H.parseGame = (row, dateIndex, markers, phaseMarkers, rowIndex) => {
    const teams = H.parseTeams(row);
    if (teams.length < 2) return null;
    const rawDate = H.dateForRow(row, markers);
    const phase = H.phaseForRow(row, phaseMarkers);
    const parsedGroup = H.groupForRow(row) || (/^Gruppe\s+/i.test(phase) ? phase : '');
    const result = H.resultFromRow(row);
    const timeMatch = H.clean(row.textContent).match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)(?:\s*Uhr)?\b/i);
    const cacheKey = H.resultCacheKey(rawDate, teams[0], teams[1]);
    const cachedEntry = H.state.resultCache?.[cacheKey] || null;
    const cachedResult = cachedEntry?.result || '';
    const manualResult = cachedEntry?.source === 'manual' ? cachedResult : '';
        /* Current WHV result is authoritative; manual/cache values are fallback only. */ const effectiveResult = result || manualResult || cachedResult;
    return {
      id: row.dataset.gameId || `${rawDate}|${rowIndex}|${teams[0].clubUrl}|${teams[1].clubUrl}`, cacheKey, resultSource: manualResult ? 'manual' : result ? 'page' : cachedResult ? (cachedEntry?.source || 'cache') : 'missing', row, group: parsedGroup, phase: phase || cachedEntry?.phase || '', phaseType: H.phaseType(phase || cachedEntry?.phase || ''), phaseFilterKey: (() => {
        const phaseText = H.norm(phase || cachedEntry?.phase || '');
        if (phaseText.includes('qualifikation')) return 'qualification';
        if (phaseText.includes('platzierung') || phaseText.includes('spiele um') || phaseText.includes('spiel um platz')) return 'placement';
        if (phaseText.includes('viertelfinale') && phaseText.includes('endrunde')) return 'quarterfinal-endround';
        if (phaseText.includes('viertelfinale')) return 'quarterfinal';
        if (phaseText.includes('halbfinale')) return 'semifinal';
        if (phaseText.includes('endrunde') || phaseText.includes('finalrunde') || phaseText.includes('finale')) return 'finals';
        return H.phaseType(phase || cachedEntry?.phase || '');
      })(), rawDate, date: H.weekday(rawDate), matchday: (dateIndex.get(rawDate) ?? -1) + 1, time: timeMatch ? `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}` : '', result: effectiveResult, completed: !!effectiveResult, location: H.findText(row, [H.S.location]) || 'ausstehend', home: teams[0], away: teams[1]
    };
  };
  H.scheduleTeamKey = team => {
        /* Die WHV-Links zeigen teilweise nur auf den Verein und sind deshalb fuer
     DHC, DHC 2 usw. identisch. Fuer den Spielzaehler muss die konkrete
     Mannschaft massgeblich sein. */ const name = H.norm(team?.name || '');
    if (name) return name;
    try {
      const url = new URL(team?.clubUrl || '', location.href);
      return decodeURIComponent(url.pathname).replace(/\/+$/, '').toLowerCase();
    }
    catch {
      return ''
    }
  };
  H.scheduleFixtureKey = game => [game.rawDate || '', H.scheduleTeamKey(game.home), H.scheduleTeamKey(game.away), H.norm(game.group || '')].join('|');
  H.buildMatchdayCache = games => {
    const cache = new Map(), seen = new Set();
    const dated = [...games].map((game, index) => ({
      game, index, date: H.gameDateValue?.(game.rawDate)?.getTime?.() || 0
    })).sort((left, right) => left.date - right.date || left.index - right.index);
    if (!H.isField()) {
            /* Halle: Ein Datum innerhalb einer Gruppe ist genau ein Spieltag.
       Alle Partien derselben Gruppe an diesem Datum erhalten dieselbe Nummer.
       Erst das naechste Datum dieser Gruppe erhoeht den Zaehler. */ const groupDates = new Map();
      for (const {
        game
      }
        of dated) {
        const groupKey = H.norm(game.group || 'ohne-gruppe');
        if (!groupDates.has(groupKey)) groupDates.set(groupKey, new Map());
        const dates = groupDates.get(groupKey);
        const dateKey = game.rawDate || '';
        if (!dates.has(dateKey)) dates.set(dateKey, dates.size + 1);
        cache.set(H.scheduleFixtureKey(game), dates.get(dateKey));
      }
      return cache;
    }
        /* Feld: laufende gemeinsame Spielnummer der beteiligten Mannschaften. */ const appearances = new Map();
    for (const {
      game
    }
      of dated) {
      const fixtureKey = H.scheduleFixtureKey(game);
      if (seen.has(fixtureKey)) continue;
      seen.add(fixtureKey);
      const homeKey = H.scheduleTeamKey(game.home), awayKey = H.scheduleTeamKey(game.away);
      const number = Math.max(appearances.get(homeKey) || 0, appearances.get(awayKey) || 0) + 1;
      cache.set(fixtureKey, number);
      appearances.set(homeKey, number);
      appearances.set(awayKey, number);
    }
    return cache;
  };
  H.applyMatchdayCache = (games, cache) => {
    for (const game of games) game.matchday = cache.get(H.scheduleFixtureKey(game)) || game.matchday || 1;
    return games;
  };
  H.parseSchedule = () => {
    const rows = H.rowCandidates();
    const markers = H.dateMarkers();
    const phaseMarkers = H.phaseMarkers();
    const dates = [];
    for (const row of rows) {
      const date = H.dateForRow(row, markers);
      if (date && !dates.includes(date)) dates.push(date);
    }
    const dateIndex = new Map(dates.map((date, index) => [date, index]));
    const games = rows.map((row, index) => H.parseGame(row, dateIndex, markers, phaseMarkers, index)).filter(Boolean);
    const matchdayCache = H.buildMatchdayCache(games);
    H.applyMatchdayCache(games, matchdayCache);
    H.state.ownClubUrls.clear();
    for (const game of games) for (const team of [game.home, game.away]) {
      if (H.isOwnName(team.name)) {
        const key = H.clubUrlKey(team.clubUrl);
        if (key) H.state.ownClubUrls.add(key);
      }
    }
        /* Feld U8/U10 wird wie die Halle als Turnier pro Datum gruppiert.
     Ab U12 ist jedes eigene Spiel ein eigener Spieltag; fremde Paarungen
     erhoehen den Zaehler nicht. */ if (H.isField()) {
      const ageMatch = decodeURIComponent(location.pathname).match(/(?:^|\/)\D*-?u(\d{1,2})(?:\/|$)/i);
      const ageNumber = ageMatch ? Number(ageMatch[1]) : 0;
      if (ageNumber >= 12) {
        let ownMatchday = 1;
        for (const game of games) {
          game.matchday = ownMatchday;
          if (H.gameIsOwn(game)) ownMatchday++;
        }
      }
      /* U8/U10 behalten die bereits nach Datum vergebene Turniernummer. */
    }
    return {
      games, dates, groups: H.sortGroups([...new Set(games.map(game => game.group).filter(Boolean))]), matchdayCache
    };
  };
  H.resolveOwnTeam = t => H.isOwnTeam(t);
  H.gameIsOwn = g => H.resolveOwnTeam(g.home) || H.resolveOwnTeam(g.away);
  H.opponent = g => H.resolveOwnTeam(g.home) ? g.away : g.home;
  H.pageMeta = () => {
    const path = decodeURIComponent(location.pathname).toLowerCase();
    const text = H.clean(document.body.innerText);
    const surface = H.isField() ? 'Feld' : path.includes('/hallensaison/') ? 'Halle' : 'Spielform';
    let age = 'Altersklasse';
    const pathAge = path.match(/\/(weibliche|maennliche|männliche)-u(\d{1,2})(?:\/|$)/i);
    if (pathAge) {
      const prefix = /^weibliche$/i.test(pathAge[1]) ? 'w' : 'm';
      age = `${prefix}U${pathAge[2]}`;
    }
    else {
      const textAge = text.match(/\b([wm])\s*U\s*(\d{1,2})\b/i);
      if (textAge) age = `${textAge[1].toLowerCase()}U${textAge[2]}`;
      else {
        const neutral = text.match(/\bU\s*(\d{1,2})\b/i);
        if (neutral) age = `U${neutral[1]}`;
      }
    }
    const season = text.match(/\b20\d{2}\s*\/\s*20\d{2}\b/)?.[0]?.replace(/\s/g, '') || '';
    const leagueMatch = path.match(/\/(regionalliga|oberliga|verbandsliga)(?:\/|$)/i) || text.match(/\b(Regionalliga|Oberliga|Verbandsliga)\b/i);
    const league = leagueMatch ? leagueMatch[1].charAt(0).toUpperCase() + leagueMatch[1].slice(1).toLowerCase() : '';
    return {
      surface, age, season, league, title: H.clean(document.querySelector('h1')?.textContent) || 'Spielbetrieb'
    };
  };
  H.buildModel = () => {
    const schedule = H.parseSchedule();
    return {
      meta: H.pageMeta(), ...schedule, standings: H.parseStandings?.(schedule.games) || []
    }
  };
})();
