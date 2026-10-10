(() => {
    'use strict';

    const api = globalThis.browser || globalThis.chrome;

    const D = {
        clubName: 'Gladbacher HTC',
        clubAliases: ['GHTC'],
        teamMode: 'all',
        teamNames: ['Gladbacher HTC', 'GHTC'],
        highlightOwnClub: true,
        showFreeNotice: true,
        markIncompleteData: false,
        statisticsEnabled: true
    };

    const $ = id => document.getElementById(id);

    const list = value =>
        String(value || '')
            .split(/[;,\n]/)
            .map(item => item.trim())
            .filter(Boolean);

    async function load() {
        const settings = {
            ...D,
            ...(await api.storage.sync.get(D))
        };

        $('clubName').value = settings.clubName;
        $('clubAliases').value = settings.clubAliases.join('\n');
        $('teamNames').value = settings.teamNames.join('\n');

        document.querySelector(
            `[name=teamMode][value=${settings.teamMode}]`
        ).checked = true;

        $('highlightOwnClub').checked = settings.highlightOwnClub;
        $('showFreeNotice').checked = settings.showFreeNotice;
        $('markIncompleteData').checked = settings.markIncompleteData;
        $('statisticsEnabled').checked = settings.statisticsEnabled;
    }

    function closePage() {
        window.close();

        setTimeout(() => {
            if (!window.closed) {
                history.back();
            }
        }, 100);
    }

    document.addEventListener('DOMContentLoaded', load);

    $('cancel').onclick = closePage;

    $('form').onsubmit = async event => {
        event.preventDefault();

        $('status').textContent = 'Wird gespeichert …';

        await api.storage.sync.set({
            clubName: $('clubName').value.trim(),
            clubAliases: list($('clubAliases').value),
            teamMode:
                document.querySelector('[name=teamMode]:checked')?.value ||
                'all',
            teamNames: list($('teamNames').value),
            highlightOwnClub: $('highlightOwnClub').checked,
            showFreeNotice: $('showFreeNotice').checked,
            markIncompleteData: $('markIncompleteData').checked,
            statisticsEnabled: $('statisticsEnabled').checked
        });

        try {
            await api.runtime.sendMessage({
                type: 'HSP_OPTIONS_SAVED'
            });
        } catch {
            // Ignorieren
        }

        closePage();
    };
})();