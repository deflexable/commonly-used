
export const mutateLink = (href, search) => {
    if (typeof search === 'string')
        search = new URLSearchParams(search);

    const theme = search.get('theme');
    const lang = search.get('lang');

    if (typeof href === 'string' && (theme || lang)) {
        const [path, ...query] = href.split('?');
        const q = new URLSearchParams(query.join('?'));

        if (theme) q.set('theme', theme);
        if (lang) q.set('lang', lang);

        return path.concat('?').concat(q.toString());
    }
}