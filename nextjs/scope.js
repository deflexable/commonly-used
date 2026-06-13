
export const WEB_STATE = {
    __absoluteIterator: 0,
    isOnline: undefined,
    prefferedSettingsValue: undefined,
    serverTimeOffset: undefined,
    hasReleaseMosquitoCache: undefined
};

export const WEB_PROCESS = {
    env: undefined
};

export const APP_STATES = {
    routes: {}
};

export const LANG_SCOPE = {
    session_lang: undefined
};

export const AuthScope = {
    uid: undefined,
    token: undefined,
    /**
     * @type {Promise<string>}
     */
    machine: undefined,
    /**
     * @type {import('./loader').LoaderResult['geo']}
     */
    geo: {}
};

export const ThemeHelperScope = {
    dayTimer: undefined,
    themeValue: undefined,
    isDarkMode: undefined
};