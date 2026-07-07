import { useEffect, useState } from "react";
import { ThemeHelperScope } from "./scope";
import { listeners } from "./listeners";
import { getThemeDateContext } from "./methods.dual";

export const onUserThemeChanged = (value) => {
    ThemeHelperScope.dayTimer?.();

    let theme = 'light', themeValue = 'auto';

    if (!value || value === 'auto') {
        const { isDayLight, milisUntilNextChange } = getThemeDateContext();

        if (!isDayLight) theme = 'dark';

        if (milisUntilNextChange > 0) {
            const future = Date.now() + milisUntilNextChange;

            let timeout;
            const timer = setInterval(() => {
                const now = Date.now();
                if (now + 5000 > future) {
                    clearInterval(timer);
                    timeout = setTimeout(() => {
                        onUserThemeChanged();
                    }, Math.max(0, future - now));
                }
            }, 5000);

            ThemeHelperScope.dayTimer = () => {
                clearInterval(timer);
                clearTimeout(timeout);
            }
        }
    } else {
        theme = value === 'light' ? 'light' : 'dark';
        themeValue = theme;
    }

    ThemeHelperScope.isDarkMode = theme === 'dark';
    ThemeHelperScope.themeValue = themeValue;

    listeners.dispatchPersist('themeListener', theme);
};

export const useDarkMode = (config) => {
    const [isDark, setDark] = useState(ThemeHelperScope.isDarkMode ?? config?.init_dark);

    useEffect(() => {
        return listeners.listenToPersist('themeListener', theme => {
            setDark(theme === 'dark');
        });
    }, []);

    return !!isDark;
};