import { dirname, join, resolve } from 'path';
import { readFile, writeFile, mkdir } from "fs/promises";
import { SUPPORTED_LANGUAGES, SUPPORTED_LANGUAGES_LIST } from "core/common_values.js";
import { translateX } from "../../dev/translate.js";
import { readdirSync, readFileSync } from 'fs';

const compareLang = 'en';
const dirPrefix = resolve(process.cwd(), './translations');

let translationStats = {};

const mainFiles = readdirSync(join(dirPrefix, compareLang));

if (!globalThis.lang_store) globalThis.lang_store = {};

const comparable = {},
    autoCorrected = {};

mainFiles.forEach(filepath => {
    comparable[filepath] = JSON.parse(readFileSync(join(dirPrefix, compareLang, filepath), { encoding: 'utf8' }));

    if (!globalThis.lang_store[compareLang]) globalThis.lang_store[compareLang] = {};
    globalThis.lang_store[compareLang][filepath.split('.')[0]] = comparable[filepath];
});

await Promise.all(
    Object.keys(SUPPORTED_LANGUAGES)
        .filter(v => v !== compareLang)
        .map(async lang => {
            const files = mainFiles.map(name => [join(dirPrefix, lang, name), name]);

            await Promise.all(files.map(async ([file, name]) => {
                const json = JSON.parse(await readFile(file, { encoding: 'utf8' }).catch(() => '{}'));

                await Promise.all(Object.entries(comparable[name]).map(async ([k, v]) => {
                    if (!([k] in json)) {
                        if (typeof v === 'string') {
                            const { text, src, correction } = await translateX(v, lang);
                            json[k] = text;
                            if (src !== compareLang) {
                                console.warn(`this text doesn't seem to be in "${compareLang}" but instead "${src}" ---> "${v}"`);
                                autoCorrected[k] = true;
                            }
                            if (correction) console.warn(`\n\ndo you mean "${correction}" for ---> "${v}"`);

                            if (!translationStats[lang]) translationStats[lang] = {};
                            if (translationStats[lang].added) {
                                ++translationStats[lang].added;
                            } else translationStats[lang].added = 1;
                        } else json[k] = v;
                    }
                }));
                Object.keys(json).forEach(k => {
                    if (!([k] in comparable[name])) {
                        delete json[k];

                        if (!translationStats[lang]) translationStats[lang] = {};
                        if (translationStats[lang].deleted) {
                            ++translationStats[lang].deleted;
                        } else translationStats[lang].deleted = 1;
                    }
                });
                if (!globalThis.lang_store[lang]) globalThis.lang_store[lang] = {};
                globalThis.lang_store[lang][name.split('.')[0]] = json;

                if (process.env.NODE_ENV === 'development') {
                    const result = JSON.stringify(json);
                    if (result) {
                        await mkdir(dirname(file), { recursive: true }).catch(() => null);
                        await writeFile(file, result, { encoding: 'utf8' });
                    }
                }
            }));
        })
);

console.log(`translation bundle: `, translationStats);

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