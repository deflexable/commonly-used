import { useEffect, useState } from "react";
import { Appearance } from 'react-native';
import Listeners, { EVENT_NAMES } from "@this_app_root/src/utils/listeners";
import { ThemeHelperScope } from "./scope";

export const onUserThemeChanged = (value) => {
    clearTimeout(ThemeHelperScope.dayTimer);

    let theme = 'light',
        themeValue = 'auto';

    if (!value || value === 'auto') { // 7am - 7pm (day - night)
        const milisSinceMorning = (new Date().getHours() * 3600000) + (new Date().getMinutes() * 60000) + (new Date().getSeconds() * 1000) + new Date().getMilliseconds(),
            sevenAmOffSet = 25200000, // 7 * 3600000
            sevenPmOffSet = 68400000,
            maxMilis = 86400000,
            isDayLight = milisSinceMorning > sevenAmOffSet && milisSinceMorning < sevenPmOffSet,
            milisUntilNextChange = isDayLight ? sevenPmOffSet - milisSinceMorning : milisSinceMorning - sevenAmOffSet <= 0 ? sevenAmOffSet - milisSinceMorning : maxMilis - milisSinceMorning + sevenAmOffSet;

        if (!isDayLight) theme = 'dark';

        if (milisUntilNextChange > 0)
            ThemeHelperScope.dayTimer = setTimeout(() => {
                onUserThemeChanged();
            }, milisUntilNextChange);
    } else {
        theme = value === 'light' ? 'light' : 'dark';
        themeValue = theme;
    }

    console.log('onUserThemeChanged theme:', theme, ' themeValue:', themeValue);
    ThemeHelperScope.isDarkMode = theme === 'dark';
    ThemeHelperScope.themeValue = themeValue;
    Listeners.dispatchPersist(EVENT_NAMES.themeListener, theme);
    try {
        Appearance.setColorScheme(ThemeHelperScope.isDarkMode ? 'dark' : 'light');
    } catch (error) {
        console.error('toggleDarkMode:', error);
    }
}

const listenDayLight = (callback) => Listeners.listenToPersist(EVENT_NAMES.themeListener, callback);

const useAppTheme = () => {
    const [theme, setTheme] = useState(ThemeHelperScope.isDarkMode ? 'dark' : 'light');

    useEffect(() => {
        return listenDayLight(theme => {
            if (theme) setTheme(theme);
        });
    }, []);

    return theme;
};

export const useDarkMode = () => useAppTheme() === 'dark';