import { usePrefferedSettings } from './page_helper.js';
import { Scope } from '@/src/utils/scope';
import { LanguageMap } from "@/src/locale/index";
import { getLocale, listenLocale } from '../src/index.js';
import listeners, { EVENT_NAMES } from './listeners.js';
import { useEffect, useState } from 'react';

let SystemLang;

const sanitizeLang = (t = '') => t?.split?.('_')?.[0]?.split?.('-')?.[0];

getLocale().then(r => {
    listeners.dispatch(EVENT_NAMES.systemLanguage, SystemLang = sanitizeLang(r));
});

listenLocale(r => {
    listeners.dispatch(EVENT_NAMES.systemLanguage, SystemLang = sanitizeLang(r));
});

export const getSupportedLang = (locale = Scope.prefferedSettingsValue?.locale) => {
    let lang = locale || SystemLang || 'en';
    if (!(lang in LanguageMap)) lang = 'en';
    return lang;
};

/**
 * @returns {{ translations: import('../../../src/locale/lang/en.json'), lang: string, langValue: string }}
 */
export const useTranslation = () => {
    const { locale } = usePrefferedSettings();
    const lang = getSupportedLang(locale);

    const [_, refreshState] = useState();

    useEffect(() => {
        return listeners.listenTo(EVENT_NAMES.systemLanguage, () => {
            refreshState({});
        });
    }, []);

    return {
        translations: __DEV__ ? locales : LanguageMap[lang],
        lang,
        langValue: locale
    };
};

/**
 * @type {import('../../../src/locale/lang/en.json')}
 */
export const locales =
    new Proxy({}, {
        get: (_, n) => {
            const lang = getSupportedLang();
            const value = LanguageMap[lang][n];

            if (!value) {
                console.warn(`'${lang}' locale with property '${n}' does not exist`);
            }

            return value;
        }
    });