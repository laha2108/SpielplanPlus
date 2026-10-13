(() => {
  'use strict'; const H = globalThis.HSP;
  H.filteredGames = model => model.games.filter(g => (!H.state.group || g.group === H.state.group) && (!H.state.day || (H.state.day.startsWith('phase:') ? H.matchesRoundFilter(g, H.state.day) : g.matchday === Number(H.state.day))) && (!H.isField() || H.gameIsOwn(g))); H.filteredStandings = model => {
    let standings = model.standings;
    if (H.state.group) {
      let matching = standings.filter(table => H.norm(table.group) === H.norm(H.state.group));
      if (!matching.length) {
        const groupTeams = new Set(model.games
          .filter(game => game.group === H.state.group)
          .flatMap(game => [H.norm(game.home.name), H.norm(game.away.name)]));
        matching = standings
          .map(table => ({ table, score: table.rows.flat().filter(cell => groupTeams.has(H.norm(cell.text))).length }))
          .filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 1)
          .map(item => item.table);
      }
      standings = matching;
    } else if (H.state.onlyOwn) {
      standings = standings.filter(table => table.rows.some(row => row.some(cell => H.isOwnName(cell.text))));
    }
    return [...standings].sort((a, b) => H.groupKey(a.group).localeCompare(H.groupKey(b.group), 'de', { numeric: true }));
  }; H.ownStandings = model => {
    const own = model.standings.filter(table => table.rows.some(row => row.some(cell => H.isOwnName(cell.text))));
    if (H.state.group) {
      const selected = own.filter(table => H.norm(table.group) === H.norm(H.state.group));
      if (selected.length) return selected.slice(0, 1);
    }
    return own.slice(0, 1);
  }; H.teamHtml = t => `<span class="team">${t.logo ? `<img src="${H.esc(t.logo)}" alt="">` : ''}<span class="${H.isOwnName(t.name) ? 'own' : ''}">${H.esc(t.name)}</span></span>`;
  H.gamesHtml = (games, showGroupBadges = false, groupHallTogether = false) => {
    const ownDays = new Set(games.filter(H.gameIsOwn).map(g => g.matchday)), parts = [];
    const source = groupHallTogether
      ? [...games].sort((left, right) =>
        H.groupKey(left.group || '').localeCompare(H.groupKey(right.group || ''), 'de', { numeric: true }) ||
        (left.matchday || 0) - (right.matchday || 0) ||
        (H.gameDateValue(left.rawDate)?.getTime() || 0) - (H.gameDateValue(right.rawDate)?.getTime() || 0)
      )
      : games;
    for (const game of source) {
      let part = parts.at(-1), key = (groupHallTogether ? H.groupKey(game.group || '') + '|' : '') + game.matchday + '|' + game.date + '|' + game.location;
      if (!part || part.key !== key) { part = { key, date: game.date, matchday: game.matchday, location: game.location, games: [] }; parts.push(part) }
      part.games.push(game);
    }
    return parts.map((part, index) => {
      const complete = part.games.every(game => game.completed);
      const lastHeader = complete ? 'Status' : 'Uhrzeit';
      const ordered = showGroupBadges ? [...part.games].sort((left, right) => H.groupKey(left.group || '').localeCompare(H.groupKey(right.group || ''), 'de', { numeric: true })) : part.games;
      let previousGroup = '';
      const rows = ordered.map(game => {
        const status = game.completed ? 'ABGESCHLOSSEN' : (game.time || 'AUSSTEHEND');
        const groupCode = H.clean(game.group).replace(/^Gruppe\s*/i, '') || '?';
        const groupChanged = showGroupBadges && game.group !== previousGroup;
        previousGroup = game.group;
        const divider = groupChanged ? `<tr class="group-divider"><td colspan="5">Gruppe ${H.esc(groupCode)}</td></tr>` : '';
        const groupCell = showGroupBadges ? `<td class="group-column"><b class="group-badge" title="${H.esc(game.group || 'Gruppe unbekannt')}">${H.esc(groupCode)}</b></td>` : '';
        return `${divider}<tr>${groupCell}<td>${H.teamHtml(game.home)}</td><td>${H.teamHtml(game.away)}</td><td class="center">${H.esc(game.result)}</td><td class="center">${H.esc(status)}</td></tr>`;
      }).join('');
      const groupColumn = showGroupBadges ? '<col class="group-col">' : '';
      const groupHeader = showGroupBadges ? '<th class="group-column">Gr.</th>' : '';
      return `<section class="matchday${index ? '' : ' first'}"><div class="heading"><span class="number">Spieltag ${part.matchday}</span><span>${H.esc(part.date)}</span><span class="location">Spielort: ${H.esc(part.location)}</span>${H.cfg.showFreeNotice && !ownDays.has(part.matchday) ? '<span class="free">SPIELFREI</span>' : ''}</div><table class="games${showGroupBadges ? ' grouped' : ''}"><colgroup>${groupColumn}<col><col><col><col></colgroup><thead><tr>${groupHeader}<th>Heim</th><th>Gast</th><th>Ergebnis</th><th>${lastHeader}</th></tr></thead><tbody>${rows}</tbody></table></section>`;
    }).join('');
  };
  H.parseNumber = value => {
    const match = H.clean(value).replace(',', '.').match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : 0;
  };
  H.parseGoals = value => {
    const match = H.clean(value).match(/(-?\d+)\s*:\s*(-?\d+)/);
    return match ? { for: Number(match[1]), against: Number(match[2]) } : { for: 0, against: 0 };
  };
  H.formatDecimal = value => Number.isFinite(value)
    ? value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '–';
  H.tableHeaderIndex = (rows, names) => {
    const header = rows.find(row => H.isStandingHeaderRow?.(row) || row.some(cell => /(Sp\.|Pkt\.|Punkte|Tore|Diff)/i.test(cell.text)));
    if (!header) return -1;
    return header.findIndex(cell => names.some(name => H.norm(cell.text) === H.norm(name)));
  };
  H.ownTableRows = table => table.rows.filter(row => row.some(cell => H.isOwnName(cell.text)));
  H.tableMetrics = (table, row) => {
    const spIndex = H.tableHeaderIndex(table.rows, ['Sp.', 'Sp', 'Spiele']);
    const sIndex = H.tableHeaderIndex(table.rows, ['S']);
    const snpIndex = H.tableHeaderIndex(table.rows, ['SnP']);
    const uIndex = H.tableHeaderIndex(table.rows, ['U']);
    const nIndex = H.tableHeaderIndex(table.rows, ['N']);
    const goalsIndex = H.tableHeaderIndex(table.rows, ['Tore']);
    const diffIndex = H.tableHeaderIndex(table.rows, ['Diff']);
    const pointsIndex = H.tableHeaderIndex(table.rows, ['Pkt.', 'Pkt', 'Punkte']);
    const teamCell = row.find(cell => H.isOwnName(cell.text));
    const position = H.parseNumber(row[0]?.text);
    const games = spIndex >= 0 ? H.parseNumber(row[spIndex]?.text) : 0;
    const wins = sIndex >= 0 ? H.parseNumber(row[sIndex]?.text) : 0;
    const shootoutWins = snpIndex >= 0 ? H.parseNumber(row[snpIndex]?.text) : 0;
    const draws = uIndex >= 0 ? H.parseNumber(row[uIndex]?.text) : 0;
    const losses = nIndex >= 0 ? H.parseNumber(row[nIndex]?.text) : 0;
    const points = pointsIndex >= 0 ? H.parseNumber(row[pointsIndex]?.text) : 0;
    const goals = goalsIndex >= 0 ? H.parseGoals(row[goalsIndex]?.text) : { for: 0, against: 0 };
    const difference = diffIndex >= 0 ? H.parseNumber(row[diffIndex]?.text) : (goals.for - goals.against);
    return {
      team: H.clean(H.cfg.clubName) || teamCell?.text || 'Eigenes Team',
      position, games, wins, shootoutWins, draws, losses, points,
      goalsFor: goals.for, goalsAgainst: goals.against, difference,
      pointsPerGame: games ? points / games : NaN,
      winRate: games ? (wins + shootoutWins) / games * 100 : NaN,
      unbeatenRate: games ? (wins + shootoutWins + draws) / games * 100 : NaN,
      goalsForPerGame: games ? goals.for / games : NaN,
      goalsAgainstPerGame: games ? goals.against / games : NaN,
      differencePerGame: games ? difference / games : NaN,
      pointsEfficiency: games ? points / (games * 3) * 100 : NaN,
      lossRate: games ? losses / games * 100 : NaN,
      goalRatio: goals.against ? goals.for / goals.against : (goals.for > 0 ? Infinity : NaN),
      totalGoalsPerGame: games ? (goals.for + goals.against) / games : NaN
    };
  };
  H.completedOwnGameDetails = game => {
    const score = H.parseGoals(game.result);
    if (!game.completed || !H.clean(game.result).match(/\d+\s*[:\-]\s*\d+/)) return null;
    const ownIsHome = H.isOwnName(game.home.name);
    const ownGoals = ownIsHome ? score.for : score.against;
    const opponentGoals = ownIsHome ? score.against : score.for;
    const opponent = H.opponent(game);
    return {
      date: game.date || game.rawDate || '',
      opponent: opponent.name,
      opponentLogo: opponent.logo || '',
      ownGoals,
      opponentGoals,
      difference: ownGoals - opponentGoals,
      displayScore: `${ownGoals}:${opponentGoals}`, scorePerspective: 'own-team-first'
    };
  };
  H.bestAndWorstGames = games => {
    const completed = games.map(H.completedOwnGameDetails).filter(Boolean);
    if (!completed.length) return { best: null, worst: null };
    /* Relative Rangfolge über alle abgeschlossenen Spiele. Keine Vorfilterung nach Ergebnisart. */
    const ordered = [...completed].sort((left, right) =>
      right.difference - left.difference ||
      right.ownGoals - left.ownGoals ||
      left.opponentGoals - right.opponentGoals ||
      left.opponent.localeCompare(right.opponent, 'de')
    );
    return { best: ordered[0], worst: ordered.at(-1) };
  };
  H.gameHighlightCard = (label, game, tone) => {
    if (!game) return `<div class="game-highlight ${tone}"><span>${H.esc(label)}</span><strong>Noch kein Ergebnis</strong><small>Keine abgeschlossene Begegnung im aktuellen Filter</small></div>`;
    /* Bestes/schlechtestes Spiel beschreibt nur die Rangposition innerhalb der Auswahl.
       Sieg, Unentschieden oder Niederlage wird ausschließlich aus dem Torvergleich ermittelt. */
    const isWin = game.ownGoals > game.opponentGoals;
    const isLoss = game.ownGoals < game.opponentGoals;
    const outcome = isWin ? 'Sieg' : isLoss ? 'Niederlage' : 'Unentschieden';
    /* Die Karte wird immer aus Sicht der konfigurierten Mannschaft formuliert:
       eigene Tore zuerst und nach "gegen" ausschließlich der tatsächliche Gegner. */
    const displayScore = `${game.ownGoals}:${game.opponentGoals}`;
    const against = game.opponent;
    const opponentLogo = game.opponentLogo
      ? `<img class="highlight-club-logo" src="${H.esc(game.opponentLogo)}" alt="">`
      : '';
    return `<div class="game-highlight ${tone}"><span>${H.esc(label)}</span><strong class="highlight-result"><span>${H.esc(outcome)} · ${H.esc(displayScore)} gegen</span>${opponentLogo}<span class="highlight-opponent-name">${H.esc(against)}</span></strong><small>${H.esc(game.date)} · Tordifferenz ${game.difference > 0 ? '+' : ''}${game.difference}</small></div>`;
  };
  H.resultForOwnTeam = game => {
    const details = H.completedOwnGameDetails(game);
    if (!details) return null;
    return { ...details, result: details.difference > 0 ? 'win' : details.difference < 0 ? 'loss' : 'draw', phase: game.phase || '', phaseType: game.phaseType || 'other' };
  };
  H.placementRange = value => {
    const text = H.clean(value);
    let match = text.match(/(?:Spiel(?:e)? um (?:die )?)?Pl[aä]tze?\s*(\d+)(?:\s*(?:[-/]|bis|und)\s*(\d+))?/i);
    if (!match) match = text.match(/(\d+)\.?\s*(?:[-/]|bis|und)\s*(\d+)\.?\s*Pl[aä]tze?/i);
    if (!match) return null;
    const first = Number(match[1]), second = Number(match[2] || first + 1);
    return { better: Math.min(first, second), worse: Math.max(first, second) };
  };
  H.teamKey = team => H.teamIdentity?.(team?.clubUrl) || H.clubUrlKey(team?.clubUrl) || H.norm(team?.name || '');
  H.gameWinnerLoser = game => {
    if (!game?.completed) return null;
    const score = H.parseGoals(game.result);
    if (score.for === score.against) return null;
    return score.for > score.against
      ? { winner: game.home, loser: game.away }
      : { winner: game.away, loser: game.home };
  };
  H.sameTeam = (left, right) => {
    const leftKey = H.teamKey(left), rightKey = H.teamKey(right);
    return !!leftKey && leftKey === rightKey;
  };
  H.containsTeams = (game, teams) => teams.every(team =>
    H.sameTeam(game.home, team) || H.sameTeam(game.away, team)
  );
  H.topFourPlacement = games => {
    const main = games.filter(game => game.completed &&
      /viertelfinale\s*&\s*endrunde/i.test(H.clean(game.phase)) &&
      !H.placementRange(game.phase));
    const byDate = new Map();
    for (const game of main) {
      const key = game.rawDate || game.date || '';
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key).push(game);
    }
    /* Am Endrundentag stehen zwei Halbfinals vor Spiel um Platz 3 und Finale. Die beiden
       späteren Spiele werden anhand der Halbfinalsieger/-verlierer eindeutig zugeordnet. */
    const days = [...byDate.values()].filter(day => day.length >= 4);
    for (const day of days.reverse()) {
      const semifinals = day.slice(0, 2);
      const decisions = semifinals.map(H.gameWinnerLoser);
      if (decisions.some(item => !item)) continue;
      const winners = decisions.map(item => item.winner);
      const losers = decisions.map(item => item.loser);
      const later = day.slice(2);
      const final = later.find(game => H.containsTeams(game, winners));
      const bronze = later.find(game => H.containsTeams(game, losers));
      if (!final || !bronze) continue;
      const finalDecision = H.gameWinnerLoser(final);
      const bronzeDecision = H.gameWinnerLoser(bronze);
      if (!finalDecision || !bronzeDecision) continue;
      if (H.isOwnTeam(finalDecision.winner)) return 1;
      if (H.isOwnTeam(finalDecision.loser)) return 2;
      if (H.isOwnTeam(bronzeDecision.winner)) return 3;
      if (H.isOwnTeam(bronzeDecision.loser)) return 4;
    }
    return null;
  };
  H.finalPlacement = games => {
    const ownCompleted = games.filter(game => game.completed && H.gameIsOwn(game))
      .map(game => ({ game, details: H.resultForOwnTeam(game), range: H.placementRange(game.phase) }))
      .filter(item => item.details);
    /* Nur ausdrücklich als Platzierungsrunde erkannte eigene Spiele verwenden. Spiele aus
       Viertelfinale & Endrunde dürfen niemals in die Bereiche 5-8, 9-12 usw. geraten. */
    const placementCandidates = ownCompleted.filter(item =>
      item.range && item.game.phaseType === 'placement' && /platzierungs|spiele? um|plätze?/i.test(H.norm(item.game.phase))
    );
    const rangeGroups = new Map();
    for (const item of placementCandidates) {
      const key = `${item.range.better}-${item.range.worse}`;
      if (!rangeGroups.has(key)) rangeGroups.set(key, []);
      rangeGroups.get(key).push(item);
    }
    const placementGames = [...rangeGroups.values()]
      .filter(items => items.length >= 2)
      .sort((a, b) => b.length - a.length || b.at(-1).game.matchday - a.at(-1).game.matchday)[0] || [];
    if (placementGames.length) {
      placementGames.sort((a, b) => a.game.matchday - b.game.matchday);
      const explicitPair = placementGames.filter(item => item.range.worse - item.range.better === 1).at(-1);
      if (explicitPair) return explicitPair.details.result === 'win' ? explicitPair.range.better :
        explicitPair.details.result === 'loss' ? explicitPair.range.worse : null;
      const first = placementGames[0], last = placementGames.at(-1), range = first.range;
      if (range.worse - range.better + 1 === 4) {
        const pairStart = first.details.result === 'win' ? range.better : range.better + 2;
        return last.details.result === 'win' ? pairStart : pairStart + 1;
      }
    }
    return H.topFourPlacement(games);
  };
  H.aggregateOwnGames = games => {
    const completed = games.map(H.resultForOwnTeam).filter(Boolean);
    const goalsFor = completed.reduce((sum, game) => sum + game.ownGoals, 0);
    const goalsAgainst = completed.reduce((sum, game) => sum + game.opponentGoals, 0);
    const wins = completed.filter(game => game.result === 'win').length;
    const draws = completed.filter(game => game.result === 'draw').length;
    const losses = completed.filter(game => game.result === 'loss').length;
    return {
      scheduled: games.length, completed: completed.length, withoutResult: games.length - completed.length, remaining: games.length - completed.length,
      wins, draws, losses, shutouts: completed.filter(game => game.opponentGoals === 0).length, goalsFor, goalsAgainst, difference: goalsFor - goalsAgainst,
      goalsForPerGame: completed.length ? goalsFor / completed.length : NaN,
      goalsAgainstPerGame: completed.length ? goalsAgainst / completed.length : NaN,
      differencePerGame: completed.length ? (goalsFor - goalsAgainst) / completed.length : NaN,
      home: games.filter(game => H.isOwnName(game.home.name)).length,
      away: games.filter(game => H.isOwnName(game.away.name)).length,
      opponents: new Set(games.map(game => H.opponent(game).name)).size,
      resultCoverage: games.length ? completed.length / games.length * 100 : NaN,
      best: H.bestAndWorstGames(games).best, worst: H.bestAndWorstGames(games).worst
    };
  };
  H.scheduleMetrics = (table, games) => {
    const ownGames = games.filter(game => H.gameIsOwn(game));
    const ownRow = H.ownTableRows(table)[0];
    const tableMetric = ownRow ? H.tableMetrics(table, ownRow) : null;
    const officialGroupCount = tableMetric?.games || 0;
    /* Die offizielle Sp.-Zahl der eigenen Gruppenphasentabelle ist die verbindliche Grenze.
       In WHV-Dokumentreihenfolge sind genau die ersten N eigenen Spiele Gruppenphase;
       ausschließlich danach folgende eigene Spiele gehören zur Platzierungs-/Endrunde. */
    const groupGames = officialGroupCount ? ownGames.slice(0, officialGroupCount) : ownGames.filter(game => game.phaseType === 'group');
    const laterGames = officialGroupCount ? ownGames.slice(officialGroupCount) : ownGames.filter(game => game.phaseType !== 'group');
    const group = H.aggregateOwnGames(groupGames);
    if (tableMetric) {
      group.scheduled = tableMetric.games; group.completed = tableMetric.games; group.withoutResult = 0; group.remaining = 0;
      group.wins = tableMetric.wins + tableMetric.shootoutWins; group.draws = tableMetric.draws; group.losses = tableMetric.losses;
      group.shutouts = H.aggregateOwnGames(groupGames).shutouts;
      group.goalsFor = tableMetric.goalsFor; group.goalsAgainst = tableMetric.goalsAgainst; group.difference = tableMetric.difference;
      group.goalsForPerGame = tableMetric.goalsForPerGame; group.goalsAgainstPerGame = tableMetric.goalsAgainstPerGame;
      group.differencePerGame = tableMetric.differencePerGame; group.resultCoverage = 100;
    }
    const later = H.aggregateOwnGames(laterGames);
    /* Eine Saison gilt als noch nicht abgeschlossen, solange mindestens eine
       angesetzte Paarung ohne Ergebnis in der Zukunft liegt. */
    const now = new Date();
    const futureWithoutResult = games.some(game => {
      const date = H.gameDateValue?.(game.rawDate);
      return !!date && date >= now && !game.completed;
    });
    const seasonComplete = !futureWithoutResult;
    const completedTotal = group.completed + later.completed;
    const totalScheduled = group.scheduled + later.scheduled;
    const total = {
      scheduled: totalScheduled, completed: completedTotal, withoutResult: group.withoutResult + later.withoutResult,
      remaining: group.remaining + later.remaining,
      wins: group.wins + later.wins, draws: group.draws + later.draws, losses: group.losses + later.losses, shutouts: (group.shutouts || 0) + (later.shutouts || 0),
      goalsFor: group.goalsFor + later.goalsFor, goalsAgainst: group.goalsAgainst + later.goalsAgainst,
      difference: group.difference + later.difference,
      goalsForPerGame: completedTotal ? (group.goalsFor + later.goalsFor) / completedTotal : NaN,
      goalsAgainstPerGame: completedTotal ? (group.goalsAgainst + later.goalsAgainst) / completedTotal : NaN,
      differencePerGame: completedTotal ? (group.difference + later.difference) / completedTotal : NaN,
      resultCoverage: totalScheduled ? completedTotal / totalScheduled * 100 : NaN,
      best: H.bestAndWorstGames([...groupGames, ...laterGames]).best,
      worst: H.bestAndWorstGames([...groupGames, ...laterGames]).worst
    };
    const participantKeys = new Set();
    for (const game of games) {
      for (const team of [game.home, game.away]) {
        const key = H.teamKey(team);
        if (key) participantKeys.add(key);
      }
    }
    return {
      group, later, total, seasonComplete, participantCount: participantKeys.size,
      finalPlacement: seasonComplete ? H.finalPlacement(games) : null
    };
  };
  H.formatRatio = value => value === Infinity ? '∞' : H.formatDecimal(value);
  H.metricCard = (label, value, help = '') => `<div class="metric"><span>${H.esc(label)}</span><strong>${H.esc(value)}</strong>${help ? `<small>${H.esc(help)}</small>` : ''}</div>`;
  H.phaseSummaryCards = (metrics, placeLabel = 'Platzierung', placeValue = '–', placeHelp = '') => [
    H.metricCard(placeLabel, placeValue, placeHelp),
    H.metricCard('Spiele', String(metrics.scheduled), 'angesetzt'),
    H.metricCard('Ergebnisse vorhanden', String(metrics.completed), 'auswertbare Resultate'),
    H.metricCard('Ohne Ergebnis', String(metrics.withoutResult ?? metrics.remaining), 'nicht hinterlegt'),
    H.metricCard('Bilanz', `${metrics.wins}-${metrics.draws}-${metrics.losses}`, 'S – U – N'),
    H.metricCard('Shutouts', String(metrics.shutouts || 0), 'Spiele ohne Gegentor'),
    H.metricCard('Tore', `${metrics.goalsFor}:${metrics.goalsAgainst}`, 'erzielt : kassiert'),
    H.metricCard('Tore je Spiel', H.formatDecimal(metrics.goalsForPerGame), 'eigene Tore'),
    H.metricCard('Gegentore je Spiel', H.formatDecimal(metrics.goalsAgainstPerGame), 'kassierte Tore'),
    H.metricCard('Tordifferenz', `${metrics.difference > 0 ? '+' : ''}${metrics.difference}`, 'gesamt'),
    H.metricCard('Tordiff. je Spiel', H.formatDecimal(metrics.differencePerGame), 'Diff. ÷ Spiele')
  ].join('');
  H.placementGraphic = place => {
    if (place === 1 || place === 2 || place === 3) {
      const tone = place === 1 ? 'gold' : place === 2 ? 'silver' : 'bronze';
      return `<div class="placement-icon trophy ${tone}" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 4h8v4a4 4 0 0 1-8 0V4Z"/><path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 12v5M8 20h8M10 17h4"/></svg></div>`;
    }
    return `<div class="placement-icon certificate" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 3h12v14H6z"/><path d="M9 7h6M9 10h6"/><circle cx="12" cy="14" r="2"/><path d="m10.8 15.6-.8 5 2-1.4 2 1.4-.8-5"/></svg></div>`;
  };
  H.finalPlacementHtml = table => {
    const metrics = table.scheduleMetrics;
    if (!metrics) return '';
    if (!metrics.seasonComplete) {
      return `<div class="final-placement pending">${H.placementGraphic(null)}<div class="placement-label">Endplatzierung</div><div class="placement-value">Noch offen</div><div class="placement-detail">Ermittlung nach Saisonabschluss</div></div>`;
    }
    const place = metrics.finalPlacement;
    if (!place) return '';
    const total = metrics.participantCount || 0;
    const placementText = total ? `${place}. Platz von ${total}` : `${place}. Platz`;
    return `<div class="final-placement">${H.placementGraphic(place)}<div class="placement-label">Endplatzierung</div><div class="placement-value">${H.esc(placementText)}</div><div class="placement-detail">Abschluss nach Platzierungsrunde / Endrunde</div></div>`;
  };
  H.seasonStatusHtml = metrics => {
    const complete = metrics?.seasonComplete !== false;
    return `<div class="season-status ${complete ? 'complete' : 'pending'}">${complete ? 'Saison abgeschlossen' : 'Saison noch nicht abgeschlossen'}</div>`;
  };
  H.statIcon = type => {
    const icons = {
      group: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M9 9v11M15 9v11"/></svg>',
      finals: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4v5a3 3 0 0 0 3 3h8a3 3 0 0 1 3 3v5M5 20v-5a3 3 0 0 1 3-3M19 4v5a3 3 0 0 1-3 3"/><circle cx="5" cy="4" r="2"/><circle cx="19" cy="4" r="2"/><circle cx="5" cy="20" r="2"/><circle cx="19" cy="20" r="2"/></svg>',
      total: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v4a4 4 0 0 1-8 0V4Z"/><path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 12v5M8 20h8M10 17h4"/></svg>'
    };
    return `<span class="section-icon ${H.esc(type)}">${icons[type] || ''}</span>`;
  };
  H.ownStatsHtml = table => {
    const ownRows = H.ownTableRows(table);
    if (!ownRows.length) return '';
    const phases = table.scheduleMetrics || { group: H.aggregateOwnGames([]), later: H.aggregateOwnGames([]), total: H.aggregateOwnGames([]), finalPlacement: null };
    return ownRows.map(row => {
      const metric = H.tableMetrics(table, row);
      const teamCell = row.find(cell => H.isOwnName(cell.text));
      const logo = teamCell?.logo || '';
      const teamHeading = `${logo ? `<img class="stats-club-logo" src="${H.esc(logo)}" alt="">` : ''}<span>${H.esc(metric.team)}</span>`;
      const groupPlace = metric.position ? `${metric.position}. Platz` : '–';
      const finalPlace = phases.finalPlacement
        ? `${phases.finalPlacement}. Platz${phases.participantCount ? ` von ${phases.participantCount}` : ''}`
        : '–';
      const groupCards = H.phaseSummaryCards(phases.group, 'Platzierung', groupPlace, 'nach der Gruppenphase');
      const laterCards = H.phaseSummaryCards(phases.later, 'Platzierung', finalPlace, 'nach Platzierungsrunde / Endrunde');
      const groupHighlights = `<div class="game-highlights">${H.gameHighlightCard('Bestes Spiel Gruppenphase', phases.group.best, 'best')}${H.gameHighlightCard('Schlechtestes Spiel Gruppenphase', phases.group.worst, 'worst')}</div>`;
      const laterHighlights = `<div class="game-highlights">${H.gameHighlightCard('Bestes Spiel Endrunde', phases.later.best, 'best')}${H.gameHighlightCard('Schlechtestes Spiel Endrunde', phases.later.worst, 'worst')}</div>`;
      const hasLater = phases.later.scheduled > 0;
      const totalHighlights = hasLater ? `<div class="game-highlights total-highlights">${H.gameHighlightCard('Bestes Spiel gesamt', phases.total.best, 'best')}${H.gameHighlightCard('Schlechtestes Spiel gesamt', phases.total.worst, 'worst')}</div>` : '';
      const laterHtml = hasLater ? `<h3>${H.statIcon('finals')}<span>Platzierungsrunde / Endrunde</span></h3><div class="metrics phase-metrics">${laterCards}</div>${laterHighlights}<h3 class="total-title">${H.statIcon('total')}<span>Gesamtturnier</span></h3>${totalHighlights}` : '';
      return `<section class="own-stats ${hasLater ? '' : 'group-only'}"><div class="own-stats-title"><span>Statistik eigenes Team</span><strong class="stats-team-heading">${teamHeading}</strong></div><h3>${H.statIcon('group')}<span>Gruppenphase</span></h3><div class="metrics phase-metrics">${groupCards}</div>${groupHighlights}${laterHtml}${H.seasonStatusHtml(phases)}</section>`;
    }).join('');
  };
  H.standingsHtml = standings => standings.length ? `<section class="standings">${standings.map(t => `<section class="standing-block">${H.finalPlacementHtml(t)}<div class="standing-shell"><h2>Abschlusstabelle Gruppenphase · ${H.esc(t.group)}${t.fallback ? ' <small style="font-weight:400;color:#52606d">(aus Spielplan rekonstruiert)</small>' : ''}</h2><table>${t.rows.map((r, i) => `<tr>${r.map(c => { const html = `${c.logo ? `<img src="${H.esc(c.logo)}" alt="">` : ''}<span class="${H.isOwnName(c.text) ? 'own' : ''}">${H.esc(c.text)}</span>`; return i === 0 ? `<th>${html}</th>` : `<td>${html}</td>` }).join('')}</tr>`).join('')}</table></div>${H.ownStatsHtml(t)}</section>`).join('')}</section>` : '';
  H.pdfDocument = snapshot => `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${H.esc(snapshot.file.replace(/\.pdf$/, ''))}</title><style>@page{size:A4 portrait;margin:8mm 9mm 14mm;@bottom-left{content:'Spielplan Plus 3.4.6, L.Hansen';font:7px Arial;color:#667788}@bottom-center{content:'Druck: ${H.esc(snapshot.printDate)}';font:7px Arial;color:#667788}@bottom-right{content:'Seite ' counter(page) ' / ' counter(pages);font:7px Arial;color:#667788}}*{box-sizing:border-box}body{margin:0;font:9px Arial,sans-serif;color:#243244;background:#fff;--red:#b5121b;--navy:#21324a;--ice:#f4f7fa}.doc{position:relative;text-align:center;margin-bottom:20px;padding:13px 16px 15px;border:1px solid #dce3e9;border-top:5px solid var(--red);border-radius:0 0 13px 13px;background:linear-gradient(135deg,#fff 0%,#f8fafc 68%,#fff0f1 100%);box-shadow:0 4px 12px rgba(31,47,67,.08)}.doc h1{margin:5px 0 3px;font-size:24px;line-height:1.15;color:var(--navy);letter-spacing:-.35px}.league{margin:0 0 9px;font-size:9px;font-weight:700;color:#657487;letter-spacing:.35px}.hero-kicker{font-size:7px;letter-spacing:1.6px;font-weight:800;color:var(--red)}.meta{display:flex;justify-content:center;flex-wrap:wrap;gap:6px;color:#5e6d7d}.meta span{display:inline-block;padding:4px 9px;border:1px solid #d9e0e7;border-radius:12px;background:#f7f9fb;white-space:nowrap}.matchday{position:relative;margin-top:30px;break-inside:avoid;page-break-inside:avoid;border:1px solid #d8dfe6;border-radius:12px;overflow:hidden;background:#fff;box-shadow:0 5px 14px rgba(31,47,67,.11)}.matchday.first{margin-top:0}.heading{position:relative;display:grid;grid-template-columns:auto auto minmax(0,1fr) auto;align-items:center;column-gap:16px;min-height:36px;padding:8px 12px;background:linear-gradient(90deg,#ffedef 0%,#fff7f8 46%,#f7f9fb 100%);color:#a91019;font-weight:700;border-bottom:1px solid #d8dfe6}.number{display:inline-flex;box-shadow:0 2px 5px rgba(181,18,27,.18);align-items:center;justify-content:center;min-width:62px;height:20px;padding:0 9px;border-radius:11px;background:#b5121b;color:#fff;font-size:8px}.location{color:#617080;font-weight:600;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.free{justify-self:end;padding:3px 9px;border:1px solid #c92832;border-radius:10px;background:#fff;color:#a91019;letter-spacing:.5px}.games{width:100%;table-layout:fixed;margin:0;border-collapse:collapse;border-spacing:0;background:#fff;border-radius:0 0 12px 12px;overflow:hidden}.games col:nth-child(1),.games col:nth-child(2){width:34%}.games col:nth-child(3){width:12%}.games col:nth-child(4){width:20%}table{width:100%;border-collapse:separate;border-spacing:0}th,td{padding:5px 7px;border-right:1px solid #e1e6eb;border-bottom:1px solid #e1e6eb}.standings tr>*:last-child{border-right:0}.standings tr:last-child td{border-bottom:0}th{background:#f5f7fa;color:#415267;font-weight:700}.games th,.games td{height:21px;padding:3px 7px;border:0;border-right:1px solid #e1e6eb;border-bottom:1px solid #e1e6eb;vertical-align:middle;background:#fff}.games thead th{height:23px;background:linear-gradient(180deg,#f7f9fb,#edf2f6);color:#405169;font-size:8px;font-weight:700;text-align:center}.games tbody tr:nth-child(even) td{background:#fafbfd}.games tbody tr:last-child td{border-bottom:0}.games tr>*:last-child{border-right:0}.games tbody tr:last-child td{border-bottom:0}.games td:nth-child(1),.games td:nth-child(2){text-align:left}.games.grouped .group-col{width:7%}.games.grouped col:nth-child(2),.games.grouped col:nth-child(3){width:30.5%}.games.grouped col:nth-child(4){width:12%}.games.grouped col:nth-child(5){width:20%}.games.grouped td:nth-child(2),.games.grouped td:nth-child(3){text-align:left}.group-column{text-align:center!important;padding-left:3px!important;padding-right:3px!important}.group-badge{display:inline-flex;align-items:center;justify-content:center;min-width:17px;height:17px;padding:0 4px;border-radius:5px;background:#b5121b;color:#fff;font-size:10px;font-weight:900;line-height:1;box-shadow:0 1px 3px rgba(181,18,27,.18)}.group-divider td{height:19px!important;padding:3px 8px!important;background:linear-gradient(90deg,#ffedef,#f8fafc)!important;color:#9f0f17;font-size:8px;font-weight:900;letter-spacing:.65px;text-align:left!important;text-transform:uppercase;border-top:1px solid #e3c3c6!important;border-bottom:1px solid #e3c3c6!important}.games td:nth-child(3),.games td:nth-child(4){text-align:center}.games .team{display:flex;width:100%;align-items:center;min-width:0}.games .team span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.games tbody tr{break-inside:avoid;page-break-inside:avoid}.standings tbody tr:nth-child(even) td{background:#fafbfd}.center{text-align:center}.team{display:inline-flex;align-items:center;gap:6px}.team img,.standings img{width:16px;height:16px;object-fit:contain;vertical-align:middle;margin-right:5px}.own{display:inline-block;background:linear-gradient(180deg,#fff0f1,#ffe3e6);color:#8f0d15;border:1px solid #e5b8bc;padding:1px 6px;border-radius:10px;font-weight:700;box-shadow:0 1px 2px rgba(181,18,27,.10)}.standings{break-before:auto;page-break-before:auto}.standings>h1{display:none;position:relative;margin:0 0 18px;padding:0 0 9px 16px;font-size:21px;color:var(--navy);border-bottom:1px solid #dfe5ea}.standings>h1:before{content:'';position:absolute;left:0;top:1px;width:6px;height:22px;border-radius:4px;background:linear-gradient(180deg,#d51d28,#8f0d15)}.standing-block{margin-bottom:14px;break-inside:auto}.final-placement{position:relative;margin:0 0 10px;padding:8px 14px 10px;border:1px solid #97101a;border-radius:10px;background:linear-gradient(180deg,#fff 0%,#fff7f8 100%);color:#000;text-align:center;box-shadow:0 3px 8px rgba(90,8,16,.12);break-inside:avoid}.placement-icon{display:flex;width:26px;height:26px;margin:0 auto 2px;align-items:center;justify-content:center;border-radius:50%;background:#f2f4f6;color:#202b38}.placement-icon svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.placement-icon.trophy.gold{background:#fff3bf;color:#b8860b}.placement-icon.trophy.silver{background:#eef1f4;color:#68727d}.placement-icon.trophy.bronze{background:#f7e2d4;color:#a65f32}.placement-icon.certificate{background:#eef3f7;color:#34495e}.placement-label{font-size:7px;font-weight:800;text-transform:uppercase;letter-spacing:1.25px;color:#000}.placement-value{margin-top:3px;font-size:22px;font-weight:800;line-height:1.05;letter-spacing:-.25px;color:#000}.placement-detail{margin-top:4px;font-size:7px;font-weight:600;color:#000}.final-placement.pending{color:#000;border:1px solid #aeb6bf;background:repeating-linear-gradient(135deg,#e0e4e7 0,#e0e4e7 7px,#f3f5f6 7px,#f3f5f6 14px);box-shadow:0 3px 8px rgba(31,47,67,.10)}.final-placement.pending .placement-icon{background:#fff;color:#34495e}.final-placement.pending .placement-label,.final-placement.pending .placement-value,.final-placement.pending .placement-detail{color:#000}.final-placement.pending span,.final-placement.pending small{opacity:1}.season-status{margin-top:7px;padding:5px 9px;border-radius:7px;text-align:center;font-size:8px;font-weight:700;letter-spacing:.2px}.season-status.complete{border:1px solid #acd4bd;background:#eef8f2;color:#176b35}.season-status.pending{border:1px solid #e2a4aa;background:#fff1f2;color:#b5121b}.standing-shell{break-inside:avoid;page-break-inside:avoid;border:1px solid #d8dfe6;border-radius:12px;overflow:hidden;background:#fff;box-shadow:0 5px 14px rgba(31,47,67,.10);break-inside:avoid-page}.standings h2{position:relative;margin:0;padding:7px 10px 7px 15px;background:linear-gradient(90deg,#ffedef,#f8fafc);overflow:hidden;color:#a91019;border:0;border-bottom:1px solid #d8dfe6;border-radius:0;font-size:9px}.standings h2:before{content:'';position:absolute;left:0;top:0;bottom:0;width:5px;background:var(--red)}.standings table{width:100%;table-layout:fixed;border:0;border-collapse:collapse;border-spacing:0;border-radius:0;overflow:hidden;font-size:7px}.standings td,.standings th{text-align:center;border-right:1px solid #e1e6eb;border-bottom:1px solid #e1e6eb;vertical-align:middle;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.standings tr>*:last-child{border-right:0}.standings tr:last-child td{border-bottom:0}.standings td:first-child,.standings th:first-child{width:6%}.standings td:nth-child(2),.standings th:nth-child(2){width:48%;text-align:left}.standings td:nth-child(n+3),.standings th:nth-child(n+3){width:5.75%}.own-stats{position:relative;margin:10px 0 7px;padding:9px;border:1px solid #d8dfe6;border-radius:10px;background:linear-gradient(145deg,#ffffff 0%,#f5f8fb 74%,#fff0f1 100%);box-shadow:0 2px 5px rgba(31,47,67,.07);break-inside:avoid;page-break-inside:avoid}.own-stats-title{display:flex;justify-content:space-between;align-items:center;gap:10px;padding-bottom:6px;border-bottom:1px solid #dfe5eb;color:#607080}.own-stats-title span{font-size:8px;text-transform:uppercase;letter-spacing:.7px;font-weight:700}.own-stats-title strong{color:#a91019;font-size:9px}.stats-team-heading{display:inline-flex;align-items:center;justify-content:flex-end;gap:6px}.stats-club-logo{width:22px;height:22px;object-fit:contain}.own-stats h3{display:flex;align-items:center;gap:5px;margin:6px 0 3px;font-size:7px;color:#405169;text-transform:uppercase;letter-spacing:.5px}.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}.schedule-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}.metric{position:relative;min-height:36px;padding:4px 5px;border:1px solid #e0e5ea;border-radius:9px;background:linear-gradient(180deg,#fff,#fafbfd);text-align:center;box-shadow:0 2px 4px rgba(31,47,67,.05)}.metric span{display:block;font-size:7px;color:#687788}.metric strong{display:block;margin-top:2px;font-size:10px;color:#203149}.metric:nth-child(3n+1) strong{color:#a91019}.metric small{display:block;margin-top:2px;font-size:5.5px;color:#85909c}.phase-warning{margin:10px 0;padding:9px 11px;border:1px solid #e5c36b;border-radius:8px;background:#fff9e8;color:#765500}.phase-empty{padding:11px;border:1px dashed #cdd5dd;border-radius:8px;background:#fff;color:#6b7886;text-align:center}.phase-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}.game-highlights{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px;margin-top:5px}.total-highlights{margin-top:3px}.total-title{margin-top:6px!important;padding-top:5px;border-top:1px solid #dfe5eb}.section-icon{display:inline-flex;width:23px;height:23px;align-items:center;justify-content:center;border-radius:50%;background:#fff0f1;color:#a91019}.section-icon svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}.section-icon.total{background:#fff4d8;color:#9a6b00}.statistics-page{zoom:1;font-size:9px}.statistics-page.fit-compact .standing-block{margin-bottom:4px}.statistics-page.fit-compact .own-stats{margin-top:4px;margin-bottom:2px;padding:5px}.statistics-page.fit-compact .metric{min-height:31px;padding:3px 4px}.statistics-page.fit-compact .game-highlight{min-height:35px;padding:4px 7px}.statistics-page.fit-compact .section-icon{width:19px;height:19px}.statistics-page.fit-compact .section-icon svg{width:12px;height:12px}.statistics-page .standing-block{break-inside:avoid;page-break-inside:avoid;margin-bottom:6px}.statistics-page .own-stats{margin-top:6px;margin-bottom:3px;padding:6px}.statistics-page .standing-shell{box-shadow:none}.statistics-doc{margin-bottom:5px;padding:5px 10px 6px;border-top-width:3px}.statistics-doc h1{margin:1px 0 2px;font-size:18px}.group-only{padding-bottom:12px}.group-only .game-highlights{margin-bottom:2px}.game-highlight{position:relative;min-height:41px;padding:5px 8px;border:1px solid #dfe5ea;border-radius:9px;background:#fff}.game-highlight:before{content:'';position:absolute;left:0;top:9px;bottom:9px;width:4px;border-radius:0 4px 4px 0}.game-highlight.best:before{background:#2b8a57}.game-highlight.worst:before{background:#b5121b}.game-highlight span{display:block;font-size:7px;text-transform:uppercase;letter-spacing:.6px;color:#6a7888}.game-highlight strong{display:block;margin-top:3px;font-size:9px;color:#203149}.highlight-result{display:flex!important;align-items:center;justify-content:center;gap:3px;flex-wrap:nowrap;white-space:nowrap}.highlight-opponent-name{min-width:0;overflow:hidden;text-overflow:ellipsis}.highlight-club-logo{flex:0 0 auto;width:12px;height:12px;object-fit:contain;vertical-align:middle}.game-highlight small{display:block;margin-top:3px;font-size:6px;color:#7b8794}@media print{.heading,.number,.free,th,.own,.own-stats,.metric,.standings h2{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body class="${snapshot.mode === 'statistics' ? 'statistics-page' : ''}"><header class="doc statistics-doc"><h1>${H.esc(snapshot.title)}</h1>${snapshot.league ? `<div class="league">${H.esc(snapshot.league)}</div>` : ''}</header>${snapshot.mode === 'schedule' ? H.gamesHtml(snapshot.games, snapshot.showGroupBadges, snapshot.groupHallTogether) : H.standingsHtml(snapshot.standings)}</body></html>`;
  H.snapshotTeam = team => ({
    name: team?.name || '',
    clubUrl: team?.clubUrl || '',
    logo: team?.logo || ''
  });
  H.snapshotGame = game => ({
    id: game.id,
    cacheKey: game.cacheKey || '',
    resultSource: game.resultSource || '',
    group: game.group,
    phase: game.phase || '',
    phaseType: game.phaseType || 'other',
    phaseFilterKey: game.phaseFilterKey || '',
    rawDate: game.rawDate,
    date: game.date,
    matchday: game.matchday,
    time: game.time,
    result: game.result,
    completed: game.completed,
    location: game.location,
    home: H.snapshotTeam(game.home),
    away: H.snapshotTeam(game.away)
  });
  H.snapshotStandings = standings => standings.map(table => ({
    group: table.group,
    fallback: table.fallback === true,
    rows: table.rows.map(row => row.map(cell => ({
      text: cell?.text || '',
      logo: cell?.logo || '',
      clubUrl: cell?.clubUrl || ''
    })))
  }));
  H.snapshotMeta = (suffix, games, standings = []) => {
    const model = H.state.model;
    const m = model.meta;
    const short = H.list(H.cfg.clubAliases)[0] || H.cfg.clubName;
    const title = ['WHV', m.title, m.surface, m.age, m.season].filter(Boolean).join(' ');
    const file = `${short}_${title}_${suffix}`
      .replace(/\s*\/\s*/g, '-').replace(/\s+/g, '_').replace(/[<>:"\\|?*]/g, '') + '.pdf';
    return {
      title, file, league: m.league || '',
      printDate: new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date()),
      games, standings
    };
  };
  H.makeScheduleSnapshot = () => {
    const games = H.filteredGames(H.state.model).map(H.snapshotGame);
    return {
      ...H.snapshotMeta('Spielplan', games, []),
      mode: 'schedule',
      showGroupBadges: !H.state.group,
      groupHallTogether: !H.isField() && !H.state.group,
      summaryItems: [H.state.group || 'Alle Gruppen', `${games.length} Spielpaarungen`, `${games.filter(H.gameIsOwn).length} eigene Spiele`]
    };
  };
  H.makeStatisticsSnapshot = () => {
    const model = H.state.model;
    const games = model.games.map(H.snapshotGame);
    const standings = H.snapshotStandings(H.ownStandings(model));
    standings.forEach(table => { table.scheduleMetrics = H.scheduleMetrics(table, games) });
    return {
      ...H.snapshotMeta('Statistik', [], standings),
      mode: 'statistics',
      summaryItems: [H.state.group || 'Alle Gruppen', `${standings.length} Tabellen`, `${games.filter(H.gameIsOwn).length} eigene Spiele`]
    };
  };
  H.fitStatisticsPage = doc => {
    if (!doc?.body?.classList.contains('statistics-page')) return 1;
    const body = doc.body;
    const ruler = doc.createElement('div');
    ruler.style.cssText = 'position:absolute;visibility:hidden;width:100mm;height:1px;pointer-events:none';
    body.appendChild(ruler);
    const pxPerMm = ruler.getBoundingClientRect().width / 100 || 3.7795275591;
    ruler.remove();
    const availableHeight = 275 * pxPerMm;
    body.style.zoom = '1'; body.style.fontSize = '9px'; body.classList.remove('fit-compact');
    const height = () => Math.max(doc.documentElement.scrollHeight, body.scrollHeight);
    if (height() > availableHeight) body.classList.add('fit-compact');
    let contentHeight = height();
    if (contentHeight > availableHeight) {
      const ratio = availableHeight / contentHeight;
      const fontSize = Math.max(7.2, Math.min(9, 9 * ratio));
      body.style.fontSize = `${fontSize.toFixed(2)}px`;
      contentHeight = height();
    }
    const residual = Math.min(1, availableHeight / Math.max(contentHeight, 1));
    body.style.zoom = String(Math.max(.82, residual * .992));
    return Number(body.style.zoom);
  };
  H.printSnapshot = s => {
    const frame = document.createElement('iframe');
    frame.dataset.hspOwned = 'true';
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;opacity:.01;border:0';
    frame.onload = () => setTimeout(() => {
      const printWindow = frame.contentWindow;
      if (!printWindow) return;
      const desiredTitle = s.file.replace(/\.pdf$/i, '');
      H.fitStatisticsPage(printWindow.document);
      const originalParentTitle = document.title;
      printWindow.document.title = desiredTitle;
      document.title = desiredTitle;
      const restore = () => {
        document.title = originalParentTitle;
        frame.remove();
      };
      printWindow.addEventListener('beforeprint', () => {
        printWindow.document.title = desiredTitle;
        document.title = desiredTitle;
      }, { once: true });
      printWindow.addEventListener('afterprint', restore, { once: true });
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 100);
      setTimeout(() => {
        if (document.title === desiredTitle) document.title = originalParentTitle;
      }, 5000);
    }, 350);
    frame.srcdoc = H.pdfDocument(s);
    document.body.appendChild(frame);
  };
  H.preview = s => {
    document.getElementById('hsp-preview')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'hsp-preview'; overlay.dataset.hspOwned = 'true';
    overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true');
    const isSchedule = s.mode === 'schedule';
    const heading = isSchedule ? 'Spielplan erstellen' : 'Statistik erstellen';
    const description = isSchedule ? 'Auswahl prüfen und anschließend drucken oder als PDF speichern.' : 'Auswertung prüfen und anschließend drucken oder als PDF speichern.';
    const labels = isSchedule ? ['Auswahl', 'Paarungen', 'Eigene Spiele'] : ['Auswahl', 'Tabellen', 'Eigene Spiele'];
    const icon = isSchedule
      ? '<svg viewBox="0 0 24 24"><path d="M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z"/><path d="M8 12h3M13 12h3M8 16h3M13 16h3"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M5 19V11M12 19V5M19 19V8M3 19h18"/></svg>';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(15,23,42,.72);backdrop-filter:blur(6px);display:grid;place-items:center;padding:20px;font:14px Arial,sans-serif;color:#172033';
    overlay.innerHTML = `<div style="width:min(760px,97vw);max-height:92vh;overflow:auto;background:#fff;border:1px solid rgba(255,255,255,.7);border-radius:20px;box-shadow:0 30px 90px rgba(3,10,24,.38)"><div style="position:relative;overflow:hidden;padding:24px 28px 22px;background:linear-gradient(135deg,#fff 0%,#f7f9fc 65%,#fff0f1 100%);border-bottom:1px solid #e3e8ee"><div style="position:absolute;right:-45px;top:-55px;width:150px;height:150px;border-radius:50%;background:rgba(181,18,27,.07)"></div><div style="position:relative;display:flex;align-items:center;gap:14px"><div style="display:grid;place-items:center;width:46px;height:46px;border-radius:14px;background:#b5121b;color:#fff;box-shadow:0 8px 20px rgba(181,18,27,.22)"><span style="display:block;width:25px;height:25px">${icon}</span></div><div><div style="font-size:11px;text-transform:uppercase;letter-spacing:1.4px;color:#b5121b;font-weight:800">Hockey Spielplan Plus</div><h2 style="margin:4px 0 3px;font-size:23px;line-height:1.1;color:#17243a">${heading}</h2><div style="font-size:12px;color:#68778a">${description}</div></div></div></div><div style="padding:22px 28px 24px"><div style="display:grid;grid-template-columns:repeat(${s.summaryItems.length},minmax(0,1fr));gap:12px;margin-bottom:18px">${s.summaryItems.map((item, index) => `<div style="min-width:0;padding:14px 15px;border:1px solid ${index === 0 ? '#edc4c8' : '#dfe5eb'};border-radius:13px;background:${index === 0 ? 'linear-gradient(145deg,#fff4f5,#fff)' : 'linear-gradient(145deg,#f8fafc,#fff)'};box-shadow:0 3px 10px rgba(31,47,67,.05)"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.65px;color:#718094;font-weight:700;margin-bottom:7px">${H.esc(labels[index] || 'Information')}</div><div style="font-size:15px;font-weight:800;color:#1d2b40;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${H.esc(item)}">${H.esc(item)}</div></div>`).join('')}</div><div style="display:flex;align-items:center;gap:12px;padding:13px 15px;border:1px solid #e0e6ec;border-radius:12px;background:#f7f9fb"><div style="display:grid;place-items:center;flex:0 0 auto;width:34px;height:34px;border-radius:10px;background:#fff;border:1px solid #e0e6ec;color:#b5121b"><svg style="width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16h16V8Z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></svg></div><div style="min-width:0"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.65px;color:#718094;font-weight:700;margin-bottom:4px">PDF-Dateiname</div><div style="font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;color:#26364d;overflow-wrap:anywhere">${H.esc(s.file)}</div></div></div></div><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:15px 28px;border-top:1px solid #e3e8ee;background:#fafbfd"><div style="font-size:11px;color:#7a8798">Im nächsten Schritt öffnet sich der Druckdialog.</div><div style="display:flex;gap:10px"><button type="button" id="hsp-cancel" style="padding:10px 17px;border:1px solid #cbd3dc;border-radius:9px;background:#fff;color:#344256;cursor:pointer;font-weight:700">Abbrechen</button><button type="button" id="hsp-confirm" style="display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border:1px solid #9f0f17;border-radius:9px;background:linear-gradient(180deg,#c51b25,#a81018);color:#fff;box-shadow:0 5px 13px rgba(181,18,27,.22);cursor:pointer;font-weight:800"><svg style="width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2" viewBox="0 0 24 24"><path d="M6 9V3h12v6M6 18H4V9h16v9h-2M7 14h10v7H7z"/></svg>Drucken / PDF</button></div></div></div>`;
    overlay.querySelectorAll('svg').forEach(svg => { svg.style.fill = 'none'; svg.style.stroke = 'currentColor'; svg.style.strokeWidth = '1.8'; svg.style.strokeLinecap = 'round'; svg.style.strokeLinejoin = 'round' });
    document.body.appendChild(overlay);
    overlay.querySelector('#hsp-cancel').onclick = () => overlay.remove();
    overlay.querySelector('#hsp-confirm').onclick = () => { overlay.remove(); H.printSnapshot(s) };
    overlay.addEventListener('click', event => { if (event.target === overlay) overlay.remove() });
    overlay.addEventListener('keydown', event => { if (event.key === 'Escape') overlay.remove() });
    overlay.querySelector('#hsp-confirm').focus();
  };
})();
