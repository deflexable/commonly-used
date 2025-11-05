import kuromoji from 'kuromoji';
import nodejieba from 'nodejieba';
import { IS_DEV } from "core/env.js";
import cld from 'cld';

function getCharacterByteSize(char) {
    const charCode = char.codePointAt(0);

    if (charCode <= 0x7F) {
        // 1 byte: ASCII characters
        return 1;
    } else if (charCode <= 0x7FF) {
        // 2 bytes: Characters from U+0080 to U+07FF
        return 2;
    } else if (charCode <= 0xFFFF) {
        // 3 bytes: Characters from U+0800 to U+FFFF
        return 3;
    } else if (charCode <= 0x10FFFF) {
        // 4 bytes: Supplementary characters (surrogate pairs)
        return 4;
    }

    throw new Error("Invalid character");
}

/**
 * @type {(text: string, detection) => { lang: string, name: string, text: string }[]}
 */
const segmentTextLanguage = (t = '', detection) => {
    if (!detection.chunks.length) {
        const selected = detection.languages.sort((a, b) => a.percent - b.percent).reverse()[0];

        return [{ text: t, name: selected?.name || 'ENGLISH', lang: selected?.code || 'en' }];
    }
    const output = [];

    detection.chunks.forEach(({ offset, bytes, code, name }, slotIndex, a) => {
        const slot = offset + bytes;
        let offsetBytes = 0, segment = "";

        for (let i = 0; i < t.length; i++) {
            const char = t[i];
            offsetBytes += getCharacterByteSize(char);
            if (offsetBytes >= offset) {
                segment += char;
            }
            if (offsetBytes >= slot && slotIndex !== a.length - 1) break;
        }

        output.push({ lang: code, name, text: segment });
    });

    return output;
};

/**
 * @type {Promise<import("kuromoji").Tokenizer<kuromoji.IpadicFeatures>>}
 */
let JapaneseTokenizer;

const LanguageTokenizer = {
    ja: async t => {
        if (!JapaneseTokenizer)
            JapaneseTokenizer = new Promise((resolve, reject) => {
                kuromoji.builder({ dicPath: "node_modules/kuromoji/dict" }).build(function (err, tokenizer) {
                    if (err) {
                        console.error('kuromoji error:', err);
                        reject(err);
                        return;
                    }
                    resolve(tokenizer);
                });
            });

        return (await JapaneseTokenizer).tokenize(t).map(v => v.surface_form.trim()).filter(v => v).join(' ');
    },
    zh: t => nodejieba.cut(t).map(v => v.trim()).filter(v => v).join(' ')
};

export const tokenizeWord = async (text, lang) => {
    if ([lang] in LanguageTokenizer) {
        try {
            const res = await LanguageTokenizer[lang](text);
            return res;
        } catch (error) {
            if (IS_DEV) console.error('tokenize err:', error);
            return text;
        }
    }
    return text;
};

export const tokenizeBlob = async (text) => {
    try {
        if (!text || !text.trim()) return '';
        const languageData = await cld.detect(text);
        const response = await Promise.all(
            segmentTextLanguage(text, languageData).map(async data =>
                await tokenizeWord(data.text, data.lang)
            )
        );
        return response.join(' ');
    } catch (error) {
        if (IS_DEV && !`${error}`.includes('Failed to identify language'))
            console.error('tokenizeBlob: ', error);
        return text;
    }
};