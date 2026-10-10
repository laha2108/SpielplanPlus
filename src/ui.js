(() => {
  'use strict';
  const H = globalThis.HSP;
  H.gamePhaseText = game => {
    const display = H.gameDisplayElement?.(game) || game?.row;
    return H.norm([game?.phase || '', display?.innerText || '', display?.textContent || '', game?.row?.innerText || '', game?.row?.textContent || ''].join(' ').replace(/&amp;/gi, '&'));
  };
  H.visibleRoundKey = game => {
    const display = H.gameDisplayElement?.(game) || game?.row;
    const visible = H.norm([display?.innerText || '', display?.textContent || ''].join(' ').replace(/&amp;/gi, '&'));
    if (/qualifikation(?:sturnier|srunde)?/.test(visible)) return 'qualification';
    if (/platzierung|spiele? um (?:die )?plätze?|spiel um platz/.test(visible)) return 'placement';
    if (/viertelfinale/.test(visible) && /endrunde/.test(visible)) return 'quarterfinal-endround';
    if (/viertelfinale/.test(visible)) return 'quarterfinal';
    if (/halbfinale?/.test(visible)) return 'semifinal';
    if (/(?:endrunde|finalrunde|(?:^|\s)finale(?:\s|$))/.test(visible)) return 'finals';
    if (/gruppe\s+[a-z0-9]+/.test(visible)) return 'group';
    return game?.phaseFilterKey || game?.phaseType || 'other';
  };
  H.matchesRoundFilter = (game, value) => {
    if (!value?.startsWith('phase:')) return true;
    return H.visibleRoundKey(game) === value.slice(6);
  };
  H.updateHighlight = () => {
    for (const el of document.querySelectorAll(`${H.S.teamDesktop},${H.S.teamMobile}`)) {
      const row = H.rowOf(el), name = H.clean(el.textContent), valid = row && H.parseTeams(row).some(t => t.name === name);
      el.classList.toggle('hsp-own-team', !!(valid && H.cfg.highlightOwnClub && H.isOwnName(name)))
    }
  };
  H.gameDisplayElement = game => {
    let current = game?.row, best = current;
    while (current?.parentElement && current.parentElement !== document.body) {
      const parent = current.parentElement;
      const clubLinks = [...parent.querySelectorAll('a[href*="/club/"]')];
      const clubs = new Set(clubLinks.map(link => link.href));
      if (clubs.size !== 2) break;
      best = parent;
      current = parent;
    }
    return best;
  };
  H.setGameVisibility = (game, show) => {
    const elements = new Set([game?.row, H.gameDisplayElement(game)].filter(Boolean));
    for (const element of elements) {
      element.toggleAttribute('hidden', !show);
      element.dataset.hspFilterHidden = show ? 'false' : 'true';
      if (show) element.style.removeProperty('display');
      else element.style.setProperty('display', 'none', 'important');
    }
  };
  H.apply = () => {
        /* WHV ersetzt Spielzeilen teilweise nach Interaktionen. Deshalb vor jedem Filterlauf
     die aktuell sichtbaren DOM-Zeilen neu einlesen, statt mit veralteten Elementreferenzen
     aus dem ersten Seitenaufbau zu arbeiten. */ const fresh = H.parseSchedule();
    if (fresh.games.length) {
      const cache = H.state.model.matchdayCache || fresh.matchdayCache || H.buildMatchdayCache(fresh.games);
      H.applyMatchdayCache(fresh.games, cache);
      H.state.model.games = fresh.games;
      H.state.model.dates = fresh.dates;
      H.state.model.groups = fresh.groups;
      H.state.model.matchdayCache = cache;
    }
    const visibleFixtures = new Set();
    for (const game of H.state.model.games) {
      const phaseMatches = !H.state.day || (H.state.day.startsWith('phase:') ? H.matchesRoundFilter(game, H.state.day) : game.matchday === Number(H.state.day));
      const fixtureKey = [H.norm(game.group || ''), game.rawDate || '', H.norm(game.home?.name || ''), H.norm(game.away?.name || ''), game.time || '', game.result || ''].join('|');
      const duplicate = visibleFixtures.has(fixtureKey);
      if (!duplicate) visibleFixtures.add(fixtureKey);
      const show = !duplicate && (!H.state.group || game.group === H.state.group) && phaseMatches && (!H.state.onlyOwn || H.gameIsOwn(game));
      H.setGameVisibility(game, show);
    }
  };
  H.clubLogo = () => {
    for (const g of H.state.model.games) {
      const t = H.gameIsOwn(g) ? (H.resolveOwnTeam(g.home) ? g.home : g.away) : null;
      if (t?.logo) return t.logo
    }
    for (const t of H.state.model.standings) for (const r of t.rows) for (const c of r) if (H.isOwnName(c.text) && c.logo) return c.logo;
    return ''
  };
  H.openOptions = () => {
    try {
      const p = H.api.runtime.sendMessage({
        type: 'HSP_OPEN_OPTIONS'
      });
      p?.catch?.(() => window.open(H.api.runtime.getURL('options.html'), '_blank', 'noopener'))
    }
    catch {
      window.open(H.api.runtime.getURL('options.html'), '_blank', 'noopener')
    }
  };
  H.loadResultCache = async () => {
    if (H.state.resultCacheLoaded) return;
    try {
      const stored = await H.api.storage.local.get({
        hspResultCache: {
        }, hspResultParserVersion: 0
      });
      if (stored.hspResultParserVersion !== H.state.resultParserVersion) {
        H.state.resultCache = Object.fromEntries(Object.entries(stored.hspResultCache || {
        }).filter(([, entry]) => entry?.source === 'manual'));
        await H.api.storage.local.set({
          hspResultCache: H.state.resultCache, hspResultParserVersion: H.state.resultParserVersion
        });
      }
      else H.state.resultCache = stored.hspResultCache || {
      };
    }
    catch {
      H.state.resultCache = {
      }
    }
    H.state.resultCacheLoaded = true;
  };
  H.saveDetectedResults = async games => {
    let changed = false;
    const cache = {
      ...H.state.resultCache
    };
    for (const game of games) {
      if (!game.result || !game.cacheKey) continue;
      const existing = cache[game.cacheKey];
            /* A detected WHV result supersedes an older manual/cache value. */ if (!existing || existing.result !== game.result || existing.source !== 'page') {
        cache[game.cacheKey] = {
          result: game.result, source: 'page', updatedAt: new Date().toISOString(), home: game.home.name, away: game.away.name, date: game.rawDate, phase: game.phase || ''
        };
        changed = true;
      }
    }
    if (changed) {
      H.state.resultCache = cache;
      await H.api.storage.local.set({
        hspResultCache: cache, hspResultParserVersion: H.state.resultParserVersion
      })
    }
  };
  H.gameDateValue = raw => {
    const match = String(raw || '').match(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
    if (!match) return null;
    let year = Number(match[3]);
    if (year < 100) year += 2000;
    return new Date(year, Number(match[2]) - 1, Number(match[1]), 23, 59, 59, 999);
  };
  H.gamesRequiringResultReview = () => {
    const now = new Date();
    const ownPast = H.state.model.games.filter(game => {
      const date = H.gameDateValue(game.rawDate);
      return H.gameIsOwn(game) && date && date < now;
    });
    const standing = H.state.model.standings.find(table => table.rows.some(row => row.some(cell => H.isOwnName(cell.text))));
    const ownRow = standing ? H.ownTableRows(standing)[0] : null;
    const officialGroupCount = ownRow ? H.tableMetrics(standing, ownRow).games : 0;
    const explicitLaterTypes = new Set(['quarterfinal', 'semifinal', 'placement', 'final', 'knockout']);
    const explicitLater = ownPast.filter(game => explicitLaterTypes.has(game.phaseType));
    const extraCount = Math.max(0, ownPast.length - officialGroupCount);
    const inferredLater = extraCount ? ownPast.slice(-extraCount) : [];
    const laterSet = new Set([...explicitLater, ...inferredLater]);
    return ownPast.filter(game => {
            /* Never ask for confirmation when WHV already provides a result. */ return !game.result;
    });
  };
  H.requestMissingResults = games => new Promise(resolve => {
    if (!games.length) {
      resolve(true);
      return
    }
    document.getElementById('hsp-result-dialog')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'hsp-result-dialog';
    overlay.dataset.hspOwned = 'true';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(14,24,38,.68);display:grid;place-items:center;padding:20px;font:14px Arial';
    overlay.innerHTML = `<div style="width:min(760px,96vw);max-height:90vh;overflow:auto;background:#fff;border-radius:14px;box-shadow:0 24px 70px rgba(0,0,0,.35)"><div style="padding:20px 24px;border-bottom:1px solid #e2e6ea"><div style="font-size:12px;color:#b5121b;font-weight:700;text-transform:uppercase;letter-spacing:.08em">Fehlende Ergebnisse</div><h2 style="margin:5px 0 6px;color:#1f2f46">Ergebnisse für vergangene Spiele ergänzen</h2><p style="margin:0;color:#667788">Fehlende vergangene Spiele und noch nicht bestätigte Folgerunden werden angezeigt. Vorhandene Werte sind vorausgefüllt. Nach dem Speichern gelten die Eingaben als verbindlich und werden dauerhaft wiederverwendet.</p></div><div style="padding:16px 24px">${games.map((game, index) => `<div data-index="${index}" style="display:grid;grid-template-columns:110px minmax(0,1fr) 64px 20px 64px;gap:8px;align-items:center;padding:10px 0;border-bottom:1px solid #edf0f3"><div style="font-weight:700;color:#52606d">${H.esc(game.rawDate)
      }
        </div><div><b>${H.esc(game.home.name)}</b><br><span style="color:#667788">gegen ${H.esc(game.away.name)
      }
        ${game.phase ? ` · ${H.esc(game.phase)}` : ''
      }
        </span></div><input class="hsp-home-score" type="number" min="0" max="30" value="${H.esc((game.result || '').split(':')[0] || '')}" aria-label="Tore Heim" style="width:64px;padding:8px;border:1px solid #c8d0d8;border-radius:6px"><b style="text-align:center">:</b><input class="hsp-away-score" type="number" min="0" max="30" value="${H.esc((game.result || '').split(':')[1] || '')}" aria-label="Tore Gast" style="width:64px;padding:8px;border:1px solid #c8d0d8;border-radius:6px"></div>`).join('')}</div><div style="display:flex;justify-content:space-between;gap:10px;padding:14px 24px;border-top:1px solid #e2e6ea;background:#fafbfc"><button type="button" id="hsp-result-skip" style="padding:9px 14px;border:1px solid #b7c0ca;border-radius:6px;background:#fff">Ohne Ergänzung fortfahren</button><button type="button" id="hsp-result-save" style="padding:9px 14px;border:1px solid #b5121b;border-radius:6px;background:#b5121b;color:#fff;font-weight:700">Ergebnisse speichern</button></div></div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#hsp-result-skip').onclick = () => {
      overlay.remove();
      resolve(true)
    };
    overlay.querySelector('#hsp-result-save').onclick = async () => {
      const cache = {
        ...H.state.resultCache
      };
      for (const row of overlay.querySelectorAll('[data-index]')) {
        const game = games[Number(row.dataset.index)];
        const home = row.querySelector('.hsp-home-score').value;
        const away = row.querySelector('.hsp-away-score').value;
        if (home === '' || away === '') continue;
        cache[game.cacheKey] = {
          result: `${Number(home)}:${Number(away)}`, source: 'manual', updatedAt: new Date().toISOString(), home: game.home.name, away: game.away.name, date: game.rawDate, phase: game.phase || ''
        };
      }
      H.state.resultCache = cache;
      await H.api.storage.local.set({
        hspResultCache: cache, hspResultParserVersion: H.state.resultParserVersion
      });
      overlay.remove();
      H.initialize();
      setTimeout(() => resolve(true), 50);
    };
  });
  H.openSchedulePreview = async () => {
    await H.requestMissingResults(H.gamesRequiringResultReview());
    H.preview(H.makeScheduleSnapshot());
  };
  H.showNoStatisticsDialog = () => {
    document.getElementById('hsp-no-statistics')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'hsp-no-statistics';
    overlay.dataset.hspOwned = 'true';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:20px;background:rgba(15,23,42,.72);backdrop-filter:blur(6px);font:14px Arial,sans-serif;color:#172033';
    overlay.innerHTML = `<div style="width:min(500px,95vw);overflow:hidden;border:1px solid rgba(255,255,255,.75);border-radius:20px;background:#fff;box-shadow:0 30px 90px rgba(3,10,24,.38)"><div style="position:relative;padding:25px 26px 21px;background:linear-gradient(135deg,#fff 0%,#f7f9fc 67%,#fff3e6 100%);border-bottom:1px solid #e4e9ef"><div style="position:absolute;right:-35px;top:-45px;width:125px;height:125px;border-radius:50%;background:rgba(181,18,27,.06)"></div><div style="position:relative;display:flex;align-items:flex-start;gap:15px"><div style="display:grid;place-items:center;flex:0 0 auto;width:48px;height:48px;border-radius:15px;background:#fff4dd;color:#a06a00;border:1px solid #f0d9a6;box-shadow:0 7px 18px rgba(135,90,0,.12)"><svg style="width:25px;height:25px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round" viewBox="0 0 24 24"><path d="M5 19V13M12 19V9M19 19V15M3 19h18"/><circle cx="12" cy="5" r="2"/><path d="M12 3V2M12 8v1M9.9 4.1l-.8-.8M14.1 4.1l.8-.8"/></svg></div><div><div style="font-size:10px;text-transform:uppercase;letter-spacing:1.25px;color:#b5121b;font-weight:800">Statistik noch nicht verfügbar</div><h2 style="margin:5px 0 7px;font-size:21px;line-height:1.15;color:#16243a">Noch keine Ergebnisse vorhanden</h2><p style="margin:0;color:#66768a;line-height:1.55">Für die konfigurierte Mannschaft liegt noch kein auswertbares Spielergebnis vor. Sobald das erste Ergebnis eingetragen ist, kann die Statistik erstellt werden.</p></div></div></div><div style="display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid #e6ebf0;background:#fafbfd;color:#59697c;font-size:12px"><svg style="flex:0 0 auto;width:17px;height:17px;fill:none;stroke:#b5121b;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>Berücksichtigt werden ausschließlich Ergebnisse der eigenen konfigurierten Mannschaft.</div><div style="display:flex;justify-content:flex-end;padding:15px 18px;background:#fff"><button type="button" id="hsp-no-statistics-close" style="padding:10px 20px;border:1px solid #9f0f17;border-radius:9px;background:linear-gradient(180deg,#c51b25,#a81018);color:#fff;box-shadow:0 5px 13px rgba(181,18,27,.2);cursor:pointer;font-weight:800">Verstanden</button></div></div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('#hsp-no-statistics-close').onclick = close;
    overlay.addEventListener('click', event => {
      if (event.target === overlay) close()
    });
    overlay.addEventListener('keydown', event => {
      if (event.key === 'Escape') close()
    });
    overlay.querySelector('#hsp-no-statistics-close').focus();
  };
  H.openStatisticsPreview = async () => {
    const ownGames = H.state.model.games.filter(H.gameIsOwn);
    if (!ownGames.some(game => game.completed && H.clean(game.result))) {
      H.showNoStatisticsDialog();
      return;
    }
    await H.requestMissingResults(H.gamesRequiringResultReview());
    H.preview(H.makeStatisticsSnapshot());
  };
  H.buildControls = () => {
    if (document.getElementById('hsp-controls')) return;
    const groups = H.state.model.groups;
    if (!groups.length) return;
    const box = document.createElement('span');
    box.id = 'hsp-controls';
    box.className = 'hsp-controls';
    box.dataset.hspOwned = 'true';
    const select = (id) => {
      const e = document.createElement('select');
      e.id = id;
      e.className = 'hsp-control';
      return e
    }, gs = select('hsp-group'), ds = select('hsp-day');
    gs.add(new Option('Alle Gruppen', ''));
    const ownGroups = new Set(H.state.model.games.filter(H.gameIsOwn).map(game => game.group).filter(Boolean));
    groups.forEach(group => {
      const isOwn = ownGroups.has(group);
      const option = new Option(`${isOwn ? '★ ' : ''}${group}`, group);
      if (isOwn) {
        option.dataset.ownGroup = 'true';
        option.style.backgroundColor = '#fff0f1';
        option.style.color = '#8f0d15';
        option.style.fontWeight = '700';
      }
      gs.add(option);
    });
    const maxMatchday = Math.max(0, ...H.state.model.games.map(game => game.matchday || 0));
    const hasRound = (value) => H.state.model.games.some(game => H.matchesRoundFilter(game, `phase:${value}`));
    const phaseOptions = [['qualification', 'Qualifikationsturnier / Qualifizierungsrunde'], ['placement', 'Platzierungsrunde'], ['quarterfinal-endround', 'Viertelfinale & Endrunde'], ['quarterfinal', 'Viertelfinale'], ['semifinal', 'Halbfinale'], ['finals', 'Endrunde / Finale']].filter(([value]) => hasRound(value));
    const validValues = new Set(['', ...Array.from({
      length: maxMatchday
    }, (_, index) => String(index + 1)), ...phaseOptions.map(([type]) => `phase:${type}`)]);
    const selectedDay = validValues.has(String(H.state.day)) ? String(H.state.day) : '';
    ds.add(new Option('Alle Spiele', ''));
    for (let matchday = 1;
      matchday <= maxMatchday;
      matchday++)ds.add(new Option(`Spieltag ${matchday}`, String(matchday)));
    if (phaseOptions.length) {
      const divider = new Option('──────── Runden ────────', '');
      divider.disabled = true;
      ds.add(divider);
      phaseOptions.forEach(([type, label]) => ds.add(new Option(label, `phase:${type}`)));
    }
    gs.value = H.state.group;
    H.state.day = selectedDay;
    ds.value = selectedDay;
    const updateGroupMarker = () => {
      const selected = gs.selectedOptions[0];
      const isOwn = selected?.dataset.ownGroup === 'true';
      gs.style.borderColor = isOwn ? '#b5121b' : '';
      gs.style.backgroundColor = isOwn ? '#fff0f1' : '';
      gs.style.color = isOwn ? '#8f0d15' : '';
      gs.style.fontWeight = isOwn ? '700' : '';
    };
    updateGroupMarker();
    gs.addEventListener('change', event => {
      H.state.group = event.currentTarget.value;
      updateGroupMarker();
      H.apply();
    });
    ds.addEventListener('change', event => {
      H.state.day = event.currentTarget.value;
      H.apply();
    });
    const own = document.createElement('label');
    own.className = 'hsp-control hsp-own-toggle';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = H.state.onlyOwn;
    cb.addEventListener('change', event => {
      H.state.onlyOwn = event.currentTarget.checked;
      H.apply()
    });
    const logo = document.createElement('img'), src = H.clubLogo();
    if (src) logo.src = src;
    else logo.style.display = 'none';
    const ownText = document.createElement('span');
    ownText.className = 'hsp-own-toggle-text';
    ownText.textContent = 'Nur Spiele';
    own.append(cb, ownText, logo);
    own.style.display = 'inline-flex';
    const scheduleButton = document.createElement('button');
    scheduleButton.className = 'hsp-control hsp-button hsp-print';
    scheduleButton.type = 'button';
    scheduleButton.textContent = 'Spielplan';
    scheduleButton.title = 'Spielplan als PDF';
    scheduleButton.onclick = async event => {
      event.preventDefault();
      event.stopPropagation();
      try {
        await H.openSchedulePreview()
      }
      catch (error) {
        console.error(error);
        alert('Die Spielplan-Vorschau konnte nicht erstellt werden.')
      }
    };
    const statsButton = document.createElement('button');
    statsButton.className = 'hsp-control hsp-button';
    statsButton.type = 'button';
    statsButton.textContent = 'Statistik';
    statsButton.title = 'Statistik als PDF';
    statsButton.onclick = async event => {
      event.preventDefault();
      event.stopPropagation();
      try {
        await H.openStatisticsPreview()
      }
      catch (error) {
        console.error(error);
        alert('Die Statistik-Vorschau konnte nicht erstellt werden.')
      }
    };
    const gear = document.createElement('button');
    gear.className = 'hsp-control hsp-button';
    gear.type = 'button';
    gear.textContent = '⚙';
    gear.title = 'Einstellungen öffnen';
    gear.onclick = H.openOptions;
    box.append(gs, ds, own, scheduleButton);
    if (H.cfg.statisticsEnabled) box.append(statsButton);
    box.append(gear);
    const allGamesTab = [...document.querySelectorAll('a,button,[role="tab"],span,div')].find(element => /^Alle Spiele$/i.test(H.clean(element.textContent)) && !element.closest?.('[data-hsp-owned="true"]'));
    const currentTab = [...document.querySelectorAll('a,button,[role="tab"],span,div')].find(element => /^Aktueller Spieltag$/i.test(H.clean(element.textContent)) && !element.closest?.('[data-hsp-owned="true"]'));
    if (!allGamesTab || !currentTab) return;
    let tabRow = allGamesTab.parentElement, probe = allGamesTab;
    while (probe && probe !== document.body && !probe.contains(currentTab)) probe = probe.parentElement;
    if (probe && probe !== document.body) tabRow = probe;
    const host = tabRow?.parentElement || document.body;
    box.style.flexWrap = 'wrap';
    box.style.justifyContent = 'center';
    box.style.gap = '8px';
    box.style.margin = '14px 0 10px';
    const currentOwn = own.cloneNode(true);
    currentOwn.id = 'hsp-current-own-toggle';
    currentOwn.dataset.hspOwned = 'true';
    currentOwn.style.width = 'max-content';
    currentOwn.style.margin = '14px auto 10px';
    const currentCb = currentOwn.querySelector('input');
    currentCb.checked = H.state.onlyOwn;
    const syncOwn = checked => {
      H.state.onlyOwn = checked;
      cb.checked = checked;
      currentCb.checked = checked;
      H.apply()
    };
    cb.onchange = null;
    cb.addEventListener('change', event => syncOwn(event.currentTarget.checked));
    currentCb.addEventListener('change', event => syncOwn(event.currentTarget.checked));
    if (tabRow?.nextSibling) host.insertBefore(box, tabRow.nextSibling);
    else host.appendChild(box);
    if (box.nextSibling) host.insertBefore(currentOwn, box.nextSibling);
    else host.appendChild(currentOwn);
    let selectedTab = H.state.activeScheduleTab || 'current';
    const resetRows = () => document.querySelectorAll('[data-hsp-filter-hidden]').forEach(element => {
      element.hidden = false;
      element.removeAttribute('data-hsp-filter-hidden');
      element.style.removeProperty('display')
    });
    const renderTab = () => {
      const current = selectedTab === 'current';
      box.style.display = current ? 'none' : 'flex';
      currentOwn.style.display = current ? 'inline-flex' : 'none'
    };
    const rebuildControlsForTab = async target => {
      H.state.activeScheduleTab = target;
      H.state.group = '';
      H.state.day = '';
      resetRows();
      document.getElementById('hsp-controls')?.remove();
      document.getElementById('hsp-current-own-toggle')?.remove();
      await H.waitForScheduleRows();
      if (target === 'all' && H.state.allGamesModel?.groups?.length) H.state.model = H.state.allGamesModel;
      else H.state.model = H.buildModel();
      H.buildControls();
      H.apply();
      const main = document.getElementById('hsp-controls');
      const currentOnly = document.getElementById('hsp-current-own-toggle');
      if (main) main.style.display = target === 'all' ? 'flex' : 'none';
      if (currentOnly) currentOnly.style.display = target === 'current' ? 'inline-flex' : 'none';
    };
    const reloadForTab = target => {
      selectedTab = target;
      H.state.activeScheduleTab = target;
      const main = document.getElementById('hsp-controls');
      const currentOnly = document.getElementById('hsp-current-own-toggle');
      if (main) main.style.display = 'none';
      if (currentOnly) currentOnly.style.display = 'none';
      setTimeout(() => rebuildControlsForTab(target), 0);
    };
    allGamesTab.addEventListener('click', () => reloadForTab('all'));
    currentTab.addEventListener('click', () => reloadForTab('current'));
    renderTab();
  };
  H.findScheduleTabs = () => {
    const candidates = [...document.querySelectorAll('a,button,[role="tab"],span,div')].filter(element => !element.closest?.('[data-hsp-owned="true"]'));
    return {
      all: candidates.find(element => /^Alle Spiele$/i.test(H.clean(element.textContent))), current: candidates.find(element => /^Aktueller Spieltag$/i.test(H.clean(element.textContent)))
    };
  };
  H.waitForScheduleRows = () => new Promise(resolve => {
    let previous = -1, stable = 0, attempt = 0;
    const poll = () => {
      const count = document.querySelectorAll(H.S.row).length;
      if (count > 0 && count === previous) stable++;
      else stable = 0;
      previous = count;
      attempt++;
      if (stable >= 3 || attempt >= 30) resolve(count);
      else setTimeout(poll, 120);
    };
    poll();
  });
  H.preloadAllGames = async () => {
    if (H.state.allGamesPreloaded || H.state.preloadingAllGames) return;
    const tabs = H.findScheduleTabs();
    if (!tabs.all || !tabs.current) return;
    H.state.preloadingAllGames = true;
    const panel = tabs.all.closest('section,article,[class*="card"],[class*="schedule"]') || tabs.all.parentElement?.parentElement;
    const oldVisibility = panel?.style.visibility || '';
    if (panel) panel.style.visibility = 'hidden';
    try {
      tabs.all.click();
      await H.waitForScheduleRows();
      const allModel = H.buildModel();
      if (allModel?.groups?.length && allModel?.games?.length) {
        H.state.allGamesModel = allModel;
        H.state.allGamesPreloaded = true;
      }
      tabs.current.click();
      await H.waitForScheduleRows();
    }
    finally {
      if (panel) panel.style.visibility = oldVisibility;
      H.state.preloadingAllGames = false;
    }
  };
  H.initialize = async () => {
    if (H.state.updating) return;
    H.state.updating = true;
    H.state.observer?.disconnect();
    try {
      await H.loadResultCache();
      H.injectStyle();
      await H.preloadAllGames();
      H.state.model = H.buildModel();
      if (H.state.activeScheduleTab === 'all' && H.state.allGamesModel?.groups?.length) {
        H.state.model = H.state.allGamesModel;
      }
      else if ((H.state.model?.games?.length || 0) > (H.state.allGamesModel?.games?.length || 0)) {
        H.state.allGamesModel = H.state.model;
      }
      await H.saveDetectedResults(H.state.model.games);
      document.getElementById('hsp-controls')?.remove();
      document.getElementById('hsp-current-own-toggle')?.remove();
      H.buildControls();
      H.apply();
      H.updateHighlight();
    }
    finally {
      H.state.updating = false;
      H.observe();
    }
  };
  H.schedule = () => {
    if (H.state.updating) return;
    clearTimeout(H.state.timer);
    H.state.timer = setTimeout(H.initialize, 250);
  };
  H.observe = () => {
    H.state.observer?.disconnect();
    H.state.observer = new MutationObserver(mutations => {
      if (H.state.updating) return;
      const relevant = mutations.some(mutation => {
        const changed = [...mutation.addedNodes, ...mutation.removedNodes];
        if (!changed.length) return false;
        return changed.some(node => {
          if (node.nodeType !== Node.ELEMENT_NODE) return false;
          const element = node;
          return !element.matches?.('[data-hsp-owned="true"]') && !element.closest?.('[data-hsp-owned="true"]');
        });
      });
      if (relevant) H.schedule();
    });
    H.state.observer.observe(document.body, {
      childList: true, subtree: true
    });
  };
})();