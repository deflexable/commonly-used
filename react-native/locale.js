import { usePrefferedSettings } from './page_helper.js';
import { Scope } from '@/src/utils/scope';
import { LanguageMap } from "@/src/locale/index";

export const DeviceLocale = Intl?.DateTimeFormat?.()?.resolvedOptions?.()?.locale;
console.log('DeviceLocale:', DeviceLocale);
const SystemLang = (DeviceLocale || '').split('-')[0];

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

    return {
        translations: LanguageMap[lang],
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
            return LanguageMap[getSupportedLang()][n]
        }
    });