import { parse, serialize } from "parse5";
import { WEB_BASE_URL } from "core/env.js";

/**
 * @type {(node: import('parse5').DefaultTreeAdapterMap['childNode'])=> string}
 */
export const getInnerText = (node) => {
    if (!node) return '';
    let out = node.value || '';

    if (node.childNodes)
        out += node.childNodes.map(getInnerText).filter(v => v).join(' ');
    return out.trim();
};

export const htmlToText = (text) => {
    const document = parse(text);
    return document.childNodes.map(getInnerText).join(' ');
};
globalThis.htmlToText = htmlToText;

export const isHTMLFilled = html => !!htmlToText(html).trim();

/**
 * @type {(document: import('parse5').DefaultTreeAdapterMap['document'], query: string)=> import('parse5').DefaultTreeAdapterMap['childNode'] | null}
 */
const parseSelector = (document, query) => {
    const [tag, attr, value] = query.includes('=') ? [undefined, query.split('=')[0], query.split('=').slice(1).join('=')] : [query];

    const findSelector = (node) => {
        if (tag ? node.nodeName === tag : (node.attrs || []).findIndex(v => v.name === attr && v.value === value) !== -1)
            return node;

        for (const thisNode of (node.childNodes || [])) {
            const k = findSelector(thisNode);
            if (k) return k;
        }
    }
    return document.childNodes.map(findSelector).filter(v => v)[0] || null;
};

export const useNode = (text) => {
    const hasHtml = text.includes('<html');

    const tagAttr = 'stage-name';
    const tagValue = !hasHtml && `${Date.now()}`;
    const [prefixTag, suffixTag] = [`<div ${tagAttr}="${tagValue}">`, '</div>'];

    const document = parse(hasHtml ? text : `${prefixTag}${text}${suffixTag}`);

    return {
        document,
        stringifyNode: () => {
            if (hasHtml) return serialize(document);
            const node = parseSelector(document, `${tagAttr}=${tagValue}`);
            return serialize(node);
        }
    }
};

export const isHTMLSanitized = text => {
    try {
        validateSanitizedHTML(text);
        return true;
    } catch (error) {
        return false;
    }
}

export const validateSanitizedHTML = (text) => {
    const node = (!text || typeof text !== 'string') ? text : parse(text);

    if (!node) return;
    if ([
        'script',
        'iframe',
        'frame',
        'frameset',
        'object',
        'embed',
        'link',
        'style',
        'form',
        'input',
        'meta',
        'base',
        'applet',
        'button'
    ].includes(node.nodeName)) {
        throw `sanitized html must not contain malicious tag of "${node.nodeName}"`;
    }

    (node.attrs || []).forEach(e => {
        const { name, value } = e;

        if (['a', 'area'].includes(node.nodeName)) {
            if (['href', 'action'].includes(name) && value) {
                if (value.startsWith('javascript'))
                    throw `unsafe attribute of <${node.nodeName} ${name}="${value}" />`;
            }
        } else if (['img', 'image'].includes(node.nodeName)) {
            if (['src', 'source', 'action'].includes(name) && value) {
                if (
                    value.startsWith('javascript') ||
                    value.startsWith('data:text/html')
                ) throw `unsafe attribute of <${node.nodeName} ${name}="${value}" />`;
            }
        }

        if (name.startsWith('on')) {
            throw `sanitized attribute must not start with "on" in "${name}"`;
        }

        if (name === 'style' && value && unsafeStyle(value)) {
            throw `unsafe style with value=${value}`;
        }
    });
    (node.childNodes || []).forEach(node => {
        validateSanitizedHTML(node);
    });
};

function unsafeStyle(styleValue) {
    // Regex to check for potentially dangerous CSS values or properties
    const unsafePatterns = [
        /expression\s*\(/i,       // Detects 'expression()' (CSS expressions in IE)
        /javascript\s*:/i,        // Detects 'javascript:' URLs
        // /url\s*\(/i,              // Detects 'url()' which can load external resources
        /behavior\s*:/i,          // Detects 'behavior' (used in IE to bind scripts)
        // /filter\s*:/i,            // Detects 'filter' (can be used to apply external files)
        /-moz-binding\s*:/i,      // Detects '-moz-binding' (Firefox-specific binding)
    ];

    // Test the style value against all unsafe patterns
    return unsafePatterns.some(pattern => pattern.test(styleValue));
};

export const sanitizeHTML = text => {
    const { document, stringifyNode } = useNode(text);

    if (document.childNodes)
        document.childNodes = document.childNodes.map(sanitizeHTMLCore).filter(v => v);

    return stringifyNode();
};

const sanitizeHTMLCore = (node) => {
    if (!node) return;

    if (
        [
            'script',
            'iframe',
            'frame',
            'frameset',
            'object',
            'embed',
            'link',
            'style',
            'form',
            'input',
            'meta',
            'base',
            'applet',
            'button'
        ].includes(node.nodeName)
    ) return;

    if (node.attrs)
        node.attrs = node.attrs.map(e => {
            const { name, value } = e;

            if (['a', 'area'].includes(node.nodeName)) {
                if (['href', 'action'].includes(name) && value.startsWith('javascript')) {
                    return;
                }
            } else if (['img', 'image'].includes(node.nodeName)) {
                if (['src', 'source', 'action'].includes(name) && value) {
                    if (
                        value.startsWith('javascript') ||
                        value.startsWith('data:text/html')
                    ) return;
                }
            }

            if (name.startsWith('on')) return;

            if (name === 'style' && value && unsafeStyle(value)) {
                return;
            }
            return e;
        }).filter(v => v);
    if (node.childNodes)
        node.childNodes = node.childNodes.map(sanitizeHTMLCore).filter(v => v);
    return node;
};

const mentionLinkRegex = () => new RegExp(`${WEB_BASE_URL.split('/').join('\\/')}\\/@([^"]+)`);

export const isMentionCleansed = (text) => {
    try {
        parse(text).childNodes.forEach(checkCleansedCore);
        const regex = /<(?!\/?a(?=>|\s.*>))[^<>]*>/g;
        if (text.match(regex)) throw null;
        return true;
    } catch (error) {
        return false;
    }
};

/**
 * @type {(node: import('parse5').DefaultTreeAdapterMap['childNode'])=> void}
 */
const checkCleansedCore = (node, isBody) => {
    if (!node) return;

    if (isBody) {
        if (node.attrs?.length) {
            node.attrs.forEach(({ name, value }) => {
                const childText = node.childNodes[0].value;
                if (
                    node.nodeName !== 'a' ||
                    name !== 'href' ||
                    value.match(mentionLinkRegex())?.[1] !== childText.substring(1) ||
                    !childText.startsWith('@') ||
                    node.childNodes.length !== 1
                ) throw 'invalid attribute';
            });
        } else if (node.nodeName !== '#text') {
            throw 'invalid tag';
        }
    }

    if (node.childNodes)
        node.childNodes.forEach((n, i) => {
            checkCleansedCore(n, isBody || node.nodeName === 'body');
        });
};