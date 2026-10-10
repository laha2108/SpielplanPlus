(() => {
  'use strict';
  const H = globalThis.HSP = {
  };
  H.api = globalThis.browser || globalThis.chrome;
  H.defaults = {
    clubName: 'Gladbacher HTC', clubAliases: ['GHTC'], teamMode: 'all', teamNames: ['Gladbacher HTC', 'GHTC'], highlightOwnClub: true, showFreeNotice: true, markIncompleteData: false, statisticsEnabled: true
  };
  H.cfg = {
    ...H.defaults
  };
  H.state = {
    group: '', day: '', onlyOwn: false, model: null, observer: null, timer: 0, updating: false, ownClubUrls: new Set(), resultCache: {
    }, resultCacheLoaded: false, resultParserVersion: 4, activeScheduleTab: 'current', allGamesModel: null, allGamesPreloaded: false, preloadingAllGames: false
  };
  H.S = {
    groupCell: '.table-schedule-condensed__table-cell--group', row: '.table-schedule-condensed__table-row,[class*="table-schedule-condensed__table-row"]', teamDesktop: '.mc-lite__team--desktop', teamMobile: '.mc-lite__team--mobile', location: '[class*="location"],[class*="venue"],[class*="spielort"],[class*="place"]'
  };
  H.clean = v => String(v || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  H.norm = v => H.clean(v).toLocaleLowerCase('de-DE');
  H.esc = v => String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  H.list = v => Array.isArray(v) ? v.map(H.clean).filter(Boolean) : String(v || '').split(/[;,\n]/).map(H.clean).filter(Boolean);
  H.groupKey = v => H.clean(v).replace(/^Gruppe\s*/i, '').toUpperCase();
  H.sortGroups = a => [...a].sort((x, y) => H.groupKey(x).localeCompare(H.groupKey(y), 'de', {
    numeric: true, sensitivity: 'base'
  }));
  H.isField = () => decodeURIComponent(location.pathname).toLowerCase().includes('/feldsaison/');
  H.clubNames = () => H.cfg.teamMode === 'exact' ? H.list(H.cfg.teamNames) : [H.cfg.clubName, ...H.list(H.cfg.clubAliases)];
  H.nameTokens = value => H.norm(value).replace(/[–—]/g, '-').replace(/[^a-z0-9äöüß]+/gi, ' ').split(/\s+/).filter(Boolean);
  H.isOwnName = name => {
    const candidate = H.norm(name);
    const candidateTokens = H.nameTokens(name);
    return H.clubNames().map(H.norm).filter(Boolean).some(configured => {
      if (H.cfg.teamMode === 'exact') return candidate === configured;
      if (candidate === configured || candidate.startsWith(configured + ' ')) return true;
      const configuredTokens = H.nameTokens(configured);
      return configuredTokens.length > 0 && configuredTokens.every(token => candidateTokens.includes(token));
    });
  };
  H.clubUrlKey = value => {
    try {
      const url = new URL(value, location.href);
      const marker = '/club/';
      const index = url.pathname.indexOf(marker);
      if (index < 0) return '';
      return url.pathname.slice(index + marker.length).split('/')[0].toLowerCase();
    }
    catch {
      return ''
    }
  };
  H.isOwnTeam = team => {
    const urlKey = H.clubUrlKey(team?.clubUrl);
    return (!!urlKey && H.state.ownClubUrls.has(urlKey)) || H.isOwnName(team?.name || '');
  };
  H.rowOf = e => e?.closest?.(H.S.row) || e?.closest?.('[class*="table-row"]') || null;
  H.imgUrl = e => {
    const i = e?.matches?.('img') ? e : e?.querySelector?.('img');
    return i?.currentSrc || i?.src || i?.getAttribute?.('data-src') || ''
  };
  H.load = async () => {
    try {
      H.cfg = {
        ...H.defaults, ...await H.api.storage.sync.get(H.defaults)
      }
    }
    catch {
      H.cfg = {
        ...H.defaults
      }
    }
  };
  H.injectStyle = () => {
    if (document.getElementById('hsp-style')) return;
    const s = document.createElement('style');
    s.id = 'hsp-style';
    s.dataset.hspOwned = 'true';
    s.textContent = '.hsp-own-team{background:#fff59d!important;border-radius:2px;font-weight:600;padding:1px 3px}[data-hsp-filter-hidden="true"]{display:none!important}.hsp-controls{display:inline-flex;align-items:center;gap:8px;margin-left:15px;flex-wrap:wrap}.hsp-control{height:30px;border:1px solid #c0c0c0;border-radius:4px;background:#fff;font-size:12px}.hsp-button{padding:0 11px;cursor:pointer;font-weight:600}.hsp-print{background:#b5121b;color:#fff;border-color:#b5121b}.hsp-own-toggle{display:none;align-items:center;gap:6px;padding:0 8px}.hsp-own-toggle-text{display:inline-block!important;color:#202124!important;font-size:12px!important;font-weight:600!important;visibility:visible!important;opacity:1!important}.hsp-own-toggle img{width:20px;height:20px;object-fit:contain}';
    document.head.appendChild(s)
  };
})();
