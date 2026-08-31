
const Locale_12h = {
    en: true,
    zh: ['上午', '下午'],
    hi: true,
    bn: true,
    ar: true,
    ja: ['午前', '午後'],
    ko: ['오전', '오후'],
    th: true,
    id: true,
    ms: true,
    tl: true,
    he: true,
    fa: true,
    sw: true,
    el: ['πμ', 'μμ']
};

export const uses12HourClock = (lang = 'en') => {
    lang = Locale_12h[lang];
    if (lang) {
        if (lang === true) return ['AM', 'PM'];
        return lang;
    }
};