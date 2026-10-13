(() => {
    'use strict';

    const H = globalThis.HSP;

    if (!H) {
        return;
    }

    const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
    const ADDRESS_CACHE_KEY = 'hspNominatimAddressCacheV2';
    const NOMINATIM_DELAY_MS = 1100;
    const HALL_DURATION_MINUTES = 29;
    const FIELD_DURATION_MINUTES = 70;

    const clean = value => H.clean(value);
    const normalize = value => H.norm(value);
    const pad = value => String(value).padStart(2, '0');
    const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

    function escapeIcsText(value) {
        return String(value || '')
            .replace(/\\/g, '\\\\')
            .replace(/\r?\n/g, '\\n')
            .replace(/,/g, '\\,')
            .replace(/;/g, '\\;');
    }


    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function createHtmlDescription(description) {
        const body = String(description || '')
            .split('\n')
            .map(line => escapeHtml(line))
            .join('<br>');

        return `<!DOCTYPE HTML><html><body>${body}</body></html>`;
    }

    function foldIcsLine(line) {
        const foldedLines = [];
        const encoder = new TextEncoder();
        let currentLine = '';
        let currentBytes = 0;

        for (const character of line) {
            const characterBytes = encoder.encode(character).length;

            if (currentLine && currentBytes + characterBytes > 73) {
                foldedLines.push(currentLine);
                currentLine = ` ${character}`;
                currentBytes = 1 + characterBytes;
            } else {
                currentLine += character;
                currentBytes += characterBytes;
            }
        }

        if (currentLine) {
            foldedLines.push(currentLine);
        }

        return foldedLines.join('\r\n');
    }

    function parseGameStart(game) {
        const dateMatch = String(game.rawDate || '')
            .match(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
        const timeMatch = String(game.time || '')
            .match(/([01]?\d|2[0-3]):([0-5]\d)/);

        if (!dateMatch || !timeMatch) {
            return null;
        }

        let year = Number(dateMatch[3]);
        if (year < 100) {
            year += 2000;
        }

        return new Date(
            year,
            Number(dateMatch[2]) - 1,
            Number(dateMatch[1]),
            Number(timeMatch[1]),
            Number(timeMatch[2])
        );
    }

    function formatLocalDateTime(date) {
        return [
            date.getFullYear(),
            pad(date.getMonth() + 1),
            pad(date.getDate()),
            'T',
            pad(date.getHours()),
            pad(date.getMinutes()),
            '00'
        ].join('');
    }

    function formatUtcTimestamp(date = new Date()) {
        return date
            .toISOString()
            .replace(/[-:]/g, '')
            .replace(/\.\d{3}Z$/, 'Z');
    }

    function gameDurationMinutes() {
        return H.isField()
            ? FIELD_DURATION_MINUTES
            : HALL_DURATION_MINUTES;
    }

    function fixtureKey(game) {
        return [
            game.rawDate,
            game.time,
            game.home?.name,
            game.away?.name,
            game.location
        ]
            .map(normalize)
            .join('|');
    }

    function createUid(game) {
        let hash = 2166136261;

        for (const character of fixtureKey(game)) {
            hash ^= character.charCodeAt(0);
            hash = Math.imul(hash, 16777619);
        }

        return `hsp-${(hash >>> 0).toString(16)}@spielplanplus`;
    }

    function configuredClubNames() {
        return [clean(H.cfg.clubName), ...H.list(H.cfg.clubAliases)]
            .map(normalize)
            .filter(Boolean);
    }

    function teamBelongsToOwnClub(team) {
        const teamName = normalize(team?.name);
        if (!teamName) {
            return false;
        }

        return configuredClubNames().some(clubName =>
            teamName === clubName ||
            teamName.startsWith(`${clubName} `) ||
            teamName.startsWith(`${clubName}-`) ||
            teamName.startsWith(`${clubName}/`)
        );
    }

    function getOpponent(game) {
        const homeIsOwn = teamBelongsToOwnClub(game.home);
        const awayIsOwn = teamBelongsToOwnClub(game.away);

        if (homeIsOwn && !awayIsOwn) {
            return clean(game.away?.name);
        }
        if (awayIsOwn && !homeIsOwn) {
            return clean(game.home?.name);
        }

        console.warn(
            'SpielplanPlus: Der Gegner konnte nicht eindeutig bestimmt werden.',
            game
        );
        return '';
    }

    function uniqueCleanValues(values) {
        const result = [];
        const seen = new Set();

        for (const value of values) {
            const cleanedValue = clean(value);
            const key = normalize(cleanedValue);
            if (!key || seen.has(key)) {
                continue;
            }
            seen.add(key);
            result.push(cleanedValue);
        }

        return result;
    }

    function gameDateKey(game) {
        const start = parseGameStart(game);
        return [
            start.getFullYear(),
            pad(start.getMonth() + 1),
            pad(start.getDate())
        ].join('-');
    }

    function createGroupedUid(games) {
        let hash = 2166136261;
        const key = games.map(fixtureKey).sort().join('||');

        for (const character of key) {
            hash ^= character.charCodeAt(0);
            hash = Math.imul(hash, 16777619);
        }

        return `hsp-day-${(hash >>> 0).toString(16)}@spielplanplus`;
    }

    function getOwnGames() {
        const model = H.state.allGamesModel || H.state.model;
        const games = model?.games || [];
        const seenFixtures = new Set();

        return games
            .filter(game => H.gameIsOwn(game))
            .filter(game => parseGameStart(game))
            .filter(game => {
                const key = fixtureKey(game);

                if (seenFixtures.has(key)) {
                    return false;
                }

                seenFixtures.add(key);
                return true;
            })
            .sort((left, right) => parseGameStart(left) - parseGameStart(right));
    }

    function loadAddressCache() {
        try {
            return JSON.parse(localStorage.getItem(ADDRESS_CACHE_KEY) || '{}');
        } catch {
            return {};
        }
    }

    function saveAddressCache(cache) {
        try {
            localStorage.setItem(
                ADDRESS_CACHE_KEY,
                JSON.stringify(cache)
            );
        } catch (error) {
            console.warn(
                'SpielplanPlus: Der Adresscache konnte nicht gespeichert werden.',
                error
            );
        }
    }

    function firstAddressValue(address, keys) {
        for (const key of keys) {
            const value = clean(address?.[key]);
            if (value) {
                return value;
            }
        }

        return '';
    }

    function formatNominatimAddress(place) {
        const address = place?.address || {};
        const road = firstAddressValue(address, [
            'road',
            'pedestrian',
            'footway',
            'path',
            'residential',
            'cycleway'
        ]);
        const houseNumber = clean(address.house_number);
        const postcode = clean(address.postcode);
        const city = firstAddressValue(address, [
            'city',
            'town',
            'village',
            'municipality',
            'hamlet'
        ]);

        const street = [road, houseNumber]
            .filter(Boolean)
            .join(' ');
        const cityLine = [postcode, city]
            .filter(Boolean)
            .join(' ');
        const structuredAddress = [street, cityLine]
            .filter(Boolean)
            .join(', ');

        if (structuredAddress) {
            return structuredAddress;
        }

        return clean(place?.display_name);
    }

    async function resolveVenueAddress(venue, cache) {
        const cleanedVenue = clean(venue);

        if (!cleanedVenue || normalize(cleanedVenue) === 'ausstehend') {
            return '';
        }

        const cacheKey = normalize(cleanedVenue);

        if (Object.prototype.hasOwnProperty.call(cache, cacheKey)) {
            return clean(cache[cacheKey]);
        }

        try {
            const parameters = new URLSearchParams({
                q: `${cleanedVenue}, Deutschland`,
                format: 'jsonv2',
                addressdetails: '1',
                limit: '1',
                countrycodes: 'de',
                'accept-language': 'de'
            });

            const response = await fetch(
                `${NOMINATIM_URL}?${parameters.toString()}`,
                {
                    headers: {
                        Accept: 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const places = await response.json();
            const address = formatNominatimAddress(places?.[0]);

            cache[cacheKey] = address;
            saveAddressCache(cache);
            await wait(NOMINATIM_DELAY_MS);

            return address;
        } catch (error) {
            console.warn(
                `SpielplanPlus: Für „${cleanedVenue}“ wurde keine Adresse gefunden.`,
                error
            );

            cache[cacheKey] = '';
            saveAddressCache(cache);
            await wait(NOMINATIM_DELAY_MS);

            return '';
        }
    }

    function getLeague(game) {
        const model = H.state.allGamesModel || H.state.model;

        return clean(game.league) ||
            clean(game.competition) ||
            clean(model?.meta?.league) ||
            clean(model?.meta?.competition) ||
            '';
    }

    function getGroup(game) {
        const group = clean(game.group);
        const phase = clean(game.phase);

        if (group) {
            return group;
        }

        if (phase && /^Gruppe\s+/i.test(phase)) {
            return phase;
        }

        return '';
    }

    function createDescription(game, address) {
        const pairing = `${clean(game.home?.name)} - ${clean(game.away?.name)}`;
        const group = getGroup(game);
        const league = getLeague(game);

        return [
            pairing,
            group,
            league,
            '',
            clean(address) || clean(game.location)
        ].join('\n');
    }

    function createLocation(game, address) {
        const venue = clean(game.location);
        const resolvedAddress = clean(address);

        if (venue && resolvedAddress) {
            return `${venue}, ${resolvedAddress}`;
        }

        return resolvedAddress || venue;
    }

    function googleMapsSearchUrl(venue) {
        const parameters = new URLSearchParams({
            api: '1',
            query: `${clean(venue)}, Deutschland`
        });

        return `https://www.google.com/maps/search/?${parameters.toString()}`;
    }

    function requestAddressCorrection(venue, suggestedAddress) {
        return new Promise(resolve => {
            document.getElementById('hsp-address-dialog')?.remove();

            const overlay = document.createElement('div');
            overlay.id = 'hsp-address-dialog';
            overlay.dataset.hspOwned = 'true';
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.style.cssText = [
                'position:fixed',
                'inset:0',
                'z-index:2147483647',
                'display:grid',
                'place-items:center',
                'padding:20px',
                'background:rgba(15,23,42,.72)',
                'backdrop-filter:blur(5px)',
                'font:14px Arial,sans-serif'
            ].join(';');

            overlay.innerHTML = `
                <section style="width:min(620px,96vw);overflow:hidden;border-radius:16px;background:#fff;box-shadow:0 28px 80px rgba(0,0,0,.35)">
                    <header style="padding:21px 24px 17px;background:linear-gradient(135deg,#fff,#f7f9fc 68%,#fff0f1);border-bottom:1px solid #e2e7ec">
                        <div style="font-size:10px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:#b5121b">ICS-Adresse prüfen</div>
                        <h2 style="margin:5px 0 7px;color:#17243a;font-size:21px">${escapeHtml(venue)}</h2>
                        <p style="margin:0;color:#66768a;line-height:1.5">Die Adresse konnte nicht eindeutig ermittelt werden. Über Google Maps kann der Spielort geprüft und die Anschrift einmalig übernommen werden.</p>
                    </header>
                    <div style="padding:20px 24px">
                        <label for="hsp-address-input" style="display:block;margin-bottom:7px;font-weight:700;color:#344256">Adresse</label>
                        <textarea id="hsp-address-input" rows="3" style="display:block;width:100%;box-sizing:border-box;resize:vertical;padding:10px 11px;border:1px solid #b8c2cc;border-radius:8px;font:14px Arial,sans-serif">${escapeHtml(suggestedAddress)}</textarea>
                        <div style="margin-top:10px;color:#708094;font-size:11px">Die bestätigte Anschrift wird lokal gespeichert und bei späteren Exporten wiederverwendet.</div>
                    </div>
                    <footer style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:14px 24px;border-top:1px solid #e2e7ec;background:#fafbfd">
                        <a id="hsp-google-maps-search" href="${escapeHtml(googleMapsSearchUrl(venue))}" target="_blank" rel="noopener noreferrer" style="color:#174ea6;font-weight:700;text-decoration:none">In Google Maps suchen</a>
                        <div style="display:flex;gap:9px">
                            <button id="hsp-address-skip" type="button" style="padding:9px 13px;border:1px solid #bcc5cf;border-radius:8px;background:#fff;color:#344256;font-weight:700;cursor:pointer">Überspringen</button>
                            <button id="hsp-address-save" type="button" style="padding:9px 15px;border:1px solid #9f0f17;border-radius:8px;background:#b5121b;color:#fff;font-weight:800;cursor:pointer">Adresse übernehmen</button>
                        </div>
                    </footer>
                </section>
            `;

            document.body.appendChild(overlay);

            const input = overlay.querySelector('#hsp-address-input');
            const close = value => {
                overlay.remove();
                resolve(clean(value));
            };

            overlay.querySelector('#hsp-address-save').addEventListener('click', () => {
                close(input.value);
            });
            overlay.querySelector('#hsp-address-skip').addEventListener('click', () => {
                close('');
            });
            overlay.addEventListener('click', event => {
                if (event.target === overlay) {
                    close('');
                }
            });
            overlay.addEventListener('keydown', event => {
                if (event.key === 'Escape') {
                    close('');
                }
            });

            input.focus();
            input.select();
        });
    }

    async function confirmMissingAddresses(games, addresses, cache) {
        const venues = [
            ...new Set(
                games
                    .map(game => clean(game.location))
                    .filter(venue => venue && normalize(venue) !== 'ausstehend')
            )
        ];

        for (const venue of venues) {
            if (clean(addresses.get(venue))) {
                continue;
            }

            const confirmedAddress = await requestAddressCorrection(venue, '');
            if (!confirmedAddress) {
                continue;
            }

            const cacheKey = normalize(venue);
            cache[cacheKey] = confirmedAddress;
            saveAddressCache(cache);
            addresses.set(venue, confirmedAddress);
        }

        return addresses;
    }

    async function resolveAddresses(games) {
        const cache = loadAddressCache();
        const addresses = new Map();
        const venues = [
            ...new Set(
                games
                    .map(game => clean(game.location))
                    .filter(venue => venue && normalize(venue) !== 'ausstehend')
            )
        ];

        for (const venue of venues) {
            addresses.set(
                venue,
                await resolveVenueAddress(venue, cache)
            );
        }

        return confirmMissingAddresses(games, addresses, cache);
    }

    function createCalendarEntries(games) {
        if (H.isField()) {
            return games.map(game => [game]);
        }

        const gamesByDay = new Map();
        for (const game of games) {
            const key = gameDateKey(game);
            if (!gamesByDay.has(key)) {
                gamesByDay.set(key, []);
            }
            gamesByDay.get(key).push(game);
        }

        return [...gamesByDay.values()].map(dayGames =>
            dayGames.sort((left, right) =>
                parseGameStart(left) - parseGameStart(right)
            )
        );
    }

    function createHallDescription(games, address) {
        const pairings = games.map(game =>
            `${clean(game.time)} ${clean(game.home?.name)} - ${clean(game.away?.name)}`
        );
        const groups = uniqueCleanValues(games.map(getGroup));
        const leagues = uniqueCleanValues(games.map(getLeague));

        return [
            ...pairings,
            groups.join(', '),
            leagues.join(', '),
            '',
            clean(address) || clean(games[0]?.location)
        ].join('\n');
    }

    async function createCalendar(games) {
        const addresses = await resolveAddresses(games);
        const durationMinutes = gameDurationMinutes();
        const timestamp = formatUtcTimestamp();
        const calendarName = `${clean(H.cfg.clubName)} Spielplan`;
        const lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Hockey Spielplan Plus//ICS Export//DE',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
            'X-WR-TIMEZONE:Europe/Berlin'
        ];

        for (const entryGames of createCalendarEntries(games)) {
            const firstGame = entryGames[0];
            const lastGame = entryGames[entryGames.length - 1];
            const start = parseGameStart(firstGame);
            const end = new Date(
                parseGameStart(lastGame).getTime() +
                durationMinutes * 60 * 1000
            );
            const opponents = uniqueCleanValues(
                entryGames.map(getOpponent)
            );
            const summary = opponents.join(', ');

            if (!summary) {
                console.warn(
                    'SpielplanPlus: Termin ohne eindeutig ermittelten Gegner wird übersprungen.',
                    entryGames
                );
                continue;
            }

            const venue = clean(firstGame.location);
            const address = addresses.get(venue) || '';
            const description = H.isField()
                ? createDescription(firstGame, address)
                : createHallDescription(entryGames, address);
            const htmlDescription = createHtmlDescription(description);
            const location = createLocation(firstGame, address);

            lines.push(
                'BEGIN:VEVENT',
                `UID:${entryGames.length > 1
                    ? createGroupedUid(entryGames)
                    : createUid(firstGame)}`,
                `DTSTAMP:${timestamp}`,
                `DTSTART;TZID=Europe/Berlin:${formatLocalDateTime(start)}`,
                `DTEND;TZID=Europe/Berlin:${formatLocalDateTime(end)}`,
                `SUMMARY:${escapeIcsText(summary)}`,
                `DESCRIPTION:${escapeIcsText(description)}`,
                `X-ALT-DESC;FMTTYPE=text/html:${escapeIcsText(htmlDescription)}`,
                `LOCATION:${escapeIcsText(location)}`,
                'STATUS:CONFIRMED',
                'TRANSP:OPAQUE',
                'END:VEVENT'
            );
        }

        lines.push('END:VCALENDAR');
        return `${lines.map(foldIcsLine).join('\r\n')}\r\n`;
    }

    function createFileName() {
        const clubName = H.list(H.cfg.clubAliases)[0] || H.cfg.clubName;
        const safeClubName = clean(clubName)
            .replace(/[<>:"/\\|?*]/g, '')
            .replace(/\s+/g, '_');

        return `${safeClubName || 'SpielplanPlus'}_Eigene_Spiele.ics`;
    }

    async function downloadCalendar(button) {
        const games = getOwnGames();

        if (!games.length) {
            window.alert(
                'Keine eigenen Spiele mit Datum und Anschlagzeit gefunden.'
            );
            return;
        }

        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Adressen werden ermittelt …';

        try {
            const content = await createCalendar(games);
            const blob = new Blob(
                [content],
                { type: 'text/calendar;charset=utf-8' }
            );
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.href = downloadUrl;
            link.download = createFileName();
            link.style.display = 'none';

            document.body.appendChild(link);
            link.click();
            link.remove();

            setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
        } catch (error) {
            console.error(
                'SpielplanPlus: Die ICS-Datei konnte nicht erstellt werden.',
                error
            );
            window.alert('Die ICS-Datei konnte nicht erstellt werden.');
        } finally {
            button.disabled = false;
            button.textContent = originalText;
        }
    }

    function composeResolvedLocation(venue, address) {
        const cleanedVenue = clean(venue);
        const cleanedAddress = clean(address);

        if (cleanedVenue && cleanedAddress) {
            return `${cleanedVenue}, ${cleanedAddress}`;
        }

        return cleanedAddress || cleanedVenue;
    }

    function ownGroupsFromGames(games) {
        return new Set(
            games
                .filter(game => H.gameIsOwn(game))
                .map(game => clean(game.group))
                .filter(Boolean)
        );
    }

    async function resolvePdfLocations(games) {
        const ownGroups = ownGroupsFromGames(games);
        const ownGroupGames = games.filter(game =>
            ownGroups.has(clean(game.group))
        );
        const addresses = await resolveAddresses(ownGroupGames);

        return games.map(game => {
            const belongsToOwnGroup = ownGroups.has(clean(game.group));
            const address = belongsToOwnGroup
                ? addresses.get(clean(game.location)) || ''
                : '';

            return {
                game,
                originalLocation: game.location,
                resolvedLocation: belongsToOwnGroup
                    ? composeResolvedLocation(game.location, address)
                    : game.location
            };
        });
    }

    function applyResolvedPdfLocations(entries) {
        for (const entry of entries) {
            entry.game.location = entry.resolvedLocation;
        }
    }

    function restorePdfLocations(entries) {
        for (const entry of entries) {
            entry.game.location = entry.originalLocation;
        }
    }

    const originalOpenSchedulePreview = H.openSchedulePreview;

    H.openSchedulePreview = async (...args) => {
        const model = H.state.model;
        const games = model?.games || [];
        const button = document.querySelector(
            '#hsp-schedule-menu [aria-expanded], #hsp-controls .hsp-print'
        );
        const originalText = button?.textContent || '';

        if (button) {
            button.disabled = true;
            button.textContent = 'Adressen werden ermittelt …';
        }

        let resolvedEntries = [];

        try {
            resolvedEntries = await resolvePdfLocations(games);
            applyResolvedPdfLocations(resolvedEntries);
            return await originalOpenSchedulePreview(...args);
        } finally {
            restorePdfLocations(resolvedEntries);

            if (button) {
                button.disabled = false;
                button.textContent = originalText;
            }
        }
    };

    function createMenuButton(label, title, onClick) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'hsp-schedule-menu-item';
        button.textContent = label;
        button.title = title;
        button.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            onClick(button);
        });
        return button;
    }

    function enhanceScheduleButton() {
        const controls = document.getElementById('hsp-controls');
        if (!controls || controls.querySelector('#hsp-schedule-menu')) {
            return;
        }

        const printButton = [...controls.querySelectorAll('button')]
            .find(button => button.textContent.trim() === 'Spielplan');

        if (!printButton) {
            return;
        }

        const wrapper = document.createElement('span');
        wrapper.id = 'hsp-schedule-menu';
        wrapper.className = 'hsp-schedule-menu';
        wrapper.dataset.hspOwned = 'true';

        const toggleButton = document.createElement('button');
        toggleButton.type = 'button';
        toggleButton.className = printButton.className;
        toggleButton.textContent = 'Spielplan ▾';
        toggleButton.title = 'Spielplan ausgeben';
        toggleButton.setAttribute('aria-haspopup', 'menu');
        toggleButton.setAttribute('aria-expanded', 'false');

        const menu = document.createElement('span');
        menu.className = 'hsp-schedule-menu-popup';
        menu.setAttribute('role', 'menu');
        menu.hidden = true;

        const closeMenu = () => {
            menu.hidden = true;
            toggleButton.setAttribute('aria-expanded', 'false');
        };

        const openPrintPreview = () => {
            closeMenu();
            printButton.click();
        };

        const exportIcs = button => {
            closeMenu();
            downloadCalendar(button);
        };

        menu.append(
            createMenuButton(
                'Drucken / PDF',
                'Spielplan drucken oder als PDF speichern',
                openPrintPreview
            ),
            createMenuButton(
                'ICS',
                'Eigene Spiele als ICS-Datei exportieren',
                exportIcs
            )
        );

        toggleButton.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            const willOpen = menu.hidden;
            menu.hidden = !willOpen;
            toggleButton.setAttribute('aria-expanded', String(willOpen));
        });

        wrapper.append(toggleButton, menu);
        printButton.replaceWith(wrapper);
        wrapper.appendChild(printButton);
        printButton.hidden = true;

        document.addEventListener('click', event => {
            if (!wrapper.contains(event.target)) {
                closeMenu();
            }
        }, { signal: createAbortSignalFor(wrapper) });
    }

    function createAbortSignalFor(element) {
        const controller = new AbortController();
        const observer = new MutationObserver(() => {
            if (!element.isConnected) {
                controller.abort();
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        return controller.signal;
    }

    function injectMenuStyle() {
        if (document.getElementById('hsp-ics-menu-style')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'hsp-ics-menu-style';
        style.dataset.hspOwned = 'true';
        style.textContent = `
            .hsp-schedule-menu {
                position: relative;
                display: inline-flex;
            }

            .hsp-schedule-menu-popup {
                position: absolute;
                top: calc(100% + 5px);
                left: 0;
                z-index: 2147483646;
                min-width: 155px;
                padding: 5px;
                border: 1px solid #c9d1da;
                border-radius: 7px;
                background: #fff;
                box-shadow: 0 9px 24px rgba(25, 39, 57, .18);
            }

            .hsp-schedule-menu-popup[hidden] {
                display: none !important;
            }

            .hsp-schedule-menu-item {
                display: block;
                width: 100%;
                padding: 8px 11px;
                border: 0;
                border-radius: 5px;
                background: #fff;
                color: #243244;
                font: 600 12px Arial, sans-serif;
                text-align: left;
                cursor: pointer;
            }

            .hsp-schedule-menu-item:hover,
            .hsp-schedule-menu-item:focus-visible {
                background: #fff0f1;
                color: #8f0d15;
                outline: none;
            }
        `;
        document.head.appendChild(style);
    }

    const originalBuildControls = H.buildControls;

    H.buildControls = (...args) => {
        const result = originalBuildControls(...args);
        injectMenuStyle();
        enhanceScheduleButton();
        return result;
    };

})();
