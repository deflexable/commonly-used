import { SUPPORTED_LANGUAGES } from "core/common_values";

/**
 * @param {string} path 
 * @param {{[key: string]: string}} params 
 * @returns {string}
 */
export default function (path, params) {
    let lang;
    if (!(lang = params?.lang) || !SUPPORTED_LANGUAGES[lang]) return path;
    const startSlash = path.startsWith('/');

    path = `${startSlash ? '/' : ''}${lang}${startSlash ? path : '/' + path}`;

    if (!path.includes('?') && path.endsWith('/'))
        path = path.slice(0, -1);

    return path;
}