import { getSimpleDate as displayDate, getSimpleTime as displayTime, aboutAgoTime as aboutAgo } from "../common/timing";
import { getSupportedLang, locales } from "./locale";

export const getSimpleDate = (time) => displayDate(time, locales);

export const getSimpleTime = (time, showDate) =>
    displayTime({
        time,
        showDate,
        locale: { data: locales, lang: getSupportedLang() }
    });

export const aboutAgoTime = (date) => aboutAgo(date, locales);