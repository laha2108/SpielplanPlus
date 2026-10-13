(() => {
    'use strict';

    const api = globalThis.browser || globalThis.chrome;
    const defaults = {
        clubName: 'Gladbacher HTC',
        clubAliases: ['GHTC'],
        teamMode: 'all',
        teamNames: ['Gladbacher HTC', 'GHTC'],
        highlightOwnClub: true,
        showFreeNotice: true,
        markIncompleteData: false,
        statisticsEnabled: true
    };
    const byId = id => document.getElementById(id);
    const parseList = value => String(value || '').split(/[;,\n]/).map(item => item.trim()).filter(Boolean);

    async function load() {
        const settings = { ...defaults, ...(await api.storage.sync.get(defaults)) };
        byId('clubName').value = settings.clubName;
        byId('clubAliases').value = settings.clubAliases.join('\n');
        byId('teamNames').value = settings.teamNames.join('\n');
        document.querySelector(`[name=teamMode][value=${settings.teamMode}]`).checked = true;
        byId('highlightOwnClub').checked = settings.highlightOwnClub;
        byId('showFreeNotice').checked = settings.showFreeNotice;
        byId('markIncompleteData').checked = settings.markIncompleteData;
        byId('statisticsEnabled').checked = settings.statisticsEnabled;
    }

    function closePage() {
        window.close();
        setTimeout(() => { if (!window.closed) history.back(); }, 100);
    }

    document.addEventListener('DOMContentLoaded', load);
    byId('cancel').onclick = closePage;
    byId('form').onsubmit = async event => {
        event.preventDefault();
        byId('status').textContent = 'Wird gespeichert …';
        await api.storage.sync.set({
            clubName: byId('clubName').value.trim(),
            clubAliases: parseList(byId('clubAliases').value),
            teamMode: document.querySelector('[name=teamMode]:checked')?.value || 'all',
            teamNames: parseList(byId('teamNames').value),
            highlightOwnClub: byId('highlightOwnClub').checked,
            showFreeNotice: byId('showFreeNotice').checked,
            markIncompleteData: byId('markIncompleteData').checked,
            statisticsEnabled: byId('statisticsEnabled').checked
        });
        try { await api.runtime.sendMessage({ type: 'HSP_OPTIONS_SAVED' }); } catch {}
        closePage();
    };
})();
