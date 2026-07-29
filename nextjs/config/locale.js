import { SUPPORTED_LANGUAGES_LIST } from "core/common_values.js";

export const getLocales = (lang, page_name) => [
    globalThis.lang_store[lang].common,
    globalThis.lang_store[lang][page_name]
]

export const mutateLocale = ({ callback, filename, lang_list }) => {
    if (!lang_list) lang_list = SUPPORTED_LANGUAGES_LIST;

    lang_list.forEach(lang => {
        Object.entries(globalThis.lang_store[lang][filename])
            .forEach(([k, v]) => {
                globalThis.lang_store[lang][filename][k] = callback(k, v, lang);
            });
    });
}