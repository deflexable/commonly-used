
export const one_day = 86400000,
    one_minute = 60000,
    one_week = 604800000,
    one_month = 2419200000,
    one_hour = 3600000,
    one_year = one_day * 365;

export const getSimpleDate = (time, common) => {
    if (!time || isNaN(time * 1)) return '';

    const date = new Date(time),
        m = MONTHS[date.getMonth()];

    return `${date.getDate()} ${common ? common[m] : m} ${date.getFullYear()}`
}

export const getSimpleTime = (time, option = { showDate: true, format: '24h', common: undefined }) => {
    const { showDate = true, format = '12h', common } = option;

    const dateObj = new Date(time),
        minuteSize = dateObj.getMinutes().toString().length,
        isPM = dateObj.getHours() > 12,
        h = dateObj.getHours() - ((format === '12h' && isPM) ? 12 : 0);

    return `${showDate ? getSimpleDate(time, common) + ', ' : ''}${h}:${minuteSize === 1 ? '0' + dateObj.getMinutes() : dateObj.getMinutes()} ${format === '12h' ? (isPM ? 'PM' : 'AM') : ''}`.trim();
}

export const getTimeAgo = (dateString, common, currentTime) => {
    return timeSince(dateString, { currentTime, format: false, addAgo: true, addAbout: true, common });
}

export const getTimeAgoShort = (dateString, common, currentTime) => {
    return timeSince(dateString, { currentTime, format: "short", addAgo: true, addAbout: false, common });
}

export const getTimeAgoShortest = (dateString, common, currentTime) => {
    return timeSince(dateString, { currentTime, format: "short", addAgo: false, addAbout: false, common });
}

export const getTimeAgoAtomic = (dateString, common, currentTime) => {
    return timeSince(dateString, { currentTime, format: "atomic", addAgo: false, addAbout: false, common });
}

export const timeSince = (time, options) => {
    const { currentTime, format, addAgo, addAbout, common } = options || {};
    const thisCommon = new Proxy({}, {
        get: (_, n) => {
            if (common && n in common) return common[n];
            return n;
        }
    });
    const isEnglish = true;
    const isAtomic = format === 'atomic',
        splitter = isAtomic ? '' : ' ';

    var rightNow = Date.now();
    var then = new Date(time);
    // var then = convertLocalDateToUTCDate(dateString, false);

    if (currentTime) {
        rightNow = currentTime;
    }

    var diff = Math.abs((rightNow - then.getTime()) / 1000);
    var second = 1,
        minute = second * 60,
        hour = minute * 60,
        day = hour * 24,
        week = day * 7,
        month = week * 4.34524,
        year = month * 12;

    var minTxt = thisCommon.minutes,
        secTxt = thisCommon.seconds,
        hoursTxt = thisCommon.hours,
        dayTxt = thisCommon.days,
        monthTxt = thisCommon.months,
        yearTxt = thisCommon.years;

    var ago = addAgo ? ' ago' : '';

    if (format) {
        switch (format) {
            case "short":
                minTxt = thisCommon.mins;
                secTxt = thisCommon.secs;
                hoursTxt = thisCommon.hrs;
                dayTxt = thisCommon.days;
                monthTxt = thisCommon.months;
                // yearTxt = 'year';
                break;
            case "atomic":
                minTxt = thisCommon.mins;
                secTxt = isEnglish ? 's' : thisCommon.secs;
                hoursTxt = isEnglish ? 'h' : thisCommon.hrs;
                dayTxt = isEnglish ? 'd' : thisCommon.days;
                monthTxt = isEnglish ? 'm' : thisCommon.months;
                yearTxt = isEnglish ? 'y' : thisCommon.years;
                break;
        }
    }

    if (isNaN(diff) || diff < 0) {
        return "Invalid time"; // return blank string if unknown
    }

    if (diff < second * 2) {
        // within 2 seconds
        return thisCommon.right_now;
    }

    if (diff < minute) {
        return Math.floor(diff / second) + `${splitter}${secTxt}${ago}`;
    }

    if (diff < minute * 2) {
        return isAtomic ? '1m' : addAbout ? thisCommon.about_1_min_ago : thisCommon['1_min_ago'];
    }

    if (diff < hour) {
        return Math.floor(diff / minute) + `${splitter}${minTxt}${ago}`;
    }

    if (diff < hour * 2) {
        return addAbout ? `about 1 ${hoursTxt}${ago}` : `1${splitter}${hoursTxt}${ago}`;
    }

    if (diff < day) {
        return Math.floor(diff / hour) + `${splitter}${hoursTxt}${ago}`;
    }

    if (diff > day && diff < day * 2) {
        return thisCommon.yesterday;
    }

    if (diff < day * 7) {
        return Math.floor(diff / day) + `${splitter}${dayTxt}${ago}`;
    }

    if (diff < month) {
        return Math.floor(diff / week) + `${splitter}${isAtomic ? 'w' : thisCommon.week}${ago}`;
    }
    if (diff < year) {
        return Math.floor(diff / month) + `${splitter}${monthTxt}${ago}`;
    } else {
        return Math.floor(diff / year) + `${splitter}${yearTxt}${ago}`;
    }
};

export const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEPT', 'OCT', 'NOV', 'DEC'];