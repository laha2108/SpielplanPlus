(() => {
  'use strict';
  const H = globalThis.HSP;
  H.teamIdentity = value => {
    try {
      const url = new URL(value, location.href);
      const segments = url.pathname.split('/').filter(Boolean);
      const clubIndex = segments.indexOf('club');
      if (clubIndex < 0) return '';
            /* Full team link is the stable identity. Normalize trailing slash only. */ return segments.slice(clubIndex + 1).join('/').toLowerCase();
    }
    catch {
      return ''
    }
  };
  H.clubIdentity = value => {
    try {
      const url = new URL(value, location.href);
      const segments = url.pathname.split('/').filter(Boolean);
      const clubIndex = segments.indexOf('club');
      return clubIndex >= 0 ? (segments[clubIndex + 1] || '').toLowerCase() : '';
    }
    catch {
      return ''
    }
  };
  H.canonicalTeams = games => {
    const map = new Map();
    for (const game of games) for (const team of [game.home, game.away]) {
      const identity = H.teamIdentity(team.clubUrl);
      if (identity) map.set(identity, team);
    }
    return map;
  };
  H.groupRosters = games => {
    const rosters = new Map();
    for (const game of games) {
      if (!game.group) continue;
      if (!rosters.has(game.group)) rosters.set(game.group, new Set());
      const roster = rosters.get(game.group);
      for (const team of [game.home, game.away]) {
        const identity = H.teamIdentity(team.clubUrl);
        const club = H.clubIdentity(team.clubUrl);
        if (identity) roster.add(identity);
        if (club) roster.add(`club:${club}`);
      }
    }
    return rosters;
  };
  H.standingLabels = () => {
    const result = [];
    const add = value => {
      const match = H.clean(value).match(/^Gruppe\s+[A-Z0-9]+$/i);
      if (match && !result.some(item => H.norm(item) === H.norm(match[0]))) result.push(match[0]);
    };
    document.querySelectorAll('.table-standings__tab-option,[class*="table-standings__tab-option"],[role="tab"]').forEach(element => add(element.textContent));
    return result;
  };
  H.locallyLinkedStandingGroup = table => {
    const labelledBy = table.getAttribute('aria-labelledby');
    if (labelledBy) {
      const label = document.getElementById(labelledBy);
      const match = H.clean(label?.textContent).match(/^Gruppe\s+[A-Z0-9]+$/i);
      if (match) return match[0];
    }
    const panel = table.closest('[role="tabpanel"]');
    if (panel?.id) {
      const tab = document.querySelector(`[role="tab"][aria-controls="${CSS.escape(panel.id)}"]`);
      const match = H.clean(tab?.textContent).match(/^Gruppe\s+[A-Z0-9]+$/i);
      if (match) return match[0];
    }
    return '';
  };
  H.tableTeamIdentities = table => new Set([...table.querySelectorAll('a[href*="/club/"]')].flatMap(link => [H.teamIdentity(link.href), `club:${H.clubIdentity(link.href)}`]).filter(Boolean));
  H.groupByRoster = (table, rosters) => {
    const tableTeams = H.tableTeamIdentities(table);
    let bestGroup = '';
    let bestScore = 0;
    let tied = false;
    for (const [group, roster] of rosters) {
      let score = 0;
      for (const identity of tableTeams) if (roster.has(identity)) score++;
      if (score > bestScore) {
        bestGroup = group;
        bestScore = score;
        tied = false
      }
      else if (score === bestScore && score > 0) {
        tied = true
      }
    }
    return bestScore > 0 && !tied ? bestGroup : '';
  };
  H.teamCell = (cell, canonical) => {
    const link = cell.querySelector('a[href*="/club/"]');
    const identity = H.teamIdentity(link?.href || '');
    const known = canonical.get(identity);
    const desktop = cell.querySelector('[class*="desktop"][class*="team"],[class*="team--desktop"]');
    const clone = (link || cell).cloneNode(true);
    clone.querySelectorAll('[aria-hidden="true"],[class*="mobile"],[class*="short"],[class*="abbreviation"]').forEach(element => element.remove());
    return {
      name: known?.name || H.clean(desktop?.textContent) || H.clean(clone.textContent), clubUrl: link?.href || '', logo: known?.logo || H.imgUrl(cell)
    };
  };
  H.standingNodes = () => {
    const accepted = [];
    const candidates = [...document.querySelectorAll('table[class*="standing"],table,[class*="table-standings__table"],[class*="standings-table"],[class*="standing"]')];
    for (const node of candidates) {
      if (accepted.some(existing => existing.contains(node) || node.contains(existing))) continue;
      const text = H.clean(node.textContent);
      const hasHeader = /(Sp\.|Spiele|Pkt\.|Punkte|Tore|Diff)/i.test(text);
      const hasRows = node.querySelectorAll('tr,[class*="table-row"],[class*="standing-row"]').length >= 2;
      if (!hasHeader || !hasRows) continue;
      accepted.push(node);
    }
    return accepted;
  };
  H.isStandingHeaderRow = values => {
    const text = values.map(cell => H.clean(cell.text)).join(' ');
    return /\bSp\.?\b/i.test(text) && /(Pkt\.?|Punkte)/i.test(text) && /(Tore|Diff)/i.test(text);
  };
  H.parseStandingRows = (table, canonical) => {
    const rows = [];
    for (const row of table.querySelectorAll('tr,[class*="table-row"],[class*="standing-row"]')) {
      const cells = [...row.querySelectorAll(':scope>th,:scope>td,:scope>[class*="cell"]')];
      if (cells.length < 2) continue;
      const values = cells.map(cell => ({
        text: H.clean(cell.textContent), logo: H.imgUrl(cell)
      }));
      const teamIndex = cells.findIndex(cell => cell.querySelector('a[href*="/club/"]') || /team|club|mannschaft/i.test(String(cell.className)));
      if (teamIndex >= 0) {
        const team = H.teamCell(cells[teamIndex], canonical);
        values[teamIndex] = {
          text: team.name, logo: team.logo, clubUrl: team.clubUrl
        };
      }
      rows.push(values);
    }
    return rows;
  };
  H.splitStandingRows = rows => {
    const sections = [];
    let current = [];
    for (const row of rows) {
      if (H.isStandingHeaderRow(row) && current.length) {
        sections.push(current);
        current = [];
      }
      current.push(row);
    }
    if (current.length) sections.push(current);
    return sections.filter(section => section.some(row => !H.isStandingHeaderRow(row)));
  };
  H.sectionText = rows => H.norm(rows.flat().map(cell => cell.text).join(' '));
  H.groupNameRosters = games => {
    const rosters = new Map();
    for (const game of games) {
      if (!game?.group) continue;
      if (!rosters.has(game.group)) rosters.set(game.group, new Set());
      const roster = rosters.get(game.group);
      for (const team of [game.home, game.away]) {
        const name = H.norm(team?.name || '');
        if (name) roster.add(name);
      }
    }
    return rosters;
  };
  H.groupForSection = (rows, nameRosters, usedGroups) => {
    const text = H.sectionText(rows);
    let best = '';
    let bestScore = 0;
    for (const [group, names] of nameRosters) {
      if (usedGroups.has(group)) continue;
      let score = 0;
      for (const name of names) if (name && text.includes(name)) score++;
      if (score > bestScore) {
        best = group;
        bestScore = score
      }
    }
    return bestScore > 0 ? best : '';
  };
  H.fallbackStandingsFromSchedule = games => {
    const byGroup = new Map();
    for (const game of games) {
      if (!game.group) continue;
      if (!byGroup.has(game.group)) byGroup.set(game.group, new Map());
      const teams = byGroup.get(game.group);
      for (const team of [game.home, game.away]) {
        const key = H.teamIdentity(team.clubUrl) || H.norm(team.name);
        if (key && !teams.has(key)) teams.set(key, team);
      }
    }
    return [...byGroup].map(([group, teams]) => {
      const sorted = [...teams.values()].sort((a, b) => a.name.localeCompare(b.name, 'de', {
        sensitivity: 'base'
      }));
      const header = ['Pos.', 'Mannschaft', 'Sp.', 'S', 'SnP', 'U', 'N', 'Tore', 'Diff', 'Pkt.'].map(text => ({
        text, logo: ''
      }));
      const rows = sorted.map((team, index) => [{
        text: `${String(index + 1).padStart(2, '0')}.`, logo: ''
      }, {
        text: team.name, logo: team.logo || '', clubUrl: team.clubUrl || ''
      }, {
        text: '0', logo: ''
      }, {
        text: '0', logo: ''
      }, {
        text: '0', logo: ''
      }, {
        text: '0', logo: ''
      }, {
        text: '0', logo: ''
      }, {
        text: '0 : 0', logo: ''
      }, {
        text: '0', logo: ''
      }, {
        text: '0', logo: ''
      }
      ]);
      return {
        group, rows: [header, ...rows], fallback: true
      };
    }).sort((a, b) => H.groupKey(a.group).localeCompare(H.groupKey(b.group), 'de', {
      numeric: true
    }));
  };
  H.parseStandings = games => {
    const canonical = H.canonicalTeams(games);
    const nameRosters = H.groupNameRosters(games);
    const labels = H.sortGroups([...nameRosters.keys()]);
    const parsed = [];
    const usedGroups = new Set();
    for (const table of H.standingNodes()) {
      const allRows = H.parseStandingRows(table, canonical);
      const sections = H.splitStandingRows(allRows);
      for (const rows of sections) {
        let group = H.groupForSection(rows, nameRosters, usedGroups);
        if (!group) {
          const linked = H.locallyLinkedStandingGroup(table);
          if (linked && !usedGroups.has(linked)) group = linked;
        }
        if (!group) group = labels.find(label => !usedGroups.has(label)) || `Tabelle ${parsed.length + 1}`;
        usedGroups.add(group);
        parsed.push({
          group, rows, fallback: false
        });
      }
    }
    if (parsed.length) {
      return parsed.sort((left, right) => H.groupKey(left.group).localeCompare(H.groupKey(right.group), 'de', {
        numeric: true
      }));
    }
    return H.fallbackStandingsFromSchedule(games);
  };
})();
