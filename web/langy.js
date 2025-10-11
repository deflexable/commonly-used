import { isBrowser } from "./is_browser";
import { Validator } from "guard-object";
import { useLastLoaderData } from "./nav";

export const langifyLink = (link = '', url = '') => {
    const urlObj = new URL(isBrowser() ? location.href : url),
        urlLang = urlObj.searchParams.get('lang'),
        lang = SUPPORTED_LANGUAGES[urlLang] ? urlLang : undefined;

    const isInputLink = Validator.LINK(link),
        isBack = link.startsWith('../'),
        isNav = link.startsWith('/'),
        navPrefix = isBack ? '../' : isNav ? '/' : '';

    const thisLink = new URL(isInputLink ? link : `${urlObj.origin}/${link.substring(navPrefix.length)}`);

    if (
        !thisLink.searchParams.get('lang') &&
        lang
    ) thisLink.searchParams.set('lang', lang);

    return isInputLink ? thisLink.href : `${navPrefix}${thisLink.pathname.substring(1)}${thisLink.search}${thisLink.hash}`;
};

export const useLangLink = () => {
    const { url } = useLastLoaderData();
    return (link) => langifyLink(link, url);
};