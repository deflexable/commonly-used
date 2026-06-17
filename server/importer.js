import { resolve } from 'path';
import { pathToFileURL } from 'url';

const importer = (path, ...fallbacks) =>
    import(pathToFileURL(resolve(process.cwd(), path)).href)
        .catch(e => {
            if (fallbacks.length) return importer(...fallbacks);
            throw e;
        });

export default importer;