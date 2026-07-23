import { SUPPORTED_LANGUAGES } from "core/common_values";

const getTimezoneOffset = (tz) => {
    if (!tz) return 0;
    const tzTime = new Date(new Date().toLocaleString("en", { timeZone: tz })).getTime();
    const clientTime = Date.now();

    return tzTime - clientTime;
};

export const getThemeDateContext = (...timezone) => { // 7am - 7pm (day - night)
    timezone = timezone = timezone.filter(v => v);
    let date = new Date();

    if (timezone.length) {
        try {
            date = new Date(date.getTime() + (getTimezoneOffset(timezone[0]) || 0));
        } catch (error) {
            if (timezone.length > 1)
                return getThemeDateContext(...timezone.slice(1));
            throw error;
        }
    }

    const milisSinceMorning =
        (date.getHours() * 3600000) +
        (date.getMinutes() * 60000) +
        (date.getSeconds() * 1000) +
        date.getMilliseconds();

    const sevenAmOffSet = 25200000, // 7 * 3600000
        sevenPmOffSet = 68400000,
        maxMilis = 86400000,
        isDayLight = milisSinceMorning > sevenAmOffSet && milisSinceMorning < sevenPmOffSet,
        milisUntilNextChange = isDayLight ? sevenPmOffSet - milisSinceMorning : milisSinceMorning - sevenAmOffSet <= 0 ? sevenAmOffSet - milisSinceMorning : maxMilis - milisSinceMorning + sevenAmOffSet;

    return { isDayLight, milisUntilNextChange };
}

export const snipLocales = (locale, list = []) =>
    Object.fromEntries(
        list.map(k => [k, locale.data?.[k] ?? locale[k]])
    );

export const stripLangFromUrl = (url = '') => {
    const segments = url.split('/');
    const offset = segments[0] ? 0 : 1;

    if (SUPPORTED_LANGUAGES[segments[offset]]) {
        segments.splice(offset, segments[offset + 1] ? 1 : 2);
    }
    return segments.join('/');
}

export const isLangRoute = (route = '', pathname) =>
    stripTrailingSlash(stripLangFromUrl(pathname)) !== stripTrailingSlash(route);

export const stripTrailingSlash = (path = '') => path.endsWith('/') ? path.slice(0, -1) : path;