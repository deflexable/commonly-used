import { readFile, writeFile } from "fs/promises";
import { resolve } from 'path';
import { SUPPORTED_LANGUAGES } from "core/common_values";
import { translateX } from "../dev/translate";

const compareLang = 'en';
const dirPrefix = resolve(process.cwd(), './locale');

let translationStats = {};
if (!globalThis.server_locale) globalThis.server_locale = {};

readFile(`${dirPrefix}/${compareLang}.json`, 'utf8').then(async mainFile => {
    // return;
    const comparable = JSON.parse(mainFile || '{}');
    globalThis.server_locale[compareLang] = comparable;

    await Promise.all(Object.keys(SUPPORTED_LANGUAGES).filter(v => v !== compareLang).map(async lang => {
        const file = `${dirPrefix}/${lang}.json`;
        const json = JSON.parse((await readFile(file, { encoding: 'utf8' }).catch(() => null)) || '{}');

        await Promise.all(Object.entries(comparable).map(async ([k, v]) => {
            if (!([k] in json)) {
                if (typeof v === 'string') {
                    const { text, src, correction } = await translateX(v, lang);
                    json[k] = text;
                    if (src !== compareLang)
                        console.warn(`this text doesn't seem to be "${compareLang}" but instead "${src}" ---> "${v}"`);
                    if (correction) console.warn(`\n\ndo you mean "${correction}" for ---> "${v}"`);

                    if (!translationStats[lang]) translationStats[lang] = {};
                    if (translationStats[lang].added) {
                        ++translationStats[lang].added;
                    } else translationStats[lang].added = 1;
                } else json[k] = v;
            }
        }));
        Object.keys(json).forEach(k => {
            if (!([k] in comparable)) {
                delete json[k];

                if (!translationStats[lang]) translationStats[lang] = {};
                if (translationStats[lang].deleted) {
                    ++translationStats[lang].deleted;
                } else translationStats[lang].deleted = 1;
            }
        });
        globalThis.server_locale[lang] = json;

        if (process.env.NODE_ENV !== 'production')
            await writeFile(file, JSON.stringify(json), { encoding: 'utf8' });
    }));
    console.log('server locale bundle:', translationStats);
});

/**
 * @type {{[key: string]: import('./lang/en.json')}}
 */
const LOCALE_STORE = new Proxy({}, {
    get: (_, n) => {
        return globalThis.server_locale[SUPPORTED_LANGUAGES[n] ? n : 'en'] || {};
    }
});

export default LOCALE_STORE;