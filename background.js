(() => {
    'use strict';

    const api = globalThis.browser || globalThis.chrome;

    api.runtime.onMessage.addListener((message, sender, respond) => {

        if (message?.type === 'HSP_OPEN_OPTIONS') {
            Promise.resolve(api.runtime.openOptionsPage())
                .then(() => respond({ ok: true }))
                .catch(error =>
                    respond({
                        ok: false,
                        error: String(error)
                    })
                );

            return true;
        }

        if (message?.type === 'HSP_OPTIONS_SAVED') {
            (async () => {
                try {
                    const tabs = await api.tabs.query({
                        url: 'https://whv.hockey.de/*'
                    });

                    await Promise.all(
                        tabs.map(tab => api.tabs.reload(tab.id))
                    );

                    respond({
                        ok: true,
                        count: tabs.length
                    });
                } catch (error) {
                    respond({
                        ok: false,
                        error: String(error)
                    });
                }
            })();

            return true;
        }

        return false;
    });
})();