import { readFile, writeFile } from "fs/promises";
import { resolve } from 'path';
import { SUPPORTED_LANGUAGES } from "core/common_values.js";
import { translateX } from "./translate";

const compareLang = 'en';
const dirPrefix = resolve(process.cwd(), './src/locale/lang');

const translationStats = {};
readFile(`${dirPrefix}/${compareLang}.json`, 'utf8').then(async mainFile => {
    const comparable = JSON.parse(mainFile || '{}');

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

        await writeFile(file, JSON.stringify(json), { encoding: 'utf8' });
    }));
    console.log('server locale bundle:', translationStats);
});