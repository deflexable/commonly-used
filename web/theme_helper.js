import { useEffect, useState } from "react";
import { AuthScope, ThemeHelperScope } from "./scope.js";
import { CentralizeListener } from "./listeners";
import { isBrowser } from "./is_browser";
import { getTimezoneOffset } from './methods.js';
import { useLastLoaderData } from "./nav.js";
import { collection } from "./client_server";
import { DbPath } from "core/common_values";
import { ENV } from "./server_variables";

const getDateContext = (timezone) => { // 7am - 7pm (day - night)
    let date = new Date();
    if (timezone) date = new Date(date.getTime() + (getTimezoneOffset(timezone) || 0));

    const milisSinceMorning = (date.getHours() * 3600000) + (date.getMinutes() * 60000) + (date.getSeconds() * 1000) + date.getMilliseconds(),
        sevenAmOffSet = 25200000, // 7 * 3600000
        sevenPmOffSet = 68400000,
        maxMilis = 86400000,
        isDayLight = milisSinceMorning > sevenAmOffSet && milisSinceMorning < sevenPmOffSet,
        milisUntilNextChange = isDayLight ? sevenPmOffSet - milisSinceMorning : milisSinceMorning - sevenAmOffSet <= 0 ? sevenAmOffSet - milisSinceMorning : maxMilis - milisSinceMorning + sevenAmOffSet;

    return { isDayLight, milisUntilNextChange };
}

export const onUserThemeChanged = (value) => {
    clearTimeout(ThemeHelperScope.dayTimer);

    let theme = 'light', themeValue = 'auto';

    if (!value || value === 'auto') {
        const { isDayLight, milisUntilNextChange } = getDateContext();

        if (!isDayLight) theme = 'dark';

        if (milisUntilNextChange > 0)
            ThemeHelperScope.dayTimer = setTimeout(() => {
                onUserThemeChanged();
            }, milisUntilNextChange);
    } else {
        theme = value === 'light' ? 'light' : 'dark';
        themeValue = theme;
    }

    ThemeHelperScope.isDarkMode = theme === 'dark';
    ThemeHelperScope.themeValue = themeValue;

    CentralizeListener.dispatchPersist('themeListener', theme);
};

export const listenDayLight = (callback) => CentralizeListener.listenToPersist('themeListener', callback, true);

export const useDarkMode = () => useAppTheme() === 'dark';

export const useAppTheme = () => {
    const [theme, setTheme] = useState(ThemeHelperScope.isDarkMode ? 'dark' : 'light');
    const { userSettings, session_theme, geo, user } = useLastLoaderData();

    const fTheme = (ThemeHelperScope.isDarkMode === undefined || !isBrowser()) ?
        (
            userSettings?.theme ||
            (user ? null : session_theme) || (geo ?
                (getDateContext(geo?.timezone).isDayLight ? 'light' : 'dark') : 'light')
        ) : theme;

    useEffect(() => {
        return listenDayLight(theme => {
            if (theme) setTheme(theme);
        });
    }, []);

    return fTheme;
};

export const useToggleTheme = (submit) => {
    const isDarkMode = useDarkMode(),
        newTheme = isDarkMode ? 'light' : 'dark';

    return {
        toggle: () => {
            if (ENV.IS_DEV) console.log('click toggle theme:', newTheme);
            const { uid } = AuthScope;
            if (uid) {
                collection(DbPath.prefferedSettings).mergeOne({ _id: uid }, { $set: { theme: newTheme } });
            } else {
                const form = new FormData();
                form.set('session_theme', newTheme);
                submit(form, { method: 'POST' });
                onUserThemeChanged(newTheme);
            }
        },
        isDarkMode
    }
};