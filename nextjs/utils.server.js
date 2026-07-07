import "server-only";

import langy from "./langy";
import { stripLangFromUrl, stripTrailingSlash } from "./methods.dual";

export const getGraphMetadata = ({ title, description, logoUrl, logoSize, locale, url, locale_list = [] }) => {
    if (!logoUrl) logoUrl = process.env.NEXT_PUBLIC_WEB_BASE_URL.concat('/logo.png');

    const link = new URL(url);
    const cleansedPath = stripTrailingSlash(stripLangFromUrl(link.pathname));
    const isLangLink = cleansedPath !== stripTrailingSlash(link.pathname);

    const linkCleansed = new URL(link);
    linkCleansed.pathname = cleansedPath;

    return {
        alternates: {
            canonical: linkCleansed.href,
            languages: {
                ...Object.fromEntries(
                    locale_list.map(v =>
                        [v, langy(linkCleansed.pathname, { lang: v }).concat(link.search)]
                    )
                ),
                [locale]: isLangLink ? link.href : linkCleansed.href
            }
        },
        openGraph: {
            title,
            description,
            url,
            siteName: process.env.NEXT_PUBLIC_APP_NAME,
            images: [
                {
                    url: logoUrl,
                    width: logoSize?.[0] || 192,
                    height: logoSize?.[1] || 192
                }
            ],
            locale,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [logoUrl]
        }
    };
}