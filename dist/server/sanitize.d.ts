/**
 * @type {(node: import('parse5').DefaultTreeAdapterMap['childNode'])=> string}
 */
export const getInnerText: (node: any["childNode"]) => string;
export function htmlToText(text: any): any;
export function isHTMLFilled(html: any): boolean;
export function useNode(text: any): {
    document: any;
    stringifyNode: () => any;
};
export function isHTMLSanitized(text: any): boolean;
export function validateSanitizedHTML(text: any): void;
export function sanitizeHTML(text: any): any;
export function isMentionCleansed(text: any): boolean;
