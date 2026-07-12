import { resolve } from 'path';
import { pathToFileURL } from 'url';

const importer = (path, ...fallbacks) =>
    import(pathToFileURL(resolve(process.cwd(), path)).href)
        .then(e => {
            if (process.env.NODE_ENV === 'development')
                return new Proxy({}, {
                    get: (_, n) => {
                        if (n !== 'then' && !(n in e))
                            throw `unable to resolve import of '${n}' from "${path}"`;
                        return e[n];
                    },
                    set: (_, n, v) => {
                        e[n] = v;
                        return true;
                    }
                });

            return e;
        })
        .catch(e => {
            if (fallbacks.length) return importer(...fallbacks);
            throw e;
        });

export default importer;