import { isBrowser } from "bbx-commonly-used/web/is_browser";

export const mentionRegex = (WEB_BASE_URL) => new RegExp(`^<a href="${(WEB_BASE_URL || location.origin).split('/').join('\\/')}\\/@([^"]+)">@\\1<\\/a>$`);

export const cleanseHTML = (html = '', WEB_BASE_URL) => {
    if (!isBrowser()) return html;
    const element = document.createElement('div');
    element.innerHTML = html;

    Array(element.children.length).fill()
        .map((_, i) => element.children.item(i))
        .forEach(node => {
            if (
                node &&
                node.nodeType !== Node.TEXT_NODE &&
                !((node.nodeName || '').toLowerCase() === 'a' && mentionRegex(WEB_BASE_URL).test(node.outerHTML))
            ) {
                if (node.textContent) {
                    node.replaceWith(node.textContent);
                } else node.remove();
            }
        });
    return element.innerHTML;
};

export const isHTMLFilled = (html) => {
    if (!isBrowser()) return false;
    const element = document.createElement('div');
    element.innerHTML = html;
    return !!element.textContent.trim();
};